import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const source = "art/npc/sun_king/field-v2";
const target = "public/cafe/npc/sun_king/field-v2";
const width = 1108;
const height = 1420;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
await mkdir(target, { recursive: true });
const sources = {};
const layers = {};
const records = [];
async function publish(name, bytes, folder = target) {
  const checksum = hash(bytes);
  await mkdir(folder, { recursive: true });
  const file = `${folder}/${name}-${checksum.slice(0, 10)}.webp`;
  await writeFile(file, bytes);
  return { src: file.replace(/^public/, ""), checksum };
}
for (const name of ["body", "head"]) {
  const file = `${source}/${name}.png`;
  const input = await readFile(file);
  const metadata = await sharp(input).metadata();
  assert.equal(metadata.hasAlpha, true, `${name} needs transparent separation`);
  sources[name] = await sharp(input).resize(width, height, { fit: "fill" }).png().toBuffer();
  const rgba = await sharp(sources[name]).ensureAlpha().raw().toBuffer();
  let empty = 0;
  let visible = 0;
  for (let i = 3; i < rgba.length; i += 4) {
    empty += rgba[i] === 0;
    visible += rgba[i] > 127;
  }
  assert.ok(
    empty > width * height * 0.1 && visible > 1000,
    `${name} must be a real isolated layer`,
  );
  const bytes = await sharp(sources[name])
    .resize({ height: 1000, withoutEnlargement: true })
    .webp({ lossless: true, exact: true, effort: 6 })
    .toBuffer();
  const output = await publish(name, bytes);
  layers[name] = output.src;
  records.push({
    name,
    source: file,
    sourceSha256: hash(input),
    originalSize: { width: metadata.width, height: metadata.height },
    ...output,
  });
}
// The rice-paddy plate includes a clear standing bank aligned to the existing character.
const terrainSource = "art/dalat/nam-bo-1995-2005/aligned-v2/source/field_land.png";
const terrainSize = { width: 1672, height: 941 };
const terrainBytes = await sharp(terrainSource)
  .resize(terrainSize.width, terrainSize.height, { fit: "fill" })
  .ensureAlpha()
  .webp({ lossless: true, exact: true, effort: 6 })
  .toBuffer();
const terrainOutput = await publish("terrain-sun-king", terrainBytes, "public/cafe/fields/storm");
// A complete first plate also gives map transitions the same landscape as the layered scene.
const sceneBytes = await sharp("art/dalat/field-storm/v1/sky.png")
  .resize(terrainSize.width, terrainSize.height, { fit: "fill" })
  .composite([
    { input: terrainBytes },
    {
      input: await sharp("art/dalat/field-storm/v1/canopy.png")
        .resize(terrainSize.width, terrainSize.height, { fit: "fill" })
        .toBuffer(),
    },
  ])
  .webp({ quality: 97, effort: 6 })
  .toBuffer();
const sceneOutput = await publish("scene-sun-king", sceneBytes, "public/cafe/fields/storm");
const combined = await sharp(sources.body)
  .composite([{ input: sources.head }])
  .png()
  .toBuffer();
const posterBytes = await sharp(combined)
  .resize({ height: 1000 })
  .webp({ quality: 95, alphaQuality: 100 })
  .toBuffer();
const poster = await publish("poster", posterBytes);
const metadata = await sharp(posterBytes).metadata();
const assetsFile = "app/cafe/topic-npc-assets.json";
const assets = JSON.parse(await readFile(assetsFile, "utf8"));
assets.sun_king = {
  ...poster,
  width: metadata.width,
  height: metadata.height,
  source: `${source}/master.png`,
  layers,
  terrain: terrainOutput.src,
  scene: sceneOutput.src,
};
await writeFile(assetsFile, `${JSON.stringify(assets, null, 2)}\n`);
await writeFile(
  `${source}/layer-manifest.json`,
  `${JSON.stringify(
    {
      npcId: "sun_king",
      coordinateSystem: { width, height },
      headPivot: { x: 0.34, y: 0.4 },
      rendering: "Blue-gray wet dusk materials, original identity/costume/pose retained",
      alignment:
        "Character parts use their own normalized canvas; ground is integrated into the full scene terrain",
      animation: "Three subtle head chuckles; body, hands, feet and ground remain fixed",
      signature: "Ki ki ki!",
      layers: records,
      terrain: {
        source: terrainSource,
        coordinateSystem: terrainSize,
        ...terrainOutput,
      },
      scene: sceneOutput,
      poster,
    },
    null,
    2,
  )}\n`,
);
console.log(
  "Sun King: unchanged body/head, character-only poster and scene-integrated earth bank published.",
);
