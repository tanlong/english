import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { npcs, resolveNpc } from "./registry.mjs";
import { validateImage } from "./pipeline.mjs";

// Per-character measured calibration; never copy Cloud Daisy's joint map.
const calibration = {
  ollie_owl: {
    shoulder: { x: 1000, y: 700 },
    arm: { width: 300, height: 430, pivotX: 0.86, pivotY: 0.89, pawX: 0.13, pawY: 0.07 },
    eyes: [
      { left: 465, top: 320, width: 213, height: 151 },
      { left: 686, top: 300, width: 157, height: 145 },
    ],
    direction: 1,
    limitations: [
      "Reading book and adjusting glasses; laptop and coffee action await separate approved props",
      "Book and supporting wing remain a single base layer",
    ],
  },
  mimi_bunny: {
    shoulder: { x: 519, y: 620 },
    arm: { width: 350, height: 359, pivotX: 0.89, pivotY: 0.86, pawX: 0.32, pawY: 0.39 },
    eyes: [
      { left: 435, top: 253, width: 170, height: 126 },
      { left: 684, top: 302, width: 112, height: 78 },
    ],
    direction: -1,
    limitations: [
      "Peace-sign greeting and blink; book/page-turn art not available",
      "Raised-leg master pose is preserved; planted foot stays fixed",
    ],
  },
  astro_bean: {
    shoulder: { x: 405, y: 690 },
    arm: { width: 430, height: 252, pivotX: 0.92, pivotY: 0.6, pawX: 0.22, pawY: 0.48 },
    eyes: [
      { left: 442, top: 353, width: 125, height: 145 },
      { left: 610, top: 327, width: 100, height: 122 },
    ],
    direction: -1,
    restAngle: 20,
    limitations: [
      "Orange bean astronaut anatomy preserved; no wings or beak",
      "Scanner remains held in the stationary base; independent badge/scanner action awaits art",
    ],
  },
  bear_explorer: {
    shoulder: { x: 410, y: 600 },
    arm: { width: 264, height: 492, pivotX: 0.84, pivotY: 0.88, pawX: 0.4, pawY: 0.12 },
    eyes: [
      { left: 505, top: 237, width: 125, height: 72 },
      { left: 664, top: 240, width: 80, height: 60 },
    ],
    direction: -1,
    limitations: [
      "Hat-tip greeting and blink while holding the approved map",
      "Map opening and camera lift await isolated map/camera art",
      "Train gesture not exported in these two clips",
    ],
  },
  gray_boo: {
    shoulder: { x: 510, y: 620 },
    arm: { width: 480, height: 405, pivotX: 0.9, pivotY: 0.28, pawX: 0.14, pawY: 0.32 },
    eyes: [
      { left: 430, top: 267, width: 192, height: 160 },
      { left: 668, top: 315, width: 120, height: 135 },
    ],
    direction: -1,
    limitations: [
      "Alien greeting and blink, original glowing guide tablet retained",
      "Guide and supporting arm remain embedded in base; cup and independent head tilt await art",
    ],
  },
};

const npcIndex = process.argv.indexOf("--npc");
const selected =
  npcIndex >= 0
    ? [resolveNpc(process.argv[npcIndex + 1])]
    : npcs.filter((npc) => npc.id !== "cloud_daisy");
for (const npc of selected) {
  const config = calibration[npc.id];
  if (!config) throw new Error("Use npc:prepare-pilot for Cloud Daisy.");
  const base = path.resolve("art/npc", npc.id);
  const previous = existsSync(path.join(base, "rig.json"))
    ? JSON.parse(await readFile(path.join(base, "rig.json"), "utf8"))
    : null;
  if (previous?.approved) throw new Error(`Refusing to overwrite approved rig: ${npc.id}`);
  const master = await validateImage(path.join(base, "source/master_rgba.png"));
  const approval = JSON.parse(await readFile(path.join(base, "approval.json"), "utf8"));
  if (
    !master.technicalPass ||
    !approval.master.accepted ||
    approval.master.normalizedSha256 !== master.sha256
  )
    throw new Error(`Approved master required: ${npc.id}`);
  const registered = path.join(base, "draft/registered");
  await mkdir(registered, { recursive: true });
  const layers = [];
  for (const id of ["body", "arm_wave"]) {
    const file = path.join(base, "draft/parts", `${id}.png`);
    const validation = await validateImage(file);
    if (!validation.bbox || validation.errors.includes("OPAQUE_BACKGROUND"))
      throw new Error(`Missing/invalid layer ${file}`);
    const box =
      id === "body"
        ? { left: 0, top: 0, width: validation.width, height: validation.height }
        : validation.bbox;
    await sharp(file)
      .extract(box)
      .png()
      .toFile(path.join(registered, `${id}.png`));
    layers.push({
      id,
      file: `draft/registered/${id}.png`,
      sourceFile: `draft/parts/${id}.png`,
      sourceHash: validation.sha256,
      sourceSize: { width: validation.width, height: validation.height },
      trim: box,
      approved: false,
    });
  }
  for (let index = 0; index < config.eyes.length; index++) {
    const id = index === 0 ? "eye_l_closed" : "eye_r_closed";
    const box = config.eyes[index];
    const feather = 5;
    const svg = `<svg width="${box.width}" height="${box.height}"><defs><filter id="blur"><feGaussianBlur stdDeviation="2.5"/></filter></defs><rect x="${feather}" y="${feather}" width="${box.width - 2 * feather}" height="${box.height - 2 * feather}" rx="12" fill="white" filter="url(#blur)"/></svg>`;
    const input = path.join(base, "draft/parts/eyes_closed.png");
    await sharp(input)
      .extract(box)
      .composite([{ input: Buffer.from(svg), blend: "dest-in" }])
      .png()
      .toFile(path.join(registered, `${id}.png`));
    const sha256 = createHash("sha256")
      .update(await readFile(input))
      .digest("hex");
    layers.push({
      id,
      file: `draft/registered/${id}.png`,
      sourceFile: "draft/parts/eyes_closed.png",
      sourceHash: sha256,
      trim: box,
      approved: false,
    });
  }
  const rig = {
    schemaVersion: "3.0",
    npcId: npc.id,
    approved: false,
    mode: "single-arm",
    status: "DRAFT_SIGNATURE_PARTIAL",
    renderer: "Canvas2D deterministic review; runtime integration requires art acceptance",
    sourceMaster: "source/master_rgba.png",
    sourceHash: master.sha256,
    coordinateSystem: { width: master.width, height: master.height, unit: "source-pixels" },
    root: {
      anchor: {
        x: Math.round(master.bbox.left + master.bbox.width / 2),
        y: master.bbox.top + master.bbox.height - 1,
      },
      displayHeightPx: 220,
    },
    calibration:
      "Measured draft joints, requires neutral overlay/owner visual review; no inherited Cloud Daisy pivots",
    layers,
    placement: {
      body: { x: 0, y: 0, width: master.width, height: master.height, order: 0 },
      arm_wave: { ...config.shoulder, ...config.arm, order: 20 },
    },
    motion: {
      idleAmplitude: 2.5,
      waveAmplitude: 22,
      direction: config.direction,
      restAngle: config.restAngle ?? 0,
    },
    clips: {
      idle: { duration: npc.idle, fps: 12, loop: true, endState: "idle" },
      interaction: { duration: npc.interaction, fps: 24, loop: false, endState: "listening" },
    },
    limitations: config.limitations,
  };
  await writeFile(path.join(base, "rig.json"), `${JSON.stringify(rig, null, 2)}\n`);
  console.log(`Prepared ${npc.id} with its own shoulder/eye calibration (draft).`);
}
