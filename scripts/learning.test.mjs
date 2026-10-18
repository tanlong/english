import assert from "node:assert/strict";
import test from "node:test";
import {
  emptyState,
  newSession,
  addActiveSeconds,
  addAttempt,
  completeStage,
  parseState,
  dateKey,
  lessonAccess,
  nextLesson,
  openLesson,
  sessionKey,
} from "../app/learning/progress.ts";
import { curriculum, roles, months, communicationScenes } from "../app/content/curriculum.ts";
import { getPracticeLesson } from "../app/content/practice.ts";
import { draftEditorial, publicationIssues, reviseContent } from "../app/content/editorial.ts";
import { sessionStages } from "../app/learning/session-plan.ts";
import { ipaSounds } from "../app/content/ipa.ts";
import { ipaArticulations } from "../app/content/ipa-articulation.ts";
const today = "2026-10-16";
const session = newSession(1, 1, "developer");

test("all IPA entries have articulation stages with correct airflow and voicing families", () => {
  assert.deepEqual(Object.keys(ipaArticulations).sort(), ipaSounds.map((sound) => sound.id).sort());
  for (const sound of ipaSounds) {
    const articulation = ipaArticulations[sound.id];
    assert.ok(articulation.frames.length >= 1 && articulation.frames.length <= 2);
    if (sound.group !== "consonants") assert.equal(articulation.voiced, true);
    if (sound.group === "diphthongs") {
      assert.equal(articulation.frames.length, 2);
      assert.notEqual(articulation.frames[0].tongue, articulation.frames[1].tongue);
    }
  }
  for (const [unvoiced, voiced] of [
    ["p", "b"],
    ["t", "d"],
    ["k", "g"],
    ["f", "v"],
    ["th", "dh"],
    ["s", "z"],
    ["sh", "zh"],
    ["ch", "j"],
  ]) {
    assert.equal(ipaArticulations[unvoiced].voiced, false);
    assert.equal(ipaArticulations[voiced].voiced, true);
    assert.deepEqual(ipaArticulations[unvoiced].frames, ipaArticulations[voiced].frames);
  }
  for (const id of ["m", "n", "ng"]) {
    assert.equal(ipaArticulations[id].frames[0].airflow, "nasal");
    assert.ok(ipaArticulations[id].frames[0].contact);
  }
  assert.equal(ipaArticulations.l.frames[0].airflow, "lateral");
  assert.equal(ipaArticulations.h.voiced, false);
});

test("IPA practice preserves valid progress and reads older learning data", () => {
  assert.equal(ipaSounds.length, 44);
  assert.deepEqual(
    ["vowels", "diphthongs", "consonants"].map(
      (group) => ipaSounds.filter((sound) => sound.group === group).length,
    ),
    [12, 8, 24],
  );
  assert.deepEqual(
    ipaSounds.filter((sound) => sound.accent === "en-GB").map((sound) => sound.symbol),
    ["ɒ", "ɪə", "eə", "ʊə"],
  );
  assert.equal(new Set(ipaSounds.map((sound) => sound.id)).size, ipaSounds.length);
  assert.equal(new Set(ipaSounds.map((sound) => sound.symbol)).size, ipaSounds.length);
  assert.ok(
    ipaSounds.every(
      (sound) =>
        sound.word && sound.ipa && sound.tip && sound.pair.word && sound.pair.word !== sound.word,
    ),
  );
  const state = { ...emptyState(), ipaPracticed: ["i", "th", "uk-near", "i", "unknown", null, 12] };
  assert.deepEqual(parseState(JSON.stringify(state)).ipaPracticed, ["i", "th", "uk-near"]);
  const { ipaPracticed, ...older } = emptyState();
  assert.deepEqual(parseState(JSON.stringify(older)).ipaPracticed, []);
});
function stateWithSession() {
  return {
    ...emptyState(),
    sessions: { [session.key]: structuredClone(session) },
  };
}
function attempt(stage, kind = "writing", answer = "A real response.") {
  return { id: stage, stage, kind, answer, at: "2026-10-16T00:00:00.000Z" };
}
function stageEvidence(stage) {
  const kinds =
    stage === "visual-listening"
      ? ["listening", "listening"]
      : stage === "speaking"
        ? ["typed", "typed", "typed"]
        : ["takeaway", "writing"];
  return kinds.map((kind, i) => ({
    ...attempt(stage, kind),
    id: `${stage}-${i}`,
    contentTrack: i === kinds.length - 1 ? "carnegie" : "everyday",
  }));
}
test("every month and role retains its Carnegie theme and a complete practice scene", () => {
  assert.equal(communicationScenes.length, months.length);
  for (const module of curriculum)
    for (const role of roles)
      for (let day = 1; day <= 6; day++) {
        const lesson = getPracticeLesson(module.week, day, role.id);
        assert.equal(lesson.principle, months[module.month - 1].principle);
        assert.equal(lesson.communication, communicationScenes[module.month - 1]);
        const scene = lesson.communication;
        assert.ok(scene.opening && scene.reply && scene.followup && scene.reflection);
        assert.equal(scene.meanings.length, 3);
        assert.ok(scene.choices[scene.correct]);
      }
});

