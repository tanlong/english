import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  for (const reduced of [false, true]) {
    test(`Sun King and field thunder respect controls at ${width}px${reduced ? " with reduced motion" : ""}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const interval = width === 390 ? 2000 : 4000;
      await page.addInitScript(() => {
        const audioWindow = window as typeof window & { thunderStarts: number };
        audioWindow.thunderStarts = 0;
        const start = AudioBufferSourceNode.prototype.start;
        AudioBufferSourceNode.prototype.start = function (...args: Parameters<typeof start>) {
          audioWindow.thunderStarts += 1;
          return start.apply(this, args);
        };
      });
      const thunderStarts = () =>
        page.evaluate(() => (window as typeof window & { thunderStarts: number }).thunderStarts);
      await page.goto("/");
      await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
      await expect(page.locator(".app-shell")).toBeVisible();
      await page.goto("/english/cafe");
      for (const name of ["Đến đồi chè", "Đến hồ thông", "Đến làng Bình Nguyên"])
        await page.getByRole("button", { name, exact: true }).click();
      const frame = page.locator(".cafe-scene-frame");
      await expect(frame).toHaveAttribute("data-scene", "map");
      await expect(page.getByRole("button", { name: "Bật tiếng sấm", exact: true })).toHaveCount(0);
      await page.evaluate(
        (random) => {
          Math.random = () => random;
        },
        width === 390 ? 0 : 0.99999999,
      );
      await page.clock.install();
      await page.clock.pauseAt(new Date());
      await page.getByRole("button", { name: "Khám phá Cánh đồng", exact: true }).click();
      await page.clock.runFor(1300);
      const sun = page.getByRole("button", { name: "Trò chuyện với Sun King", exact: true });
      await expect(sun).toBeEnabled();
      const portrait = frame.locator('[data-npc-id="sun_king"] .sun-king-poster');
      await expect
        .poll(() => portrait.evaluate((img) => (img as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
      await page.keyboard.press("Tab");
      await sun.focus();
      const bubble = page.getByRole("tooltip");
      await expect(bubble).toContainText("Chủ đề: Making Plans & Solving Problems");
      const bubbleBox = (await bubble.boundingBox())!;
      const frameBox = (await frame.boundingBox())!;
      expect(bubbleBox.y).toBeGreaterThanOrEqual(frameBox.y);
      expect(bubbleBox.y + bubbleBox.height).toBeLessThanOrEqual(frameBox.y + frameBox.height);
      await sun.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByRole("heading", { name: "Sun King", exact: true })).toBeVisible();
      await expect(dialog.getByRole("combobox", { name: "Chủ đề", exact: true })).toHaveValue(
        "Making Plans & Solving Problems",
      );
      await dialog.getByRole("button", { name: "Đóng trò chuyện", exact: true }).click();
      const lightning = frame.locator(".cafe-field-lightning");
      const enableSound = page.getByRole("button", { name: "Bật tiếng sấm", exact: true });
      await expect(enableSound).toHaveAttribute("aria-pressed", "false");
      expect(await thunderStarts()).toBe(0);
      await enableSound.click();
      const mute = page.getByRole("button", { name: "Tắt tiếng sấm", exact: true });
      await expect(mute).toHaveAttribute("aria-pressed", "true");
      if (reduced) {
        await page.clock.runFor(20_000);
        await expect(lightning).toHaveCSS("opacity", "0");
        expect(await thunderStarts()).toBeGreaterThanOrEqual(4);
      } else {
        await page.clock.runFor(interval + 100);
        await expect
          .poll(() => lightning.evaluate((el) => Number(getComputedStyle(el).opacity)))
          .toBeGreaterThan(0);
        await page.addStyleTag({ content: "nextjs-portal { display:none!important; }" });
        await frame.screenshot({ path: test.info().outputPath("sun-king-storm.png") });
        await page.clock.runFor(1200);
        expect(await thunderStarts()).toBe(1);
        await page.clock.runFor(interval - 1200);
        await expect
          .poll(() => lightning.evaluate((el) => Number(getComputedStyle(el).opacity)))
          .toBeGreaterThan(0);
        await page.clock.runFor(1200);
        expect(await thunderStarts()).toBe(2);
        await page.getByRole("button", { name: "Tạm dừng chuyển động", exact: true }).click();
        await page.clock.runFor(20_000);
        await expect(lightning).toHaveCSS("opacity", "0");
        expect(await thunderStarts()).toBe(2);
        await page.getByRole("button", { name: "Bật chuyển động", exact: true }).click();
      }
      await mute.click();
      await expect(enableSound).toHaveAttribute("aria-pressed", "false");
      await page.getByRole("button", { name: "Về Bình Nguyên", exact: true }).click();
      await page.clock.runFor(1300);
      await expect(frame).toHaveAttribute("data-scene", "map");
      await expect(lightning).toHaveCount(0);
      await expect(enableSound).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      expect(errors).toEqual([]);
    });
  }
}
