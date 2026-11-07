import { expect, test, type Page } from "@playwright/test";
import { mockMicrophone } from "./microphone-fixture";
async function quickStart(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
  await expect(page.locator(".natural-hero")).toBeVisible();
}
async function mockTutor(page: Page) {
  await page.route("**/api/daily-speaking", (route) =>
    route.fulfill({
      json: {
        reply: "Thanks for sharing. What do you do next?",
        explanationVi: "Bạn đã chia sẻ về thói quen. Hãy thử diễn đạt thêm một ý.",
      },
    }),
  );
}
test("onboarding includes a skippable listening and response baseline without mic permission", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Mình nên gọi bạn là gì?").fill("Linh");
  await page.getByRole("button", { name: "Tiếp tục · Làm quen nhanh" }).click();
  await expect(
    page.getByRole("heading", { name: "Bắt đầu bằng một câu quen thuộc." }),
  ).toBeVisible();
  await page.getByText("Không nghe được? Xem câu chữ").click();
  await page.getByLabel("Tôi ra khỏi giường lúc bảy giờ.").check();
  await page.getByLabel("What time do you get up?").fill("I get up at six.");
  await page.getByRole("button", { name: "Bắt đầu từ Basic" }).click();
  await expect(page.getByRole("heading", { name: /Chào Linh/ })).toBeVisible();
  const profile = await page.evaluate(
    () => JSON.parse(localStorage.getItem("natural-english:v2")!).profile,
  );
  expect(profile.baseline.listeningCorrect).toBe(true);
  expect(profile.baseline.response).toBe("I get up at six.");
});
test("guided lesson switches versions, saves unsent text and resumes the exact segment", async ({
  page,
}) => {
  await mockTutor(page);
  await quickStart(page);
  await page.getByRole("link", { name: "Bắt đầu học", exact: true }).click();
  await expect(page).toHaveURL(/\/preview\/my-daily-routine$/);
  await expect(page.getByText(/Bản học thử · Nội dung/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Basic", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Natural", exact: true }).click();
  await expect(page.getByRole("heading", { name: "I usually get up around 5:40." })).toBeVisible();
  await page.getByRole("button", { name: "Ẩn tiếng Việt", exact: true }).click();
  await expect(
    page.getByText("Tôi thường ra khỏi giường vào khoảng 5 giờ 40.", { exact: true }),
  ).toBeHidden();
  const answer = page.getByLabel("Câu trả lời của bạn", { exact: true });
  await answer.fill("I get up at six.");
  await page.reload();
  await expect(answer).toHaveValue("I get up at six.");
  await page.getByRole("button", { name: "Gửi câu trả lời", exact: true }).click();
  await expect(
    page.getByText("Thanks for sharing. What do you do next?", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tiếp theo", exact: true }).click();
  await expect(page.getByRole("heading", { name: "When do you leave home?" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "When do you leave home?" })).toBeVisible();
  await page.getByRole("link", { name: "Về hôm nay · tiến độ đã lưu" }).click();
  await expect(page.getByRole("link", { name: "Tiếp tục học", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Tiếp tục học", exact: true }).click();
  await expect(page.getByRole("heading", { name: "When do you leave home?" })).toBeVisible();
});
test("completed lesson feeds flashcards, reveals answers on demand and persists ratings", async ({
  page,
}) => {
  await mockTutor(page);
  await quickStart(page);
  await page.goto("/preview/my-daily-routine");
  for (let i = 0; i < 6; i++) {
    await page
      .getByLabel("Câu trả lời của bạn", { exact: true })
      .fill(`I practice this situation ${i}.`);
    await page.getByRole("button", { name: "Gửi câu trả lời", exact: true }).click();
    await expect(
      page.getByText("Thanks for sharing. What do you do next?", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: i === 5 ? "Hoàn thành bài" : "Tiếp theo", exact: true })
      .click();
  }
  await expect(page.getByRole("heading", { name: "Mang một câu vào ngày hôm nay." })).toBeVisible();
  await page.getByRole("link", { name: "Ôn lại câu vừa học" }).click();
  const deck = page.getByRole("list", { name: "Các thẻ đến hạn" });
  await expect(deck.getByRole("button")).toHaveCount(6);
  await page.screenshot({ path: "artifacts/review-cards-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.screenshot({ path: "artifacts/review-cards-mobile.png", fullPage: true });
  await deck.getByRole("button", { name: /Chúng tôi rời nhà/ }).click();
  await expect(page.getByRole("heading", { name: "Chúng tôi rời nhà." })).toBeVisible();
  await page.getByRole("button", { name: "Lật thẻ", exact: true }).click();
  await expect(page.getByRole("group", { name: "Bạn nhớ câu này thế nào?" })).toBeVisible();
  await deck.getByRole("button", { name: /Tôi thức dậy lúc 5 giờ 40/ }).click();
  await expect(page.getByRole("button", { name: "Lật thẻ", exact: true })).toBeVisible();
  await expect(page.getByText("I wake up at 5:40.", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Lật thẻ", exact: true }).click();
  await expect(page.getByText("I wake up at 5:40.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Nhớ", exact: true }).dblclick();
  await expect(page.getByText(/5 thẻ đến hạn/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/5 thẻ đến hạn/)).toBeVisible();
  const reviews = await page.evaluate(
    () => JSON.parse(localStorage.getItem("natural-english:v2")!).cardReviews,
  );
  expect(Object.values(reviews)).toHaveLength(1);
  expect(Object.values(reviews)[0]).toMatchObject({ count: 1, intervalDays: 2, rating: "good" });
  await page.goto("/progress");
  await expect(page.locator(".natural-progress-stats > div").first().locator("strong")).toHaveText(
    "0",
  );
  await expect(page.getByText(/1 bài học thử hoàn thành/)).toBeVisible();
});
test("provider failure keeps the response and offers a model without inventing feedback", async ({
  page,
}) => {
  await quickStart(page);
  await page.goto("/preview/my-daily-routine");
  await page.getByLabel("Câu trả lời của bạn", { exact: true }).fill("I get up early.");
  await page.getByRole("button", { name: "Gửi câu trả lời", exact: true }).click();
  await expect(page.locator(".natural-feedback[role=alert]")).toContainText("chưa có đánh giá AI");
  await expect(page.getByLabel("Câu trả lời của bạn", { exact: true })).toHaveValue(
    "I get up early.",
  );
  await expect(page.getByRole("button", { name: "Tiếp theo", exact: true })).toBeEnabled();
});
test("a segment selected in another tab restores its own draft and clears old feedback", async ({
  page,
}) => {
  await mockTutor(page);
  await quickStart(page);
  await page.goto("/preview/my-daily-routine");
  const answer = page.getByLabel("Câu trả lời của bạn", { exact: true });
  await answer.fill("I get up at six.");
  await page.getByRole("button", { name: "Gửi câu trả lời", exact: true }).click();
  await expect(
    page.getByText("Thanks for sharing. What do you do next?", { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    const key = "natural-english:v2";
    const oldValue = localStorage.getItem(key)!;
    const state = JSON.parse(oldValue);
    const visit = Object.values(state.lessonVisits)[0] as { index: number; updatedAt: string };
    visit.index = 1;
    visit.updatedAt = new Date().toISOString();
    const newValue = JSON.stringify(state);
    localStorage.setItem(key, newValue);
    window.dispatchEvent(
      new StorageEvent("storage", { key, oldValue, newValue, storageArea: localStorage }),
    );
  });
  await expect(page.getByRole("heading", { name: "When do you leave home?" })).toBeVisible();
  await expect(answer).toHaveValue("");
  await expect(
    page.getByText("Thanks for sharing. What do you do next?", { exact: true }),
  ).toHaveCount(0);
  await answer.fill("I leave home at seven.");
  const answers = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("natural-english:v2")!);
    return Object.values(state.lessonVisits)[0];
  });
  expect(answers).toMatchObject({
    answers: { "routine-1": "I get up at six." },
    drafts: { "routine-1": "I get up at six.", "routine-2": "I leave home at seven." },
  });
});

test("reading time continues after advancing to the next situation", async ({ page }) => {
  await page.clock.install();
  await mockTutor(page);
  await quickStart(page);
  await page.goto("/preview/my-daily-routine");
  await page.clock.runFor(100);
  await page.getByLabel("Câu trả lời của bạn", { exact: true }).fill("I get up at six.");
  await page.getByRole("button", { name: "Gửi câu trả lời", exact: true }).click();
  await expect(
    page.getByText("Thanks for sharing. What do you do next?", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tiếp theo", exact: true }).click();
  await expect(page.getByRole("heading", { name: "When do you leave home?" })).toBeVisible();
  const seconds = () =>
    page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("natural-english:v2")!);
      return Object.values(state.dailySeconds as Record<string, number>).reduce(
        (sum, value) => sum + value,
        0,
      );
    });
  const before = await seconds();
  await page.clock.runFor(3_000);
  expect(await seconds()).toBeGreaterThan(before);
});

test("microphone consent stays selected while moving between situations in a lesson", async ({
  page,
}) => {
  await mockMicrophone(page, "__mic");
  await mockTutor(page);
  await quickStart(page);
  await page.goto("/preview/my-daily-routine");
  const consent = page.getByRole("checkbox", { name: /Tôi đồng ý dùng nhận diện giọng nói/ });
  await consent.check();
  await page.getByLabel("Câu trả lời của bạn", { exact: true }).fill("I get up at six.");
  await page.getByRole("button", { name: "Gửi câu trả lời", exact: true }).click();
  await expect(
    page.getByText("Thanks for sharing. What do you do next?", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tiếp theo", exact: true }).click();
  await expect(page.getByRole("heading", { name: "When do you leave home?" })).toBeVisible();
  await expect(consent).toBeChecked();
});
test("draft lesson is private through production API and the 52 weeks are a plan", async ({
  page,
  request,
}) => {
  await quickStart(page);
  await page.goto("/path");
  await expect(page.locator(".natural-path-week")).toHaveCount(52);
  await expect(page.getByText("Đang chuẩn bị", { exact: true })).toHaveCount(52);
  expect((await request.get("/api/v1/lessons/my-daily-routine")).status()).toBe(404);
  const response = await request.get("/api/v1/lessons");
  expect((await response.json()).lessons).toEqual([]);
});
test("applied wisdom is a short modern interpretation and offers speaking practice", async ({
  page,
}) => {
  await quickStart(page);
  await page.goto("/roadmap");
  await page.getByRole("button", { name: "Giao tiếp ứng xử", exact: true }).click();
  await page.getByRole("link", { name: /Listen before you answer/ }).click();
  await expect(
    page.getByText("You don't have to answer right away. Listen first.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/không phải trích dẫn hoặc bản dịch trực tiếp/)).toBeVisible();
  await page.getByText("Xem hội thoại gợi ý").click();
  await expect(page.locator(".natural-dialogue")).toHaveCount(4);
  await expect(page.getByLabel("Câu trả lời của bạn", { exact: true })).toBeVisible();
});
test("the suggested daily goal never locks the new lesson", async ({ page }) => {
  await quickStart(page);
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("natural-english:v2")!);
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    state.dailySeconds[today] = 3600;
    localStorage.setItem("natural-english:v2", JSON.stringify(state));
  });
  await page.reload();
  await page.getByRole("link", { name: "Bắt đầu học", exact: true }).click();
  await expect(page.getByLabel("Câu trả lời của bạn", { exact: true })).toBeEnabled();
});
