import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const width = 1920,
  height = 1080;
const source = "art/dalat/pine_lake/source/master-fullhd.png";
const sourceBytes = await readFile(source);
const motionFolder = "art/dalat/pine_lake/motion";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const sceneFolder = "public/cafe/assets/scenes/mountain_view";
const npcFolder = "public/cafe/assets/npc/gray_boo";
await mkdir(sceneFolder, { recursive: true });
await mkdir(npcFolder, { recursive: true });
const assets = [];
async function publish(folder, name, input) {
  const bytes = await sharp(input).webp({ quality: 96, alphaQuality: 100 }).toBuffer();
  const file = `${folder}/${name}.webp`;
  await writeFile(file, bytes);
  const meta = await sharp(bytes).metadata();
  const entry = {
    src: file.replace(/^public/, ""),
    width: meta.width,
    height: meta.height,
    hasAlpha: meta.hasAlpha,
    bytes: bytes.length,
    sha256: hash(bytes),
  };
  assets.push(entry);
  return entry;
}
const background = await publish(sceneFolder, "bg_clean", sourceBytes);
const repaired = await sharp(`${motionFolder}/boat-region-repaired.png`)
  .resize(480, 240)
  .ensureAlpha()
  .raw()
  .toBuffer();
const patchBoat = (data) => {
  // Only the old hull and its reflection are replaced. The surrounding scene
  // stays pixel-identical to the original plate, with an eight-pixel feather.
  for (let y = 455; y < 517; y++)
    for (let x = 520; x < 625; x++) {
      const edge = Math.min(x - 520, 624 - x, y - 455, 516 - y);
      const blend = Math.min(1, edge / 8);
      const i = (y * width + x) * 4,
        j = ((y - 360) * 480 + x - 360) * 4;
      for (let c = 0; c < 3; c++)
        data[i + c] = Math.round(data[i + c] * (1 - blend) + repaired[j + c] * blend);
    }
  return data;
};
const boatlessMaster = patchBoat(await sharp(sourceBytes).ensureAlpha().raw().toBuffer());
const waterBase = await publish(
  sceneFolder,
  "lake_base_boatless",
  await sharp(boatlessMaster, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer(),
);
const landscapePixels = patchBoat(
  await sharp("art/dalat/pine_lake/layers/landscape-fullhd.png").ensureAlpha().raw().toBuffer(),
);
const landscape = await publish(
  sceneFolder,
  "landscape_boatless",
  await sharp(landscapePixels, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer(),
);
const boatBytes = await sharp(`${motionFolder}/boat-cutout.png`)
  .trim({ threshold: 12 })
  .resize({ width: 256 })
  .png()
  .toBuffer();
const boatTexture = await publish(sceneFolder, "rowboat", boatBytes);
const legMs = 30000,
  turnMs = 2000;
const boat = {
  ...boatTexture,
  x: 530,
  y: 510,
  displayWidth: 104,
  displayHeight: (104 * boatTexture.height) / boatTexture.width,
  destination: { x: 1750, y: 600 },
  legMs,
  turnMs,
  periodMs: 2 * (legMs + turnMs),
};
const rowerBody = await publish(
  sceneFolder,
  "rower_redhair_strawhat",
  await sharp(`${motionFolder}/rower-redhair-strawhat.png`)
    .trim({ threshold: 12 })
    .resize({ width: 384 })
    .png()
    .toBuffer(),
);
const rowingOar = await publish(
  sceneFolder,
  "rowing_oar",
  await sharp(`${motionFolder}/rowing-oar.png`)
    .trim({ threshold: 12 })
    .resize({ height: 512 })
    .png()
    .toBuffer(),
);
const rower = {
  body: rowerBody,
  oar: rowingOar,
  x: 30,
  y: -38,
  displayWidth: 42,
  displayHeight: (42 * rowerBody.height) / rowerBody.width,
  grip: { x: 0.55, y: 0.6 },
  oarHeight: 72,
  oarGrip: 0.12,
  strokeMs: 2000,
};
const foliage = [];
for (const [name, plate, side, pivot, zIndex, group, angle, phase] of [
  ["pine_branch_left", "foliage-mid", "left", [85, 20], 20, "pine", 1.05, 0],
  ["pine_branch_right", "foliage-mid", "right", [1900, 24], 20, "pine", 0.9, 1.4],
  ["hydrangea_left", "foreground", "left", [100, 1070], 40, "flowers", 0.45, 0.8],
  ["hydrangea_right", "foreground", "right", [1820, 1070], 40, "flowers", 0.45, 2.3],
]) {
  const file = `art/dalat/pine_lake/layers/${plate}-fullhd.png`;
  const pixels = await sharp(file).ensureAlpha().raw().toBuffer();
  let left = width,
    top = height,
    right = -1,
    bottom = -1;
  for (let y = 0; y < height; y++)
    for (let x = side === "left" ? 0 : width / 2; x < (side === "left" ? width / 2 : width); x++) {
      if (pixels[(y * width + x) * 4 + 3] <= 8) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  if (right < left) throw new Error(`Empty foliage: ${name}`);
  const bounds = { left, top, width: right - left + 1, height: bottom - top + 1 };
  const crop = await sharp(file).extract(bounds).png().toBuffer();
  foliage.push({
    id: name,
    ...(await publish(sceneFolder, name, crop)),
    source: file,
    x: left,
    y: top,
    pivot,
    zIndex,
    group,
    angle,
    phase,
  });
}

// Follow the real shore and continue underneath the fixed railing. The old
// inset polygon ended in open water and exposed a diagonal edge in reflections.
const lakePolygon = [
  [735, 456],
  [1120, 450],
  [1960, 452],
  [1960, 930],
  [1700, 900],
  [1450, 870],
  [1210, 830],
  [1020, 795],
  [840, 765],
  [680, 718],
  [540, 675],
  [410, 620],
  [300, 565],
  [310, 540],
  [400, 510],
  [520, 487],
  [610, 474],
];
function inside(x, y, polygon) {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i],
      [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
// A feathered alpha boundary blends warped reflections into calm shore water.
// Keep it in the same full-frame coordinates as all registered scene plates.
const shoreMask = Buffer.alloc(width * height * 4);
for (let y = 450; y < 930; y++)
  for (let x = 280; x < width; x++) {
    if (!inside(x, y, lakePolygon)) continue;
    let distance = Infinity;
    for (let i = 0; i < lakePolygon.length; i++) {
      const [ax, ay] = lakePolygon[i];
      const [bx, by] = lakePolygon[(i + 1) % lakePolygon.length];
      const dx = bx - ax,
        dy = by - ay;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
      distance = Math.min(distance, Math.hypot(x - ax - t * dx, y - ay - t * dy));
    }
    const fade = Math.min(1, distance / 24);
    shoreMask.set(
      [255, 255, 255, Math.round(255 * fade * fade * (3 - 2 * fade))],
      (y * width + x) * 4,
    );
  }
const waterMask = await publish(
  sceneFolder,
  "lake_shore_mask",
  await sharp(shoreMask, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer(),
);
const master = boatlessMaster;
const water = Buffer.alloc(width * height * 4);
for (let y = 450; y < 850; y++)
  for (let x = 330; x < width; x++) {
    if (!inside(x, y, lakePolygon)) continue;
    const i = (y * width + x) * 4;
    const [r, g, b] = master.subarray(i, i + 3);
    if (b < 145 || g < r * 1.12 || b < r * 1.25) continue;
    water[i] = 180;
    water[i + 1] = 239;
    water[i + 2] = 255;
    // The runtime applies 0.15–0.30 opacity again. Keep the reflection mask
    // strong enough to survive that second blend and remain visible over the lake.
    water[i + 3] = Math.round(Math.max(0, Math.min(255, ((g - 110) / 145) * 450)));
  }
const shimmer = await publish(
  sceneFolder,
  "lake_shimmer_alpha",
  await sharp(water, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer(),
);

// Small procedural alpha FX, not replacement character artwork.
async function effect(name, w, h, pixel) {
  const data = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = pixel(x / w, y / h);
      data.set([r, g, b, Math.round(Math.max(0, Math.min(1, a)) * 255)], (y * w + x) * 4);
    }
  return publish(
    npcFolder,
    name,
    await sharp(data, { raw: { width: w, height: h, channels: 4 } })
      .png()
      .toBuffer(),
  );
}
const hologram = await effect("hologram_glow", 192, 128, (x, y) => {
  const a = inside(x, y, [
    [0.26, 0.16],
    [0.98, 0.02],
    [0.79, 0.86],
    [0.02, 0.96],
  ])
    ? Math.max(0, 1 - Math.hypot((x - 0.5) * 1.3, (y - 0.5) * 1.4)) * 0.6
    : 0;
  return [92, 231, 255, a];
});
const sparkle = await effect("sparkle", 32, 32, (x, y) => {
  const dx = Math.abs(x - 0.5),
    dy = Math.abs(y - 0.5);
  return [203, 248, 255, Math.max(0, 1 - Math.min(dx * 30 + dy * 2.5, dy * 30 + dx * 2.5))];
});
const shadow = await effect("shadow", 128, 32, (x, y) => [
  41,
  30,
  52,
  Math.max(0, 1 - Math.hypot((x - 0.5) * 2, (y - 0.5) * 2)) ** 2 * 0.35,
]);
const config = {
  version: "1.1",
  sceneId: "mountain_view",
  logicalSize: { width, height },
  background,
  foliage,
  shimmer,
  waterBase,
  waterMask,
  landscape,
  boat,
  rower,
  lakePolygon,
  hologram,
  sparkle,
  shadow,
  hologramBox: { left: 0.618, top: 0.413, width: 0.324, height: 0.16 },
  hoverBoost: {
    easeInMs: 450,
    easeOutMs: 800,
    water: 1.8,
    pine: 1.5,
    flowers: 1.5,
    particles: 2,
    hologram: 1.3,
    boat: 1,
    rowing: 1,
  },
};
await writeFile("configs/mountain_view.animation.json", JSON.stringify(config, null, 2) + "\n");
const scenes = JSON.parse(await readFile("configs/scenes.json", "utf8"));
scenes.scenes
  .find((scene) => scene.id === "mountain_view")
  .layers.find((layer) => layer.id === "landscape").src = landscape.src;
await writeFile("configs/scenes.json", JSON.stringify(scenes, null, 2) + "\n");
await mkdir("reports/gray-boo-pine-lake", { recursive: true });
await writeFile(
  "reports/gray-boo-pine-lake/asset-manifest.json",
  JSON.stringify(
    {
      version: "1.1",
      source,
      sourceSha256: hash(sourceBytes),
      provenance:
        "Reuses project image_gen Full HD artwork and registered alpha plates. Rowboat alpha and a local hull/reflection repair are generated with built-in image_gen; see motion generation log. Small cyan FX and shadow are procedural.",
      motionGeneration: "art/dalat/pine_lake/motion/generation.json",
      rowerGeneration: "art/dalat/pine_lake/motion/rowing-generation.json",
      waterRenderer:
        "Canvas2D strip displacement of real reflection pixels, clipped to lake polygon; 30 paints per second maximum.",
      sourceProvenance: "art/dalat/pine_lake/source/fullhd-provenance.json",
      reference: "MD/Gray_Boo_Pine_Lake_Guide_Package_v1.1/Gray_Boo_Pine_Lake_Reference.jpg",
      geometry:
        "Existing native 1920×1080 project master; reference JPG is not stretched or upscaled.",
      artReviewStatus: "pending owner visual review",
      productionApproved: false,
      animationConfig: "configs/mountain_view.animation.json",
      npcRig: JSON.parse(await readFile("app/cafe/npc-assets.json", "utf8")).gray_boo.rig,
      samplerStates: ["idle", "notice", "listening", "thinking", "talking", "error"],
      idleBlinkMs: [1150, 1380],
      preview: {
        fps: 8,
        durationMs: 3000,
        validation: "reports/gray-boo-pine-lake/preview-validation.json",
      },
      assets,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Gray Boo Pine Lake: ${assets.length} assets, ${assets.reduce((sum, a) => sum + a.bytes, 0)} bytes.`,
);
