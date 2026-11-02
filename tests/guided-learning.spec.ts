import { expect, test } from "@playwright/test";
test("learning screens fit mobile, tablet and desktop with visible settings", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [360, 390, 430, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/roadmap", "/review", "/progress", "/daily-speaking", "/settings"]) {
      await page.goto(path);
      await expect(page.locator(".main-content h1")).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `${path} at ${width}px`,
      ).toBeLessThanOrEqual(width);
      if ([390, 1280].includes(width))
        await page.screenshot({
          path: `artifacts/natural-${width}-${path === "/" ? "today" : path.slice(1)}.png`,
          fullPage: true,
        });
    }
    await page.goto("/preview/my-daily-routine");
    await expect(page.getByLabel("Câu trả lời của bạn", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    if (width === 390)
      await page.screenshot({ path: "artifacts/natural-390-lesson.png", fullPage: true });
  }
});
test("Alex offers Guided, Free and Review with microphone-independent text input", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
  await page.goto("/daily-speaking");
  const modes = page.getByRole("group", { name: "Chế độ Alex", exact: true });
  await expect(modes.getByRole("button")).toHaveText(["Guided Talk", "Free Talk", "Review"]);
  await expect(modes.getByRole("button", { name: "Review", exact: true })).toBeDisabled();
  await expect(modes.getByRole("button", { name: "Free Talk", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
test("content studio is independent from learner onboarding and rejects missing credentials", async ({
  page,
  request,
}) => {
  await page.goto("/admin");
  await expect(page.getByLabel("Khóa truy cập theo vai trò")).toBeVisible();
  expect((await request.get("/api/content-admin")).status()).toBe(403);
  expect(
    (
      await request.post("/api/content-admin", {
        headers: { Origin: "http://127.0.0.1:3001" },
        data: { action: "publish", id: "my-daily-routine", revision: 1 },
      })
    ).status(),
  ).toBe(403);
});

test("content studio edits a draft, displays gates and restricts workflow actions by role", async ({
  page,
}) => {
  await page.goto("/admin");
  await page
    .getByLabel("Khóa truy cập theo vai trò")
    .fill("E2E-ONLY-EDITOR-KEY-DO-NOT-USE-IN-PRODUCTION");
  await page.getByRole("button", { name: "Kết nối", exact: true }).click();
  await page.getByRole("button", { name: "Nhập bản nháp từ đặc tả", exact: true }).click();
  await expect(page.getByLabel("Bài đang biên tập")).toContainText("My Daily Routine");
  await page.getByLabel("Bài đang biên tập").selectOption("my-daily-routine");
  await expect(
    page.getByRole("heading", { name: "Cổng kiểm duyệt · bản đã lưu", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Cần bộ 1.500 lemma đã được người duyệt xác nhận.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Xuất bản", exact: true })).toHaveCount(0);
  const editor = page.getByLabel("Nội dung và chứng cứ (JSON)", { exact: true });
  const draft = JSON.parse(await editor.inputValue());
  const nextRevision = draft.lesson.revision + 1;
  draft.lesson.description = "Test draft description.";
  await editor.fill(JSON.stringify(draft));
  await page.getByRole("button", { name: "Lưu revision mới", exact: true }).click();
  await expect(page.getByLabel("Bài đang biên tập")).toContainText(`r${nextRevision}`);
  await page.getByRole("button", { name: "Gửi duyệt bản đã lưu", exact: true }).click();
  await expect(page.getByLabel("Bài đang biên tập")).toContainText("review");
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await page
    .getByLabel("Khóa truy cập theo vai trò")
    .fill("E2E-ONLY-REVIEWER-KEY-DO-NOT-USE-IN-PRODUCTION");
  await page.getByRole("button", { name: "Kết nối", exact: true }).click();
  await page.getByLabel("Bài đang biên tập").selectOption("my-daily-routine");
  await page.getByRole("button", { name: "Duyệt ngôn ngữ và ngoại lệ", exact: true }).click();
  await expect(page.locator(".field-error")).toContainText("1.500");
  await expect(page.getByRole("button", { name: "Xuất bản", exact: true })).toHaveCount(0);
});
