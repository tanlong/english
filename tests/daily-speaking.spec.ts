import { mockMicrophone } from "./microphone-fixture";
import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "natural-english:v2",
      JSON.stringify({
        version: 2,
        profile: {
          name: "Long",
          role: "general",
          goal: "both",
          confidence: "some",
          largeText: false,
          mic: false,
        },
        activeWeek: 1,
        activeDay: 1,
        sessions: {},
        dailySeconds: {},
      }),
    );
  });
});

for (const [format, explanationVi] of [
  [
    "labelled",
    'Sai: "i usslly get up 6AM" thiếu giới từ trước giờ.\n\nGợi ý đúng: "I usually get up at 6 AM." Viết usually và thêm at trước giờ.',
  ],
  [
    "previous wording",
    'Bạn nói "i usslly get up 6AM". Câu đúng là "I usually get up at 6 AM" vì "usually" viết đúng và nhớ thêm "at" trước giờ. Bạn hãy thử nói lại nhé!',
  ],
]) {
  test(`corrections show two paragraphs with ${format}`, async ({ page }) => {
    await page.route("**/api/daily-speaking", (route) =>
      route.fulfill({
        json:
          route.request().postDataJSON().action === "start"
            ? { reply: "What did you do yesterday?", explanationVi: "" }
            : {
                reply: "How did you get to work?",
                explanationVi,
              },
      }),
    );
    await page.goto("/daily-speaking");
    await page.getByRole("button", { name: "Mở thiết lập", exact: true }).click();
    await page.getByRole("checkbox", { name: "Tự phát giọng Alex", exact: true }).uncheck();
    await page.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true }).click();
    await expect(page.getByRole("log")).toContainText("What did you do yesterday?");
    await page.getByLabel("Câu trả lời của bạn", { exact: true }).fill("i usslly get up 6AM");
    await page.getByRole("button", { name: "Gửi câu trả lời", exact: true }).click();
    const explanation = page.getByRole("log").locator(".speaking-vietnamese");
    await expect(explanation).toBeHidden();
    await page
      .getByRole("log")
      .getByRole("button", { name: "Xem góp ý", exact: true })
      .press("Enter");
    await expect(explanation).toBeVisible();
    await expect(explanation.locator("p")).toHaveCount(2);
    await expect(explanation.locator("p").nth(0)).toContainText('Cần sửa: "i usslly get up 6AM"');
    await expect(explanation.locator("p").nth(1)).toContainText(
      'Gợi ý sửa: "I usually get up at 6 AM',
    );
    await expect(explanation.locator("p strong")).toHaveText(["Cần sửa:", "Gợi ý sửa:"]);
    const [wrong, suggestion] = await explanation.locator("p").all();
    const wrongBox = await wrong.boundingBox();
    const suggestionBox = await suggestion.boundingBox();
    expect(suggestionBox!.y).toBeGreaterThan(wrongBox!.y + wrongBox!.height);
  });
}

