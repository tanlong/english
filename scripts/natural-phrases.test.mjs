import assert from "node:assert/strict";
import test from "node:test";
import { sentences } from "../app/data.ts";
import { createMatrixFrame, naturalPhrasePattern, naturalPhraseTranslations } from "../app/natural-phrases.ts";

test("every lesson sentence has a translated Natural English phrase", () => {
  for (const sentence of sentences) {
    const matches = [...sentence.en.matchAll(naturalPhrasePattern)].map((match) => match[0].toLocaleLowerCase("en-US"));
    assert.ok(matches.length > 0, `Missing phrase in: ${sentence.en}`);
    for (const phrase of matches) assert.ok(naturalPhraseTranslations[phrase], `Missing translation for: ${phrase}`);
  }
});

test("Matrix frames preserve spacing and resolve to the target", () => {
  assert.equal(createMatrixFrame("về nhà!", 0, () => 0), "00 000!");
  assert.equal(createMatrixFrame("về nhà!", 99, () => 0), "về nhà!");
});
