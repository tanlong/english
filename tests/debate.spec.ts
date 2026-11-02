import { mockMicrophone } from "./microphone-fixture";
import { expect, test } from "@playwright/test";
import analysis from "./fixtures/debate.json" with { type: "json" };

const content = analysis.evidence.map((e) => e.text).join("\n");
const consentLabel = "Tôi đồng ý gửi nội dung này đến OpenAI để tạo cuộc hội thoại tranh luận.";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
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
    ),
  );
});

for (const width of [1440, 375]) {
  test(`P-R-E-C topics and stance preserve the learner's own answer at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    let calls = 0;
    await page.route("**/api/debate", (route) => {
      const body = route.request().postDataJSON();
      calls++;
      expect(body.action).toBe("analyze");
      expect(body.stance).toBe("disagree");
      expect(body.content).toContain("Should students use phones at school?");
      return route.fulfill({
        json: {
          analysis,
          source: "text",
          sourceName: "Nội dung đã nhập",
          stance: body.stance,
          token: "prec-source",
        },
      });
    });
    await page.goto("/debate");
    await page.getByText("Chọn chủ đề luyện nhanh", { exact: true }).click();
    await expect(page.locator(".debate-topic-grid button")).toHaveCount(4);
    await page
      .getByRole("button", { name: "Học sinh nên được dùng điện thoại ở trường", exact: true })
      .click();
    await expect(page.getByLabel("Nội dung dùng để tranh luận", { exact: true })).toHaveValue(
      /Should students use phones at school\?/,
    );
    await page.getByRole("button", { name: "Không đồng ý", exact: true }).click();
    await expect(page.getByRole("button", { name: "Không đồng ý", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.getByRole("checkbox", { name: consentLabel, exact: true }).check();
    await page.getByRole("button", { name: "Tạo cuộc hội thoại", exact: true }).click();
    await expect(page.getByText("Quan điểm mở đầu:", { exact: false })).toContainText(
      "Không đồng ý",
    );
    const draft = page.getByLabel("Quan điểm hoặc câu hỏi của bạn", { exact: true });
    await draft.fill("My own opinion.");
    for (const step of ["P · Quan điểm", "R · Lý do", "E · Ví dụ", "C · Kết luận"])
      await page.getByRole("button", { name: new RegExp(step) }).click();
    await expect(draft).toHaveValue(
      "My own opinion.\nI think \nBecause \nFor example, \nThat's why I think ",
    );
    await page.getByText("Câu tranh luận tự nhiên & phản biện lịch sự", { exact: true }).click();
    await page
      .locator(".debate-phrase")
      .filter({ hasText: "I understand your point, but I think" })
      .click();
    await expect(draft).toHaveValue(
      "My own opinion.\nI think \nBecause \nFor example, \nThat's why I think \nI understand your point, but I think ",
    );
    await draft.fill("a".repeat(1999));
    await page.getByRole("button", { name: /P · Quan điểm/ }).click();
    await expect(page.locator(".debate-composer").getByRole("alert")).toContainText(
      "gần đủ 2.000 ký tự",
    );
    expect((await draft.inputValue()).length).toBe(1999);
    expect(calls).toBe(1);
    await draft.fill("I think students should put their phones away.");
    await expect(page.locator(".debate-composer").getByRole("alert")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `artifacts/debate-prec-${width}.png`, fullPage: true });
  });

  test(`voice replies stay editable and require an explicit send at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockMicrophone(page, "__debateMic");
    const sent: string[] = [];
    await page.route("**/api/debate", (route) => {
      const body = route.request().postDataJSON();
      if (body.action === "analyze")
        return route.fulfill({
          json: { analysis, source: "text", sourceName: "Nội dung đã nhập", token: "text-source" },
        });
      sent.push(body.message);
      return route.fulfill({
        json: {
          reply: "Why do small habits help?",
          translationVi: "Vì sao thói quen nhỏ hữu ích?",
          scope: "in_scope",
          warningVi: "",
          evidenceIds: ["E1"],
        },
      });
    });
    await page.goto("/debate");
    await page.getByLabel("Nội dung dùng để tranh luận", { exact: true }).fill(content);
    await page.getByRole("checkbox", { name: consentLabel, exact: true }).check();
    await page.getByRole("button", { name: "Tạo cuộc hội thoại", exact: true }).click();
    const answer = page.getByLabel("Quan điểm hoặc câu hỏi của bạn", { exact: true });
    const start = page.getByRole("button", { name: "Trả lời bằng giọng nói", exact: true });
    const send = page.getByRole("button", { name: "Gửi quan điểm", exact: true });
    const error = page.locator(".debate-composer").getByRole("alert");
    await answer.fill("I think:");
    await start.click();
    await expect(error).toContainText("Tích ô đồng ý");
    expect(await page.evaluate(() => !!window.__debateMic)).toBe(false);
    await page
      .getByRole("checkbox", { name: /Tôi đồng ý dùng tính năng chuyển giọng nói/ })
      .check();
    await start.click();
    expect(await page.evaluate(() => window.__debateMic.lang)).toBe("en-US");
    await expect(answer).toBeDisabled();
    await expect(send).toBeDisabled();
    await expect(page.getByRole("button", { name: "Nghe câu này", exact: true })).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Tạo cuộc hội thoại", exact: true }),
    ).toBeDisabled();
    await page.evaluate(() => {
      const mic = window.__debateMic;
      mic.onresult({ results: [{ isFinal: false, 0: { transcript: "Small habits" } }] });
      mic.onresult({
        results: [{ isFinal: true, 0: { transcript: "Small habits help us learn." } }],
      });
      mic.onend();
    });
    await expect.poll(() => page.evaluate(() => window.__debateMic.starts)).toBe(2);
    await expect(answer).toHaveValue("I think: Small habits help us learn.");
    await page.evaluate(() =>
      window.__debateMic.onresult({
        results: [{ isFinal: true, 0: { transcript: "I agree." } }],
      }),
    );
    await page.getByRole("button", { name: "Dừng mic", exact: true }).click();
    await expect(answer).toBeEnabled();
    await expect(answer).toHaveValue("I think: Small habits help us learn. I agree.");
    expect(sent).toEqual([]);
    await answer.fill("I agree because daily practice helps me.");
    await send.click();
    await expect(page.getByRole("log")).toContainText("Why do small habits help?");
    expect(sent).toEqual(["I agree because daily practice helps me."]);
    await start.click();
    await page.evaluate(() => {
      const mic = window.__debateMic;
      mic.onresult({ results: [{ isFinal: true, 0: { transcript: "Keep these words." } }] });
      mic.onerror({ error: "not-allowed" });
    });
    await expect(error).toContainText("Chưa được cấp quyền micro");
    await expect(answer).toHaveValue("Keep these words.");
    await start.click();
    await page.evaluate(() =>
      window.__debateMic.onresult({
        results: [{ isFinal: true, 0: { transcript: "a".repeat(2100) } }],
      }),
    );
    await expect(error).toContainText("Đã đủ 2.000 ký tự");
    expect((await answer.inputValue()).length).toBe(2000);
    await answer.fill("");
    await start.click();
    await page.screenshot({ path: `artifacts/debate-voice-${width}.png`, fullPage: true });
    await page.getByRole("link", { name: "Ôn tập", exact: true }).click();
    await page.getByRole("link", { name: "Luyện phát âm IPA" }).click();
    await expect(page).toHaveURL(/\/ipa$/);
    await expect.poll(() => page.evaluate(() => window.__debateMic.aborted)).toBe(true);
    expect(sent.length).toBe(1);
  });

  test(`create explains missing content and consent at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    let requests = 0;
    await page.route("**/api/debate", (route) => {
      requests++;
      return route.fulfill({
        json: { analysis, source: "text", sourceName: "Nội dung đã nhập", token: "text-source" },
      });
    });
    await page.goto("/debate");
    const input = page.getByLabel("Nội dung dùng để tranh luận", { exact: true });
    const create = page.getByRole("button", { name: "Tạo cuộc hội thoại", exact: true });
    const error = page.locator(".debate-input-panel").getByRole("alert");
    await expect(create).toBeEnabled();
    await create.click();
    await expect(error).toContainText("Nhập hoặc dán nội dung tiếng Anh");
    await expect(input).toBeFocused();
    await input.fill("Short text.");
    await create.click();
    await expect(error).toContainText("Cần thêm 69 ký tự");
    await input.fill(content);
    await create.click();
    await expect(error).toContainText("Tích ô đồng ý gửi nội dung đến OpenAI");
    const consent = page.getByRole("checkbox", { name: consentLabel, exact: true });
    await expect(consent).toBeFocused();
    expect(requests).toBe(0);
    await consent.check();
    await create.click();
    await expect(page.getByRole("log")).toContainText(analysis.questions[0]);
    expect(requests).toBe(1);
  });

  test(`textarea creates a conversation, opens with an AI question and keeps drafts at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      Object.defineProperty(window, "Audio", {
        value: class {
          onended: (() => void) | null = null;
          onerror: (() => void) | null = null;
          playbackRate = 1;
          play() {
            setTimeout(() => this.onended?.(), 1000);
            return Promise.resolve();
          }
          pause() {}
        },
      });
    });
    const spoken: string[] = [];
    let speechFails = true;
    await page.route("**/api/daily-speaking/speech", (route) => {
      spoken.push(route.request().postDataJSON().input);
      return route.fulfill(
        speechFails
          ? { status: 502, json: { error: "Chưa phát được âm thanh. Hãy thử lại." } }
          : { contentType: "audio/mpeg", body: "mock mp3" },
      );
    });
    let fail = false;
    await page.route("**/api/debate", (route) => {
      const body = route.request().postDataJSON();
      if (fail)
        return route.fulfill({
          status: 502,
          json: { error: "AI chưa thể phản hồi. Hãy thử lại." },
        });
      if (body.action === "analyze") {
        expect(body.content).toBe(content);
        expect(body.url).toBeUndefined();
        return route.fulfill({
          json: { analysis, source: "text", sourceName: "Nội dung đã nhập", token: "text-source" },
        });
      }
      expect(body.history[0]).toEqual({ role: "assistant", content: analysis.questions[0] });
      const unrelated = body.message.includes("weather");
      return route.fulfill({
        json: {
          reply: unrelated
            ? "Let's return to the text."
            : "The text suggests starting small. Do you agree?",
          translationVi: "Mình cùng thảo luận ý này nhé.",
          scope: unrelated ? "out_of_scope" : "in_scope",
          warningVi: unrelated ? "Câu này nằm ngoài chủ đề của nội dung đã cung cấp." : "",
          evidenceIds: unrelated ? [] : ["E1"],
        },
      });
    });
    await page.goto("/debate");
    await expect(page.getByLabel("Link video", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Tải clip / SRT", exact: true })).toHaveCount(0);
    const input = page.getByLabel("Nội dung dùng để tranh luận", { exact: true });
    const create = page.getByRole("button", { name: "Tạo cuộc hội thoại", exact: true });
    await expect(input).toBeVisible();
    await input.fill(content);
    await create.click();
    await expect(page.locator(".debate-input-panel").getByRole("alert")).toContainText(
      "Tích ô đồng ý",
    );
    await page.getByRole("checkbox", { name: consentLabel, exact: true }).check();
    await create.click();
    await expect(page.getByRole("heading", { name: analysis.title })).toBeVisible();
    await expect(page.locator(".debate-level")).toHaveText("B1");
    await expect(page.getByRole("log")).toContainText(analysis.questions[0]);
    await expect(page.locator(".debate-source-meta")).toContainText("NỘI DUNG ĐÃ NHẬP");
    expect(spoken).toEqual([]);
    const opening = page.locator(".debate-message").first();
    await expect(opening.locator('[data-vocabulary="common"]').first()).toHaveText("Do");
    await expect(opening.locator(".debate-learning-word").first()).toHaveCSS(
      "color",
      "rgb(157, 51, 39)",
    );
    await opening.getByRole("button", { name: "Nghe câu này", exact: true }).click();
    await expect(opening.getByRole("alert")).toContainText("Chưa phát được âm thanh");
    speechFails = false;
    await opening.getByRole("button", { name: "Nghe câu này", exact: true }).click();
    await expect(opening.getByRole("alert")).toHaveCount(0);
    await opening.getByRole("button", { name: "Dừng âm thanh" }).click();
    await expect(opening.getByRole("button", { name: "Nghe câu này", exact: true })).toBeVisible();
    expect(spoken).toEqual([analysis.questions[0], analysis.questions[0]]);
    await page.getByRole("button", { name: analysis.questions[1], exact: true }).click();
    const draft = page.getByLabel("Quan điểm hoặc câu hỏi của bạn", { exact: true });
    await expect(draft).toHaveValue(analysis.questions[1]);
    await draft.fill("I disagree because five minutes is too short.");
    await page.getByRole("button", { name: "Gửi quan điểm", exact: true }).click();
    await expect(page.getByRole("log")).toContainText("Căn cứ từ nội dung: E1");
    await expect(
      page.locator('.debate-message-user [data-vocabulary="phrase"]').first(),
    ).toHaveText("I disagree");
    await expect(
      page.getByRole("log").getByRole("button", { name: "Nghe câu này", exact: true }),
    ).toHaveCount(3);
    await page.screenshot({ path: `artifacts/debate-audio-${width}.png`, fullPage: true });
    await draft.fill("What is the weather in Hanoi?");
    await page.getByRole("button", { name: "Gửi quan điểm", exact: true }).click();
    await expect(page.getByRole("log").getByRole("alert")).toContainText("ngoài chủ đề");
    fail = true;
    await draft.fill("Please explain the first point.");
    await page.getByRole("button", { name: "Gửi quan điểm", exact: true }).click();
    await expect(page.locator(".debate-composer").getByRole("alert")).toBeVisible();
    await expect(draft).toHaveValue("Please explain the first point.");
    await create.click();
    await expect(page.locator(".debate-input-panel").getByRole("alert")).toBeVisible();
    await expect(input).toHaveValue(content);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });

  for (const extension of ["txt", "srt"] as const) {
    test(`${extension} upload creates a conversation and retries at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      let fail = true;
      await page.route("**/api/debate/upload", (route) => {
        expect(route.request().headers()["content-type"]).toContain(
          "multipart/form-data; boundary=",
        );
        expect(route.request().postDataBuffer()?.toString()).toContain(
          `name="file"; filename="lesson.${extension}"`,
        );
        expect(route.request().postDataBuffer()?.toString()).toMatch(
          /name="stance"\r\n\r\nagree\r\n/,
        );
        return route.fulfill(
          fail
            ? { status: 502, json: { error: "Chưa thể tạo cuộc hội thoại. Hãy thử lại." } }
            : {
                json: {
                  analysis,
                  source: extension,
                  sourceName: `lesson.${extension}`,
                  stance: "agree",
                  token: "file-source",
                },
              },
        );
      });
      await page.goto("/debate");
      await page.getByRole("button", { name: "Tải tệp TXT / SRT", exact: true }).click();
      await page.getByRole("button", { name: "Đồng ý", exact: true }).click();
      const file = page.getByLabel("Chọn tệp TXT hoặc SRT", { exact: true });
      const create = page.getByRole("button", { name: "Tạo cuộc hội thoại", exact: true });
      const consent = page.getByRole("checkbox", { name: consentLabel, exact: true });
      await expect(file).toHaveAttribute("accept", ".txt,.srt");
      await file.setInputFiles({
        name: "unsupported.mp4",
        mimeType: "video/mp4",
        buffer: Buffer.from("unsupported media"),
      });
      await expect(page.locator(".debate-input-panel").getByRole("alert")).toContainText(
        "Chỉ hỗ trợ tệp văn bản .txt hoặc phụ đề .srt",
      );
      await create.click();
      await expect(page.locator(".debate-input-panel").getByRole("alert")).toContainText(
        "Chỉ hỗ trợ tệp văn bản .txt hoặc phụ đề .srt",
      );
      await file.setInputFiles({
        name: `lesson.${extension}`,
        mimeType: "text/plain",
        buffer: Buffer.from(
          extension === "srt" ? `1\n00:00:00,000 --> 00:00:10,000\n${content}\n` : content,
        ),
      });
      await consent.check();
      await create.click();
      await expect(page.locator(".debate-input-panel").getByRole("alert")).toContainText(
        "Hãy thử lại",
      );
      expect(await file.evaluate((input: HTMLInputElement) => input.files?.[0]?.name)).toBe(
        `lesson.${extension}`,
      );
      fail = false;
      await create.click();
      await expect(page.getByRole("log")).toContainText(analysis.questions[0]);
      await expect(page.getByText(`Nguồn: lesson.${extension}`, { exact: true })).toBeVisible();
      await expect(page.locator(".debate-source-meta")).toContainText(
        extension === "srt" ? "TỆP PHỤ ĐỀ SRT" : "TỆP VĂN BẢN TXT",
      );
      await expect(page.getByRole("link", { name: "Mở video gốc" })).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (extension === "txt")
        await page.screenshot({ path: `artifacts/debate-text-${width}.png`, fullPage: true });
      await page.getByRole("button", { name: "Nhập nội dung", exact: true }).click();
      await page.getByRole("button", { name: "Tải tệp TXT / SRT", exact: true }).click();
      expect(await file.evaluate((input: HTMLInputElement) => input.files?.length)).toBe(0);
      await create.click();
      await expect(page.locator(".debate-input-panel").getByRole("alert")).toContainText(
        "Hãy chọn tệp TXT hoặc SRT",
      );
    });
  }
}

test("missing AI configuration preserves textarea input", async ({ page }) => {
  await page.goto("/debate");
  await page.getByLabel("Nội dung dùng để tranh luận", { exact: true }).fill(content);
  await page.getByRole("checkbox", { name: consentLabel, exact: true }).check();
  await page.getByRole("button", { name: "Tạo cuộc hội thoại", exact: true }).click();
  await expect(page.locator(".debate-input-panel").getByRole("alert")).toContainText(
    "AI phân tích chưa sẵn sàng",
  );
  await expect(page.getByLabel("Nội dung dùng để tranh luận", { exact: true })).toHaveValue(
    content,
  );
});

test("an unsupported microphone keeps typed debate replies available", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "SpeechRecognition", { value: undefined });
    Object.defineProperty(window, "webkitSpeechRecognition", { value: undefined });
  });
  await page.route("**/api/debate", (route) =>
    route.fulfill({
      json: { analysis, source: "text", sourceName: "Nội dung đã nhập", token: "text-source" },
    }),
  );
  await page.goto("/debate");
  await page.getByLabel("Nội dung dùng để tranh luận", { exact: true }).fill(content);
  await page.getByRole("checkbox", { name: consentLabel, exact: true }).check();
  await page.getByRole("button", { name: "Tạo cuộc hội thoại", exact: true }).click();
  await expect(
    page.getByText(
      "Trình duyệt chưa hỗ trợ nhận diện giọng nói. Bạn vẫn có thể nhập câu trả lời.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Trả lời bằng giọng nói", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Quan điểm hoặc câu hỏi của bạn", { exact: true }).fill("I agree.");
  await expect(page.getByRole("button", { name: "Gửi quan điểm", exact: true })).toBeEnabled();
});
