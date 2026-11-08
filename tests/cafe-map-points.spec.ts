import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`five map points open distinct ground-level scenes and return at ${width}px`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
    await page.goto("/english/cafe");
    for (const name of ["Đến đồi chè", "Đến hồ thông", "Đến làng Bình Nguyên"])
      await page.getByRole("button", { name, exact: true }).click();
    const locations = ["Vườn cây ăn trái", "Khu nhà", "Cầu qua sông", "Bờ hồ", "Cánh đồng"];
    const frame = page.locator(".cafe-scene-frame");
    const sources = new Set<string>();
    for (const label of locations) {
      const point = page.getByRole("button", { name: `Khám phá ${label}`, exact: true });
      await expect(point).toBeEnabled();
      const bounds = await point.boundingBox();
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
      if (width === 1440) {
        await point.focus();
        await page.keyboard.press("Enter");
      } else await point.click();
      const scene = page.getByRole("img", { name: `Khung cảnh ${label}`, exact: true });
      await expect(scene).toBeVisible();
      await expect
        .poll(() => scene.evaluate((img) => (img as HTMLImageElement).naturalWidth))
        .toBe(1672);
      sources.add((await scene.getAttribute("src"))!);
      await expect(
        frame.locator(".cafe-map-point, .cafe-light-rays, .cafe-ambient-fx"),
      ).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
      await frame.screenshot({ path: test.info().outputPath(`${label}.png`) });
      await page.getByRole("button", { name: "Về Bình Nguyên", exact: true }).click();
      await expect(point).toBeFocused();
      await expect(page).toHaveURL(/scene=map$/);
    }
    expect(sources.size).toBe(5);
    await frame.screenshot({ path: test.info().outputPath("five-points.png") });
    expect(errors).toEqual([]);
  });
}
