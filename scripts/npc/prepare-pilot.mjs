import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { validateImage } from "./pipeline.mjs";

const base = path.resolve("art/npc/cloud_daisy");
if (existsSync(path.join(base, "approval.json"))) {
  const approval = JSON.parse(await readFile(path.join(base, "approval.json"), "utf8"));
  if (approval.pilot?.accepted)
    throw new Error(
      "Refusing to overwrite the owner-approved Cloud Daisy pilot. Create a separate draft version for changes.",
    );
}
const draft = path.join(base, "draft");
const out = path.join(draft, "registered");
await mkdir(out, { recursive: true });
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const layers = [];
for (const [id, folder] of [
  ["body", "parts"],
  ["arm_wave", "parts"],
  ["arm_hold", "parts"],
  ["cup", "props"],
  ["cloth", "props"],
]) {
  const file = path.join(draft, folder, `${id}.png`);
  const validation = await validateImage(file);
  if (!validation.bbox || validation.errors.includes("OPAQUE_BACKGROUND"))
    throw new Error(`Invalid alpha: ${file}`);
  const bbox =
    id === "body"
      ? { left: 0, top: 0, width: validation.width, height: validation.height }
      : validation.bbox;
  await sharp(file)
    .extract(bbox)
    .png()
    .toFile(path.join(out, `${id}.png`));
  layers.push({
    id,
    file: `draft/registered/${id}.png`,
    sourceFile: `draft/${folder}/${id}.png`,
    sourceHash: validation.sha256,
    sourceSize: { width: validation.width, height: validation.height },
    trim: bbox,
    approved: false,
  });
}

// Registered crops from the full-resolution expression edit; no sheet thumbnails.
for (const [id, box] of [
  ["eye_l_closed", { left: 400, top: 200, width: 153, height: 120 }],
  ["eye_r_closed", { left: 606, top: 253, width: 100, height: 100 }],
]) {
  const feather = 6;
  const svg = `<svg width="${box.width}" height="${box.height}"><defs><filter id="blur"><feGaussianBlur stdDeviation="${feather / 2}"/></filter></defs><rect x="${feather}" y="${feather}" width="${box.width - 2 * feather}" height="${box.height - 2 * feather}" rx="14" fill="white" filter="url(#blur)"/></svg>`;
  const input = path.join(draft, "parts/eyes_closed.png");
  await sharp(input)
    .extract(box)
    .composite([{ input: Buffer.from(svg), blend: "dest-in" }])
    .png()
    .toFile(path.join(out, `${id}.png`));
  layers.push({
    id,
    file: `draft/registered/${id}.png`,
    sourceFile: "draft/parts/eyes_closed.png",
    sourceHash: sha(await readFile(input)),
    trim: box,
    approved: false,
  });
}

const rig = {
  schemaVersion: "3.0",
  npcId: "cloud_daisy",
  approved: false,
  status: "DRAFT_REQUIRES_JOINT_AND_IDENTITY_REVIEW",
  renderer: "Canvas2D review renderer; existing app uses DOM/CSS, no PixiJS installed",
  sourceMaster: "source/master_rgba.png",
  sourceHash: sha(await readFile(path.join(base, "source/master_rgba.png"))),
  coordinateSystem: { width: 1087, height: 1447, unit: "source-pixels" },
  root: { anchor: { x: 470, y: 1427 }, displayHeightPx: 220 },
  calibration:
    "Initial positions measured against supplied art; editable in review lab. Not approved joint coordinates.",
  layers,
  placement: {
    body: { x: 0, y: 0, width: 1087, height: 1447, order: 0 },
    arm_wave: {
      x: 365,
      y: 630,
      width: 235,
      height: 310,
      pivotX: 0.78,
      pivotY: 0.85,
      order: 20,
      pawX: 0.38,
      pawY: 0.22,
    },
    arm_hold: {
      x: 704,
      y: 625,
      width: 285,
      height: 198,
      pivotX: 0.89,
      pivotY: 0.16,
      order: 10,
      pawX: 0.15,
      pawY: 0.53,
    },
    cup: { x: 460, y: 650, width: 166, height: 140, order: 15, parent: "arm_hold" },
    cloth: { width: 100, height: 100, order: 25, parent: "arm_wave" },
  },
  clips: {
    idle: { duration: 8, fps: 12, loop: true, endState: "idle" },
    interaction: { duration: 2, fps: 24, loop: false, endState: "listening" },
  },
  limitations: [
    "Draft reconstructed cloak differs in regions originally hidden by paws; owner must review",
    "Cup grip and cloth contact require visual approval",
    "Cup remains attached to paw; counter set-down is not implemented without a calibrated scene attachment",
    "No automatic art acceptance or runtime deployment",
  ],
};
await writeFile(path.join(base, "rig.json"), `${JSON.stringify(rig, null, 2)}\n`);
console.log("Prepared seven registered draft layers and editable rig coordinates.");
