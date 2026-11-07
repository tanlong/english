import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { main } from "./pipeline.mjs";
import { resolveNpc } from "./registry.mjs";

if (!process.argv.includes("--draft"))
  throw new Error("Review export requires --draft. Production publishing is not enabled.");
const npcArg = process.argv.indexOf("--npc");
const npc = resolveNpc(npcArg < 0 ? "cloud_daisy" : process.argv[npcArg + 1]);
const root = process.cwd();
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
if (npc.id !== "cloud_daisy") {
  const cloud = path.join(root, "art/npc/cloud_daisy");
  const approval = JSON.parse(await readFile(path.join(cloud, "approval.json"), "utf8"));
  const cloudRigHash = hash(await readFile(path.join(cloud, "rig.json")));
  if (!approval.pilot?.accepted || approval.pilot.reviewedRigHash !== cloudRigHash)
    throw new Error("The current Cloud Daisy pilot must be approved before exporting other NPCs.");
}
const master = await main(["validate-master", "--npc", npc.id]);
if (!master.approved) throw new Error("An approved and hash-verified master is required.");
const out = path.join(root, "reports/npc", npc.id);
const art = path.join(root, "art/npc", npc.id);
const html = path.join(out, "review.html");
if (!existsSync(html)) throw new Error("Run npm run npc:preview first.");
const rigBytes = await readFile(path.join(art, "rig.json"));
const rig = JSON.parse(rigBytes);
if (rig.npcId !== npc.id || rig.sourceHash !== master.sha256)
  throw new Error("Rig must reference the requested NPC and approved source master hash.");
if (rig.coordinateSystem.width !== master.width || rig.coordinateSystem.height !== master.height)
  throw new Error("Rig source dimensions must match the approved master.");
for (const [state, fps] of [
  ["idle", 12],
  ["interaction", 24],
]) {
  const clip = rig.clips[state];
  if (!clip || clip.fps !== fps || clip.duration !== npc[state] || clip.loop !== (state === "idle"))
    throw new Error(`Invalid ${state} timing; use the per-NPC registry duration at ${fps} fps.`);
}
const layers = [];
for (const layer of rig.layers)
  layers.push({ file: layer.file, sha256: hash(await readFile(path.join(art, layer.file))) });
