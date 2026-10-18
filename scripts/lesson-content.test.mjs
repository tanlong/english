import assert from "node:assert/strict";
import test from "node:test";
import { lesson01 } from "../app/data.ts";

test("Lesson 01 has stable, unique content identities", () => {
  const sentenceIds = lesson01.sentences.map((sentence) => sentence.id);
  const sceneIds = lesson01.scenes.map((scene) => scene.id);
  const promptIds = lesson01.prompts.map((prompt) => prompt.id);
  const allIds = [...sentenceIds, ...sceneIds, ...promptIds];

  assert.equal(lesson01.locale, "en-US");
  assert.match(lesson01.contentVersion, /^lesson-01-content-v\d+$/);
  assert.match(lesson01.audioVersion, /^lesson-01-audio-v\d+$/);
  assert.equal(new Set(allIds).size, allIds.length);
});

test("Lesson 01 scene and audio references are valid", () => {
  const sentenceIds = new Set(lesson01.sentences.map((sentence) => sentence.id));

  assert.equal(lesson01.sentences.length, 28);
  assert.equal(lesson01.scenes.length, 6);
  assert.equal(
    lesson01.scenes.reduce((total, scene) => total + scene.hotspots.length, 0),
    22,
  );

  for (const sentence of lesson01.sentences) {
    assert.equal(sentence.audio.locale, "en-US");
    assert.equal(sentence.audio.version, lesson01.audioVersion);
    assert.ok(sentence.audio.spokenText.length > 0);
    assert.ok(sentence.chunks.length > 0, `Missing Natural English chunk: ${sentence.id}`);
  }

  for (const scene of lesson01.scenes) {
    assert.ok(scene.sentenceIds.length > 0, `Scene has no sentences: ${scene.id}`);
    for (const sentenceId of scene.sentenceIds) {
      assert.ok(sentenceIds.has(sentenceId), `Unknown sentence ${sentenceId} in ${scene.id}`);
    }
    for (const hotspot of scene.hotspots) {
      assert.ok(
        sentenceIds.has(hotspot.sentenceId),
        `Unknown sentence ${hotspot.sentenceId} in ${hotspot.id}`,
      );
      assert.ok(hotspot.position.xPercent >= 0 && hotspot.position.xPercent <= 100);
      assert.ok(hotspot.position.yPercent >= 0 && hotspot.position.yPercent <= 100);
    }
  }
});
