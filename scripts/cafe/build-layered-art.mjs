import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { npcs } from "../npc/registry.mjs";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = async (file, data) => {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
};
const records = [];
async function publish(folder, name, bytes, extension = "webp") {
  const sha256 = hash(bytes);
  const src = `/cafe/${folder}/${name}-${sha256.slice(0, 10)}.${extension}`;
  await mkdir(path.dirname(`public${src}`), { recursive: true });
  await writeFile(`public${src}`, bytes);
  return { src, sha256, bytes: bytes.length };
}

const definition = JSON.parse(await readFile("art/dalat/scenes-v5.json", "utf8"));
const width = 1920,
  height = 1080;
const raw = { width, height, channels: 4 };
const loadPlate = async (file) => {
  const bytes = await readFile(file),
    meta = await sharp(bytes).metadata();
  const data = await sharp(bytes)
    .resize(width, height, { fit: "fill" })
    .toColourspace("srgb")
    .ensureAlpha()
    .raw()
    .toBuffer();
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 8) data[i] = 0;
    else if (data[i] >= 245) data[i] = 255;
  }
  return {
    data,
    source: file,
    sourceSha256: hash(bytes),
    nativeSize: { width: meta.width, height: meta.height },
  };
};
const expand = (mask) =>
  sharp(mask, { raw: { width, height, channels: 1 } })
    .dilate(8)
    .toColourspace("b-w")
    .raw()
    .toBuffer();
const scenes = [],
  fullhdSources = [];
for (const scene of definition.scenes) {
  const base = `art/dalat/${scene.settingId}`;
  const source = `${base}/source/master-fullhd.png`;
  const masterBytes = await readFile(source),
    masterMeta = await sharp(masterBytes).metadata();
  assert.equal(masterMeta.width, width);
  assert.equal(masterMeta.height, height);
  const provenance = JSON.parse(await readFile(`${base}/source/fullhd-provenance.json`, "utf8"));
  assert.equal(hash(masterBytes), provenance.sha256);
  fullhdSources.push({ settingId: scene.settingId, source, ...provenance });
  const master = await sharp(masterBytes).ensureAlpha().raw().toBuffer();
  const ground = await loadPlate(`${base}/layers/ground.png`);
  const foliage = await loadPlate(`${base}/layers/foliage.png`);
  const distant = await loadPlate(`${base}/layers/distant.png`);
  const coverage = Buffer.alloc(width * height),
    foregroundMask = Buffer.alloc(width * height);
  for (let p = 0; p < coverage.length; p++) {
    const i = p * 4;
    coverage[p] = ground.data[i + 3] || foliage.data[i + 3] ? 255 : 0;
    foregroundMask[p] = foliage.data[i + 3] ? 255 : 0;
  }
  const guard = await expand(coverage),
    foregroundGuard = await expand(foregroundMask);
  assert.equal(guard.length, width * height);
  // Retain the new Full HD detail where visible. Only hidden disoccluded pixels
  // come from the generated repair plates, so moving foliage cannot reveal a duplicate.
  for (let p = 0; p < width * height; p++) {
    const i = p * 4;
    for (let c = 0; c < 3; c++) {
      if (!guard[p]) distant.data[i + c] = master[i + c];
      if (!foregroundGuard[p]) ground.data[i + c] = master[i + c];
      foliage.data[i + c] = master[i + c];
    }
    distant.data[i + 3] = 255;
  }
  const layers = [];
  for (const [id, plate, depth, zIndex, region] of [
    ["landscape", distant, 0.1, 5, "all"],
    ["ground", ground, 0, 15, "all"],
    ["foliage-mid", foliage, 0.12, 20, "top"],
    ["foreground", foliage, 0.18, 40, "bottom"],
  ]) {
    const pixels = Buffer.from(plate.data);
    if (region !== "all")
      for (let y = 0; y < height; y++)
        if ((region === "top" && y >= height / 2) || (region === "bottom" && y < height / 2))
          for (let x = 0; x < width; x++) pixels[(y * width + x) * 4 + 3] = 0;
    const png = await sharp(pixels, { raw }).png().toBuffer();
    await writeFile(`${base}/layers/${id}-fullhd.png`, png);
    const bytes = await sharp(png).webp({ quality: 96, alphaQuality: 100, effort: 5 }).toBuffer();
    const stats = await sharp(bytes).stats();
    if (id !== "landscape")
      assert.equal(stats.isOpaque, false, `${scene.settingId}/${id} requires real alpha`);
    const output = await publish(`dalat/${scene.settingId}/layers`, id, bytes);
    records.push({
      scene: scene.id,
      settingId: scene.settingId,
      type: id,
      region,
      source: plate.source,
      sourceSha256: plate.sourceSha256,
      nativeSize: plate.nativeSize,
      runtimeSize: { width, height },
      fullhdMaster: source,
      masterSha256: hash(masterBytes),
      usesFullhdMasterPixels: true,
      hasAlpha: !stats.isOpaque,
      ...output,
    });
    layers.push({
      id,
      src: output.src,
      depth,
      zIndex,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      flip: false,
    });
  }
  scenes.push({ ...scene, layers, occluders: [] });
}
await json("configs/scenes.json", {
  version: "5.0",
  assetRevision: definition.assetRevision,
  inspiration: definition.inspiration,
  artStatus: "owner-requested-local-preview",
  logicalSize: { width, height },
  defaultSceneId: "inside_cafe",
  scenes,
});

