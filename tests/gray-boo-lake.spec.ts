import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";
import { pathToFileURL } from "node:url";
import path from "node:path";

async function openLake(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem(
      "natural-english:v2",
      JSON.stringify({
        version: 2,
        profile: {
          name: "Linh",
          role: "general",
          goal: "both",
          confidence: "some",
          largeText: false,
          mic: false,
        },
        activeWeek: 1,
        activeDay: 1,
        sessions: {},
        dailySeconds: {},
      }),
    ),
  );
  await page.goto("/english/cafe");
  await page.getByRole("button", { name: "Đến đồi chè", exact: true }).click();
  await page.getByRole("button", { name: "Đến hồ thông", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Trò chuyện với Gray Boo", exact: true }),
  ).toBeEnabled();
}

async function rates(page: Page) {
  return page.evaluate(() =>
    Object.fromEntries(
      document
        .getAnimations()
        .filter((animation) => animation.id.startsWith("pine-lake-"))
        .map((animation) => [
          animation.id.split(":")[0],
          Number(animation.playbackRate.toFixed(1)),
        ]),
    ),
  );
}

test("static pine trunks retain the original artwork without blue gaps between layers", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1996, height: 1400 });
  await openLake(page);
  await page
    .locator(".cafe-scene-frame img")
    .evaluateAll((images) =>
      Promise.all(images.map((image) => (image as HTMLImageElement).decode())),
    );
  const png = await page.locator(".cafe-scene-frame").screenshot();
  const meta = await sharp(png).metadata();
  expect(meta.width).toBe(1920);
  const crop = { left: 0, top: 210, width: 420, height: 230 };
  const expected = await sharp("art/dalat/pine_lake/source/master-fullhd.png")
    .extract(crop)
    .removeAlpha()
    .raw()
    .toBuffer();
  const actual = await sharp(png).extract(crop).removeAlpha().raw().toBuffer();
  let error = 0;
  for (let i = 0; i < actual.length; i++) error += Math.abs(actual[i] - expected[i]);
  await test.info().attach("tree-seam", {
    body: await sharp(png).extract(crop).png().toBuffer(),
    contentType: "image/png",
  });
  expect(
    error / actual.length,
    "Static trunks should match the master apart from WebP compression",
  ).toBeLessThan(8);
});

test("water motion continues across the lake without a diagonal clipped patch", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1996, height: 1400 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openLake(page);
  await page
    .locator(".cafe-scene-frame img")
    .evaluateAll((images) =>
      Promise.all(images.map((image) => (image as HTMLImageElement).decode())),
    );
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Tạm dừng chuyển động", exact: true }).click();
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.id.startsWith("pine-lake-"))
        .map((a) => a.ready.then(() => undefined)),
    ),
  );
  const scene = page.locator(".cafe-scene-frame");
  const moving = await scene.screenshot();
  await page.locator(".pine-lake-water-mask").evaluate((element) => {
    (element as HTMLElement).style.visibility = "hidden";
  });
  const still = await scene.screenshot();
  const a = await sharp(moving).removeAlpha().raw().toBuffer();
  const b = await sharp(still).removeAlpha().raw().toBuffer();
  const energy = (side: number) => {
    let total = 0,
      count = 0;
    for (let x = 460; x <= 750; x += 2) {
      const boundary = x <= 540 ? 535 + ((x - 410) * 38) / 130 : 573 + ((x - 540) * 40) / 140;
      for (let dy = -1; dy <= 1; dy++) {
        const y = Math.round(boundary + side * 7 + dy);
        for (let c = 0; c < 3; c++) {
          const i = (y * 1920 + x) * 3 + c;
          total += Math.abs(a[i] - b[i]);
          count++;
        }
      }
    }
    return total / count;
  };
  const upper = energy(-1),
    lower = energy(1);
  await test.info().attach("lake-edge-before", { body: moving, contentType: "image/png" });
  expect(upper).toBeGreaterThan(2);
  expect(
    lower / upper,
    "Motion must not drop to zero on the diagonal inside the lake",
  ).toBeGreaterThan(0.35);
  expect(lower / upper).toBeLessThan(2.5);
});

test("the delivered preview shows visibly moving scenery", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(pathToFileURL(path.resolve("reports/gray-boo-pine-lake/index.html")).href);
  const scene = page.locator(".scene");
  await expect(scene).toBeVisible();
  const before = await scene.screenshot();
  await page.waitForTimeout(1200);
  const after = await scene.screenshot();
  await test.info().attach("preview-before", { body: before, contentType: "image/png" });
  await test.info().attach("preview-after", { body: after, contentType: "image/png" });
  expect(
    after.equals(before),
    "The main scene preview must advance, rather than display a still screenshot",
  ).toBe(false);
});

