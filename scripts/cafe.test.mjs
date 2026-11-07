import assert from "node:assert/strict";
import test from "node:test";
import { createTestDatabase } from "./test-database.mjs";
import { GET as identity } from "../app/api/learning/route.ts";
import { GET, POST, DELETE } from "../app/api/cafe/[[...path]]/route.ts";
import { GET as cards, POST as saveCard } from "../app/api/flashcards/route.ts";

function request(path, body, cookie, method = body ? "POST" : "GET") {
  return new Request(`http://localhost/api/cafe/${path}`, {
    method,
    headers: { Origin: "http://localhost", ...(cookie ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
async function learner() {
  return (await identity(request(""))).headers.get("set-cookie").split(";")[0];
}

test("legacy NPC links and conversation requests resolve to the new canonical characters", async () => {
  const database = await createTestDatabase();
  try {
    const daisy = await (await GET(request("npcs/may"))).json();
    assert.equal(daisy.id, "cloud_daisy");
    assert.equal(daisy.name, "Cloud Daisy");
    const bear = await (await GET(request("npcs/deo_explorer"))).json();
    assert.equal(bear.id, "bear_explorer");
    const cookie = await learner();
    const session = await (
      await POST(
        request(
          "conversations",
          { npcId: "may", topicId: "ordering", level: "A1", useAi: false },
          cookie,
        ),
      )
    ).json();
    assert.equal(session.npcId, "cloud_daisy");
    const history = await (await GET(request("conversations", undefined, cookie))).json();
    assert.equal(history[0].id, session.id);
    assert.equal(history[0].npcId, "cloud_daisy");
  } finally {
    await database.close();
  }
});

test("café keeps one active session, persists one copy of a retried turn and grounds its summary", async () => {
  const database = await createTestDatabase();
  try {
    const cookie = await learner();
    const start = { npcId: "may", topicId: "ordering", level: "A1", useAi: false };
    const responses = await Promise.all([
      POST(request("conversations", start, cookie)),
      POST(request("conversations", start, cookie)),
    ]);
    assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
    const session = await responses.find((r) => r.status === 201).json();
    assert.equal(session.mode, "scripted");
    const body = { clientMessageId: "turn-1", text: "I'd like a coffee, please." };
    const first = await POST(request(`conversations/${session.id}/messages`, body, cookie));
    assert.equal(first.status, 200);
    const turn = await first.json();
    assert.equal(turn.reply.sourceMode, "scripted");
    assert.equal(turn.reply.correction, null);
    assert.deepEqual(
      await (await POST(request(`conversations/${session.id}/messages`, body, cookie))).json(),
      turn,
    );
    const finish = () =>
      POST(request(`conversations/${session.id}/end`, { requestId: "end-1" }, cookie));
    const finished = await Promise.all([finish(), finish()]);
    assert.deepEqual(
      finished.map((response) => response.status),
      [200, 200],
    );
    const summary = await finished[0].json();
    assert.deepEqual(await finished[1].json(), summary);
    assert.deepEqual(summary.learnerSentences, ["I'd like a coffee, please."]);
    assert.match(summary.noteVi, /Chưa đủ/);
    assert.deepEqual(await (await finish()).json(), summary);
    const otherCookie = await learner();
    assert.equal(
      (await GET(request(`conversations/${session.id}`, undefined, otherCookie))).status,
      404,
    );
    assert.equal(
      (await DELETE(request(`conversations/${session.id}`, undefined, cookie, "DELETE"))).status,
      200,
    );
    assert.equal(
      (await GET(request(`conversations/${session.id}`, undefined, cookie))).status,
      404,
    );
  } finally {
    await database.close();
  }
});

test("flashcards require an owned ended transcript, acknowledge storage, and deduplicate retries", async () => {
  const database = await createTestDatabase();
  try {
    const cookie = await learner();
    const session = await (
      await POST(
        request(
          "conversations",
          { npcId: "ollie_owl", topicId: "daily_life", level: "A2" },
          cookie,
        ),
      )
    ).json();
    await POST(
      request(
        `conversations/${session.id}/messages`,
        { clientMessageId: "one", text: "I eat breakfast." },
        cookie,
      ),
    );
    const summary = await (
      await POST(request(`conversations/${session.id}/end`, { requestId: "end" }, cookie))
    ).json();
    const payload = { sessionId: session.id, phraseId: summary.phrases[0].id };
    const first = await saveCard(request("", payload, cookie));
    assert.equal(first.status, 200);
    const saved = await first.json();
    assert.equal((await (await saveCard(request("", payload, cookie))).json()).id, saved.id);
    assert.equal((await (await cards(request("", undefined, cookie))).json()).length, 1);
    assert.equal((await saveCard(request("", payload, await learner()))).status, 404);
    assert.equal(
      (await saveCard(request("", { ...payload, phraseId: "invented" }, cookie))).status,
      400,
    );
  } finally {
    await database.close();
  }
});
