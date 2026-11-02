import assert from "node:assert/strict";
import test from "node:test";
import { analyzeLexicon, validateLexicon } from "../app/content/lexicon.ts";
import { contentIssues, newDraft, validDraft } from "../app/content/governance.ts";
import { baselineLesson, wisdomPreview } from "../app/content/baseline.ts";
import { scheduleReview } from "../app/learning/review.ts";
import { emptyState, parseState } from "../app/learning/progress.ts";
import { mergeLearningState } from "../app/learning/personalization.ts";
import { providerQuota } from "../app/api/quota.ts";

test("95/5 uses token counts, reports unmapped and never certifies an absent lexicon", () => {
  const lexicon = {
    version: "TEST-ONLY",
    approvedBy: "fixture",
    entries: [
      { lemma: "get", forms: ["got", "gotten"], meaningVi: "nhận", source: "https://example.test" },
    ],
  };
  assert.equal(
    analyzeLexicon(`${"get ".repeat(180)}${"extra ".repeat(20)}`, lexicon, ["extra"]).coverage,
    90,
  );
  const target = analyzeLexicon(`${"got ".repeat(191)}${"extra ".repeat(9)}`, lexicon, ["extra"]);
  assert.equal(target.coverage, 95.5);
  assert.equal(target.coreTypes, 1);
  assert.equal(analyzeLexicon("get unknown 5:40 Alex", lexicon, [], ["Alex"]).unmapped, 1);
  assert.equal(analyzeLexicon("get", lexicon).official, false);
  assert.equal(analyzeLexicon("get", null).coverage, null);
  assert.equal(validateLexicon(lexicon), false);
});
test("drafts block publication and wisdom requires chapter provenance", () => {
  assert.ok(validDraft(newDraft(baselineLesson)));
  const draft = newDraft(baselineLesson);
  assert.ok(contentIssues(draft, null).issues.some((i) => i.includes("1.500")));
  assert.ok(contentIssues(draft, null).issues.some((i) => i.includes("Audio")));
  assert.ok(
    contentIssues(newDraft(wisdomPreview), null).issues.some((i) => i.includes("Applied Wisdom")),
  );
  assert.equal(validDraft({ ...draft, lesson: { ...draft.lesson, segments: [null] } }), false);
  assert.equal(validDraft({ ...draft, evidence: {} }), false);
});
test("four review ratings schedule actual due times and duplicate events do not reschedule", () => {
  const now = new Date("2026-11-02T01:00:00Z");
  for (const [rating, delay] of [
    ["again", 600000],
    ["hard", 86400000],
    ["good", 172800000],
    ["easy", 345600000],
  ]) {
    const review = scheduleReview(undefined, rating, "event-1", now);
    assert.equal(Date.parse(review.dueAt) - now.getTime(), delay);
    assert.equal(review.count, 1);
    assert.equal(scheduleReview(review, rating, "event-1", new Date()), review);
  }
});
test("new learning evidence survives reload, merges by timestamp and rejects malformed reviews", () => {
  const old = emptyState();
  const next = emptyState();
  old.cardReviews.x = scheduleReview(undefined, "hard", "first", new Date("2026-11-01T00:00:00Z"));
  next.cardReviews.x = scheduleReview(
    old.cardReviews.x,
    "good",
    "second",
    new Date("2026-11-02T00:00:00Z"),
  );
  next.lessonVisits.x = {
    revision: 2,
    index: 1,
    updatedAt: "2026-11-02T00:00:00Z",
    answers: { one: "I get up early." },
    drafts: { two: "I get breakfast" },
  };
  const merged = mergeLearningState(next, old);
  assert.equal(merged.cardReviews.x.eventId, "second");
  assert.equal(merged.lessonVisits.x.drafts.two, "I get breakfast");
  assert.deepEqual(parseState(JSON.stringify(merged)), merged);
  assert.deepEqual(
    parseState(
      JSON.stringify({
        ...old,
        cardReviews: { x: { dueAt: "invalid" } },
        lessonVisits: { x: null },
      }),
    ).cardReviews,
    {},
  );
});

test("provider quotas expire and preserve per-service isolation", () => {
  const request = new Request("http://localhost");
  assert.equal(providerQuota(request, "test-one", 1, 100), null);
  const limited = providerQuota(request, "test-one", 1, 200);
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("Retry-After"), "900");
  assert.equal(providerQuota(request, "test-two", 1, 200), null);
  assert.equal(providerQuota(request, "test-one", 1, 900101), null);
});
