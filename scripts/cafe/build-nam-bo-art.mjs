import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const aligned = process.argv.includes("--aligned");
const variant = aligned ? "/aligned-v2" : "";
const source = `art/dalat/nam-bo-1995-2005${variant}`;
const target = `public/cafe/maps/nam-bo-1995-2005${variant}`;
const jobs = JSON.parse(await readFile(`${source}/generation-jobs.json`, "utf8"));
await mkdir(target, { recursive: true });
const assets = [];
for (const { id } of jobs.assets) {
  const file = `${source}/source/${id}.png`;
  const input = await readFile(file);
  const metadata = await sharp(input).metadata();
  if (id === "field_land" && !metadata.hasAlpha) throw new Error("Field land needs alpha");
  const output = `${target}/${id}.webp`;
  await sharp(input)
    .resize(1672, 941, { fit: "fill" })
    .webp({ quality: aligned ? 97 : 92, lossless: id === "field_land", effort: 6 })
    .toFile(output);
  assets.push({
    id,
    source: file,
    sourceSha256: createHash("sha256").update(input).digest("hex"),
    nativeSize: { width: metadata.width, height: metadata.height },
    output,
    runtimeSize: { width: 1672, height: 941 },
  });
}
await writeFile(`${source}/manifest.json`, `${JSON.stringify({ assets }, null, 2)}\n`);
console.log(`Published ${assets.length} Southern Vietnam 1995–2005 backgrounds.`);