test("new lessons require Carnegie practice in each step and retain that evidence after reload", () => {
  for (const [index, stage] of sessionStages.entries()) {
    let current = { ...newSession(1, 1, "general"), stage: index };
    for (const evidence of stageEvidence(stage.id).filter((a) => a.contentTrack !== "carnegie"))
      current = addAttempt(current, evidence);
    assert.equal(completeStage(current), current, stage.id);
    const evidence = stageEvidence(stage.id).at(-1);
    current = addAttempt(current, evidence);
    const completed = completeStage(current);
    assert.ok(completed.completed.includes(stage.id));
    const state = { ...emptyState(), sessions: { [completed.key]: completed } };
    const restored = parseState(JSON.stringify(state)).sessions[completed.key];
    assert.ok(restored.completed.includes(stage.id));
    assert.ok(restored.attempts.some((a) => a.contentTrack === "carnegie"));
  }
});
test("52 weeks, all 312 daily drafts and distinct role overlays are addressable", () => {
  assert.equal(curriculum.length, 52);
  assert.deepEqual(
    curriculum.map((m) => m.week),
    Array.from({ length: 52 }, (_, i) => i + 1),
  );
  const ids = new Set();
  for (const week of curriculum)
    for (let day = 1; day <= 6; day++)
      for (const role of roles) {
        const lesson = getPracticeLesson(week.week, day, role.id);
        ids.add(lesson.id);
        assert.ok(lesson.choices[lesson.correct]);
        assert.ok(lesson.lines.every((l) => l.en.trim()));
        assert.ok(lesson.lines.every((l) => l.vi.trim() && !l.vi.includes("Tự diễn đạt")));
        assert.ok(lesson.targetVi.trim());
        assert.ok(lesson.grammar.en.trim() && lesson.grammar.vi.trim());
        assert.ok(lesson.target.length <= lesson.lines[1].en.length);
        assert.ok(lesson.transfer.trim());
        assert.ok(lesson.goal.trim());
        assert.ok(lesson.followup.trim());
      }
  assert.equal(ids.size, 52 * 6 * 7);
  assert.match(getPracticeLesson(20, 1, "developer").target, /API/);
  assert.match(getPracticeLesson(20, 1, "po").target, /release/);
  assert.notEqual(getPracticeLesson(20, 1, "po").target, getPracticeLesson(20, 1, "pm").target);
  assert.equal(
    new Set(Array.from({ length: 6 }, (_, i) => getPracticeLesson(1, i + 1, "general").target))
      .size,
    6,
  );
});
test("suggested stage time does not interrupt practice; the shared daily cap still applies", () => {
  let state = stateWithSession();
  state = addActiveSeconds(state, session.key, 9999, today);
  assert.equal(state.sessions[session.key].seconds[0], 3600);
  state.dailySeconds[today] = 3598;
  state.sessions[session.key].stage = 1;
  state = addActiveSeconds(state, session.key, 20, today);
  assert.equal(state.dailySeconds[today], 3600);
  assert.equal(state.sessions[session.key].seconds[1], 2);
  assert.equal(addActiveSeconds(state, session.key, NaN, today), state);
  const second = newSession(20, 1, "po");
  state.sessions[second.key] = second;
  assert.equal(addActiveSeconds(state, second.key, 20, today).sessions[second.key].seconds[0], 0);
  assert.equal(
    addActiveSeconds(state, second.key, 20, "2026-10-17").sessions[second.key].seconds[0],
    20,
  );
});
test("completion needs evidence and does not invent minutes; events are idempotent", () => {
  assert.equal(completeStage(session), session);
  const event = attempt("visual-listening", "listening");
  let next = addAttempt(session, event);
  assert.equal(addAttempt(next, event), next);
  assert.equal(completeStage(next), next, "Everyday evidence alone cannot skip Carnegie listening");
  next = addAttempt(next, { ...event, id: "carnegie-listen", contentTrack: "carnegie" });
  next = {
    ...next,
    attempts: next.attempts.map((a) =>
      a.id === event.id ? { ...a, contentTrack: "everyday" } : a,
    ),
  };
  next = completeStage(next);
  assert.equal(next.stage, 1);
  assert.deepEqual(next.completed, ["visual-listening"]);
  assert.equal(
    next.seconds.reduce((a, b) => a + b, 0),
    0,
  );
});
test("full session resumes without losing artifacts or recording nonexistent speech", () => {
  let state = stateWithSession();
  const profile = {
    name: "Long",
    role: "developer",
    goal: "both",
    confidence: "some",
    mic: false,
    largeText: false,
  };
  state.profile = profile;
  let s = state.sessions[session.key];
  for (const stage of sessionStages) {
    for (const evidence of stageEvidence(stage.id)) s = addAttempt(s, evidence);
    s = completeStage(s);
  }
  s.drafts.reflection = "I will listen carefully.";
  state.sessions[s.key] = s;
  const restored = parseState(JSON.stringify(state));
  assert.ok(restored.sessions[s.key].finishedAt);
  assert.equal(restored.sessions[s.key].drafts.reflection, s.drafts.reflection);
  assert.equal(restored.sessions[s.key].attempts.filter((a) => a.kind === "speaking").length, 0);
});
test("lessons are freely selectable, recommendations stay ordered and replays preserve history", () => {
  let state = emptyState();
  assert.deepEqual(nextLesson(state), { week: 1, day: 1 });
  assert.equal(lessonAccess(state, 1, 2).status, "available");
  assert.equal(lessonAccess(state, 20, 1).status, "available");
  assert.equal(openLesson(state, 1, 2, "developer").key, sessionKey(1, 2, "developer"));
  assert.equal(openLesson(state, 20, 1, "developer").key, sessionKey(20, 1, "developer"));
  for (const [week, day] of [
    [0, 1],
    [53, 1],
    [1, 7],
    [1, 1.5],
  ])
    assert.equal(openLesson(state, week, day, "general").key, null);
  const first = openLesson(state, 1, 1, "developer");
  state = first.state;
  assert.equal(first.key, sessionKey(1, 1, "developer"));
  assert.equal(openLesson(state, 1, 1, "developer").key, first.key);
  let finished = state.sessions[first.key];
  for (const stage of sessionStages) {
    for (const evidence of stageEvidence(stage.id)) finished = addAttempt(finished, evidence);
    finished = completeStage(finished);
  }
  state = { ...state, sessions: { ...state.sessions, [first.key]: finished } };
  assert.equal(lessonAccess(state, 1, 1).status, "completed");
  assert.equal(lessonAccess(state, 1, 2).status, "available");
  assert.equal(lessonAccess(state, 1, 3).status, "available");
  assert.deepEqual(nextLesson(state), { week: 1, day: 2 });
  const replay = openLesson(state, 1, 1, "developer");
  assert.equal(replay.key, `${first.key}-r1`);
  assert.equal(replay.state.sessions[first.key], finished);
  assert.equal(replay.state.activeDay, 1);
  assert.equal(openLesson(replay.state, 1, 1, "developer").key, replay.key);
  const restored = parseState(JSON.stringify(replay.state));
  assert.ok(restored.sessions[first.key].finishedAt);
  assert.equal(restored.sessions[replay.key].stage, 0);
  const otherRole = openLesson(restored, 1, 1, "po");
  assert.equal(otherRole.key, sessionKey(1, 1, "po"));
  for (let day = 2; day <= 6; day++) {
    const key = sessionKey(1, day, "po");
    restored.sessions[key] = { ...finished, key, day };
  }
  assert.deepEqual(nextLesson(restored), { week: 2, day: 1 });
  assert.equal(lessonAccess(restored, 2, 1).status, "available");
  assert.equal(lessonAccess(restored, 2, 2).status, "available");
  assert.equal(openLesson(restored, 2, 1, "developer").key, sessionKey(2, 1, "developer"));
});
test("corrupt and malicious local storage is rejected without crashing", () => {
  for (const raw of [
    "{",
    "null",
    "[]",
    '{"version":1}',
    '{"version":2,"sessions":{"__proto__":{}}}',
  ])
    assert.deepEqual(parseState(raw), emptyState());
  const bad = stateWithSession();
  bad.sessions[session.key].seconds[0] = -1;
  assert.deepEqual(parseState(JSON.stringify(bad)).sessions, {});
  assert.deepEqual(
    parseState(
      JSON.stringify({ version: 2, profile: { name: 3 }, dailySeconds: { [today]: 99999 } }),
    ),
    emptyState(),
  );
});
test("daily accounting uses Vietnam date across UTC midnight", () => {
  assert.equal(dateKey(new Date("2026-10-16T18:00:00Z")), "2026-10-17");
  assert.equal(dateKey(new Date("2026-10-16T16:59:59Z")), "2026-10-16");
});
test("eight-stage data migrates once, preserving time, drafts, evidence and completed history", () => {
  const stages = [
    "review",
    "visual-listening",
    "shadowing",
    "speaking",
    "read-write",
    "communication-listening",
    "communication-speaking",
    "reflection",
  ];
  const state = stateWithSession();
  const old = state.sessions[session.key];
  delete old.planVersion;
  old.seconds = [60, 180, 90, 80, 100, 60, 40, 20];
  old.stage = 6;
  old.completed = stages.slice(0, 6);
  old.attempts = old.completed.flatMap((stage) =>
    Array.from({ length: stage === "speaking" ? 3 : 1 }, (_, i) => ({
      ...attempt(stage, stage === "speaking" ? "typed" : "writing"),
      id: `${stage}-${i}`,
    })),
  );
  old.drafts = { reflection: "Ask about lunch.", "speaking-1": "My own answer." };
  const restored = parseState(JSON.stringify(state));
  const migrated = restored.sessions[old.key];
  assert.equal(migrated.planVersion, "conversation-v1");
  assert.equal(migrated.stage, 2);
  assert.deepEqual(migrated.completed, ["visual-listening", "speaking"]);
  assert.deepEqual(migrated.seconds, [390, 120, 120]);
  assert.deepEqual(migrated.drafts, old.drafts);
  assert.equal(migrated.attempts.length, old.attempts.length);
  assert.equal(migrated.finishedAt, undefined);
  assert.deepEqual(parseState(JSON.stringify(restored)), restored);
  old.completed = stages;
  old.stage = 7;
  old.finishedAt = "2026-10-16T10:00:00.000Z";
  old.attempts = stages.flatMap((stage) =>
    Array.from({ length: stage.includes("speaking") ? 3 : 1 }, (_, i) => ({
      ...attempt(stage, "typed"),
      id: `${stage}-${i}`,
    })),
  );
  const finished = parseState(JSON.stringify(state)).sessions[old.key];
  assert.equal(finished.finishedAt, old.finishedAt);
  assert.equal(finished.completed.length, 3);
  assert.equal(finished.attempts.filter((a) => a.kind === "speaking").length, 0);
});
test("seed lexicon fails publication; editing invalidates dependent approvals", () => {
  assert.ok(publicationIssues(draftEditorial).some((x) => x.includes("seed")));
  const approval = {
    revision: "v1",
    reviewer: "Editor",
    at: "2026-10-16T00:00:00Z",
    evidence: ["review-record"],
  };
  const approved = {
    revision: "v1",
    language: approval,
    ipa: approval,
    illustration: approval,
    audio: approval,
    assessment: approval,
    lexicon: { status: "approved", version: "v1", ratio: 0.95 },
    rights: true,
    alt: "An adult at work.",
  };
  assert.deepEqual(publicationIssues(approved), []);
  assert.ok(publicationIssues(reviseContent(approved, "v2")).length >= 6);
});

