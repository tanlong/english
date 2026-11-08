import assert from "node:assert/strict";
import test from "node:test";
import { createTestDatabase } from "./test-database.mjs";
import { GET as identity } from "../app/api/learning/route.ts";
import { POST } from "../app/api/cafe/[[...path]]/route.ts";
import { npcs } from "../app/cafe/content.ts";
import { cafeVocabulary } from "../app/cafe/vocabulary.ts";

function request(path, body, cookie, origin = "http://localhost") {
  return new Request(`http://localhost/api/cafe/${path}`, {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}
async function learner() {
  return (await identity(new Request("http://localhost/api/learning"))).headers
    .get("set-cookie")
    .split(";")[0];
}
function wav() {
  const bytes = Buffer.alloc(48);
  bytes.write("RIFF");
  bytes.writeUInt32LE(40, 4);
  bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(24000, 24);
  bytes.writeUInt32LE(48000, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(4, 40);
  return bytes;
}
function geminiAudio(audio = wav()) {
  return Response.json({
    status: "completed",
    steps: [
      {
        type: "model_output",
        content: [{ type: "audio", mime_type: "audio/wav", data: audio.toString("base64") }],
      },
    ],
  });
}
async function withGemini(run) {
  const database = await createTestDatabase();
  const originalFetch = globalThis.fetch;
  const previous = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_TTS_MODEL: process.env.GEMINI_TTS_MODEL,
  };
  process.env.GEMINI_API_KEY = "test-gemini-key";
  delete process.env.GEMINI_TTS_MODEL;
  try {
    await run(database);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await database.close();
  }
}

test("all NPCs use stable Gemini voices for authored lines and share cached audio", async () =>
  withGemini(async () => {
    const calls = [];
    const audio = wav();
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "https://generativelanguage.googleapis.com/v1beta/interactions");
      assert.equal(options.headers["x-goog-api-key"], "test-gemini-key");
      const payload = JSON.parse(options.body);
      assert.equal(payload.model, "gemini-3.8-flash-lite-tts");
      assert.equal(payload.store, false);
      assert.match(payload.input[0].content[0].annotations[0].style, /American English/);
      calls.push(payload);
      return geminiAudio(audio);
    };
    const cookie = await learner();
    for (const npc of npcs) {
      const response = await POST(request(`npcs/${npc.id}/speech`, { text: npc.greeting }, cookie));
      assert.equal(response.status, 200, npc.id);
      assert.equal(response.headers.get("Content-Type"), "audio/wav");
      assert.equal(response.headers.get("Cache-Control"), "no-store");
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), audio);
    }
    assert.equal(calls.length, 55, "54 scene characters plus the global guide");
    assert.equal(
      new Set(calls.slice(0, 19).map((call) => call.generation_config.speech_config[0].voice)).size,
      19,
      "Existing characters retain their distinct voices",
    );
    for (const [id, voice] of [
      ["sage_red_panda", "Sulafat"],
      ["pip_penguin", "Gacrux"],
      ["sun_king", "Sadachbia"],
    ])
      assert.equal(
        calls[npcs.findIndex((npc) => npc.id === id)].generation_config.speech_config[0].voice,
        voice,
      );
    const npc = npcs.find((npc) => npc.id === "cloud_daisy");
    const again = await Promise.all(
      [cookie, await learner()].map((owner) =>
        POST(request(`npcs/${npc.id}/speech`, { text: npc.greeting }, owner)),
      ),
    );
    assert.ok(again.every((response) => response.status === 200));
    assert.equal(calls.length, npcs.length, "Authored audio is reused across learners");
    const word = cafeVocabulary[npc.topics[0]][0];
    const spoken = `${word.english}. ${word.example}`;
    const responses = await Promise.all(
      [1, 2].map(() => POST(request(`npcs/${npc.id}/speech`, { text: spoken }, cookie))),
    );
    assert.ok(responses.every((response) => response.status === 200));
    assert.equal(calls.length, npcs.length + 1, "Concurrent listens generate once");
    assert.equal(calls.at(-1).input[0].content[0].text, spoken);
    const before = calls.length;
    for (const [text, owner, origin, status] of [
      ["Make arbitrary paid audio.", cookie, undefined, 400],
      [npc.greeting, "", undefined, 401],
      [npc.greeting, cookie, "https://elsewhere.invalid", 403],
      ["x".repeat(1501), cookie, undefined, 400],
    ])
      assert.equal(
        (await POST(request(`npcs/${npc.id}/speech`, { text }, owner, origin))).status,
        status,
      );
    assert.equal(calls.length, before, "Rejected input does not spend provider requests");
  }));

test("Gemini speech protects saved conversation lines, private caches and provider failures", async () =>
  withGemini(async () => {
    let calls = 0;
    let mode = "ok";
    globalThis.fetch = async () => {
      calls++;
      if (mode === "error") return new Response("provider secret error", { status: 429 });
      if (mode === "invalid") return geminiAudio(Buffer.from("not audio"));
      return geminiAudio();
    };
    const cookie = await learner();
    const create = async (owner) => {
      const response = await POST(
        request(
          "conversations",
          { npcId: "gray_boo", topicId: "health_feelings", level: "A1", useAi: false },
          owner,
        ),
      );
      assert.equal(response.status, 201);
      return response.json();
    };
    const first = await create(cookie);
    const speak = (text, owner = cookie, id = first.id) =>
      POST(request(`conversations/${id}/speech`, { text }, owner));
    assert.equal((await speak(first.greeting)).status, 200);
    assert.equal((await speak(first.greeting)).status, 200);
    assert.equal(calls, 1);
    assert.equal((await speak("Generate unrelated audio.")).status, 400);
    assert.equal((await speak(first.greeting, "")).status, 401);
    const other = await learner();
    assert.equal((await speak(first.greeting, other)).status, 404);
    const second = await create(other);
    assert.equal((await speak(second.greeting, other, second.id)).status, 200);
    assert.equal(calls, 2, "Private session audio is not shared between learners");
    const turnResponse = await POST(
      request(
        `conversations/${first.id}/messages`,
        { clientMessageId: "gemini-turn", text: "I feel tired today." },
        cookie,
      ),
    );
    assert.equal(turnResponse.status, 200);
    const turn = await turnResponse.json();
    mode = "invalid";
    assert.equal((await speak(turn.reply.replyEn)).status, 503);
    mode = "error";
    const error = await speak(turn.reply.replyEn);
    assert.equal(error.status, 503);
    assert.doesNotMatch(await error.text(), /provider secret/);
    mode = "ok";
    assert.equal(
      (await speak(turn.reply.replyEn)).status,
      200,
      "A failed generation must not poison the cache",
    );
    const summaryResponse = await POST(
      request(`conversations/${first.id}/end`, { requestId: "gemini-end" }, cookie),
    );
    assert.equal(summaryResponse.status, 200);
    const summary = await summaryResponse.json();
    assert.equal((await speak(summary.phrases[0].english)).status, 200);
    delete process.env.GEMINI_API_KEY;
    assert.equal(
      (await speak(first.greeting)).status,
      200,
      "Existing audio is still usable without a key",
    );
    const pink = npcs.find((npc) => npc.id === "mr_pink");
    assert.equal(
      (await POST(request(`npcs/${pink.id}/speech`, { text: pink.greeting }, cookie))).status,
      503,
    );
  }));
