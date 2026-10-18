import { expect, test } from "@playwright/test";

test("App Router preserves the learner across navigation, reload and legacy bookmarks", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
  await page.locator(".sidebar").getByRole("link", { name: "Cài đặt", exact: true }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await page.getByLabel("Mình nên gọi bạn là gì?").fill("Linh");
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await page.locator(".side-nav").getByRole("link", { name: "Luyện IPA", exact: true }).click();
  await expect(page).toHaveURL(/\/ipa$/);
  await page
    .locator(".side-nav")
    .getByRole("link", { name: "Danh sách bài học", exact: true })
    .click();
  await expect(page).toHaveURL(/\/roadmap$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/ipa$/);
  await expect(page.locator(".profile-nav strong")).toHaveText("Linh");
  await page.goForward();
  await expect(page).toHaveURL(/\/roadmap$/);
  await page.goto("/#ipa");
  await expect(page).toHaveURL(/\/ipa$/);
  await page.reload();
  await expect(page.locator(".profile-nav strong")).toHaveText("Linh");
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    const nav = page.getByRole("navigation", {
      name: width < 768 ? "Điều hướng trên điện thoại" : "Điều hướng chính",
      exact: true,
    });
    await expect(nav.getByRole("link")).toHaveCount(5);
    await expect(nav.getByRole("link").last()).toHaveText("Tranh luận");
    await expect(nav.getByRole("link", { name: "Ôn tập", exact: true })).toHaveCount(0);
  }
  await page.goto("/#review");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Giao tiếp mỗi ngày." })).toBeVisible();
  expect((await request.get("/review")).status()).toBe(404);
});
