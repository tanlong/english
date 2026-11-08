import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`four indoor map points open matching rooms and return to their origin at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
    await page.goto("/english/cafe");
    for (const name of ["Đến đồi chè", "Đến hồ thông", "Đến làng Bình Nguyên"])
      await page.getByRole("button", { name, exact: true }).click();
    const frame = page.locator(".cafe-scene-frame");
    await expect(frame).toHaveAttribute("data-scene", "map");
    const points = frame.locator(".cafe-map-point");
    await expect(points).toHaveCount(9);
    const boxes = await Promise.all((await points.all()).map((point) => point.boundingBox()));
    const boundary = (await frame.boundingBox())!;
    for (const [index, box] of boxes.entries()) {
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.x).toBeGreaterThanOrEqual(boundary.x);
      expect(box!.y).toBeGreaterThanOrEqual(boundary.y);
      expect(box!.x + box!.width).toBeLessThanOrEqual(boundary.x + boundary.width);
      expect(box!.y + box!.height).toBeLessThanOrEqual(boundary.y + boundary.height);
      for (const other of boxes.slice(index + 1)) {
        const overlapX =
          Math.min(box!.x + box!.width, other!.x + other!.width) - Math.max(box!.x, other!.x);
        const overlapY =
          Math.min(box!.y + box!.height, other!.y + other!.height) - Math.max(box!.y, other!.y);
        expect(overlapX > 0 && overlapY > 0, "point hit areas must not overlap").toBe(false);
      }
    }
    await page.addStyleTag({ content: "nextjs-portal { display:none!important; }" });
    await frame.screenshot({ path: test.info().outputPath("indoor-points.png") });
    for (const [room, npc] of [
      ["Cửa hàng Bình Nguyên", "Penny Panda"],
      ["Góc làm việc", "Alex Otter"],
      ["Phòng dự án", "Morgan Wolf"],
      ["Studio sản phẩm", "Tess Turtle"],
    ]) {
      const point = page.getByRole("button", { name: `Khám phá ${room}`, exact: true });
      if (width === 1440) {
        await point.focus();
        await page.keyboard.press("Enter");
      } else await point.click();
      const background = page.getByRole("img", { name: `Khung cảnh ${room}`, exact: true });
      await expect(background).toBeVisible();
      await expect
        .poll(() => background.evaluate((img) => (img as HTMLImageElement).naturalWidth))
        .toBe(1672);
      await expect(
        page.getByRole("button", { name: `Trò chuyện với ${npc}`, exact: true }),
      ).toBeEnabled();
      await frame.screenshot({ path: test.info().outputPath(`${room}.png`) });
      await page.getByRole("button", { name: "Về Bình Nguyên", exact: true }).click();
      await expect(frame).toHaveAttribute("data-scene", "map");
      await expect(point).toBeFocused();
    }
    await page.getByRole("button", { name: "Khám phá Khu nhà", exact: true }).click();
    await page
      .getByRole("navigation", { name: "Địa điểm trong khu nhà", exact: true })
      .getByRole("button", { name: "Cửa hàng Bình Nguyên", exact: true })
      .click();
    await expect(page.getByRole("button", { name: "Về Bình Nguyên", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Về khu nhà", exact: true }).click();
    await expect(frame).toHaveAttribute("data-scene", "village_homes");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}