test("the rowboat travels visibly across the water and pauses with the scene", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1440 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openLake(page);
  const boat = page.locator(".pine-lake-boat");
  await expect(boat).toBeVisible();
  const before = (await boat.boundingBox())!;
  const frame = (await page.locator(".cafe-scene-frame").boundingBox())!;
  expect(before.x).toBeGreaterThan(frame.x + frame.width * 0.25);
  expect(before.x).toBeLessThan(frame.x + frame.width * 0.45);
  expect(before.y).toBeGreaterThan(frame.y + frame.height * 0.41);
  expect(before.y).toBeLessThan(frame.y + frame.height * 0.5);
  await expect
    .poll(async () => Math.abs((await boat.boundingBox())!.x - before.x), {
      message: "The boat must actually travel, not just brighten",
      timeout: 6000,
    })
    .toBeGreaterThan(25);
  await page.getByRole("button", { name: "Tạm dừng chuyển động", exact: true }).click();
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.id.startsWith("pine-lake-"))
        .map((a) => a.ready.then(() => undefined)),
    ),
  );
  const stopped = await boat.boundingBox();
  await page.waitForTimeout(250);
  expect(await boat.boundingBox()).toEqual(stopped);
});

test("a seated passenger rows across the whole lake, turns and rows back", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1440 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openLake(page);
  const rower = page.locator(".pine-lake-rower-image");
  const oar = page.locator(".pine-lake-oar");
  await expect(rower).toBeVisible();
  await expect(oar).toBeVisible();
  const stroke = await oar.evaluate((element) => getComputedStyle(element).transform);
  await expect
    .poll(() => oar.evaluate((element) => getComputedStyle(element).transform))
    .not.toBe(stroke);
  await page.getByRole("button", { name: "Tạm dừng chuyển động", exact: true }).click();
  const seek = (progress: number) =>
    page.evaluate(async (progress) => {
      const animations = document.getAnimations().filter((a) => a.id.startsWith("pine-lake-boat:"));
      await Promise.all(animations.map((a) => a.ready));
      animations.forEach((a) => {
        a.currentTime = Number(a.effect!.getTiming().duration) * progress;
      });
    }, progress);
  const boat = page.locator(".pine-lake-boat");
  const frame = (await page.locator(".cafe-scene-frame").boundingBox())!;
  await seek(0);
  const start = (await boat.boundingBox())!;
  await seek(0.46875);
  const farBank = (await boat.boundingBox())!;
  expect(start.x).toBeLessThan(frame.x + frame.width * 0.35);
  expect(farBank.x).toBeGreaterThan(frame.x + frame.width * 0.85);
  await seek(0.75);
  const returning = (await boat.boundingBox())!;
  expect(returning.x).toBeLessThan(farBank.x - frame.width * 0.2);
  const heading = await boat.evaluate(
    (element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m11,
  );
  expect(heading).toBeLessThan(0);
  await seek(1);
  expect(Math.abs((await boat.boundingBox())!.x - start.x)).toBeLessThan(1);
});

test("lake reflections bend and travel with real ripples while the deck stays fixed", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1440 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openLake(page);
  await page
    .locator(".cafe-scene-frame img")
    .evaluateAll((images) =>
      Promise.all(images.map((image) => (image as HTMLImageElement).decode())),
    );
  const scene = page.locator(".cafe-scene-frame");
  const first = await scene.screenshot();
  await page.waitForTimeout(600);
  const second = await scene.screenshot();
  const meta = await sharp(first).metadata();
  const deck = {
    left: Math.round(meta.width! * 0.4),
    top: Math.round(meta.height! * 0.94),
    width: Math.round(meta.width! * 0.28),
    height: Math.round(meta.height! * 0.04),
  };
  const deckBefore = await sharp(first).extract(deck).raw().toBuffer();
  const deckAfter = await sharp(second).extract(deck).raw().toBuffer();
  expect(
    deckBefore.every((value, i) => Math.abs(value - deckAfter[i]) <= 1),
    "Water motion must not affect deck pixels",
  ).toBe(true);
  const crop = {
    left: Math.round(meta.width! * 0.44),
    top: Math.round(meta.height! * 0.45),
    width: Math.round(meta.width! * 0.4),
    height: Math.round(meta.height! * 0.1),
  };
  const a = await sharp(first).extract(crop).greyscale().raw().toBuffer();
  const b = await sharp(second).extract(crop).greyscale().raw().toBuffer();
  // Track horizontal reflection features. Normalising each row removes brightness
  // pulses, so an opacity-only shimmer cannot pass as a moving wave.
  let movingRows = 0;
  for (let y = 0; y < crop.height; y++) {
    const row = y * crop.width;
    let meanA = 0,
      meanB = 0;
    for (let x = 0; x < crop.width; x++) {
      meanA += a[row + x];
      meanB += b[row + x];
    }
    meanA /= crop.width;
    meanB /= crop.width;
    const error = (shift: number) => {
      let total = 0;
      for (let x = 8; x < crop.width - 8; x++)
        total += Math.abs(a[row + x] - meanA - (b[row + x + shift] - meanB));
      return total;
    };
    const rest = error(0);
    let best = rest,
      offset = 0;
    for (let shift = -7; shift <= 7; shift++) {
      const value = error(shift);
      if (value < best) {
        best = value;
        offset = shift;
      }
    }
    if (offset !== 0 && best < rest * 0.8) movingRows++;
  }
  const movingFraction = movingRows / crop.height;
  await test.info().attach("reflection-travel", {
    body: JSON.stringify({ movingFraction }),
    contentType: "application/json",
  });
  await test.info().attach("water-before", { body: first, contentType: "image/png" });
  await test.info().attach("water-after", { body: second, contentType: "image/png" });
  expect(
    movingFraction,
    "Reflected tree lines must shift across at least 30% of rows, rather than just change brightness",
  ).toBeGreaterThan(0.3);
});