const expectedBuildMeta = {
  rigHash: hash(rigBytes),
  masterHash: master.sha256,
  rendererHash: hash(await readFile(path.join(root, "scripts/npc/review-player.mjs"))),
  layers,
};
await mkdir(path.join(out, "preview"), { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = {
  npcId: npc.id,
  mode: "draft",
  renderer: "Canvas2D deterministic seek + Playwright",
  encoder: "Sharp/libvips GIF (current draft encoder; FFmpeg available)",
  sourceHash: master.sha256,
  rigHash: hash(rigBytes),
  rendererHash: expectedBuildMeta.rendererHash,
  renderedLayers: layers,
  clips: [],
  browserChecks: {},
  pass: false,
  productionApproved: false,
};
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1100 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // Self-contained local review: no network services or remote image calls.
  await page.route("https://**/*", (route) => route.abort());
  await page.route("http://**/*", (route) => route.abort());
  await page.goto(pathToFileURL(html).href);
  await page.waitForFunction(() => window.npcLab?.ready);
  const embedded = await page.evaluate(() => ({
    rig: window.npcLab.rig,
    buildMeta: window.npcLab.buildMeta,
  }));
  if (
    JSON.stringify(embedded.rig) !== JSON.stringify(rig) ||
    JSON.stringify(embedded.buildMeta) !== JSON.stringify(expectedBuildMeta)
  )
    throw new Error(
      "Review HTML is stale: rebuild npc:preview for this NPC before exporting the current rig or artwork.",
    );
  report.browserChecks.reviewMatchesCurrentAssets = true;
  await page.screenshot({ path: path.join(out, "review-desktop.png") });
  report.browserChecks.reducedMotionStartsPaused = await page.evaluate(
    () => !window.npcLab.playing,
  );
  report.browserChecks.idleLoopSamePose = await page.evaluate((duration) => {
    const a = window.npcLab.player.sample(0, "idle"),
      b = window.npcLab.player.sample(duration, "idle");
    return JSON.stringify(a) === JSON.stringify(b);
  }, rig.clips.idle.duration);
  for (const state of ["idle", "interaction"]) {
    await page.evaluate((state) => {
      window.npcLab.setClip(state);
      window.npcLab.pause();
    }, state);
    const clip = rig.clips[state];
    const count = Math.round(clip.duration * clip.fps);
    const frameDir = path.join(out, "frames", state);
    await mkdir(frameDir, { recursive: true });
    const raw = [];
    const contact = [];
    let info;
    let stableFeet = true;
    let feetRegion;
    let feetHash;
    for (let i = 0; i < count; i++) {
      // Last interaction frame holds the endpoint listening pose; no duplicate loop endpoint for idle.
      const time = state === "interaction" && i === count - 1 ? clip.duration : i / clip.fps;
      const frame = await page.evaluate((time) => {
        const pose = window.npcLab.seek(time);
        return {
          pose,
          png: document.getElementById("canvas").toDataURL("image/png").split(",")[1],
        };
      }, time);
      const fixedAnchor =
        frame.pose.feetAnchor.x === rig.root.anchor.x &&
        frame.pose.feetAnchor.y === rig.root.anchor.y;
      const png = Buffer.from(frame.png, "base64");
      await writeFile(path.join(frameDir, `frame_${String(i).padStart(4, "0")}.png`), png);
      const decoded = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      info = decoded.info;
      if (!feetRegion) {
        let top = info.height,
          bottom = -1;
        for (let y = 0; y < info.height; y++) {
          for (let x = 0; x < info.width; x++) {
            if (decoded.data[(y * info.width + x) * 4 + 3] > 16) {
              top = Math.min(top, y);
              bottom = y;
            }
          }
        }
        if (bottom < 0) throw new Error("Rendered frame is empty; cannot verify feet stability.");
        const height = Math.max(1, Math.ceil((bottom - top + 1) * 0.1));
        feetRegion = { left: 0, top: bottom - height + 1, width: info.width, height };
      }
      const currentFeetHash = hash(
        decoded.data.subarray(
          feetRegion.top * info.width * 4,
          (feetRegion.top + feetRegion.height) * info.width * 4,
        ),
      );
      feetHash ??= currentFeetHash;
      stableFeet &&= fixedAnchor && currentFeetHash === feetHash;
      raw.push(decoded.data);
      if (i % Math.ceil(count / 8) === 0) contact.push(png);
    }
    // GIF has centisecond timing; distribute rounding over the full clip.
    const delays = Array.from(
      { length: count },
      (_, i) => (Math.round(((i + 1) * 100) / clip.fps) - Math.round((i * 100) / clip.fps)) * 10,
    );
    const file = path.join(out, "preview", `${npc.id}_${state}.gif`);
    await sharp(Buffer.concat(raw), {
      raw: { width: info.width, height: info.height * count, channels: 4, pageHeight: info.height },
    })
      .gif({
        loop: clip.loop ? 0 : 1,
        delay: delays,
        effort: 7,
        dither: 0.5,
        colours: 256,
        keepDuplicateFrames: true,
      })
      .toFile(file);
    const meta = await sharp(file, { animated: true }).metadata();
    const durationMs = (meta.delay ?? []).reduce((a, b) => a + b, 0);
    const expectedDurationMs = clip.duration * 1000;
    const pass =
      meta.pages === count &&
      durationMs === expectedDurationMs &&
      meta.loop === (clip.loop ? 0 : 1) &&
      stableFeet;
    report.clips.push({
      state,
      path: path.relative(root, file),
      sha256: hash(await readFile(file)),
      frames: meta.pages,
      width: meta.width,
      height: meta.pageHeight,
      durationMs,
      loop: meta.loop,
      stableFeet,
      feetPixelRegion: feetRegion,
      feetPixelSha256: feetHash,
      pass,
    });
    const thumbW = 192,
      thumbH = 240;
    const cells = await Promise.all(
      contact.map(async (png, i) => ({
        input: await sharp(png)
          .resize(thumbW, thumbH)
          .flatten({ background: "#e9e7df" })
          .png()
          .toBuffer(),
        left: (i % 4) * thumbW,
        top: Math.floor(i / 4) * thumbH,
      })),
    );
    await sharp({
      create: { width: thumbW * 4, height: thumbH * 2, channels: 3, background: "#e9e7df" },
    })
      .composite(cells)
      .png()
      .toFile(path.join(out, `${state}-contact-sheet.png`));
    console.log(`${state}: ${meta.pages} frames, ${durationMs}ms, loop=${meta.loop}, pass=${pass}`);
  }
  // Five repeated greetings replace a single foreground action; do not stack players.
  for (let i = 0; i < 5; i++) await page.locator("#notice").click();
  report.browserChecks.repeatedClickOneForeground = await page.evaluate(
    () => window.npcLab.player.render(0.4, "interaction").activeForegroundTimelines === 1,
  );
  await page.evaluate(() => window.npcLab.pause());
  report.browserChecks.interactionEndsListening = await page.evaluate(
    (duration) => window.npcLab.player.render(duration, "interaction").state === "listening",
    rig.clips.interaction.duration,
  );
  for (const [name, color] of [
    ["light", "#e9e7df"],
    ["dark", "#101827"],
    ["cafe", "#86a68e"],
  ]) {
    await page.selectOption("#bg", color);
    await page.evaluate((duration) => {
      window.npcLab.setClip("idle");
      window.npcLab.seek(duration * 0.65625);
    }, rig.clips.idle.duration);
    await page.locator("#rigStage").screenshot({ path: path.join(out, `alpha-${name}.png`) });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(out, "review-mobile.png"), fullPage: true });
  report.browserChecks.mobileNoHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= innerWidth,
  );
  report.browserChecks.pageErrors = errors;
  report.pass =
    report.clips.every((clip) => clip.pass) &&
    Object.entries(report.browserChecks).every(([name, value]) =>
      name === "pageErrors" ? value.length === 0 : value === true,
    );
} catch (error) {
  report.error = error.message;
  console.error(error.message);
} finally {
  await browser.close();
}
await writeFile(path.join(out, "export-validation.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Draft export ${report.pass ? "PASS" : "FAIL"}. Owner review remains required.`);
if (!report.pass) process.exitCode = 1;
