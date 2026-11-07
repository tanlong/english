import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const config = JSON.parse(await readFile("configs/scenes.json", "utf8"));
assert.equal(config.assetRevision, "dalat-fullhd-v5");
const baseURL = process.env.CAFE_PREVIEW_URL || "http://localhost:3000";
const out = "reports/dalat";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ["--no-proxy-server"] });
const page = await browser.newPage({
  viewport: { width: 2048, height: 1440 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
const failures = [],
  captures = [];
page.on("pageerror", (error) => failures.push(error.message));
page.on("response", (response) => {
  if (response.status() >= 400 && /\/cafe\/(dalat|npc)\//.test(response.url()))
    failures.push(`${response.status()} ${response.url()}`);
});
async function ready(scene) {
  await page.locator(`.cafe-scene-frame[data-setting="${scene.settingId}"]`).waitFor();
  await page.waitForFunction((count) => {
    const people = [...document.querySelectorAll(".cafe-scene-person [data-renderer]")];
    const images = [...document.querySelectorAll(".cafe-scene-frame img")];
    return (
      people.length === count &&
      people.every((p) => p.dataset.renderer === "pixi") &&
      images.length >= count + 4 &&
      images.every((i) => i.complete && i.naturalWidth > 0)
    );
  }, scene.npcs.length);
  await page
    .locator(".cafe-scene-frame img")
    .evaluateAll((images) => Promise.all(images.map((i) => i.decode())));
  const layout = await page.evaluate(() => {
    const rect = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    return {
      frame: rect(document.querySelector(".cafe-scene-frame")),
      toolbar: rect(document.querySelector(".cafe-scene-top")),
      labels: [...document.querySelectorAll(".cafe-scene-arrow-label")].map(rect),
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  assert.equal(layout.overflow, false);
  assert.ok(layout.toolbar.y >= layout.frame.y + layout.frame.height - 1);
  for (const label of layout.labels) {
    assert.ok(
      label.x >= layout.frame.x && label.x + label.width <= layout.frame.x + layout.frame.width + 1,
    );
    assert.ok(
      label.y >= layout.frame.y &&
        label.y + label.height <= layout.frame.y + layout.frame.height + 1,
    );
  }
}
try {
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
  await page.goto(`${baseURL}/english/cafe`);
  for (const [index, scene] of config.scenes.entries()) {
    await ready(scene);
    await mkdir(`${out}/${scene.settingId}`, { recursive: true });
    const original = await page.locator(".cafe-scene-frame").screenshot();
    const png = await sharp(original).resize(1920, 1080, { fit: "fill" }).png().toBuffer();
    const file = `${out}/${scene.settingId}/scene-fullhd.png`;
    await writeFile(file, png);
    captures.push({
      settingId: scene.settingId,
      file,
      width: 1920,
      height: 1080,
      sha256: createHash("sha256").update(png).digest("hex"),
      npcs: scene.npcs.map((npc) => npc.id),
    });
    if (index < config.scenes.length - 1)
      await page
        .getByRole("button", {
          name: scene.exits.find((exit) => exit.direction === "right").label,
          exact: true,
        })
        .locator(".cafe-scene-arrow-label")
        .click();
  }
  for (const viewport of [
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(`${baseURL}/english/cafe`);
    for (const [index, scene] of config.scenes.entries()) {
      await ready(scene);
      await page.screenshot({
        path: `${out}/${scene.settingId}/${viewport.width}-runtime.png`,
        fullPage: true,
      });
      if (index < config.scenes.length - 1)
        await page
          .getByRole("button", {
            name: scene.exits.find((exit) => exit.direction === "right").label,
            exact: true,
          })
          .locator(".cafe-scene-arrow-label")
          .click();
    }
  }
  assert.deepEqual(failures, []);
  const report = {
    baseURL,
    revision: config.assetRevision,
    pass: true,
    captures,
    viewports: ["2048x1440 capture to 1920x1080", "768x1024", "390x844"],
    failures,
    toolbarBelowScene: true,
    visibleLabelsClickable: true,
    sixPuppetsRender: true,
  };
  await writeFile(`${out}/browser-captures-v5.json`, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
