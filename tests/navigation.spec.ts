import { expect, test } from "@playwright/test";
test("sidebar starts collapsed, can expand, and keeps only café in the main navigation", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
  await page.goto("/settings");
  await page.getByLabel("Mình nên gọi bạn là gì?").fill("Linh");
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  const sidebar = page.locator(".sidebar");
  const expand = page.getByRole("button", { name: "Mở rộng thanh bên", exact: true });
  await expect(expand).toHaveAttribute("aria-expanded", "false");
  const collapsedWidth = (await sidebar.boundingBox())!.width;
  expect(collapsedWidth).toBeLessThanOrEqual(80);
  await expect(sidebar.getByText("Cà phê vỉa hè", { exact: true })).toBeHidden();
  await page.screenshot({ path: "artifacts/sidebar-collapsed.png" });
  await expand.click();
  const collapse = page.getByRole("button", { name: "Thu gọn thanh bên", exact: true });
  await expect(collapse).toHaveAttribute("aria-expanded", "true");
  expect((await sidebar.boundingBox())!.width).toBeGreaterThan(collapsedWidth);
  await expect(sidebar.getByText("Cà phê vỉa hè", { exact: true })).toBeVisible();
  await page.screenshot({ path: "artifacts/sidebar-expanded.png" });
  await collapse.focus();
  await page.keyboard.press("Enter");
  await expect(expand).toHaveAttribute("aria-expanded", "false");
  await sidebar.getByRole("link", { name: "Cà phê vỉa hè", exact: true }).click();
  await expect(page).toHaveURL(/\/english\/cafe$/);
  await expect(sidebar.getByRole("link", { name: "Cà phê vỉa hè", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.goBack();
  await expect(page).toHaveURL(/\/settings$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/english\/cafe$/);
  await expand.click();
  await page.reload();
  await expect(expand).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".topbar .avatar")).toHaveText("L");
  for (const width of [1440, 900, 375]) {
    await page.setViewportSize({ width, height: 900 });
    const nav = page.getByRole("navigation", {
      name: width < 768 ? "Điều hướng trên điện thoại" : "Điều hướng chính",
      exact: true,
    });
    await expect(nav.getByRole("link")).toHaveCount(1);
    await expect(nav.getByRole("link")).toHaveAccessibleName(
      width < 768 ? "Cà phê" : "Cà phê vỉa hè",
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  }
  await page.screenshot({ path: "artifacts/sidebar-mobile.png" });
  await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  const menu = page.getByRole("navigation", { name: "Menu điện thoại", exact: true });
  await expect(menu.getByRole("link")).toHaveCount(1);
  await menu.getByRole("link", { name: "Cà phê vỉa hè", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Không gian học", exact: true })).not.toBeVisible();
  await page.goto("/#review");
  await expect(page).toHaveURL(/\/review$/);
});