test("correct sentences get optional alternatives, a retry and a separate recap", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () {
      setTimeout(() => this.dispatchEvent(new Event("ended")), 10);
      return Promise.resolve();
    };
  });
  const spoken: string[] = [];
  await page.route("**/api/daily-speaking/speech", (route) => {
    spoken.push(route.request().postDataJSON().input);
    return route.fulfill({ contentType: "audio/mpeg", body: Buffer.from([1, 2, 3]) });
  });
  const calls: (Record<string, unknown> & { history: { role: string; content: string }[] })[] = [];
  const alternative =
    "Cách nói khác: I enjoy this book.\n\nCâu của bạn đã đúng. Enjoy là một cách khác để diễn tả sự yêu thích.";
  await page.route("**/api/daily-speaking", (route) => {
    const body = route.request().postDataJSON();
    calls.push(body);
    return route.fulfill({
      json: {
        reply:
          body.action === "start"
            ? "What do you think of this book?"
            : body.action === "retry"
              ? "That works too. What do you enjoy about it?"
              : body.action === "end"
                ? "You shared your opinion and tried another way to say it."
                : "What do you like about it?",
        explanationVi: body.action === "conversation" ? alternative : "",
        translationVi: body.action === "conversation" ? "Bạn thích điều gì ở đó?" : "",
        ...(body.action === "conversation"
          ? {
              speakingVersions: {
                short: { en: "I like it.", vi: "Tôi thích cuốn đó." },
                full: { en: "I enjoy this book.", vi: "Tôi thích cuốn sách này." },
                grammar: { en: "I like this book.", vi: "Tôi thích cuốn sách này." },
              },
            }
          : {}),
      },
    });
  });
  await page.goto("/daily-speaking");
  await page.getByRole("button", { name: "Mở thiết lập", exact: true }).click();
  await page.getByRole("checkbox", { name: "Tự phát giọng Alex", exact: true }).uncheck();
  await page.getByRole("button", { name: "Thu gọn thiết lập", exact: true }).click();
  await page.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true }).click();
  const answer = page.getByLabel("Câu trả lời của bạn", { exact: true });
  await answer.fill("I like this book.");
  await page.getByRole("button", { name: "Gửi câu trả lời", exact: true }).click();
  const feedback = page.getByRole("log").locator(".speaking-vietnamese");
  const latestTurn = page.locator(".speaking-turn.assistant").last();
  const disclosure = latestTurn.getByRole("button", { name: "Xem góp ý và cách nói", exact: true });
  await expect(disclosure).toBeVisible();
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const speaker = await latestTurn
      .getByRole("button", { name: "Nghe phản hồi của Alex" })
      .boundingBox();
    for (const name of ["Hiện nghĩa tiếng Việt", "Xem góp ý và cách nói", "Thử nói lại"]) {
      const icon = latestTurn.getByRole("button", { name, exact: true });
      const bounds = await icon.boundingBox();
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(speaker!.x);
      expect(bounds!.y).toBe(speaker!.y);
    }
  }
  await page.setViewportSize({ width: 375, height: 900 });
  await expect(feedback).toBeHidden();
  await expect(page.getByRole("log").locator('section[aria-label="Bản ngắn gọn"]')).toBeHidden();
  await disclosure.click();
  await expect(feedback).toBeVisible();
  await latestTurn.getByRole("button", { name: "Ẩn góp ý và cách nói" }).click();
  await expect(feedback).toBeHidden();
  await disclosure.click();
  await expect(feedback).toContainText("Câu của bạn đã đúng");
  await expect(feedback.locator("p strong")).toHaveText(["Cách nói khác:"]);
  await expect(feedback).not.toContainText(/Sai:|Cần sửa:|Gợi ý sửa:/);
  const grammarVersion = page.getByRole("log").locator('section[aria-label="Bản đúng ngữ pháp"]');
  await expect(grammarVersion).toBeHidden();
  await page.getByRole("log").getByText("Xem bản đúng ngữ pháp", { exact: true }).click();
  await expect(grammarVersion).toContainText("I like this book.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/speaking-grammar-open-375.png", fullPage: true });
  await page.getByRole("log").getByText("Xem bản đúng ngữ pháp", { exact: true }).press("Enter");
  await expect(grammarVersion).toBeHidden();
  const shortVersion = page.getByRole("log").getByRole("region", { name: "Bản ngắn gọn" });
  const fullVersion = page.getByRole("log").getByRole("region", { name: "Bản đầy đủ" });
  await expect(shortVersion).toContainText("I like it.");
  await expect(fullVersion).toContainText("I enjoy this book.");
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const version of [shortVersion, fullVersion]) {
      const english = await version.locator('[lang="en"]').boundingBox();
      const vietnamese = await version.locator('[lang="vi"]').boundingBox();
      const audio = await version.getByRole("button", { name: /Nghe bản/ }).boundingBox();
      expect(vietnamese!.y).toBeGreaterThanOrEqual(english!.y + english!.height);
      expect(audio!.y).toBeGreaterThan(vietnamese!.y + vietnamese!.height);
    }
  }
  await shortVersion.screenshot({ path: "artifacts/spoken-version.png" });
  await shortVersion.getByRole("button", { name: "Nghe bản ngắn gọn" }).click();
  await expect.poll(() => spoken).toEqual(["I like it."]);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.getByRole("button", { name: "Thử nói lại", exact: true }).click();
  await expect(answer).toBeFocused();
  await answer.fill("I enjoy this book.");
  await page.getByRole("button", { name: "Gửi câu trả lời", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("That works too.");
  expect(calls.at(-1)).toMatchObject({ action: "retry", message: "I enjoy this book." });
  await expect(page.getByTestId("speaking-counts")).toContainText("2 lượt nhập chữ");
  await page.getByRole("button", { name: "Kết thúc & ôn lại", exact: true }).click();
  const recap = page.getByRole("region", { name: "Nhìn lại cuộc trò chuyện" });
  await expect(recap.getByLabel("Góp ý đã luyện")).toHaveCount(0);
  await expect(recap.getByLabel("Cách nói khác đã gặp")).toContainText("I enjoy this book.");
  await expect(recap.getByRole("region", { name: /Bản (ngắn gọn|đầy đủ)/ })).toHaveCount(2);
  const downloading = page.waitForEvent("download");
  await recap.getByRole("button", { name: "Tải hội thoại", exact: true }).click();
  const download = await downloading;
  const contents = await readFile((await download.path())!, "utf8");
  expect(contents).toContain("Bạn: I like this book.");
  expect(contents).toContain("Cách nói khác: I enjoy this book.");
  expect(contents).toContain("Bản ngắn gọn: I like it.");
  expect(contents).toContain("Bản đầy đủ: I enjoy this book.");
  expect(contents).toContain("Bản đúng ngữ pháp: I like this book.");
  expect(contents).not.toMatch(/Sai:|Cần sửa:/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/speaking-optional-alternative.png", fullPage: true });
});

for (const width of [375, 1440]) {
  test(`Alex translations toggle independently in small italic text at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const actions: string[] = [];
    await page.route("**/api/daily-speaking", (route) => {
      const { action } = route.request().postDataJSON();
      actions.push(action);
      return route.fulfill({
        json:
          action === "end"
            ? {
                reply: "Try talking about tomorrow.",
                translationVi: "Hãy thử nói về ngày mai.",
                explanationVi: "",
              }
            : action === "start"
              ? {
                  reply: "Coffee first! How was your morning?",
                  translationVi: "Cà phê trước đã! Buổi sáng của bạn thế nào?",
                  explanationVi: "",
                }
              : {
                  reply: "What did you have for breakfast?",
                  translationVi: "Bạn đã ăn gì vào bữa sáng?",
                  explanationVi: "",
                },
      });
    });
    await page.goto("/daily-speaking");
    await page.getByRole("button", { name: "Mở thiết lập", exact: true }).click();
    await page.getByRole("checkbox", { name: "Tự phát giọng Alex", exact: true }).uncheck();
    await page
      .getByRole("combobox", { name: "Giải thích tiếng Việt", exact: true })
      .fill("Chỉ khi");
    await page
      .getByRole("combobox", { name: "Giải thích tiếng Việt", exact: true })
      .press("ArrowDown");
    await page.getByRole("combobox", { name: "Giải thích tiếng Việt", exact: true }).press("Enter");
    await page.getByRole("button", { name: "Thu gọn thiết lập", exact: true }).click();
    await page.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true }).click();
    const first = page.locator(".speaking-turn.assistant").first();
    const meaning = first.locator(".speaking-translation p");
    const eye = first.getByRole("button", { name: /nghĩa tiếng Việt/ });
    await expect(meaning).toBeHidden();
    await expect(eye).toHaveAccessibleName("Hiện nghĩa tiếng Việt");
    await eye.focus();
    await eye.press("Enter");
    await expect(eye).toHaveAttribute("aria-expanded", "true");
    await expect(meaning).toBeVisible();
    await expect(meaning).toHaveText("Cà phê trước đã! Buổi sáng của bạn thế nào?");
    const typography = await meaning.evaluate((el) => ({
      style: getComputedStyle(el).fontStyle,
      size: parseFloat(getComputedStyle(el).fontSize),
      englishSize: parseFloat(
        getComputedStyle(el.closest("article")!.querySelector('[lang="en"]')!).fontSize,
      ),
    }));
    expect(typography.style).toBe("italic");
    expect(typography.size).toBeLessThan(typography.englishSize);
    await eye.click();
    await expect(meaning).toBeHidden();
    expect(actions).toEqual(["start"]);
    await page
      .getByLabel("Câu trả lời của bạn", { exact: true })
      .fill("I had coffee this morning.");
    await page.getByRole("button", { name: "Gửi câu trả lời", exact: true }).click();
    const second = page.locator(".speaking-turn.assistant").nth(1);
    await expect(second.locator(".speaking-translation p")).toBeHidden();
    await second.getByRole("button", { name: "Hiện nghĩa tiếng Việt" }).click();
    await expect(second.locator(".speaking-translation p")).toHaveText(
      "Bạn đã ăn gì vào bữa sáng?",
    );
    await expect(meaning).toBeHidden();
    await expect(page.locator(".speaking-turn.user .speaking-translation")).toHaveCount(0);
    await expect(page.getByTestId("speaking-counts")).toContainText("1 lượt nhập chữ");
    expect(actions).toEqual(["start", "conversation"]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `artifacts/alex-translation-${width}.png`, fullPage: true });
    await page.getByRole("button", { name: "Kết thúc & ôn lại", exact: true }).click();
    const summary = page.getByRole("region", { name: "Nhìn lại cuộc trò chuyện" });
    await expect(summary.locator(".speaking-translation p")).toBeHidden();
    await summary.getByRole("button", { name: "Hiện nghĩa tiếng Việt" }).click();
    await expect(summary.locator(".speaking-translation p")).toHaveText("Hãy thử nói về ngày mai.");
    expect(actions).toEqual(["start", "conversation", "end"]);
  });
}

test("roleplay provides roles, supports a real retry and exports the conversation recap", async ({
  page,
}) => {
  const calls: (Record<string, unknown> & { history: { role: string; content: string }[] })[] = [];
  const speech: string[] = [];
  let retryFailed = false;
  await page.route("**/api/daily-speaking/speech", (route) => {
    speech.push(route.request().postDataJSON().input);
    return route.fulfill({ contentType: "audio/mpeg", body: Buffer.from([1, 2, 3]) });
  });
  await page.route("**/api/daily-speaking", (route) => {
    const body = route.request().postDataJSON();
    calls.push(body);
    if (body.action === "retry" && !retryFailed) {
      retryFailed = true;
      return route.fulfill({ status: 502, json: { error: "Hãy thử lại; câu đang nhập vẫn còn." } });
    }
    const response =
      body.action === "start"
        ? {
            reply: "Welcome! What would you like to drink?",
            translationVi: "Chào bạn! Bạn muốn uống gì?",
            explanationVi: "",
          }
        : body.action === "conversation"
          ? {
              reply: "For yesterday, you can say: I wanted coffee. What size would you like?",
              translationVi:
                "Để kể về hôm qua, bạn có thể nói: Tôi đã muốn uống cà phê. Bạn muốn cỡ nào?",
              explanationVi:
                'Cần sửa: "I want coffee yesterday" cần dùng quá khứ.\n\nGợi ý sửa: "I wanted coffee yesterday." Dùng wanted để kể việc đã qua.',
            }
          : body.action === "retry"
            ? {
                reply: "You used wanted this time. What size would you like?",
                translationVi: "Lần này bạn đã dùng wanted. Bạn muốn cỡ nào?",
                explanationVi: "",
              }
            : {
                reply: "You practiced ordering coffee and tried your answer again.",
                translationVi: "Bạn đã luyện gọi cà phê và thử nói lại câu trả lời.",
                explanationVi: "Lần sau hãy thử hỏi giá đồ uống.",
              };
    return route.fulfill({ json: response });
  });
  await page.goto("/daily-speaking");
  await page
    .getByRole("group", { name: "Tình huống luyện nói" })
    .getByRole("button", { name: /Gọi món ở quán cà phê/ })
    .click();
  await expect(page.getByLabel("Mục tiêu buổi nói")).toContainText("Alex · Nhân viên quán");
  await expect(page.getByLabel("Mục tiêu buổi nói")).toContainText("Gọi một đồ uống");
  await page.getByText("Mẫu câu để bắt đầu", { exact: true }).click();
  await expect(page.getByText("How much is it?", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mở thiết lập", exact: true }).click();
  await page.getByRole("checkbox", { name: "Tự phát giọng Alex" }).uncheck();
  await page.getByRole("button", { name: "Thu gọn thiết lập", exact: true }).click();
  await page.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("What would you like to drink?");
  expect(calls[0]).toMatchObject({
    mode: "roleplay",
    scenarioId: "coffee-order",
    topic: "Ordering at a cafe",
  });
  const answer = page.getByLabel("Câu trả lời của bạn", { exact: true });
  await answer.fill("I want coffee yesterday.");
  await page.getByRole("button", { name: "Gửi câu trả lời", exact: true }).click();
  await page.getByRole("button", { name: "Thử nói lại", exact: true }).click();
  await expect(answer).toBeFocused();
  await expect(answer).toHaveValue("");
  await expect(page.getByRole("button", { name: "Hủy luyện lại", exact: true })).toBeVisible();
  await answer.fill("I wanted coffee yesterday.");
  await page.getByRole("button", { name: "Gửi câu trả lời", exact: true }).click();
  await expect(answer).toHaveValue("I wanted coffee yesterday.");
  await expect(page.getByRole("button", { name: "Hủy luyện lại", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Gửi câu trả lời", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("You used wanted this time.");
  expect(calls.at(-1)).toMatchObject({
    action: "retry",
    message: "I wanted coffee yesterday.",
    mode: "roleplay",
    scenarioId: "coffee-order",
  });
  expect(calls.at(-1)!.history.filter((turn) => turn.role === "user")).toEqual([
    { role: "user", content: "I want coffee yesterday." },
  ]);
  await expect(page.getByTestId("speaking-counts")).toContainText(
    "0 lượt qua mic · 2 lượt nhập chữ · 0 gợi ý",
  );
  await page.getByRole("button", { name: "Nghe phản hồi của Alex", exact: true }).first().click();
  await expect.poll(() => speech.length).toBe(1);
  expect(speech[0]).toBe("Welcome! What would you like to drink?");
  await page.getByRole("button", { name: "Kết thúc & ôn lại", exact: true }).click();
  const recap = page.getByRole("region", { name: "Nhìn lại cuộc trò chuyện" });
  await expect(recap.getByLabel("Góp ý đã luyện")).toContainText("I wanted coffee yesterday.");
  const downloading = page.waitForEvent("download");
  await recap.getByRole("button", { name: "Tải hội thoại", exact: true }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe("natural-english-hoi-thoai.txt");
  const contents = await readFile((await download.path())!, "utf8");
  expect(contents).toContain("Bạn: I want coffee yesterday.");
  expect(contents).toContain("Bạn: I wanted coffee yesterday.");
  await page.screenshot({ path: "artifacts/hala-inspired-speaking-recap.png", fullPage: true });
});

test("conversation retries preserve the draft; hints and explanations do not become learner turns", async ({
  page,
}) => {
  const calls: Record<string, unknown>[] = [];
  let failed = false;
  await page.route("**/api/daily-speaking", async (route) => {
    const body = route.request().postDataJSON();
    calls.push(body);
    if (body.action === "conversation" && !failed) {
      failed = true;
      return route.fulfill({
        status: 502,
        json: { error: "Alex chưa thể phản hồi. Hãy thử lại." },
      });
    }
    const replies = {
      start: { reply: "What did you do this morning?", explanationVi: "" },
      conversation: { reply: "What did you have for breakfast?", explanationVi: "" },
      hint: { reply: 'You can start with: "I had..."', explanationVi: "" },
      explain: { reply: "", explanationVi: "Alex hỏi bạn đã ăn gì vào bữa sáng." },
      skip: { reply: "What do you like to drink?", explanationVi: "" },
      end: {
        reply:
          'Practiced: "got up". You described your morning. Try speaking for 30 seconds about tomorrow.',
        explanationVi: "Bạn đã dùng got up để kể về sáng nay. Hãy nói 30 giây về ngày mai.",
      },
    };
    return route.fulfill({ json: replies[body.action as keyof typeof replies] });
  });
  await page.goto("/daily-speaking");
  await expect(
    page.getByRole("heading", { name: "Nói chuyện cùng Alex", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#speaking-mode")).toBeHidden();
  await expect(page.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true })).toBeVisible();
  expect((await page.locator(".speaking-settings").boundingBox())?.width).toBe(64);
  const collapsedConversation = await page.locator(".speaking-conversation").boundingBox();
  const settingsToggle = page
    .locator(".speaking-settings")
    .getByRole("button", { name: /thiết lập/ });
  await settingsToggle.click();
  await expect
    .poll(async () => (await page.locator(".speaking-settings").boundingBox())?.width)
    .toBe(400);
  expect((await page.locator(".speaking-conversation").boundingBox())?.x).toBeGreaterThan(
    collapsedConversation!.x,
  );
  await expect(page.getByRole("combobox", { name: "Chế độ", exact: true })).toBeVisible();
  await page.getByRole("checkbox", { name: "Tự phát giọng Alex", exact: true }).uncheck();
  await page.getByRole("combobox", { name: "Chế độ", exact: true }).fill("Guided");
  await page.getByRole("option", { name: "Guided Lesson · Theo bài", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Chủ đề", exact: true })).toBeDisabled();
  await page.getByRole("combobox", { name: "Tốc độ", exact: true }).fill("Slow");
  await page.getByRole("option", { name: "Slow · Chậm, câu ngắn", exact: true }).click();
  await page.getByRole("combobox", { name: "Giải thích tiếng Việt", exact: true }).fill("Chỉ khi");
  await page
    .getByRole("combobox", { name: "Giải thích tiếng Việt", exact: true })
    .press("ArrowDown");
  await page.getByRole("combobox", { name: "Giải thích tiếng Việt", exact: true }).press("Enter");
  await settingsToggle.click();
  await expect(page.locator("#speaking-mode")).toBeHidden();
  await expect
    .poll(async () => (await page.locator(".speaking-settings").boundingBox())?.width)
    .toBe(64);
  await settingsToggle.click();
  await expect(page.getByRole("combobox", { name: "Chế độ", exact: true })).toHaveValue(
    "Guided Lesson · Theo bài",
  );
  await page.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("What did you do this morning?");
  await expect(
    page.getByRole("button", { name: "Giải thích tiếng Việt", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Bỏ qua câu hỏi", exact: true })).toHaveCount(0);
  for (const name of ["Chế độ", "Chủ đề", "Bài học", "Thời lượng mục tiêu"]) {
    await expect(page.getByRole("combobox", { name, exact: true })).toBeDisabled();
    await expect(
      page.getByRole("button", { name: `Mở danh sách ${name}`, exact: true }),
    ).toBeDisabled();
  }
  await page.getByLabel("Câu trả lời của bạn", { exact: true }).fill("I got up at six.");
  await page.getByRole("button", { name: "Gửi câu trả lời", exact: true }).click();
  await expect(page.locator(".speaking-controls").getByRole("alert")).toContainText("Hãy thử lại");
  await expect(page.getByLabel("Câu trả lời của bạn", { exact: true })).toHaveValue(
    "I got up at six.",
  );
  await expect(page.getByTestId("speaking-counts")).toContainText("0 lượt nhập chữ");
  await page.getByRole("button", { name: "Gửi câu trả lời", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("What did you have for breakfast?");
  await expect(page.getByTestId("speaking-counts")).toContainText("1 lượt nhập chữ");
  await page.getByRole("button", { name: "Gợi ý", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("You can start with:");
  await page.getByLabel("Câu trả lời của bạn", { exact: true }).fill("Vietnamese");
  await page.getByRole("button", { name: "Gửi câu trả lời", exact: true }).click();
  await expect(page.getByLabel("Câu trả lời của bạn", { exact: true })).toHaveValue("");
  await expect(page.getByRole("log")).toContainText("Alex hỏi bạn đã ăn gì vào bữa sáng.");
  expect(calls.at(-1)?.action).toBe("explain");
  expect(calls.at(-1)?.lastCoach).toBe("What did you have for breakfast?");
  await expect(page.locator(".speaking-turn.assistant")).toHaveCount(3);
  await expect(page.getByTestId("speaking-counts")).toContainText(
    "0 lượt qua mic · 1 lượt nhập chữ · 1 gợi ý",
  );
  await page.getByLabel("Câu trả lời của bạn", { exact: true }).fill("skip");
  await page.getByRole("button", { name: "Gửi câu trả lời", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("What do you like to drink?");
  await page.getByRole("button", { name: "Kết thúc & ôn lại", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Nhìn lại cuộc trò chuyện" })).toBeVisible();
  await expect(page.locator(".speaking-summary")).toContainText("30 giây");
  await expect(page.getByLabel("Câu trả lời của bạn", { exact: true })).toBeDisabled();
  const final = calls.at(-1)!;
  const learnerTurns = (final.history as { role: string; content: string }[]).filter(
    (turn) => turn.role === "user",
  );
  expect(learnerTurns).toEqual([{ role: "user", content: "I got up at six." }]);
  expect(final.mode).toBe("guided");
  expect(final.pace).toBe("slow");
  expect(final.explanationMode).toBe("onRequest");
  await page.getByRole("button", { name: "Bắt đầu buổi mới", exact: true }).click();
  await expect(page.getByTestId("speaking-counts")).toContainText(
    "0 lượt qua mic · 0 lượt nhập chữ · 0 gợi ý",
  );
  await expect(page.locator(".speaking-summary")).toHaveCount(0);
});

test("mic requires consent, shows an editable transcript and keeps speech separate from text", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "SpeechRecognition", {
      value: class {
        onresult?: (event: unknown) => void;
        onend?: () => void;
        start() {
          this.onresult?.({
            results: [{ isFinal: true, 0: { transcript: "I had breakfast at home." } }],
          });
        }
        stop() {
          this.onend?.();
        }
        abort() {}
      },
    });
  });
  await page.route("**/api/daily-speaking", (route) =>
    route.fulfill({ json: { reply: "What did you have for breakfast?", explanationVi: "" } }),
  );
  await page.goto("/daily-speaking");
  await page.getByRole("button", { name: "Mở thiết lập", exact: true }).click();
  await page.getByRole("checkbox", { name: "Tự phát giọng Alex", exact: true }).uncheck();
  await page.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true }).click();
  const mic = page.getByRole("button", { name: "Bấm để nói", exact: true });
  await expect(mic).toBeDisabled();
  await page.getByRole("checkbox", { name: /Tôi đồng ý dùng tính năng chuyển giọng nói/ }).check();
  await mic.click();
  await expect(page.getByLabel("Câu trả lời của bạn", { exact: true })).toHaveValue(
    "I had breakfast at home.",
  );
  await expect(page.getByTestId("speaking-counts")).toContainText("0 lượt qua mic");
  await page.getByRole("button", { name: "Dừng mic", exact: true }).click();
  await page.getByRole("button", { name: "Gửi câu trả lời", exact: true }).click();
  await expect(page.getByTestId("speaking-counts")).toContainText(
    "1 lượt qua mic · 0 lượt nhập chữ",
  );
  await expect(page.getByRole("log")).toContainText("Bạn · Qua mic");
});

test("mic keeps listening across browser disconnects until the learner stops", async ({ page }) => {
  await mockMicrophone(page, "__mic");
  await page.route("**/api/daily-speaking", (route) =>
    route.fulfill({ json: { reply: "What did you do this morning?", explanationVi: "" } }),
  );
  await page.goto("/daily-speaking");
  await page.getByRole("button", { name: "Mở thiết lập", exact: true }).click();
  await page.getByRole("checkbox", { name: "Tự phát giọng Alex", exact: true }).uncheck();
  await page.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true }).click();
  const answer = page.getByLabel("Câu trả lời của bạn", { exact: true });
  await answer.fill("This morning:");
  await page.getByRole("checkbox", { name: /Tôi đồng ý dùng tính năng chuyển giọng nói/ }).check();
  await page.getByRole("button", { name: "Bấm để nói", exact: true }).click();
  expect(await page.evaluate(() => window.__mic.continuous)).toBe(true);
  await page.evaluate(() => {
    const mic = window.__mic;
    mic.onresult({
      results: [
        { isFinal: true, 0: { transcript: "I had coffee." } },
        { isFinal: false, 0: { transcript: "Then I went to work." } },
      ],
    });
    mic.onend();
  });
  await expect(page.getByRole("button", { name: "Dừng mic", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__mic.starts)).toBe(2);
  await expect(answer).toHaveValue("This morning: I had coffee. Then I went to work.");
  await page.evaluate(() => {
    window.__mic.onresult({
      results: [{ isFinal: false, 0: { transcript: "I talked" } }],
    });
    window.__mic.onresult({
      results: [{ isFinal: true, 0: { transcript: "I talked to my coworkers." } }],
    });
    window.__mic.onerror({ error: "no-speech" });
    window.__mic.onend();
  });
  await expect.poll(() => page.evaluate(() => window.__mic.starts)).toBe(3);
  await expect(answer).toHaveValue(
    "This morning: I had coffee. Then I went to work. I talked to my coworkers.",
  );
  await page.getByRole("button", { name: "Dừng mic", exact: true }).click();
  await expect(page.getByRole("button", { name: "Bấm để nói", exact: true })).toBeVisible();
  // A delayed end event must not reopen the microphone after an explicit stop.
  await page.evaluate(() => window.__mic.onend?.());
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__mic.starts)).toBe(3);
  await expect(answer).toBeEnabled();
  await page.getByRole("button", { name: "Gửi câu trả lời", exact: true }).click();
  await expect(page.getByTestId("speaking-counts")).toContainText(
    "1 lượt qua mic · 0 lượt nhập chữ",
  );

  await expect(answer).toHaveValue("");
  await page.getByRole("button", { name: "Bấm để nói", exact: true }).click();
  await page.evaluate(() => {
    window.__mic.onend();
    // Stop during the reconnect delay, before the engine has started again.
    const stop = Array.from(document.querySelectorAll("button")).find(
      (button) => button.getAttribute("aria-label") === "Dừng mic",
    );
    stop!.click();
  });
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__mic.starts)).toBe(1);
  await expect(answer).toBeEnabled();
  await page.getByRole("button", { name: "Bấm để nói", exact: true }).click();
  await page.evaluate(() => {
    window.__mic.onresult({
      results: [{ isFinal: false, 0: { transcript: "Keep these words." } }],
    });
    window.__mic.onerror({ error: "not-allowed" });
    window.__mic.onend?.();
  });
  await expect(page.locator(".speaking-controls").getByRole("alert")).toContainText(
    "Chưa được cấp quyền micro",
  );
  await expect(answer).toHaveValue("Keep these words.");
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__mic.starts)).toBe(1);
  await page.getByRole("button", { name: "Bấm để nói", exact: true }).click();
  await page.evaluate(() =>
    window.__mic.onresult({
      results: [{ isFinal: true, 0: { transcript: "word ".repeat(400) } }],
    }),
  );
  await expect(page.locator(".speaking-controls").getByRole("alert")).toContainText("1.500 ký tự");
  expect((await answer.inputValue()).length).toBe(1500);
  await expect(page.getByRole("button", { name: "Bấm để nói", exact: true })).toBeVisible();
  await answer.fill("One more thought.");
  await page.getByRole("button", { name: "Bấm để nói", exact: true }).click();
  await page.evaluate(() => {
    window.__mic.onend();
    // Simulate hiding the tab before the reconnect timeout fires.
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__mic.starts)).toBe(1);
  await expect(page.getByRole("button", { name: "Bấm để nói", exact: true })).toBeVisible();
  await expect(answer).toHaveValue("One more thought.");
});

test("Alex speaks after a reply by default and can be muted", async ({ page }) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () {
      document.documentElement.dataset.alexPlays = String(
        Number(document.documentElement.dataset.alexPlays ?? 0) + 1,
      );
      setTimeout(() => this.dispatchEvent(new Event("ended")), 10);
      return Promise.resolve();
    };
  });
  const spoken: string[] = [];
  await page.route("**/api/daily-speaking/speech", async (route) => {
    spoken.push(route.request().postDataJSON().input);
    await route.fulfill({ contentType: "audio/mpeg", body: Buffer.from([1, 2, 3]) });
  });
  await page.route("**/api/daily-speaking", (route) =>
    route.fulfill({
      json:
        route.request().postDataJSON().action === "explain"
          ? { reply: "", explanationVi: "Alex hỏi về buổi sáng của bạn." }
          : route.request().postDataJSON().action === "start"
            ? { reply: "What did you do this morning?", explanationVi: "Bạn đã làm gì sáng nay?" }
            : { reply: "That sounds lovely. What happened next?", explanationVi: "Nghe thật vui." },
    }),
  );
  await page.goto("/daily-speaking");
  await page.getByRole("button", { name: "Mở thiết lập", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Tự phát giọng Alex", exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true }).click();
  await expect.poll(() => spoken.length).toBe(1);
  expect(spoken).toEqual(["What did you do this morning?"]);
  await page.getByLabel("Câu trả lời của bạn", { exact: true }).fill("I had coffee.");
  await page.getByRole("button", { name: "Gửi câu trả lời", exact: true }).click();
  await expect.poll(() => spoken.length).toBe(2);
  expect(spoken[1]).toBe("That sounds lovely. What happened next?");
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.alexPlays))
    .toBe("2");
  await page.getByLabel("Câu trả lời của bạn", { exact: true }).fill("Vietnamese");
  await page.getByRole("button", { name: "Gửi câu trả lời", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("Alex hỏi về buổi sáng của bạn.");
  expect(spoken).toHaveLength(2);
  await page.getByRole("checkbox", { name: "Tự phát giọng Alex", exact: true }).uncheck();
  await page.getByLabel("Câu trả lời của bạn", { exact: true }).fill("I went to work.");
  await page.getByRole("button", { name: "Gửi câu trả lời", exact: true }).click();
  await expect(page.getByText("I went to work.", { exact: true })).toBeVisible();
  expect(spoken).toHaveLength(2);
});

test("when the browser blocks autoplay, the learner can see how to play Alex's reply", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = () =>
      Promise.reject(new DOMException("blocked", "NotAllowedError"));
  });
  await page.route("**/api/daily-speaking", (route) =>
    route.fulfill({
      json: { reply: "What did you do this morning?", explanationVi: "" },
    }),
  );
  await page.route("**/api/daily-speaking/speech", (route) =>
    route.fulfill({ contentType: "audio/mpeg", body: Buffer.from([1, 2, 3]) }),
  );
  const learnerReady = page.waitForResponse(
    (response) => response.url().endsWith("/api/learning") && response.request().method() === "GET",
  );
  await page.goto("/daily-speaking");
  await learnerReady;
  await page.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true }).click();
  await expect(page.locator(".speaking-controls").getByRole("alert")).toContainText("Bấm Nghe lại");
  await expect(page.getByRole("button", { name: "Nghe lại", exact: true })).toBeEnabled();
});

test("the reply sidebar sits beside the conversation on desktop and below it on mobile", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () {
      setTimeout(() => this.dispatchEvent(new Event("ended")), 10);
      return Promise.resolve();
    };
  });
  await page.route("**/api/daily-speaking", (route) =>
    route.fulfill({
      json: { reply: "What did you do this morning?", explanationVi: "" },
    }),
  );
  await page.route("**/api/daily-speaking/speech", (route) =>
    route.fulfill({ contentType: "audio/mpeg", body: Buffer.from([1, 2, 3]) }),
  );
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/daily-speaking");
    await page.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true }).click();
    await expect(page.getByRole("log")).toContainText("What did you do this morning?");
    const conversation = await page
      .getByRole("region", { name: "Một cuộc trò chuyện nhỏ, mỗi ngày" })
      .boundingBox();
    const sidebar = await page
      .getByRole("complementary", { name: "Trả lời và hỗ trợ" })
      .boundingBox();
    expect(conversation).not.toBeNull();
    expect(sidebar).not.toBeNull();
    if (width > 1000) expect(sidebar!.x).toBeGreaterThan(conversation!.x + conversation!.width - 1);
    else expect(sidebar!.y).toBeGreaterThan(conversation!.y + conversation!.height - 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `artifacts/speaking-sidebar-${width}.png`, fullPage: true });
  }
});

test("mobile navigation and large text fit small portrait and landscape screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/daily-speaking", (route) =>
    route.fulfill({
      json: { reply: "What did you do this morning?", explanationVi: "Bạn đã làm gì sáng nay?" },
    }),
  );
  await page.goto("/daily-speaking");
  await page.getByRole("button", { name: "Mở thiết lập", exact: true }).click();
  await page.getByRole("checkbox", { name: "Tự phát giọng Alex", exact: true }).uncheck();
  expect((await page.locator(".speaking-settings").boundingBox())?.width).toBeLessThanOrEqual(400);
  await page.getByRole("button", { name: "Thu gọn thiết lập", exact: true }).click();
  await page.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("What did you do this morning?");
  await page.locator(".app-shell").evaluate((element) => element.classList.add("large-text"));
  for (const size of [
    { width: 375, height: 812 },
    { width: 812, height: 375 },
  ]) {
    await page.setViewportSize(size);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: "artifacts/daily-speaking-mobile.png", fullPage: true });
});

test("missing server configuration stays an error and does not start a scripted session", async ({
  page,
}) => {
  await page.goto("/daily-speaking");
  await page.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true }).click();
  await expect(page.locator(".speaking-controls").getByRole("alert")).toContainText(
    "Alex hiện chưa sẵn sàng trò chuyện",
  );
  await expect(page.getByTestId("speaking-counts")).toContainText(
    "0 lượt qua mic · 0 lượt nhập chữ",
  );
  await expect(page.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true })).toBeEnabled();
  await expect(page.getByLabel("Câu trả lời của bạn", { exact: true })).toBeDisabled();
});
