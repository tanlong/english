import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { sampleNpcPose } from "../app/cafe/npc-motion.ts";

const rig = JSON.parse(await readFile("art/npc/cloud_daisy/rig.json", "utf8"));
test("idle returns to the same rig pose after one complete loop", () => {
  assert.deepEqual(sampleNpcPose(rig, 0, "idle"), sampleNpcPose(rig, 8, "idle"));
});
test("a one-shot greeting ends in the listening pose with no active foreground animation", () => {
  const end = sampleNpcPose(rig, 2, "notice");
  const listening = sampleNpcPose(rig, 0, "listening");
  assert.equal(end.state, "listening");
  assert.equal(end.foregroundCount, 0);
  assert.equal(end.wave, listening.wave);
  assert.equal(end.mouthClosed, true);
});
test("talking alternates registered mouth textures and listening holds the closed mouth", () => {
  assert.notEqual(
    sampleNpcPose(rig, 0, "talking").mouthClosed,
    sampleNpcPose(rig, 0.1, "talking").mouthClosed,
  );
  assert.equal(sampleNpcPose(rig, 0.1, "listening").mouthClosed, true);
});
test("a single-arm character never requests Cloud Daisy's cleaning cloth", async () => {
  const owl = JSON.parse(await readFile("art/npc/ollie_owl/rig.json", "utf8"));
  assert.equal(sampleNpcPose(owl, 2, "idle").cloth, false);
});