test("Gray Boo hover eases each environment cycle without moving the deck or feet", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1440 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openLake(page);
  const gray = page.getByRole("button", { name: "Trò chuyện với Gray Boo", exact: true });
  const deck = page.locator(".layer-ground");
  const npc = page.locator(".cafe-scene-person");
  const anchors = [await deck.boundingBox(), await npc.boundingBox()];
  const conversationRequests: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && /\/api\/cafe\//.test(request.url()))
      conversationRequests.push(request.url());
  });
  await gray.hover();
  await expect
    .poll(() => rates(page))
    .toEqual({
      "pine-lake-water": 1.8,
      "pine-lake-pine": 1.5,
      "pine-lake-flowers": 1.5,
      "pine-lake-particles": 2,
      "pine-lake-hologram": 1.3,
      "pine-lake-boat": 1,
      "pine-lake-rowing": 1,
    });
  expect([await deck.boundingBox(), await npc.boundingBox()]).toEqual(anchors);
  expect(conversationRequests).toEqual([]);
  await page.mouse.move(0, 0);
  await expect
    .poll(() => rates(page))
    .toEqual({
      "pine-lake-water": 1,
      "pine-lake-pine": 1,
      "pine-lake-flowers": 1,
      "pine-lake-particles": 1,
      "pine-lake-hologram": 1,
      "pine-lake-boat": 1,
      "pine-lake-rowing": 1,
    });
  await expect(npc.locator('[data-renderer="pixi"]')).toBeVisible();
  await page
    .locator(".cafe-scene-frame")
    .screenshot({ path: "reports/gray-boo-pine-lake/desktop.png" });
  const animationCount = () =>
    page.evaluate(
      () => document.getAnimations().filter((a) => a.id.startsWith("pine-lake-")).length,
    );
  expect(await animationCount()).toBe(17);
  await page.getByRole("button", { name: "Về đồi chè", exact: true }).click();
  await expect.poll(animationCount).toBe(0);
  await page.getByRole("button", { name: "Đến hồ thông", exact: true }).click();
  await expect.poll(animationCount).toBe(17);
});

