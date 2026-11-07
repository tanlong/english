import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";

test("three Dalat settings provide Full HD ground layers for six standing characters", async () => {
  const config = JSON.parse(await readFile("configs/scenes.json", "utf8"));
  assert.equal(config.assetRevision, "dalat-fullhd-v5");
  assert.deepEqual(
    config.scenes.map((scene) => scene.id),
    ["inside_cafe", "outdoor_terrace", "mountain_view"],
  );
  assert.deepEqual(
    config.scenes.map((scene) => scene.settingId),
    ["flower_garden", "tea_hills", "pine_lake"],
  );
  for (const scene of config.scenes) {
    assert.equal(scene.layers.find((layer) => layer.id === "ground")?.depth, 0);
    const master = await sharp(`art/dalat/${scene.settingId}/source/master-fullhd.png`).metadata();
    assert.equal(master.width, 1920);
    assert.equal(master.height, 1080);
    for (const id of ["ground", "foliage-mid", "foreground"]) {
      const layer = scene.layers.find((entry) => entry.id === id);
      assert.ok(layer, `${scene.id} needs ${id}`);
      const file = `public${layer.src}`;
      const meta = await sharp(file).metadata();
      assert.equal(meta.width, 1920);
      assert.equal(meta.height, 1080);
      assert.equal(meta.hasAlpha, true);
      assert.equal((await sharp(file).stats()).isOpaque, false);
    }
    const ground = scene.layers.find((layer) => layer.id === "ground");
    const pixels = await sharp(`public${ground.src}`).ensureAlpha().raw().toBuffer();
    for (const npc of scene.npcs) {
      const x = Math.round((npc.x / 100) * 1920),
        y = Math.round((npc.y / 100) * 1080);
      assert.ok(
        pixels[(y * 1920 + x) * 4 + 3] > 240,
        `${npc.id} needs solid ground beneath its feet`,
      );
    }
  }
  const placements = config.scenes.flatMap((scene) => scene.npcs.map((npc) => npc.id));
  assert.deepEqual(placements, [
    "cloud_daisy",
    "ollie_owl",
    "mimi_bunny",
    "astro_bean",
    "bear_explorer",
    "gray_boo",
  ]);
});
