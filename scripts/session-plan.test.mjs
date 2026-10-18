import assert from "node:assert/strict";
import test from "node:test";
import { createSessionPlan, sessionStages } from "../app/learning/session-plan.ts";
test("short lessons devote most time to conversation without mandatory extra activities", () => {
  const plan = createSessionPlan();
  assert.deepEqual(plan.ledger, {
    total: 12,
    listeningSpeaking: 10,
    readingWriting: 2,
  });
  assert.deepEqual(
    sessionStages.map((s) => s.minutes),
    [2, 8, 2],
  );
  assert.deepEqual(
    sessionStages.map((s) => s.id),
    ["visual-listening", "speaking", "reflection"],
  );
  assert.equal(plan.duration, plan.ledger.total);
  assert.equal(new Set(sessionStages.map((s) => s.id)).size, 3);
  assert.deepEqual(plan.contentLedgerSeconds, { everyday: 576, carnegie: 144 });
  assert.equal(plan.contentLedgerSeconds.carnegie / (plan.duration * 60), 0.2);
  for (const stage of sessionStages)
    assert.equal(stage.contentSeconds.everyday + stage.contentSeconds.carnegie, stage.minutes * 60);
});