test("keyboard focus boosts the lake, chat freezes ambient motion and closing returns to idle", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openLake(page);
  await page.mouse.move(0, 0);
  const gray = page.getByRole("button", { name: "Trò chuyện với Gray Boo", exact: true });
  await page.keyboard.press("Tab");
  await gray.focus();
  await expect.poll(async () => (await rates(page))["pine-lake-water"]).toBe(1.8);
  await page.keyboard.press("Tab");
  await expect.poll(async () => (await rates(page))["pine-lake-water"]).toBe(1);
  await page.keyboard.press("Shift+Tab");
  await expect(gray).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        document
          .getAnimations()
          .filter((a) => a.id.startsWith("pine-lake-"))
          .every((a) => a.playState === "paused" && a.playbackRate === 1),
      ),
    )
    .toBe(true);
  await expect(page.getByRole("button", { name: "Về đồi chè", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Đóng trò chuyện", exact: true }).click();
  await expect(gray).toBeFocused();
  await expect.poll(async () => (await rates(page))["pine-lake-water"]).toBe(1);
});

test("lake animation freezes on pause and hidden tabs, and reduced motion disables ambient FX", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1440 });
  await openLake(page);
  const times = () =>
    page.evaluate(() =>
      document
        .getAnimations()
        .filter((a) => a.id.startsWith("pine-lake-"))
        .map((a) => a.currentTime),
    );
  // WAAPI commits pause on the next timeline frame; wait for that public promise.
  const settledPause = () =>
    page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.id.startsWith("pine-lake-"))
          .map((a) => a.ready.then(() => undefined)),
      ),
    );
  await page.getByRole("button", { name: "Tạm dừng chuyển động", exact: true }).click();
  await settledPause();
  const paused = await times();
  expect(paused.length).toBeGreaterThan(5);
  await page.waitForTimeout(150);
  expect(await times()).toEqual(paused);
  await page.getByRole("button", { name: "Bật chuyển động", exact: true }).click();
  await expect.poll(async () => JSON.stringify(await times())).not.toBe(JSON.stringify(paused));
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await settledPause();
  const hidden = await times();
  await page.waitForTimeout(150);
  expect(await times()).toEqual(hidden);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Trò chuyện với Gray Boo", exact: true }).hover();
  await expect.poll(async () => (await rates(page))["pine-lake-water"]).toBe(1);
  await expect(page.locator(".pine-lake-water-mask")).toBeHidden();
  await expect(page.locator(".pine-lake-hologram")).toBeHidden();
  await expect(page.locator(".pine-lake-sway").first()).toHaveCSS("transform", "none");
  await settledPause();
  const reduced = await times();
  const reducedBoat = await page.locator(".pine-lake-boat").boundingBox();
  await page.waitForTimeout(150);
  expect(await times()).toEqual(reduced);
  expect(await page.locator(".pine-lake-boat").boundingBox()).toEqual(reducedBoat);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".pine-lake-water-mask")).toBeVisible();
  await expect.poll(async () => JSON.stringify(await times())).not.toBe(JSON.stringify(reduced));
});

test("mobile tap opens Gray Boo without sticky hover and keeps a 16:9 scene with a 44px hotspot", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  try {
    const page = await context.newPage();
    await openLake(page);
    const frame = await page.locator(".cafe-scene-frame").boundingBox();
    const gray = page.getByRole("button", { name: "Trò chuyện với Gray Boo", exact: true });
    const hotspot = await gray.boundingBox();
    expect(frame!.width / frame!.height).toBeCloseTo(16 / 9, 2);
    expect(hotspot!.width).toBeGreaterThanOrEqual(44);
    expect(hotspot!.height).toBeGreaterThanOrEqual(44);
    await gray.tap();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect.poll(async () => (await rates(page))["pine-lake-water"]).toBe(1);
    await page.getByRole("button", { name: "Đóng trò chuyện", exact: true }).tap();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect.poll(async () => (await rates(page))["pine-lake-water"]).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: "reports/gray-boo-pine-lake/mobile.png", fullPage: true });
  } finally {
    await context.close();
  }
});

test("Gray Boo idle animates inside the canvas while the shoe pixels stay fixed", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openLake(page);
  const npc = page.locator('.cafe-scene-person [data-npc-id="gray_boo"]');
  await expect(npc).toHaveAttribute("data-renderer", "pixi");
  const canvas = npc.locator("canvas");
  await canvas.evaluate((element) => {
    element.style.backgroundColor = "#e9e7df";
  });
  const first = await canvas.screenshot();
  await page.waitForTimeout(500);
  const second = await canvas.screenshot();
  expect(second.equals(first)).toBe(false);
  const feet = async (png: Buffer) => {
    const meta = await sharp(png).metadata();
    const height = Math.max(1, Math.floor(meta.height! * 0.08));
    return sharp(png)
      .extract({ left: 0, top: meta.height! - height, width: meta.width!, height })
      .raw()
      .toBuffer();
  };
  const a = await feet(first),
    b = await feet(second);
  expect(a.length).toBe(b.length);
  expect(a.every((value, i) => Math.abs(value - b[i]) <= 1)).toBe(true);
});

test("a missing lake layer shows a static poster and retry restores the live scene", async ({
  page,
}) => {
  await page.route("**/pine_branch_left.webp", (route) => route.abort());
  await openLake(page);
  const fallback = page.getByRole("alert").filter({ hasText: "Chưa tải đủ khung cảnh" });
  await expect(fallback).toBeVisible();
  await expect(page.locator(".pine-lake-static-poster")).toBeVisible();
  await expect(page.locator(".cafe-pine-lake")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Trò chuyện với Gray Boo", exact: true }),
  ).toBeEnabled();
  await page.unroute("**/pine_branch_left.webp");
  await page.getByRole("button", { name: "Tải lại cảnh", exact: true }).click();
  await expect(fallback).toHaveCount(0);
  await expect(page.locator(".pine-lake-static-poster")).toHaveCount(0);
  await expect(page.locator(".cafe-pine-lake")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".cafe-pine-lake img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
});
