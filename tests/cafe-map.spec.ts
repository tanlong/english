import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`pine lake links to the supplied map and returns safely at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
    await page.goto("/english/cafe");
    const toMap = page.getByRole("button", { name: "Đến làng Bình Nguyên", exact: true });
    await expect(toMap).toHaveCount(0);
    await page.getByRole("button", { name: "Đến đồi chè", exact: true }).click();
    await expect(toMap).toHaveCount(0);
    await page.getByRole("button", { name: "Đến hồ thông", exact: true }).click();
    await expect(toMap).toBeVisible();
    if (width >= 1024) {
      await toMap.focus();
      await page.keyboard.press("Enter");
    } else await toMap.click();
    const frame = page.locator(".cafe-scene-frame");
    await expect(frame).toHaveAttribute("data-scene", "map");
    await expect(page).toHaveURL(/scene=map$/);
    const map = page.getByRole("img", {
      name: "Bản đồ khu vực với những con đường, hồ nước và nhà cửa",
      exact: true,
    });
    await expect(map).toBeVisible();
    await expect
      .poll(() => map.evaluate((image) => (image as HTMLImageElement).naturalWidth))
      .toBe(1672);
    await expect(frame.locator(".cafe-hotspot")).toHaveCount(0);
    await expect(frame.locator(".cafe-light-rays, .cafe-ambient-fx")).toHaveCount(0);
    const stops = page.getByRole("list", { name: "Các điểm dừng Đà Lạt", exact: true });
    await expect(stops.getByRole("listitem")).toHaveCount(4);
    await expect(stops.getByRole("listitem").filter({ hasText: "Bản đồ" })).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
    await frame.screenshot({ path: test.info().outputPath("map.png") });
    await page.clock.install();
    await page.clock.runFor(16_000);
    expect(errors).toEqual([]);
    await page.getByRole("button", { name: "Về hồ thông", exact: true }).click();
    await expect(frame).toHaveAttribute("data-scene", "mountain_view");
    await expect(
      page.getByRole("button", { name: "Trò chuyện với Gray Boo", exact: true }),
    ).toBeEnabled();
    await expect(toMap).toBeVisible();
    expect(errors).toEqual([]);
  });
}
