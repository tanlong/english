import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";

const settings = ["flower_garden", "tea_hills", "pine_lake"];
for (const scene of settings) {
  const base = `art/dalat/${scene}`;
  await mkdir(`${base}/tiles`, { recursive: true });
  if (process.argv.includes("--prepare")) {
    const concept = await sharp(`${base}/source/concept-v5.png`)
      .resize(1920, 1080, { fit: "fill" })
      .png()
      .toBuffer();
    for (const [name, left] of [
      ["left", 0],
      ["right", 832],
    ])
      await sharp(concept)
        .extract({ left, top: 0, width: 1088, height: 1080 })
        .png()
        .toFile(`${base}/tiles/${name}-reference.png`);
    continue;
  }
  const tiles = [];
  for (const side of ["left", "right"]) {
    const file = `${base}/tiles/${side}-detail.png`;
    const input = await readFile(file);
    const meta = await sharp(input).metadata();
    assert.ok(
      meta.width >= 1088 && meta.height >= 1080,
      `${scene}/${side} requires native detail at least the target tile size`,
    );
    const pixels = await sharp(input)
      .resize(1088, 1080, { fit: "fill" })
      .removeAlpha()
      .raw()
      .toBuffer();
    tiles.push({
      file,
      nativeSize: { width: meta.width, height: meta.height },
      pixels,
      sha256: createHash("sha256").update(input).digest("hex"),
    });
  }
  const rgb = Buffer.alloc(1920 * 1080 * 3);
  for (let y = 0; y < 1080; y++)
    for (let x = 0; x < 1920; x++) {
      const u = Math.max(0, Math.min(1, (x - 832) / 255));
      const mix = u * u * (3 - 2 * u);
      for (let c = 0; c < 3; c++) {
        const a = tiles[0].pixels[(y * 1088 + Math.min(x, 1087)) * 3 + c];
        const b = tiles[1].pixels[(y * 1088 + Math.max(0, x - 832)) * 3 + c];
        rgb[(y * 1920 + x) * 3 + c] = Math.round(a * (1 - mix) + b * mix);
      }
    }
  const png = await sharp(rgb, { raw: { width: 1920, height: 1080, channels: 3 } })
    .png()
    .toBuffer();
  await writeFile(`${base}/source/master-fullhd.png`, png);
  await writeFile(
    `${base}/source/fullhd-provenance.json`,
    JSON.stringify(
      {
        scene,
        outputSize: { width: 1920, height: 1080 },
        method:
          "two overlapping image_gen regional detail edits; native tile detail downsampled and feathered over 256 pixels",
        conceptIsLayoutReferenceOnly: true,
        overlap: 256,
        tiles: tiles.map(({ file, nativeSize, sha256 }) => ({ file, nativeSize, sha256 })),
        sha256: createHash("sha256").update(png).digest("hex"),
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`${scene}: assembled 1920x1080 from two native detail tiles`);
}
