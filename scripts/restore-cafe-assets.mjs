import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const manifest = JSON.parse(await readFile("art/cafe/recovered/manifest.json", "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
for (const asset of manifest.assets) {
  const source = path.resolve(root, asset.source);
  const output = path.resolve(root, `public${asset.runtime}`);
  assert.ok(
    source.startsWith(path.join(root, "art/cafe/recovered") + path.sep),
    "Recovery source must be in the project art pack",
  );
  assert.ok(
    output.startsWith(path.join(root, "public/cafe") + path.sep),
    "Runtime output must be a café public asset",
  );
  const original = await readFile(source);
  assert.equal(sha256(original), asset.sourceSha256, `Source changed: ${asset.source}`);
  if (existsSync(output)) {
    assert.equal(
      sha256(await readFile(output)),
      asset.sha256,
      `Refusing to replace different existing asset: ${asset.runtime}`,
    );
    continue;
  }
  const bytes =
    asset.encoding.format === "png"
      ? original
      : await sharp(original).webp(asset.encoding.options).toBuffer();
  assert.equal(
    sha256(bytes),
    asset.sha256,
    `Recovered bytes must match the runtime checksum: ${asset.runtime}`,
  );
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, bytes);
}
console.log(`Verified/restored ${manifest.assets.length} café assets from workspace sources.`);