test("three speaking turns are required before completing the speaking stage", () => {
  const s = addAttempt(
    { ...newSession(1, 1, "general"), stage: 1 },
    {
      ...attempt("speaking", "typed"),
      id: "turn1",
    },
  );
  assert.equal(completeStage(s), s);
});

test("old review data is dropped while completed lessons and takeaway choices survive", () => {
  const state = stateWithSession();
  let s = state.sessions[session.key];
  s.planVersion = "conversation-v1";
  for (const stage of sessionStages) {
    for (let i = 0; i < (stage.id === "speaking" ? 3 : 1); i++) {
      s = addAttempt(s, {
        ...attempt(stage.id, stage.id === "reflection" ? "review" : "typed"),
        id: `${stage.id}-${i}`,
      });
    }
    s = completeStage(s);
  }
  s.drafts.reflection = "Use this with a coworker.";
  state.sessions[s.key] = s;
  state.dailySeconds[today] = 600;
  const restored = parseState(
    JSON.stringify({
      ...state,
      reviews: [{ itemId: "old-item" }],
      standaloneReviewSeconds: { [today]: 120 },
    }),
  );
  assert.equal("reviews" in restored, false);
  assert.equal("standaloneReviewSeconds" in restored, false);
  assert.equal(restored.dailySeconds[today], 600);
  assert.equal(restored.sessions[s.key].finishedAt, s.finishedAt);
  assert.equal(restored.sessions[s.key].drafts.reflection, s.drafts.reflection);
  assert.equal(
    restored.sessions[s.key].attempts.find((a) => a.stage === "reflection").kind,
    "takeaway",
  );
  assert.deepEqual(parseState(JSON.stringify(restored)), restored);
});
