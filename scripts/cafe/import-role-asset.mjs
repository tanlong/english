import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [id, kind, source, prompt] = process.argv.slice(2);
if (!/^[a-z_]+$/.test(id) || !["npc", "scene"].includes(kind) || !source || !prompt)
  throw new Error("Expected id, npc|scene, generated image path and prompt");
const originals = "art/dalat/role-expansion-v1";
const runtime = kind === "npc" ? "public/cafe/npc/roles" : "public/cafe/topics";
await mkdir(originals, { recursive: true });
await mkdir(runtime, { recursive: true });
const original = path.join(originals, `${id}.png`);
const destination = path.join(runtime, `${id}.webp`);
await copyFile(source, original);
const input = sharp(original);
const metadata = await input.metadata();
if (kind === "npc" && !metadata.hasAlpha) throw new Error(`${id} needs actual alpha`);
const image =
  kind === "npc"
    ? input
        .trim({ threshold: 8 })
        .resize({ height: 768, withoutEnlargement: true })
        .webp({ lossless: true })
    : input.webp({ quality: 90 });
const output = await image.toFile(destination);
await writeFile(
  path.join(originals, `${id}.json`),
  JSON.stringify(
    {
      id,
      kind,
      generator: "built-in image_gen",
      prompt,
      source: original,
      src: `/${destination.replace(/^public\//, "")}`,
      width: output.width,
      height: output.height,
      hasAlpha: metadata.hasAlpha,
      originalWidth: metadata.width,
      originalHeight: metadata.height,
    },
    null,
    2,
  ) + "\n",
);
console.log(`${id}: ${output.width} × ${output.height}`);
