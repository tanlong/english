import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

// One registered mouth overlay per master; the approved body and eyes stay untouched.
const boxes = {
  cloud_daisy: [512, 288, 132, 128],
  ollie_owl: [625, 373, 148, 150],
  mimi_bunny: [584, 369, 126, 112],
  astro_bean: [550, 430, 122, 144],
  bear_explorer: [592, 300, 132, 132],
  gray_boo: [590, 420, 110, 104],
};
const hash = (data) => createHash("sha256").update(data).digest("hex");
for (const [id, [left, top, width, height]] of Object.entries(boxes)) {
  const base = `art/npc/${id}`;
  const original = await readFile(`${base}/source/master_rgba.png`);
  const source = await readFile(`${base}/runtime-v4/mouth-closed-source.png`);
  const master = await sharp(original).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const edited = await sharp(source)
    .resize(master.info.width, master.info.height, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer();
  // Register only the unchanged border around the mouth, never the changed mouth itself.
  let best = { score: Infinity, dx: 0, dy: 0 };
  for (let dy = -8; dy <= 8; dy++)
    for (let dx = -8; dx <= 8; dx++) {
      let sum = 0,
        count = 0;
      for (let y = 0; y < height; y += 2)
        for (let x = 0; x < width; x += 2) {
          if (Math.min(x, y, width - x - 1, height - y - 1) > 7) continue;
          const a = ((top + y) * master.info.width + left + x) * 4;
          const b = ((top + y + dy) * master.info.width + left + x + dx) * 4;
          if (master.data[a + 3] < 250 || edited[b + 3] < 250) continue;
          for (let c = 0; c < 3; c++) sum += Math.abs(master.data[a + c] - edited[b + c]);
          count += 3;
        }
      const score = sum / Math.max(count, 1);
      if (score < best.score) best = { score, dx, dy };
    }
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const a = (y * width + x) * 4;
      const b = ((top + y + best.dy) * master.info.width + left + x + best.dx) * 4;
      edited.copy(pixels, a, b, b + 4);
      const distance = Math.min(x, y, width - x - 1, height - y - 1);
      pixels[a + 3] = Math.round(pixels[a + 3] * Math.min(1, distance / 5));
    }
  const mouth = await sharp(pixels, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
  await writeFile(`${base}/runtime-v4/mouth-closed.png`, mouth);
  const trim = { left, top, width, height };
  await writeFile(
    `${base}/runtime-v4/mouth.json`,
    JSON.stringify(
      {
        id: "mouth_closed",
        trim,
        registration: best,
        sourceMasterSha256: hash(original),
        editSourceSha256: hash(source),
        overlaySha256: hash(mouth),
        method: "generated localized edit; border registration and five-pixel alpha feather",
      },
      null,
      2,
    ) + "\n",
  );
  const combined = await sharp(original)
    .composite([{ input: mouth, left, top }])
    .png()
    .toBuffer();
  const preview = await sharp(combined)
    .extract({
      left: Math.max(0, left - 80),
      top: Math.max(0, top - 80),
      width: width + 160,
      height: height + 160,
    })
    .resize({ width: 400 })
    .flatten({ background: "#edece1" })
    .png()
    .toBuffer();
  await writeFile(`${base}/runtime-v4/mouth-review.png`, preview);
  console.log(`${id}: registered (${best.dx}, ${best.dy}), border MAE ${best.score.toFixed(2)}`);
}
