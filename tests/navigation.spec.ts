import { expect, test } from "@playwright/test";
test("four task domains preserve the profile across navigation and reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
  await page.goto("/settings");
  await page.getByLabel("Mình nên gọi bạn là gì?").fill("Linh");
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await page.locator(".side-nav").getByRole("link", { name: "Bài học", exact: true }).click();
  await expect(page).toHaveURL(/\/roadmap$/);
  await page.locator(".side-nav").getByRole("link", { name: "Ôn tập", exact: true }).click();
  await expect(page).toHaveURL(/\/review$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/roadmap$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/review$/);
  await page.reload();
  await expect(page.locator(".profile-nav strong")).toHaveText("Linh");
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    const nav = page.getByRole("navigation", {
      name: width < 768 ? "Điều hướng trên điện thoại" : "Điều hướng chính",
      exact: true,
    });
    await expect(nav.getByRole("link")).toHaveText(["Hôm nay", "Bài học", "Nói chuyện", "Ôn tập"]);
  }
  await page.goto("/#review");
  await expect(page).toHaveURL(/\/review$/);
});
