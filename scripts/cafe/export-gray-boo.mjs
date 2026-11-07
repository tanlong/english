import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import ts from "typescript";
import sharp from "sharp";

// Render the real Pixi puppet offline, not a second approximation of its rig.
const origin = "http://gray-boo-preview.local";
const compile = async (file) =>
  ts.transpileModule(await readFile(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;
const player = (await compile("app/cafe/npc-puppet.ts"))
  .replace(/from "pixi.js"/, 'from "/pixi.mjs"')
  .replace(/import \{ gsap \} from "gsap";/, "const { gsap } = globalThis;")
  .replace(/from "\.\/npc-motion"/, 'from "/npc-motion.js"');
const modules = {
  "/player.js": player,
  "/npc-motion.js": await compile("app/cafe/npc-motion.ts"),
  "/pixi.mjs": await readFile("node_modules/pixi.js/dist/pixi.mjs", "utf8"),
  "/gsap.js": await readFile("node_modules/gsap/dist/gsap.min.js", "utf8"),
};
const npc = JSON.parse(await readFile("app/cafe/npc-assets.json", "utf8")).gray_boo;
const config = JSON.parse(await readFile("configs/mountain_view.animation.json", "utf8"));
const out = "public/cafe/assets/npc/gray_boo";
const reports = "reports/gray-boo-pine-lake";
await mkdir(out, { recursive: true });
await mkdir(reports, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = {
  renderer: "Project PixiJS puppet, deterministic snapshots",
  fps: 8,
  durationMs: 3000,
  width: 384,
  height: 480,
  clips: [],
  pageErrors: [],
  rig: npc.rig,
  productionApproved: false,
};
const hash = (data) => createHash("sha256").update(data).digest("hex");
try {
  const page = await browser.newPage({
    viewport: { width: 512, height: 640 },
    deviceScaleFactor: 1,
  });
  page.on("pageerror", (error) => report.pageErrors.push(error.message));
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (url.pathname === "/")
      return route.fulfill({
        contentType: "text/html",
        body: `<!doctype html>
      <html><head><style>body{margin:0}#puppet{width:512px;height:640px}</style></head>
      <body><div id="puppet"></div><script src="/gsap.js"></script><script type="module">
      import { mountNpcPuppet } from '/player.js';
      window.player = await mountNpcPuppet(document.getElementById('puppet'), ${JSON.stringify(npc.rig)});
      </script></body></html>`,
      });
    if (modules[url.pathname])
      return route.fulfill({ contentType: "text/javascript", body: modules[url.pathname] });
    if (!url.pathname.startsWith("/cafe/")) return route.abort();
    const file = path.resolve("public", `.${url.pathname}`);
    if (!file.startsWith(path.resolve("public") + path.sep)) return route.abort();
    await route.fulfill({ path: file });
  });
  await page.goto(origin);
  await page.waitForFunction(() => Boolean(window.player));
  const snapshot = async (seconds, state) =>
    Buffer.from(
      (
        await page.evaluate(({ seconds, state }) => window.player.snapshot(seconds, state), {
          seconds,
          state,
        })
      ).split(",")[1],
      "base64",
    );
  const idleStart = await snapshot(0, "idle"),
    idleEnd = await snapshot(3, "idle");
  const firstPixels = await sharp(idleStart).raw().toBuffer();
  const lastPixels = await sharp(idleEnd).raw().toBuffer();
  assert.ok(
    firstPixels.equals(lastPixels),
    "The three-second idle loop must return to the same pixels",
  );
  report.seamlessIdle = true;
  const glow = await readFile(`public${config.hologram.src}`);
  const contact = [];
  for (const [name, state] of [
    ["idle", "idle"],
    ["notice", "notice"],
  ]) {
    const frames = [];
    let feetHash;
    for (let i = 0; i < 24; i++) {
      const time = i / 8;
      const png = await snapshot(time, state);
      const glowPixels = await sharp(glow)
        .resize(166, 102)
        .ensureAlpha()
        .linear([1, 1, 1, 0.25 + Math.sin((time / 3) * Math.PI * 2) * 0.1], [0, 0, 0, 0])
        .png()
        .toBuffer();
      const composed = await sharp(png)
        .composite([{ input: glowPixels, left: 316, top: 264 }])
        .png()
        .toBuffer();
      const frame = await sharp(composed).resize(384, 480).ensureAlpha().raw().toBuffer();
      assert.ok(
        frame.some((_, p) => p % 4 === 3 && frame[p] > 0),
        "Nonempty alpha frame required",
      );
      const feet = hash(frame.subarray(410 * 384 * 4));
      feetHash ??= feet;
      assert.equal(feet, feetHash, `${state}: shoe pixels must remain anchored`);
      frames.push(frame);
      if (state === "idle" && [0, 4, 8, 10, 12, 16, 20, 23].includes(i)) contact.push(frame);
      if (name === "idle" && i === 0) {
        await sharp(frame, { raw: { width: 384, height: 480, channels: 4 } })
          .webp({ lossless: true })
          .toFile(`${out}/gray_boo_poster.webp`);
        await sharp(frame, { raw: { width: 384, height: 480, channels: 4 } })
          .png()
          .toFile(`${out}/gray_boo_poster.png`);
      }
    }
    const input = { raw: { width: 384, height: 480 * 24, channels: 4, pageHeight: 480 } };
    for (const format of name === "idle" ? ["webp", "gif"] : ["webp"]) {
      const encoder = sharp(Buffer.concat(frames), input);
      if (format === "webp")
        encoder.webp({
          quality: 90,
          alphaQuality: 100,
          loop: 0,
          delay: Array(24).fill(125),
          effort: 5,
        });
      else
        encoder.gif({
          loop: 0,
          delay: Array.from({ length: 24 }, (_, i) => (i % 2 ? 120 : 130)),
          colours: 256,
          effort: 7,
          dither: 0.5,
          keepDuplicateFrames: true,
        });
      const file = `${out}/gray_boo_${name}.${format}`;
      const bytes = await encoder.toBuffer();
      await writeFile(file, bytes);
      const meta = await sharp(bytes, { animated: true }).metadata();
      assert.equal(meta.loop, 0);
      assert.ok(meta.pages > 2);
      assert.equal(
        meta.delay.reduce((sum, ms) => sum + ms, 0),
        3000,
      );
      report.clips.push({
        file,
        frames: meta.pages,
        durationMs: 3000,
        bytes: bytes.length,
        sha256: hash(bytes),
        stableFeet: true,
        hasAlpha: meta.hasAlpha,
      });
    }
  }
  const thumbs = await Promise.all(
    contact.map(async (frame, i) => ({
      input: await sharp(frame, { raw: { width: 384, height: 480, channels: 4 } })
        .resize(192, 240)
        .flatten({ background: "#e9e7df" })
        .png()
        .toBuffer(),
      left: (i % 4) * 192,
      top: Math.floor(i / 4) * 240,
    })),
  );
  await sharp({ create: { width: 768, height: 480, channels: 3, background: "#e9e7df" } })
    .composite(thumbs)
    .png()
    .toFile(`${reports}/idle-contact-sheet.png`);
  assert.deepEqual(report.pageErrors, []);
  report.pass = true;
} finally {
  await browser.close();
  await writeFile(`${reports}/preview-validation.json`, JSON.stringify(report, null, 2) + "\n");
}
console.log(JSON.stringify(report, null, 2));
