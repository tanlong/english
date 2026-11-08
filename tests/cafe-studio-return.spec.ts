import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  for (const origin of ["map", "village_homes"]) {
    test(`Studio has an in-scene return to Binh Nguyen from ${origin} at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
      await page.goto("/english/cafe");
      for (const name of ["Đến đồi chè", "Đến hồ thông", "Đến làng Bình Nguyên"])
        await page.getByRole("button", { name, exact: true }).click();
      if (origin === "village_homes") {
        await page.getByRole("button", { name: "Khám phá Khu nhà", exact: true }).click();
        await page
          .getByRole("navigation", { name: "Địa điểm trong khu nhà" })
          .getByRole("button", { name: "Studio sản phẩm", exact: true })
          .click();
      } else {
        await page.getByRole("button", { name: "Khám phá Studio sản phẩm", exact: true }).click();
      }
      const frame = page.locator(".cafe-scene-frame");
      await expect(frame).toHaveAttribute("data-scene", "design_studio");
      const back = frame.getByRole("button", { name: "Về Bình Nguyên", exact: true });
      await expect(back).toBeVisible();
      await expect(back).toBeEnabled();
      const frameBox = (await frame.boundingBox())!;
      const buttonBox = (await back.boundingBox())!;
      expect(buttonBox.x).toBeGreaterThanOrEqual(frameBox.x);
      expect(buttonBox.y).toBeGreaterThanOrEqual(frameBox.y);
      expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(frameBox.x + frameBox.width);
      expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(frameBox.y + frameBox.height);
      await back.focus();
      await expect(back).toBeFocused();
      await frame.screenshot({ path: test.info().outputPath("studio-return.png") });
      await back.press("Enter");
      await expect(frame).toHaveAttribute("data-scene", "map");
      await expect(page).toHaveURL(/scene=map$/);
    });
  }
}
