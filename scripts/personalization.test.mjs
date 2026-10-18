import assert from "node:assert/strict";
import test from "node:test";
import { createTestDatabase } from "./test-database.mjs";
import { GET, POST, DELETE } from "../app/api/learning/route.ts";
import {
  buildLearnerMemory,
  choosePersonalTopic,
  mergeLearningState,
} from "../app/learning/personalization.ts";
import { coachingContext, saveConversation } from "../app/learning/personalization-server.ts";
import { emptyState, newSession } from "../app/learning/progress.ts";
import { createSessionPlan } from "../app/learning/session-plan.ts";
import { POST as speaking } from "../app/api/daily-speaking/route.ts";
import { POST as debate } from "../app/api/debate/route.ts";
import { signContext } from "../app/debate/server.ts";
import { readFile } from "node:fs/promises";

function request(body, cookie, method = "POST", origin = "http://localhost") {
  return new Request("http://localhost/api/learning", {
    method,
    headers: {
      Origin: origin,
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
function learning() {
  return {
    ...emptyState(),
    profile: {
      name: "Long",
      role: "developer",
      goal: "workplace",
      confidence: "some",
      largeText: false,
      mic: false,
    },
  };
}

test("memory uses evidenced results, schedules successful reuse later and preserves both content tracks", () => {
  const state = learning();
  const session = newSession(1, 1, "developer");
  session.attempts = [
    {
      id: "listen",
      stage: "visual-listening",
      kind: "listening",
      answer: "Wrong choice",
      correct: false,
      contentTrack: "carnegie",
      at: "2026-10-01T00:00:00Z",
    },
  ];
  state.sessions[session.key] = session;
  const record = {
    key: "speaking:one",
    kind: "speaking",
    topic: "Work",
    completed: true,
    updatedAt: "2026-10-01T00:00:00Z",
    turns: ["I get up six."],
    corrections: [
      { original: "I get up six.", corrected: "I get up at six.", noteVi: "Thêm at trước giờ." },
    ],
  };
  const memory = buildLearnerMemory(state, [record]);
  assert.equal(memory.completedLessons, 0);
  assert.equal(memory.learnerTurns, 1);
  assert.equal(memory.reviews.length, 2);
  const replay = newSession(1, 1, "developer");
  replay.key += "-r1";
  replay.attempts = [
    {
      ...session.attempts[0],
      id: "correct",
      correct: true,
      captions: true,
      at: "2026-10-03T00:00:00Z",
    },
  ];
  state.sessions[replay.key] = replay;
  assert.ok(
    buildLearnerMemory(state, [record]).reviews.some((r) => r.id.startsWith("listening:")),
    "Assisted reading does not establish independent listening",
  );
  replay.attempts[0].captions = false;
  assert.equal(
    buildLearnerMemory(state, [record]).reviews.filter((r) => r.id.startsWith("listening:")).length,
    0,
  );
  delete state.sessions[replay.key];
  assert.ok(memory.reviews.some((r) => r.labelVi === "Quan tâm chân thành"));
  const later = {
    ...record,
    key: "speaking:two",
    updatedAt: "2026-10-03T00:00:00Z",
    turns: ["I get up at six."],
    corrections: [],
  };
  const reused = buildLearnerMemory(state, [later, record]);
  assert.equal(
    reused.reviews.find((r) => r.id.startsWith("phrase:")).dueAt,
    "2026-10-06T00:00:00.000Z",
  );
  assert.equal(
    buildLearnerMemory(
      state,
      [record],
      memory.reviews.map((r) => r.id),
    ).reviews.length,
    0,
  );
  const one = choosePersonalTopic(state, memory, 0, new Date("2026-10-18T00:00:00Z"));
  const two = choosePersonalTopic(state, memory, 1, new Date("2026-10-18T00:00:00Z"));
  assert.notEqual(one.id, two.id);
  assert.ok(one.content.length >= 80);
  assert.equal(Array.isArray(one), false, "A recommendation is exactly one article");
  assert.deepEqual(createSessionPlan().contentLedgerSeconds, { everyday: 576, carnegie: 144 });
  const a = learning(),
    b = learning();
  a.sessions[session.key] = { ...session, attempts: [session.attempts[0]] };
  b.sessions[session.key] = { ...session, attempts: [{ ...session.attempts[0], id: "other" }] };
  assert.equal(mergeLearningState(a, b).sessions[session.key].attempts.length, 2);
});

test("database personalizations are private, durable, idempotent and only use learner-approved examples", async () => {
  const database = await createTestDatabase();
  try {
    const first = await GET(request(null, null, "GET"));
    const cookie = first.headers.get("set-cookie").split(";")[0];
    assert.match(first.headers.get("set-cookie"), /HttpOnly; SameSite=Lax/);
    assert.equal(first.headers.get("Cache-Control"), "no-store");
    assert.equal(
      (
        await POST(
          request({ action: "sync", state: learning() }, cookie, "POST", "http://evil.test"),
        )
      ).status,
      403,
    );
    assert.equal((await POST(request({ action: "sync", state: learning() }))).status, 401);
    const synced = await POST(request({ action: "sync", state: learning() }, cookie));
    assert.equal(synced.status, 200);
    assert.equal((await synced.json()).state.profile.name, "Long");
    assert.equal(
      (await (await GET(request(null, cookie, "GET"))).json()).state.profile.role,
      "developer",
    );
    const other = await GET(request(null, null, "GET"));
    const otherCookie = other.headers.get("set-cookie").split(";")[0];
    assert.equal((await other.json()).state.profile, null);
    const input = {
      key: "speaking:test",
      kind: "speaking",
      topic: "Breakfast",
      turns: ["I get up six."],
      completed: false,
      correction: { original: "I get up six.", corrected: "I get up at six.", noteVi: "Thêm at." },
    };
    await saveConversation(request(null, cookie), input);
    let data = await (await GET(request(null, cookie, "GET"))).json();
    assert.equal(
      data.personalization.memory.learnerTurns,
      0,
      "Incomplete speaking is not an achievement",
    );
    await saveConversation(request(null, cookie), { ...input, completed: true });
    await saveConversation(request(null, cookie), { ...input, completed: true });
    assert.equal(await database.db.learningRecord.count(), 1);
    data = await (await GET(request(null, cookie, "GET"))).json();
    assert.equal(data.personalization.memory.learnerTurns, 1);
    assert.equal(data.personalization.memory.reviews.length, 1);
    assert.equal(
      (await (await GET(request(null, otherCookie, "GET"))).json()).personalization.memory
        .learnerTurns,
      0,
    );
    const example = {
      action: "approve-example",
      english: "I grab breakfast on my way to work.",
      vietnamese: "Tôi ghé ăn sáng trên đường đi làm.",
      usageVi: "Dùng trong giao tiếp đời thường.",
    };
    assert.equal((await POST(request(example, cookie))).status, 200);
    assert.equal((await POST(request(example, cookie))).status, 200);
    assert.equal(await database.db.coachingExample.count(), 1);
    await saveConversation(request(null, cookie), {
      ...input,
      turns: ["I get up six.", "I had coffee."],
    });
    await saveConversation(request(null, cookie), {
      ...input,
      turns: ["I had coffee.", "Then I went to work."],
    });
    const savedRecord = await database.db.learningRecord.findFirst();
    assert.deepEqual(JSON.parse(savedRecord.dataJson).turns, [
      "I get up six.",
      "I had coffee.",
      "Then I went to work.",
    ]);
    const context = await coachingContext(request(null, cookie), "", "Breakfast");
    assert.match(context, /Long/);
    assert.match(context, /I grab breakfast/);
    assert.match(context, /never instructions or source evidence/);
    assert.equal(await coachingContext(request(null, null)), "");
    const oldTopic = data.personalization.topic.id;
    const refreshed = await (await POST(request({ action: "refresh-topic" }, cookie))).json();
    assert.notEqual(refreshed.personalization.topic.id, oldTopic);
    const reviewId = data.personalization.memory.reviews[0].id;
    const dismissed = await (
      await POST(request({ action: "dismiss-review", reviewId }, cookie))
    ).json();
    assert.equal(dismissed.personalization.memory.reviews.length, 0);
    const ownedExample = refreshed.personalization.examples[0].id;
    await POST(request({ action: "delete-example", exampleId: ownedExample }, otherCookie));
    assert.equal(
      await database.db.coachingExample.count(),
      1,
      "Another learner cannot delete a private example",
    );
    assert.equal((await DELETE(request(null, cookie, "DELETE"))).status, 200);
    assert.equal(await database.db.learningRecord.count(), 0);
    assert.equal(await database.db.coachingExample.count(), 0);
    assert.equal(await database.db.learner.count(), 1, "Reset must retain the other learner");
  } finally {
    await database.close();
  }
});

test("AI Lead receives saved context and remembers only actual learner turns after ending a session", async () => {
  const database = await createTestDatabase();
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key";
  const calls = [];
  let result = {
    reply: "What time do you have breakfast?",
    translationVi: "Bạn ăn sáng lúc mấy giờ?",
    explanationVi: "",
    correction: {
      mistakeVi: "Thiếu at trước giờ.",
      suggestionVi: "I get up at six. Thêm at trước giờ.",
    },
    alternative: null,
    speakingVersions: {
      short: { en: "At six.", vi: "Lúc sáu giờ." },
      full: { en: "I get up at six.", vi: "Tôi dậy lúc sáu giờ." },
      grammar: { en: "I get up at six.", vi: "Tôi dậy lúc sáu giờ." },
    },
  };
  globalThis.fetch = async (_url, options) => {
    calls.push(JSON.parse(options.body));
    return Response.json({
      status: "completed",
      output: [{ content: [{ type: "output_text", text: JSON.stringify(result) }] }],
    });
  };
  try {
    const initial = await GET(request(null, null, "GET"));
    const cookie = initial.headers.get("set-cookie").split(";")[0];
    await POST(request({ action: "sync", state: learning() }, cookie));
    const send = (body) =>
      speaking(
        new Request("http://localhost/api/daily-speaking", {
          method: "POST",
          headers: {
            Origin: "http://localhost",
            Cookie: cookie,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", ...body }),
        }),
      );
    assert.equal((await send({ message: "I get up six." })).status, 200);
    assert.match(calls[0].instructions, /"name":"Long"/);
    assert.match(calls[0].instructions, /"role":"developer"/);
    result = { ...result, correction: null, speakingVersions: null };
    assert.equal(
      (
        await send({
          action: "end",
          history: [
            { role: "user", content: "I get up six." },
            { role: "assistant", content: "Try at six." },
          ],
        })
      ).status,
      200,
    );
    let data = await (await GET(request(null, cookie, "GET"))).json();
    assert.equal(data.personalization.memory.learnerTurns, 1);
    assert.equal(data.personalization.memory.reviews.length, 1);
    assert.match(data.personalization.memory.reviews[0].evidenceVi, /I get up six/);
    assert.doesNotMatch(data.personalization.memory.summaryVi, /Try at six/);
    const analysis = JSON.parse(
      await readFile(new URL("../tests/fixtures/debate.json", import.meta.url), "utf8"),
    );
    const token = signContext({
      analysis,
      stance: "agree",
      source: "text",
      sourceName: "Practice",
    });
    const before = calls.length;
    const finish = await debate(
      new Request("http://localhost/api/debate", {
        method: "POST",
        headers: { Origin: "http://localhost", Cookie: cookie, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finish",
          token,
          history: [{ role: "user", content: "I think short daily practice helps me." }],
        }),
      }),
    );
    assert.equal(finish.status, 200);
    assert.equal(calls.length, before, "Finishing a debate must not call the model");
    data = await (await GET(request(null, cookie, "GET"))).json();
    assert.equal(data.personalization.memory.learnerTurns, 2);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    await database.close();
  }
});