const previous = JSON.parse(await readFile("app/cafe/npc-assets.json", "utf8"));
const assets = {};
const npcRecords = [];
for (const [index, npc] of npcs.entries()) {
  const base = `art/npc/${npc.id}`;
  const approval = JSON.parse(await readFile(`${base}/approval.json`, "utf8"));
  const master = await readFile(`${base}/source/master_rgba.png`);
  assert.equal(approval.master.accepted, true, `${npc.id} source requires approval`);
  assert.equal(hash(master), approval.master.sha256, `${npc.id} source changed after approval`);
  const pack = `${base}/draft/runtime`;
  const checked = JSON.parse(await readFile(`${pack}/pack-validation.json`, "utf8"));
  assert.equal(checked.pass, true, `${npc.id} atlas must pass pixel validation`);
  let atlasBytes = await readFile(`${pack}/atlas.webp`);
  assert.equal(hash(atlasBytes), checked.fileHashes["atlas.webp"]);
  const folder = `npc/${npc.id}/runtime`;
  const atlas = JSON.parse(await readFile(`${pack}/atlas.json`, "utf8"));
  const sourceRig = JSON.parse(await readFile(`${pack}/rig.json`, "utf8"));
  let posterSource = master;
  let bodyEdit;
  if (npc.id === "cloud_daisy") {
    bodyEdit = `${base}/runtime-v6/body-right-arm-fixed.png`;
    const body = await readFile(bodyEdit);
    const frame = atlas.frames["cloud_daisy/body.png"].frame;
    const replacement = await sharp(body)
      .resize(frame.w, frame.h, { fit: "fill" })
      .ensureAlpha()
      .raw()
      .toBuffer();
    const pixels = await sharp(atlasBytes)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let row = 0; row < frame.h; row++)
      replacement.copy(
        pixels.data,
        ((frame.y + row) * pixels.info.width + frame.x) * 4,
        row * frame.w * 4,
        (row + 1) * frame.w * 4,
      );
    atlasBytes = await sharp(pixels.data, { raw: pixels.info })
      .webp({ lossless: true, exact: true, alphaQuality: 100 })
      .toBuffer();
    // The resting arm is painted into the body; its old puppet and props are unused.
    const removed = ["arm_hold", "cup", "cloth"];
    sourceRig.layers = sourceRig.layers.filter((layer) => !removed.includes(layer.id));
    for (const id of removed) {
      delete sourceRig.placement[id];
      delete atlas.frames[`cloud_daisy/${id}.png`];
    }
    const bodyFrame = atlas.frames["cloud_daisy/body.png"];
    bodyFrame.sourceFile = bodyEdit;
    bodyFrame.sourcePngSha256 = hash(body);
    bodyFrame.originalPngSize = await sharp(body)
      .metadata()
      .then(({ width, height }) => ({ width, height }));
    bodyFrame.resizedRgbaSha256 = hash(replacement);
    for (const layer of sourceRig.layers) {
      const entry = atlas.frames[layer.texture];
      const f = entry.frame;
      const packed = await sharp(atlasBytes)
        .extract({ left: f.x, top: f.y, width: f.w, height: f.h })
        .ensureAlpha()
        .raw()
        .toBuffer();
      assert.equal(hash(packed), entry.resizedRgbaSha256, `${npc.id}/${layer.id} pixels changed`);
    }
    atlas.meta.atlasSha256 = hash(atlasBytes);
    const wave = sourceRig.placement.arm_wave;
    posterSource = await sharp(body)
      .resize(sourceRig.coordinateSystem.width, sourceRig.coordinateSystem.height, { fit: "fill" })
      .composite([
        {
          input: await sharp(`${base}/draft/registered/arm_wave.png`)
            .resize(wave.width, wave.height)
            .png()
            .toBuffer(),
          left: Math.round(wave.x - wave.pivotX * wave.width),
          top: Math.round(wave.y - wave.pivotY * wave.height),
        },
      ])
      .png()
      .toBuffer();
  }
  const texture = await publish(folder, "atlas", atlasBytes);
  atlas.meta.image = path.basename(texture.src);
  const atlasFile = await publish(folder, "atlas", Buffer.from(JSON.stringify(atlas)), "json");
  const rig = {
    version: "4.0",
    npcId: npc.id,
    renderer: "pixi8-gsap",
    sourceHash: hash(master),
    usage: "owner-requested-local-integration",
    atlas: atlasFile.src,
    coordinateSystem: sourceRig.coordinateSystem,
    root: sourceRig.root,
    mode: sourceRig.mode ?? "cloud-puppet",
    motion: sourceRig.motion ?? null,
    phase: index * 0.71,
    layers: sourceRig.layers.map(({ id, texture, trim }) => ({ id, texture, trim })),
    placement: sourceRig.placement,
    clips: sourceRig.clips,
  };
  const mouthMeta = JSON.parse(await readFile(`${base}/runtime-v4/mouth.json`, "utf8"));
  assert.equal(mouthMeta.sourceMasterSha256, hash(master), `${npc.id} mouth must match master`);
  const mouthBytes = await readFile(`${base}/runtime-v4/mouth-closed.png`);
  assert.equal(hash(mouthBytes), mouthMeta.overlaySha256);
  const mouth = await publish(
    folder,
    "mouth-closed",
    await sharp(mouthBytes).webp({ lossless: true }).toBuffer(),
  );
  rig.mouth = { src: mouth.src, trim: mouthMeta.trim };
  const rigFile = await publish(folder, "rig", Buffer.from(JSON.stringify(rig)), "json");
  const posterBytes = await sharp(posterSource)
    .resize({ height: 768, withoutEnlargement: true })
    .webp({ quality: 95, alphaQuality: 100 })
    .toBuffer();
  const poster = await publish(folder, "master", posterBytes);
  const meta = await sharp(posterBytes).metadata();
  assets[npc.id] = {
    src: poster.src,
    width: meta.width,
    height: meta.height,
    checksum: poster.sha256,
    masterSha256: hash(master),
    source: bodyEdit ?? `${base}/source/master_rgba.png`,
    rig: rigFile.src,
    canonicalId: npc.id,
  };
  npcRecords.push({
    npcId: npc.id,
    masterSha256: hash(master),
    packValidation: `${pack}/pack-validation.json`,
    ...(bodyEdit ? { bodyEdit, bodyEditSha256: hash(await readFile(bodyEdit)) } : {}),
    rig: rigFile,
    atlas: atlasFile,
    texture,
    poster,
    mouth,
  });
}
assets.mr_pink = previous.mr_pink;
await json("app/cafe/npc-assets.json", assets);
await json("reports/dalat/fullhd-manifest-v5.json", {
  version: "5.0",
  renderer: "DOM depth planes + PixiJS 8 NPC puppets / GSAP",
  artworkTool: "built-in image_gen",
  logicalSize: { width: 1920, height: 1080 },
  fullhdSources,
  inspiration: definition.inspiration,
  sourceQuality:
    "1920x1080 assembled from overlapping native 1254x1254 image_gen detail tiles; registered extraction masks reuse visible Full HD master pixels",
  localIntegrationRequested: true,
  artReviewStatus: "pending final owner visual review",
  sceneLayers: records,
  npcAssets: npcRecords,
  totalSceneBytes: records.reduce((sum, entry) => sum + entry.bytes, 0),
});
await copyFile("art/dalat/generation-jobs-v5.json", "reports/dalat/generation-jobs-v5.json");
await json(
  "reports/cafe/npc-mouth-jobs-v4.json",
  await Promise.all(
    npcs.map(async (npc) =>
      JSON.parse(await readFile(`art/npc/${npc.id}/runtime-v4/generation-job.json`, "utf8")),
    ),
  ),
);
console.log(
  `Published 3 scenes / ${records.length} real alpha plates and ${npcRecords.length} canonical NPC puppet packs.`,
);
await import("./build-gray-boo-lake.mjs");
await import("./build-sun-king.mjs");
