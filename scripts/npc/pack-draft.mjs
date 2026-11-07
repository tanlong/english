import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { npcs, resolveNpc } from "./registry.mjs";

const root = process.cwd();
const status = "DRAFT_NOT_FOR_PRODUCTION";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = async (file, value) => writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
const arg = process.argv.indexOf("--npc");
const selected = arg < 0 ? npcs : [resolveNpc(process.argv[arg + 1])];

for (const npc of selected) {
  const base = path.join(root, "art/npc", npc.id);
  const output = path.join(base, "draft/runtime");
  await mkdir(output, { recursive: true });
  const rigBytes = await readFile(path.join(base, "rig.json"));
  const rig = JSON.parse(rigBytes);
  assert.equal(rig.npcId, npc.id, "Rig identity must match its directory");
  assert.ok(rig.layers?.length, "Rig must reference actual layers");
  const sourceSha256 = sha256(await readFile(path.join(base, rig.sourceMaster)));
  assert.equal(rig.sourceHash, sourceSha256, "Master changed since rig preparation");
  const rigSha256 = sha256(rigBytes);
  const textures = [];
  const atlasWidth = 1536;
  const padding = 2;
  let x = padding,
    y = padding,
    rowHeight = 0;
  for (const layer of rig.layers) {
    const file = path.resolve(base, layer.file);
    assert.ok(file.startsWith(`${base}${path.sep}`), "Layer path must stay inside NPC directory");
    const png = await readFile(file);
    const metadata = await sharp(png).metadata();
    assert.equal(metadata.format, "png", `Expected PNG layer: ${layer.id}`);
    assert.equal(metadata.hasAlpha, true, `Missing alpha: ${layer.id}`);
    const resized = await sharp(png)
      .toColourspace("srgb")
      .ensureAlpha()
      .resize({ width: 768, height: 768, fit: "inside", withoutEnlargement: true })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { width, height } = resized.info;
    if (x + width + padding > atlasWidth) {
      x = padding;
      y += rowHeight + padding;
      rowHeight = 0;
    }
    textures.push({
      id: layer.id,
      texture: `${npc.id}/${layer.id}.png`,
      sourceFile: layer.file,
      sourcePngSha256: sha256(png),
      originalPngSize: { width: metadata.width, height: metadata.height },
      frame: { x, y, w: width, h: height },
      raw: resized.data,
    });
    x += width + padding;
    rowHeight = Math.max(rowHeight, height);
  }
  const atlasHeight = y + rowHeight + padding;
  const rawAtlas = Buffer.alloc(atlasWidth * atlasHeight * 4);
  for (const texture of textures) {
    const frame = texture.frame;
    for (let row = 0; row < frame.h; row++) {
      texture.raw.copy(
        rawAtlas,
        ((frame.y + row) * atlasWidth + frame.x) * 4,
        row * frame.w * 4,
        (row + 1) * frame.w * 4,
      );
    }
  }
  // Sharp's exact option preserves RGB even beneath fully transparent pixels.
  const atlasBytes = await sharp(rawAtlas, {
    raw: { width: atlasWidth, height: atlasHeight, channels: 4 },
  })
    .webp({ lossless: true, exact: true, alphaQuality: 100, effort: 6 })
    .toBuffer();
  await writeFile(path.join(output, "atlas.webp"), atlasBytes);
  const frames = Object.fromEntries(
    textures.map((texture) => [
      texture.texture,
      {
        frame: texture.frame,
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: texture.frame.w, h: texture.frame.h },
        sourceSize: { w: texture.frame.w, h: texture.frame.h },
        originalPngSize: texture.originalPngSize,
        sourceFile: texture.sourceFile,
        sourcePngSha256: texture.sourcePngSha256,
        resizedRgbaSha256: sha256(texture.raw),
      },
    ]),
  );
  const atlas = {
    frames,
    meta: {
      app: "npc/pack-draft.mjs",
      version: "3.0",
      image: "atlas.webp",
      format: "RGBA8888",
      size: { w: atlasWidth, h: atlasHeight },
      scale: "1",
      status,
      sourceSha256,
      rigSha256,
      atlasSha256: sha256(atlasBytes),
      maxTextureEdge: 768,
      padding,
    },
  };
  const runtimeRig = {
    ...rig,
    status,
    approved: false,
    sourceSha256,
    rigSha256,
    atlas: "atlas.json",
    layers: rig.layers.map(({ file, ...layer }) => ({
      ...layer,
      approved: false,
      registeredSourceFile: file,
      atlas: "atlas.json",
      texture: `${npc.id}/${layer.id}.png`,
      texturePixelSize: {
        width: frames[`${npc.id}/${layer.id}.png`].frame.w,
        height: frames[`${npc.id}/${layer.id}.png`].frame.h,
      },
    })),
  };
  await json(path.join(output, "atlas.json"), atlas);
  await json(path.join(output, "rig.json"), runtimeRig);
  await json(path.join(output, "animations.json"), {
    schemaVersion: rig.schemaVersion,
    npcId: npc.id,
    status,
    approved: false,
    sourceSha256,
    rigSha256,
    mode: rig.mode ?? null,
    clips: rig.clips,
    motion: rig.motion ?? null,
  });
  const meta = await sharp(atlasBytes).metadata();
  assert.equal(meta.hasAlpha, true, "Atlas must retain alpha");
  const checks = [];
  for (const texture of textures) {
    const f = texture.frame;
    const inBounds = f.x >= 0 && f.y >= 0 && f.x + f.w <= atlasWidth && f.y + f.h <= atlasHeight;
    assert.ok(inBounds, `Frame outside atlas: ${texture.id}`);
    const extracted = await sharp(atlasBytes)
      .extract({ left: f.x, top: f.y, width: f.w, height: f.h })
      .ensureAlpha()
      .raw()
      .toBuffer();
    const exactPixels = extracted.equals(texture.raw);
    assert.ok(exactPixels, `Lossless frame differs from resized source: ${texture.id}`);
    checks.push({
      id: texture.id,
      inBounds,
      exactPixels,
      resizedRgbaSha256: sha256(texture.raw),
      extractedRgbaSha256: sha256(extracted),
    });
  }
  const fileHashes = {};
  for (const name of ["atlas.webp", "atlas.json", "rig.json", "animations.json"])
    fileHashes[name] = sha256(await readFile(path.join(output, name)));
  await json(path.join(output, "pack-validation.json"), {
    npcId: npc.id,
    status,
    sourceSha256,
    rigSha256,
    pass: true,
    hasAlpha: meta.hasAlpha,
    atlasSize: { width: atlasWidth, height: atlasHeight },
    fileHashes,
    frames: checks,
    notes:
      "RGBA byte equality includes RGB under alpha=0; no enlargement; source logical rig placement retained.",
  });
  console.log(
    `${npc.id}: ${textures.length} textures → ${atlasWidth}×${atlasHeight} lossless WebP; exact RGBA checks PASS; ${status}`,
  );
}
