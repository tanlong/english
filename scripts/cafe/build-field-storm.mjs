import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const target = "public/cafe/fields/storm";
await mkdir(target, { recursive: true });
for (const name of ["dusk", "sky", "land", "canopy"]) {
  const source = `art/dalat/field-storm/v1/${name}.png`;
  const metadata = await sharp(source).metadata();
  if (name === "land" || name === "canopy") {
    if (!metadata.hasAlpha) throw new Error(`${source} requires transparency`);
  }
  await sharp(source)
    .webp({ quality: 92, lossless: name === "land" || name === "canopy", effort: 6 })
    .toFile(`${target}/${name}.webp`);
  console.log(`${name}: ${metadata.width} × ${metadata.height}`);
}
