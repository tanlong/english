import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";
async function sameFrame(first: Buffer, second: Buffer) {
  const a = await sharp(first).raw().toBuffer();
  const b = await sharp(second).raw().toBuffer();
  // GPU compositing may round individual color channels by one value between captures.
  return a.length === b.length && a.every((value, index) => Math.abs(value - b[index]) <= 1);
}
async function sceneReady(page: Page) {
  await expect(page.locator(".cafe-hotspot").first()).toBeEnabled();
  await expect
    .poll(() =>
      page
        .locator(".cafe-scene-layer img")
        .evaluateAll(
          (images) =>
            images.length > 3 &&
            images.every(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0,
            ),
        ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page
        .locator(".cafe-scene-person .cafe-npc-image")
        .evaluateAll(
          (images) =>
            images.length > 0 &&
            images.every(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0,
            ),
        ),
    )
    .toBe(true);
  await page
    .locator(".cafe-scene-frame img")
    .evaluateAll((images) =>
      Promise.all(images.map((image) => (image as HTMLImageElement).decode())),
    );
  await expect
    .poll(() => page.locator('.cafe-scene-person [data-renderer="pixi"]').count())
    .toBe(await page.locator(".cafe-scene-person").count());
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "natural-english:v2",
      JSON.stringify({
        version: 2,
        profile: {
          name: "Linh",
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

test("new puppet NPCs stay anchored and motion controls freeze rendered frames", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/english/cafe");
  await sceneReady(page);
  const person = page.locator('.cafe-scene-person [data-npc-id="cloud_daisy"]');
  const frameBox = (await page.locator(".cafe-scene-frame").boundingBox())!;
  const personBox = (await person.boundingBox())!;
  expect(personBox.width).toBeLessThanOrEqual(frameBox.width * 0.12);
  expect(personBox.y + personBox.height).toBeLessThan(frameBox.y + frameBox.height);
  const canvas = person.locator("canvas");
  // A solid backdrop isolates puppet pixels from the scenery visible through its alpha.
  await canvas.evaluate((element) => {
    element.style.backgroundColor = "#edece1";
  });
  const first = await canvas.screenshot();
  await page.getByRole("button", { name: "Trò chuyện với Cloud Daisy" }).hover();
  await expect.poll(async () => (await canvas.screenshot()).equals(first)).toBe(false);
  const ground = page.locator(".layer-ground");
  const anchors = [await ground.boundingBox(), await person.boundingBox()];
  await page.mouse.move(frameBox.x + frameBox.width - 10, frameBox.y + 10);
  expect([await ground.boundingBox(), await person.boundingBox()]).toEqual(anchors);
  await page.getByRole("button", { name: "Tạm dừng chuyển động" }).click();
  await expect(page.locator(".cafe-scene-frame")).toHaveAttribute("data-paused", "true");
  await expect(person.locator(".cafe-npc-runtime")).toHaveAttribute("data-paused", "true");
  const stopped = await canvas.screenshot();
  const stoppedTime = await person.locator(".cafe-npc-runtime").getAttribute("data-time");
  // Observe one animation frame interval; no input or network wait is involved.
  await page.waitForTimeout(500);
  const after = await canvas.screenshot();
  if (!(await sameFrame(after, stopped))) {
    await test.info().attach("paused-before", { body: stopped, contentType: "image/png" });
    await test.info().attach("paused-after", { body: after, contentType: "image/png" });
    await test.info().attach("paused-clock", {
      body: JSON.stringify({
        stoppedTime,
        afterTime: await person.locator(".cafe-npc-runtime").getAttribute("data-time"),
        state: await person.getAttribute("data-state"),
      }),
      contentType: "application/json",
    });
  }
  expect(await sameFrame(after, stopped)).toBe(true);
  await page.getByRole("button", { name: "Bật chuyển động" }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".cafe-scene-frame")).toHaveAttribute("data-paused", "true");
  const hidden = await canvas.screenshot();
  await page.waitForTimeout(300);
  expect(await sameFrame(await canvas.screenshot(), hidden)).toBe(true);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".cafe-scene-frame")).toHaveAttribute("data-paused", "true");
  await page.getByRole("button", { name: "Trò chuyện với Cloud Daisy" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
test("café visits three linked scenes and completes a scripted practice with saved flashcards", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/english/cafe");
  await expect(page.getByRole("region", { name: "Không gian Đà Lạt", exact: true })).toBeVisible();
  await sceneReady(page);
  await page.screenshot({ path: "artifacts/cafe/inside-runtime.png", fullPage: true });
  await page.getByRole("button", { name: "Đến đồi chè" }).click();
  await expect(page.getByRole("button", { name: "Trò chuyện với Astro Bean" })).toBeVisible();
  await sceneReady(page);
  await page.screenshot({ path: "artifacts/cafe/outdoor-runtime.png", fullPage: true });
  await page.getByRole("button", { name: "Đến hồ thông" }).click();
  await expect(page.getByRole("button", { name: "Trò chuyện với Gray Boo" })).toBeVisible();
  await sceneReady(page);
  await page.screenshot({ path: "artifacts/cafe/mountain-runtime.png", fullPage: true });
  await page.getByRole("button", { name: "Về đồi chè" }).click();
  await page.getByRole("button", { name: "Về vườn hoa" }).click();
  await page.getByRole("button", { name: "Trò chuyện với Cloud Daisy" }).click();
  await page.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("What would you like to drink?");
  await page.getByLabel("Câu trả lời của bạn", { exact: true }).fill("I'd like a coffee, please.");
  await page.getByRole("button", { name: "Gửi câu trả lời" }).click();
  await expect(page.getByRole("log")).toContainText("Would you like it hot or iced?");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Kết thúc cuộc trò chuyện?" })).toBeVisible();
  await page.getByRole("button", { name: "Tiếp tục luyện", exact: true }).click();
  await page.getByRole("button", { name: "Kết thúc & xem tổng kết" }).click();
  await expect(page.getByRole("heading", { name: "Một chút mang về" })).toBeVisible();
  await page.getByRole("button", { name: "Lưu flashcard" }).click();
  await expect(page.getByRole("button", { name: "Đã lưu" })).toBeVisible();
  await page.getByRole("button", { name: "Đóng trò chuyện" }).click();
  await page.reload();
  const cards = await page.request.get("/api/flashcards");
  expect(cards.ok()).toBe(true);
  expect((await cards.json()) as Array<{ english: string }>).toContainEqual(
    expect.objectContaining({ english: "Could I get an iced coffee to go?" }),
  );
});
test("mobile contains the scene, respects reduced motion and exposes read-only connections", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/english/cafe");
  const frame = page.locator(".cafe-scene-frame");
  await expect(frame).toBeVisible();
  await sceneReady(page);
  const linkRows = await page
    .locator(".mobile-nav a")
    .evaluateAll((links) => links.map((link) => Math.round(link.getBoundingClientRect().top)));
  expect(new Set(linkRows).size).toBe(1);
  await page.screenshot({ path: "artifacts/cafe/mobile-runtime.png", fullPage: true });
  const box = (await frame.boundingBox())!;
  expect(Math.abs(box.width / box.height - 16 / 9)).toBeLessThan(0.03);
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({ path: "artifacts/cafe/tablet-runtime.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Trò chuyện với Cloud Daisy" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Trò chuyện với Cloud Daisy" })).toBeFocused();
  await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Không gian học" })
    .getByRole("link", { name: "Nâng cấp / Upgrade", exact: true })
    .click();
  await expect(page).toHaveURL(/\/settings\/upgrade\/connections$/);
  await expect(page.getByRole("heading", { name: "Nâng cấp khả năng học" })).toBeVisible();
  await expect(page.getByLabel("Provider API key", { exact: true })).toHaveCount(0);
  await page.screenshot({ path: "artifacts/cafe/connections-mobile.png", fullPage: true });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
});

test("all six personas have usable topics and the scene query cannot skip the navigation graph", async ({
  page,
}) => {
  await page.goto("/english/cafe?scene=mountain_view");
  await expect(page.locator(".cafe-scene-frame")).toHaveAttribute("data-scene", "inside_cafe");
  for (const [names, next] of [
    [["Cloud Daisy", "Ollie Owl", "Mimi Bunny"], "Đến đồi chè"],
    [["Astro Bean", "Bear Explorer"], "Đến hồ thông"],
    [["Gray Boo"], null],
  ] as const) {
    for (const name of names) {
      await page.getByRole("button", { name: `Trò chuyện với ${name}` }).click();
      await expect(page.getByRole("dialog")).toContainText(name);
      await page.locator(".cafe-levels button").filter({ hasText: "A2" }).click();
      await page.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true }).click();
      await expect(page.getByRole("log")).toBeVisible();
      await page.getByRole("button", { name: "Kết thúc & xem tổng kết", exact: true }).click();
      await page.getByRole("button", { name: "Đóng trò chuyện" }).click();
    }
    if (next) await page.getByRole("button", { name: next }).click();
  }
});

test("a failed puppet texture keeps the approved poster and conversation usable", async ({
  page,
}) => {
  await page.route("**/cafe/npc/cloud_daisy/runtime/rig-*.json", (route) => route.abort());
  await page.goto("/english/cafe");
  const cloud = page.locator('.cafe-scene-person [data-npc-id="cloud_daisy"]');
  await expect(cloud).toHaveAttribute("data-renderer", "poster");
  await expect(cloud.locator(".cafe-npc-image")).toBeVisible();
  await page.getByRole("button", { name: "Trò chuyện với Cloud Daisy" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true })).toBeEnabled();
});

test("a delayed reply keeps thinking active and a failed reply leaves an error pose", async ({
  page,
}) => {
  await page.goto("/english/cafe");
  await sceneReady(page);
  await page.getByRole("button", { name: "Trò chuyện với Cloud Daisy" }).click();
  await page.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true }).click();
  const answer = page.getByLabel("Câu trả lời của bạn", { exact: true });
  await answer.fill("I'd like a coffee, please.");
  await page.getByRole("button", { name: "Gửi câu trả lời" }).click();
  const avatar = page.locator('.cafe-dialog [data-npc-id="cloud_daisy"]');
  await expect(avatar).toHaveAttribute("data-state", "talking");
  let release: (() => void) | undefined;
  const delayed = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/cafe/conversations/*/messages", async (route) => {
    await delayed;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Thử lại sau" }),
    });
  });
  await answer.fill("Hot, please.");
  await page.getByRole("button", { name: "Gửi câu trả lời" }).click();
  await expect(avatar).toHaveAttribute("data-state", "thinking");
  await page.waitForTimeout(1800);
  await expect(avatar).toHaveAttribute("data-state", "thinking");
  release?.();
  await expect(avatar).toHaveAttribute("data-state", "error");
  await expect(answer).toHaveValue("Hot, please.");
});

test("Mr. Pink guides learners to the hidden pronunciation and debate corners", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/english/cafe");
  await sceneReady(page);
  await page.getByRole("button", { name: "Đến đồi chè" }).click();
  const guideTrigger = page.getByRole("button", { name: "Học cùng Mr. Pink", exact: true });
  await expect(guideTrigger).toBeEnabled();
  await guideTrigger.click();
  const guide = page.getByRole("dialog", { name: "Mr. Pink", exact: true });
  await expect(guide).toBeVisible();
  await page.screenshot({ path: "artifacts/cafe/mr-pink-guide.png", fullPage: true });
  const pronunciation = guide.getByRole("link", { name: /Luyện phát âm/ });
  const debate = guide.getByRole("link", { name: /Tranh luận/ });
  await expect(pronunciation).toHaveAttribute("href", "/ipa");
  await expect(debate).toHaveAttribute("href", "/debate");
  await pronunciation.click();
  await expect(page).toHaveURL(/\/ipa$/);
});
test("owner configures a masked provider without exposing its key to learners or enabling AI", async ({
  page,
}) => {
  await page.goto("/settings/upgrade/connections");
  await page.getByText("Dành cho owner/admin", { exact: true }).click();
  await page
    .getByLabel("Khóa truy cập quản trị", { exact: true })
    .fill("E2E-ONLY-CAFE-OWNER-DO-NOT-USE-IN-PRODUCTION");
  await page.getByRole("button", { name: "Mở quyền quản trị", exact: true }).click();
  const card = page
    .locator(".cafe-connector-card")
    .filter({ has: page.getByRole("heading", { name: "AI Conversation · Groq", exact: true }) });
  await card.getByRole("button", { name: "Cấu hình", exact: true }).click();
  const key = "fake-e2e-provider-key-no-external-calls";
  await page.getByLabel("Provider API key", { exact: true }).fill(key);
  await page.getByLabel("Giới hạn lượt / ngày của tenant", { exact: true }).fill("8");
  await page.getByLabel("Giới hạn lượt / người / ngày", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Lưu khóa được mã hóa", exact: true }).click();
  await expect(card).toContainText("Chưa kiểm tra");
  await expect(card.getByRole("button", { name: "Đặt mặc định", exact: true })).toBeDisabled();
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(key);
  const metadata = await page.request.get("/api/advanced/connections", {
    headers: { Authorization: "Bearer E2E-ONLY-CAFE-OWNER-DO-NOT-USE-IN-PRODUCTION" },
  });
  expect(await metadata.text()).not.toContain(key);
  await card.getByRole("button", { name: "Xóa kết nối", exact: true }).click();
  await card.getByRole("button", { name: "Xác nhận xóa", exact: true }).click();
  await expect(card).toContainText("Chưa kết nối");
  await page.getByRole("button", { name: "Đóng quyền quản trị", exact: true }).click();
  await expect(page.getByLabel("Provider API key", { exact: true })).toHaveCount(0);
});

test("café chat records the learner locally without sending audio", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) },
    });
    Object.defineProperty(window, "MediaRecorder", {
      value: class {
        static isTypeSupported() {
          return true;
        }
        state = "inactive";
        mimeType = "audio/webm";
        onstart?: () => void;
        onstop?: () => void;
        ondataavailable?: (event: { data: Blob }) => void;
        start() {
          this.state = "recording";
          this.onstart?.();
        }
        stop() {
          this.state = "inactive";
          this.ondataavailable?.({ data: new Blob(["cafe recording"], { type: this.mimeType }) });
          this.onstop?.();
        }
      },
    });
  });
  let uploads = 0;
  await page.route("**/api/speech-score", (route) => {
    uploads++;
    return route.abort("failed");
  });
  await page.goto("/english/cafe");
  await page.getByRole("button", { name: "Trò chuyện với Cloud Daisy" }).click();
  await page.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true }).click();
  const record = page.getByRole("button", { name: /Thu âm & nghe lại/ });
  await expect(record).toBeVisible();
  await record.click();
  await page.getByRole("button", { name: "Bắt đầu thu", exact: true }).click();
  await page.getByRole("button", { name: "Dừng ghi", exact: true }).click();
  await expect(page.getByRole("button", { name: "Nghe lại", exact: true })).toBeEnabled();
  await expect(page.locator(".cafe-dialog .recording-review audio")).toHaveAttribute(
    "src",
    /^blob:/,
  );
  await expect(page.getByRole("button", { name: "Kiểm tra nội dung", exact: true })).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: /Tôi đồng ý gửi bản ghi/ })).toHaveCount(0);
  expect(uploads).toBe(0);
});
