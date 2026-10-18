import { expect, test, type Page } from "@playwright/test";
import { completeCarnegieListening } from "./lesson-helpers";
const profile = {
  name: "Long",
  role: "developer",
  goal: "both",
  confidence: "some",
  largeText: false,
  mic: false,
};
async function onboard(page: Page) {
  await page.goto("/");
  await page.getByLabel("Mình nên gọi bạn là gì?").fill("Long");
  await page.getByRole("combobox", { name: "Vai trò / ngữ cảnh công việc" }).fill("Developer");
  await page.getByRole("option", { name: "Software Developer" }).click();
  await page.getByRole("button", { name: "Vào không gian học" }).click();
  await expect(page.getByRole("heading", { name: "Giao tiếp mỗi ngày." })).toBeVisible();
}
async function mockSpeech(page: Page) {
  await page.route("**/api/tts", (route) =>
    route.fulfill({ status: 200, contentType: "audio/mpeg", body: "mock mp3" }),
  );
  await page.addInitScript(() => {
    Object.defineProperty(window, "Audio", {
      value: class {
        onended: (() => void) | null = null;
        onerror: (() => void) | null = null;
        playbackRate = 1;
        constructor(_src: string) {}
        play() {
          setTimeout(() => this.onended?.(), 30);
          return Promise.resolve();
        }
        pause() {}
      },
    });
  });
}
async function next(page: Page) {
  await page.getByRole("button", { name: "Hoàn thành bước", exact: true }).click();
}
async function speechTurns(page: Page) {
  await page.getByRole("button", { name: "Nhập câu trả lời", exact: true }).click();
  for (let i = 0; i < 3; i++) {
    await page.locator("textarea").fill(`I can help with this task and ask a question ${i}.`);
    await page
      .getByRole("button", {
        name: i < 2 ? "Lưu & nghe câu hỏi tiếp" : "Lưu lượt trả lời",
        exact: true,
      })
      .click();
  }
  await expect(page.getByText("Đã luyện đủ 3 lượt phản hồi.")).toBeVisible();
}
test("three-step lesson, optional practice, truthful typed responses and reload", async ({
  page,
}) => {
  await mockSpeech(page);
  await onboard(page);
  await page.getByRole("button", { name: "Bắt đầu buổi học", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Nghe mẫu", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Hoàn thành bước", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Xem lời thoại sau khi trả lời" })).toBeDisabled();
  const voice = page.getByRole("combobox", { name: "Giọng Anh-Mỹ" });
  await voice.fill("Giọng 2");
  await page.getByRole("option", { name: "Giọng 2" }).click();
  const listenRequest = page.waitForRequest("**/api/tts");
  await page.getByRole("button", { name: "Nghe hội thoại", exact: true }).click();
  expect((await listenRequest).postDataJSON().voice).toBe("alloy");
  await page.getByRole("button", { name: /Mua đồ ăn sáng trên đường đi làm/ }).click();
  await page.getByRole("button", { name: "Kiểm tra câu trả lời" }).click();
  await page.getByRole("button", { name: "Xem lời thoại sau khi trả lời" }).click();
  await expect(page.getByRole("table", { name: "Bản ngắn gọn", exact: true })).toContainText(
    "I grab breakfast on my way to work.",
  );
  await expect(page.getByRole("table", { name: "Bản đầy đủ", exact: true })).toContainText(
    "I usually get up early and grab breakfast on my way to work.",
  );
  await page.getByRole("button", { name: "Gợi ý tiếng Việt", exact: true }).click();
  await expect(page.getByRole("table", { name: "Bản đầy đủ", exact: true })).toContainText(
    "Tôi thường dậy sớm rồi ghé mua đồ ăn sáng trên đường đi làm.",
  );
  const fullAudio = page.waitForRequest("**/api/tts");
  await page.getByRole("button", { name: "Nghe bản đầy đủ", exact: true }).click();
  expect((await fullAudio).postDataJSON().spokenText).toBe(
    "I usually get up early and grab breakfast on my way to work.",
  );
  const grammarTable = page.getByRole("table", { name: "Bản đúng ngữ pháp", exact: true });
  await expect(grammarTable).toBeHidden();
  await page.getByText("Xem bản đúng ngữ pháp", { exact: true }).click();
  await expect(grammarTable).toBeVisible();
  await page.screenshot({ path: "artifacts/lesson-grammar-open.png", fullPage: true });
  await expect(grammarTable).toContainText(
    "I usually get up early. I get breakfast on the way to work.",
  );
  const grammarAudio = page.waitForRequest("**/api/tts");
  await page.getByRole("button", { name: "Nghe bản đúng ngữ pháp", exact: true }).click();
  expect((await grammarAudio).postDataJSON().spokenText).toBe(
    "I usually get up early. I get breakfast on the way to work.",
  );
  await page.getByText("Xem bản đúng ngữ pháp", { exact: true }).click();
  await expect(grammarTable).toBeHidden();
  await completeCarnegieListening(page);
  await next(page);
  await expect(page.getByRole("heading", { name: "Bạn lên tiếng", exact: true })).toBeVisible();
  await page.getByText("Luyện thêm: nghe và nói theo câu mẫu", { exact: true }).click();
  await page.getByRole("button", { name: "Nhịp tự nhiên · 1×", exact: true }).click();
  await page.getByRole("button", { name: "Tôi đã nghe và nói theo", exact: true }).click();
  await expect(page.getByRole("button", { name: "Hoàn thành bước", exact: true })).toBeDisabled();
  await page.getByText("Luyện thêm: nghe và nói theo câu mẫu", { exact: true }).click();
  await page.getByRole("button", { name: "Nhập câu trả lời", exact: true }).click();
  await page.locator("textarea").fill("I get coffee before work.");
  await page.reload();
  await page.getByRole("button", { name: "Nhập câu trả lời", exact: true }).click();
  await expect(page.locator("textarea")).toHaveValue("I get coffee before work.");
  await speechTurns(page);
  await next(page);
  await expect(page.getByRole("heading", { name: "Dùng ngoài đời", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Khi trò chuyện với đồng nghiệp", exact: true }).click();
  await page
    .getByLabel("Viết một câu hỏi thể hiện sự quan tâm đến đồng nghiệp.", { exact: true })
    .fill("How was your morning?");
  await page.getByRole("button", { name: "Giữ lại câu này", exact: true }).click();
  await page.getByRole("button", { name: "Xem tổng kết", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Một bước tiến thật sự." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Trò chuyện tự do với AI Lead" })).toBeVisible();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("natural-english:v2")!));
  const session = Object.values(state.sessions)[0] as {
    completed: string[];
    seconds: number[];
    attempts: { kind: string }[];
  };
  expect(session.completed).toEqual(["visual-listening", "speaking", "reflection"]);
  expect(session.seconds.reduce((a, b) => a + b, 0)).toBe(0);
  expect(session.attempts.filter((a) => a.kind === "typed")).toHaveLength(3);
  expect(session.attempts.filter((a) => a.kind === "speaking")).toHaveLength(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Một bước tiến thật sự." })).toBeVisible();
});
test("all profile choices and lesson day use searchable comboboxes", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const goal = page.getByRole("combobox", { name: "Bạn muốn dùng tiếng Anh ở đâu?" });
  await goal.fill("công việc");
  await page.getByRole("option", { name: "Ưu tiên công việc" }).click();
  await expect(goal).toHaveValue("Ưu tiên công việc");
  await goal.fill("không có lựa chọn này");
  await goal.press("Tab");
  await expect(goal).toHaveValue("Ưu tiên công việc");
  const confidence = page.getByRole("combobox", { name: "Mức tự tin hiện tại" });
  await confidence.fill("Khá tự tin");
  await confidence.press("ArrowDown");
  await confidence.press("Enter");
  await expect(confidence).toHaveValue("Khá tự tin, muốn ứng biến tự nhiên");
  await page.getByRole("button", { name: "Vào không gian học" }).click();
  await page.goto("/roadmap");
  const day = page.getByRole("combobox", { name: "Chọn buổi trong tuần" });
  await day.fill("Ngày 2");
  await page.getByRole("option", { name: "Ngày 2 · Understand" }).click();
  await expect(day).toHaveValue("Ngày 2 · Understand");
  await day.click();
  const popup = page.locator(".app-combobox-popup");
  const bounds = await popup.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375);
  await day.press("Escape");
});
test("profile role, roadmap search and persistence", async ({ page }) => {
  await onboard(page);
  await page.goto("/settings");
  await page.getByRole("combobox", { name: "Vai trò / ngữ cảnh công việc" }).fill("Product Owner");
  await page.getByRole("option", { name: "Product Owner" }).click();
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Vai trò / ngữ cảnh công việc" })).toHaveValue(
    "Product Owner",
  );
  await page.locator(".side-nav").getByRole("link", { name: "Danh sách bài học" }).click();
  await page.getByRole("textbox", { name: "Tìm tuần học" }).fill("52");
  await page.getByRole("button", { name: /52 Final B1/ }).click();
  await expect(page.getByRole("heading", { name: "Final B1 + 80% Test" })).toBeVisible();
});
test("first month has four distinct square week illustrations", async ({ page }) => {
  await onboard(page);
  await page.goto("/roadmap");
  const thumbnails = page.locator(".week-artwork");
  await expect(thumbnails).toHaveCount(4);
  const sources = await thumbnails.evaluateAll((images) =>
    images.map((image) => image.getAttribute("src")),
  );
  expect(new Set(sources).size).toBe(4);
  const thumbnail = await thumbnails.first().boundingBox();
  expect(thumbnail?.width).toBe(thumbnail?.height);
  await expect
    .poll(() =>
      thumbnails.evaluateAll((images) =>
        images.every((image) => (image as HTMLImageElement).complete),
      ),
    )
    .toBe(true);
  await page.screenshot({ path: "artifacts/roadmap-month-one.png", fullPage: true });
  const firstPreview = await page.locator(".module-art img").getAttribute("src");
  const preview = await page.locator(".module-art").boundingBox();
  const previewImage = await page.locator(".module-art img").boundingBox();
  expect(previewImage?.width).toBe(preview?.width);
  await page.getByRole("button", { name: /Tuần 2 Family/ }).click();
  await expect(page.locator(".module-art img")).toHaveAttribute("alt", "Minh họa chủ đề Family");
  expect(await page.locator(".module-art img").getAttribute("src")).not.toBe(firstPreview);
  await page.setViewportSize({ width: 390, height: 850 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/roadmap-month-one-mobile.png", fullPage: true });
});
test("choose work topics immediately; old completed lessons replay without losing history", async ({
  page,
}) => {
  await onboard(page);
  await expect(page.locator(".dashboard").getByRole("button")).toHaveCount(1);
  await page.goto("/roadmap");
  await page
    .getByRole("group", { name: "Chọn ngữ cảnh giao tiếp" })
    .getByRole("button", { name: "Công việc", exact: true })
    .click();
  await page.getByRole("textbox", { name: "Tìm tuần học" }).fill("20");
  await page.getByRole("button", { name: /Tuần 20 Task Updates/ }).click();
  await expect(page.getByRole("heading", { name: "Task Updates" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mở bài luyện" })).toBeEnabled();
  await expect(page.locator(".module-preview .lesson-lock-note")).toHaveCount(0);
  await page.getByRole("button", { name: "Mở bài luyện", exact: true }).click();
  await expect(page).toHaveURL(/session\/w20-d1-developer$/);
  await page.goto("/");
  await page.getByRole("button", { name: "Tiếp tục buổi học", exact: true }).click();
  await expect(page).toHaveURL(/session\/w20-d1-developer$/);
  await page.goto("/#roleplay");
  await expect(page.getByRole("heading", { name: "Giao tiếp mỗi ngày." })).toBeVisible();

  await page.evaluate(() => {
    const key = "w20-d1-developer";
    const state = JSON.parse(localStorage.getItem("natural-english:v2")!);
    state.sessions[key] = {
      key,
      week: 20,
      day: 1,
      stage: 0,
      completed: [],
      seconds: Array(8).fill(0),
      attempts: [],
      drafts: {},
    };
    localStorage.setItem("natural-english:v2", JSON.stringify(state));
  });
  await page.reload();
  await page.goto("/session/w20-d1-developer");
  await expect(page.getByRole("heading", { name: "Nghe mẫu", exact: true })).toBeVisible();

  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("natural-english:v2")!);
    delete state.sessions["w20-d1-developer"];
    state.activeWeek = 1;
    state.activeDay = 1;
    const stages = [
      "review",
      "visual-listening",
      "shadowing",
      "speaking",
      "read-write",
      "communication-listening",
      "communication-speaking",
      "reflection",
    ];
    const key = "w1-d1-developer";
    state.sessions[key] = {
      key,
      week: 1,
      day: 1,
      stage: 7,
      completed: stages,
      seconds: Array(8).fill(0),
      drafts: {},
      finishedAt: new Date().toISOString(),
      attempts: stages.flatMap((stage) =>
        Array.from({ length: stage.includes("speaking") ? 3 : 1 }, (_, i) => ({
          id: `${stage}-${i}`,
          stage,
          kind: "typed",
          answer: "Practice response",
          at: new Date().toISOString(),
        })),
      ),
    };
    localStorage.setItem("natural-english:v2", JSON.stringify(state));
  });
  await page.reload();
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Bắt đầu buổi học", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Bắt đầu buổi học", exact: true }).click();
  await expect(page.locator(".lesson-page .eyebrow").first()).toContainText("NGÀY 2");
  await page.goto("/roadmap");
  await page.getByRole("button", { name: "Học lại bài", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Nghe mẫu", exact: true })).toBeVisible();
  const sessions = await page.evaluate(
    () => JSON.parse(localStorage.getItem("natural-english:v2")!).sessions,
  );
  expect(sessions["w1-d1-developer"].finishedAt).toBeTruthy();
  expect(sessions["w1-d1-developer-r1"].finishedAt).toBeUndefined();
  await page.goto("/");
  await page.getByRole("button", { name: "Tiếp tục buổi học", exact: true }).click();
  await expect(page).toHaveURL(/\/session\/w1-d1-developer-r1$/);
  expect(
    await page.evaluate(() =>
      Object.keys(JSON.parse(localStorage.getItem("natural-english:v2")!).sessions).filter((key) =>
        key.startsWith("w1-d1-developer-r"),
      ),
    ),
  ).toEqual(["w1-d1-developer-r1"]);
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
  await expect(
    page.getByRole("heading", { name: "Bạn đã học đủ thời gian hôm nay." }),
  ).toBeVisible();
});
test("corrupt storage, offline audio fallback and microphone denied", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("natural-english:v2", "{broken");
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: () =>
          Promise.reject(new DOMException("Permission denied", "NotAllowedError")),
      },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
  await page.getByRole("button", { name: "Bắt đầu buổi học", exact: true }).click();
  await page.getByText("Cần phụ đề hoặc không phát được âm thanh?", { exact: true }).click();
  await page.getByRole("button", { name: "Mở hỗ trợ chữ", exact: true }).click();
  await page.getByRole("button", { name: /Mua đồ ăn sáng trên đường đi làm/ }).click();
  await page.getByRole("button", { name: "Kiểm tra câu trả lời" }).click();
  await expect(page.getByText("Lần sau, thử nghe trước khi mở lời thoại.")).toBeVisible();
  await completeCarnegieListening(page);
  await next(page);
  await page.getByRole("button", { name: /Thu âm & nghe lại/ }).click();
  await page.getByRole("button", { name: "Bắt đầu thu", exact: true }).click();
  await expect(page.locator(".recording-error")).toBeVisible();
  await page.getByRole("checkbox", { name: "Tôi đã trả lời thành tiếng", exact: true }).check();
  await page.getByRole("button", { name: "Lưu & nghe câu hỏi tiếp", exact: true }).click();
  await expect(page.getByRole("button", { name: "Hoàn thành bước", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Nhập câu trả lời", exact: true }).click();
  for (let i = 1; i < 3; i++) {
    await page.locator("textarea").fill("I can try another way.");
    await page
      .getByRole("button", {
        name: i < 2 ? "Lưu & nghe câu hỏi tiếp" : "Lưu lượt trả lời",
        exact: true,
      })
      .click();
  }
  await expect(page.getByRole("button", { name: "Hoàn thành bước", exact: true })).toBeEnabled();
});
test("daily cap persists across routes and reopening a lesson", async ({ page }) => {
  await page.addInitScript(
    ({ p }) => {
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
      localStorage.setItem(
        "natural-english:v2",
        JSON.stringify({
          version: 2,
          profile: p,
          activeWeek: 1,
          activeDay: 1,
          sessions: {},
          dailySeconds: { [today]: 3600 },
        }),
      );
    },
    { p: profile },
  );
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Bắt đầu buổi học", exact: true })).toBeDisabled();
  await expect(page.locator(".dashboard").getByRole("button")).toHaveCount(1);
  await page.goto("/roadmap");
  await page.getByRole("button", { name: "Mở bài luyện", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Bạn đã học đủ thời gian hôm nay." }),
  ).toBeVisible();
});
test("home recommends the next lesson when the saved selection has no active session", async ({
  page,
}) => {
  await page.addInitScript((savedProfile) => {
    localStorage.setItem(
      "natural-english:v2",
      JSON.stringify({
        version: 2,
        profile: savedProfile,
        activeWeek: 20,
        activeDay: 1,
        sessions: {},
        dailySeconds: {},
      }),
    );
  }, profile);
  await page.goto("/");
  const start = page.getByRole("button", { name: "Bắt đầu buổi học", exact: true });
  await expect(start).toBeVisible();
  await expect(start).toBeEnabled();
  await start.click();
  await expect(page.locator(".lesson-page .eyebrow").first()).toContainText("TUẦN 1");
});
for (const width of [360, 390, 768, 1280, 1440])
  test(`responsive screens at ${width}px and accessible keyboard focus`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await onboard(page);
    for (const view of ["today", "roadmap", "settings"]) {
      await page.goto(`/${view === "today" ? "" : view}`);
      await expect(page.locator("#main")).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    }
    await page.goto("/");
    await page.screenshot({
      path: `artifacts/dashboard-${width}.png`,
      fullPage: true,
    });
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
    await page.getByRole("button", { name: "Bắt đầu buổi học", exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: `artifacts/lesson-${width}.png`,
      fullPage: true,
    });
  });
test("lesson navigation includes Daily Speaking; arbitrary lesson TTS text is rejected", async ({
  page,
  request,
}) => {
  await onboard(page);
  await expect(page.locator(".side-nav .nav-item")).toHaveText([
    "Hôm nay",
    "Danh sách bài học",
    "Luyện giao tiếp",
    "Luyện IPA",
    "Tranh luận",
  ]);
  await expect(page.locator(".lesson-pipeline-step")).toHaveCount(3);
  await page.goto("/#editorial");
  await expect(page.getByRole("heading", { name: "Giao tiếp mỗi ngày." })).toBeVisible();
  const response = await request.post("/api/tts", {
    headers: { Origin: "http://127.0.0.1:3001" },
    data: { spokenText: "An unapproved sentence." },
  });
  expect(response.status()).toBe(400);
  const speech = await request.post("/api/speech-score", {
    multipart: { target: "Hello" },
  });
  expect(speech.status()).toBe(403);
});

test("timer pauses honestly and resumed stages keep their actual elapsed time", async ({
  page,
}) => {
  await mockSpeech(page);
  await page.clock.install({ time: new Date("2026-10-16T09:00:00Z") });
  await onboard(page);
  await page.getByRole("button", { name: "Bắt đầu buổi học", exact: true }).click();
  await page.getByRole("button", { name: "Bắt đầu tính giờ", exact: true }).click();
  await page.clock.runFor(3000);
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  const elapsed = await page.evaluate(
    () =>
      Object.values(JSON.parse(localStorage.getItem("natural-english:v2")!).sessions).map(
        (s: any) => s.seconds[0],
      )[0],
  );
  expect(elapsed).toBeGreaterThanOrEqual(2);
  await page.clock.runFor(10_000);
  expect(
    await page.evaluate(
      () =>
        Object.values(JSON.parse(localStorage.getItem("natural-english:v2")!).sessions).map(
          (s: any) => s.seconds[0],
        )[0],
    ),
  ).toBe(elapsed);
  await page.reload();
  await expect(page.getByRole("button", { name: "Bắt đầu tính giờ", exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        Object.values(JSON.parse(localStorage.getItem("natural-english:v2")!).sessions).map(
          (s: any) => s.seconds[0],
        )[0],
    ),
  ).toBe(elapsed);
});
test("large text, reduced motion and lesson list remain usable on a small screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await onboard(page);
  await page.goto("/settings");
  await page.getByRole("checkbox", { name: "Chữ lớn, dễ đọc hơn", exact: true }).check();
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto("/roadmap");
  await page.getByRole("textbox", { name: "Tìm tuần học" }).fill("Task Updates");
  await page.getByRole("button", { name: /Tuần 20 Task Updates/ }).click();
  await expect(page.getByRole("button", { name: "Mở bài luyện" })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
