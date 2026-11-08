import { expect, test } from "@playwright/test";
import sharp from "sharp";

for (const width of [390, 1440, 3290]) {
  test(`field mist fades into the sky without a horizontal seam at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1200 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
    await page.goto("/english/cafe");
    for (const name of [
      "Đến đồi chè",
      "Đến hồ thông",
      "Đến làng Bình Nguyên",
      "Khám phá Cánh đồng",
    ])
      await page.getByRole("button", { name, exact: true }).click();
    const frame = page.locator('.cafe-scene-frame[data-scene="farm_fields"]');
    await expect(frame).toBeVisible();
    await frame
      .locator("img")
      .evaluateAll((images) =>
        Promise.all(images.map((img) => (img as HTMLImageElement).decode())),
      );
    await page.addStyleTag({ content: "nextjs-portal { display:none!important; }" });
    const mist = frame.locator(".cafe-field-rain-mist");
    await mist.scrollIntoViewIfNeeded();
    const bounds = (await frame.boundingBox())!;
    const haze = (await mist.boundingBox())!;
    const capture = await frame.screenshot({ path: test.info().outputPath("field-sky.png") });
    await mist.evaluate((element) => {
      element.style.visibility = "hidden";
    });
    const baseline = await frame.screenshot();
    const { data, info } = await sharp(capture)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const clear = await sharp(baseline).removeAlpha().raw().toBuffer();
    function mistContribution(y: number) {
      let difference = 0,
        samples = 0;
      for (let row = y; row < y + 2; row++)
        for (let x = Math.floor(info.width * 0.4); x < info.width * 0.6; x++)
          for (let channel = 0; channel < 3; channel++) {
            const index = (row * info.width + x) * 3 + channel;
            difference += Math.abs(data[index] - clear[index]);
            samples++;
          }
      return difference / samples;
    }
    expect(
      mistContribution(Math.ceil(haze.y - bounds.y)),
      "The haze must be transparent at its upper edge",
    ).toBeLessThan(0.75);
    expect(
      mistContribution(Math.round(haze.y - bounds.y + haze.height * 0.3)),
      "The soft haze must remain visible inside the scene",
    ).toBeGreaterThan(1);
  });
}

for (const width of [390, 1440]) {
  for (const reduced of [false, true]) {
    test(`field rain is scoped and respects motion controls at ${width}px${reduced ? " with reduced motion" : ""}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
      await page.goto("/");
      await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
      await page.goto("/english/cafe");
      const frame = page.locator(".cafe-scene-frame");
      const rain = frame.locator(".cafe-field-rain");
      await expect(rain).toHaveCount(0);
      for (const name of ["Đến đồi chè", "Đến hồ thông", "Đến làng Bình Nguyên"])
        await page.getByRole("button", { name, exact: true }).click();
      await expect(frame).toHaveAttribute("data-scene", "map");
      await expect(rain).toHaveCount(0);
      await page.getByRole("button", { name: "Khám phá Cánh đồng", exact: true }).click();
      await expect(frame).toHaveAttribute("data-scene", "farm_fields");
      await expect(rain).toBeVisible();
      await expect(rain).toHaveCSS("pointer-events", "none");
      const clouds = frame.locator(".layer-field-clouds img");
      const foliage = frame.locator(".layer-field-trees-left img");
      for (const layer of [clouds, frame.locator(".layer-field-land img"), foliage,
        frame.locator(".layer-field-trees-right img")]) {
        await expect(layer).toBeVisible();
        await expect.poll(() => layer.evaluate((img) => (img as HTMLImageElement).naturalWidth))
          .toBeGreaterThan(0);
      }
      const drop = rain.locator("i").first();
      const splash = rain.locator(".cafe-rain-splash").first();
      if (reduced) {
        await expect(drop).toBeHidden();
        await expect(splash).toBeHidden();
        await expect(clouds).toHaveCSS("animation-name", "none");
        await expect(foliage).toHaveCSS("animation-name", "none");
      } else {
        for (const layer of [clouds, foliage]) {
          const initial = await layer.evaluate((el) => getComputedStyle(el).transform);
          await expect.poll(() => layer.evaluate((el) => getComputedStyle(el).transform))
            .not.toBe(initial);
        }
        await expect(drop).toBeVisible();
        await expect(splash).toBeVisible();
        const ground = (await frame.boundingBox())!;
        for (const impact of await rain.locator(".cafe-rain-impact:visible").all()) {
          const box = (await impact.boundingBox())!;
          expect(box.y).toBeGreaterThanOrEqual(ground.y + ground.height * 0.6);
          expect(box.y).toBeLessThan(ground.y + ground.height);
        }
        const initial = await drop.evaluate((el) => getComputedStyle(el).transform);
        await expect
          .poll(() => drop.evaluate((el) => getComputedStyle(el).transform))
          .not.toBe(initial);
        const ripple = await splash.evaluate((el) => getComputedStyle(el).opacity);
        await expect
          .poll(() => splash.evaluate((el) => getComputedStyle(el).opacity))
          .not.toBe(ripple);
        await page.addStyleTag({ content: "nextjs-portal { display:none!important; }" });
        await frame.screenshot({ path: test.info().outputPath("field-rain.png") });
        await page.getByRole("button", { name: "Tạm dừng chuyển động", exact: true }).click();
        await expect(drop).toHaveCSS("animation-play-state", "paused");
        await expect(splash).toHaveCSS("animation-play-state", "paused");
        await expect(clouds).toHaveCSS("animation-play-state", "paused");
        await expect(foliage).toHaveCSS("animation-play-state", "paused");
        const splashFrozen = await splash.evaluate((el) => getComputedStyle(el).transform);
        const frozen = await drop.evaluate((el) => getComputedStyle(el).transform);
        const later = await drop.evaluate(
          (el) =>
            new Promise<string>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve(getComputedStyle(el).transform)),
              ),
            ),
        );
        expect(later).toBe(frozen);
        expect(await splash.evaluate((el) => getComputedStyle(el).transform)).toBe(splashFrozen);
        await page.getByRole("button", { name: "Bật chuyển động", exact: true }).click();
        await expect(drop).toHaveCSS("animation-play-state", "running");
        await expect(splash).toHaveCSS("animation-play-state", "running");
      }
      await page.getByRole("button", { name: "Về Bình Nguyên", exact: true }).click();
      await expect(frame).toHaveAttribute("data-scene", "map");
      await expect(rain).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    });
  }
}
