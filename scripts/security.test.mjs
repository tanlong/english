import assert from "node:assert/strict";
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { POST as lessonSpeech } from "../app/api/tts/route.ts";
import { POST as tutorSpeech } from "../app/api/daily-speaking/speech/route.ts";
import { POST as conversation } from "../app/api/daily-speaking/route.ts";
import { POST as learning } from "../app/api/learning/route.ts";
import { POST as debate } from "../app/api/debate/route.ts";
import { POST as upload } from "../app/api/debate/upload/route.ts";
import { POST as speechScore } from "../app/api/speech-score/route.ts";
import { POST as contentAdmin } from "../app/api/content-admin/route.ts";
import { createTestDatabase } from "./test-database.mjs";

test("write APIs reject an Origin with a different scheme even if Host matches", async () => {
  const request = new Request("http://localhost/api/tts", {
    method: "POST",
    headers: { Origin: "https://localhost", Host: "localhost", "Content-Type": "application/json" },
    body: JSON.stringify({ spokenText: "I get up at seven." }),
  });
  assert.equal((await lessonSpeech(request)).status, 403);
});

test("JSON APIs stop reading oversized streams even without Content-Length", async () => {
  let cancelled = false;
  let reads = 0;
  const request = new Request("http://localhost/api/tts", {
    method: "POST",
    headers: { Origin: "http://localhost", "Content-Type": "application/json" },
    duplex: "half",
    body: new ReadableStream(
      {
        pull(controller) {
          reads++;
          controller.enqueue(new TextEncoder().encode(reads === 1 ? '"' + "x".repeat(9000) : '"'));
          if (reads === 2) controller.close();
        },
        cancel() {
          cancelled = true;
        },
      },
      { highWaterMark: 0 },
    ),
  });
  assert.equal((await lessonSpeech(request)).status, 413);
  await setImmediate();
  assert.equal(cancelled, true);
  assert.equal(reads, 1, "The server must stop consuming bytes as soon as the limit is exceeded");
});

test("an aggregate provider budget blocks cookie rotation across paid APIs", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const originalLimit = process.env.PROVIDER_GLOBAL_LIMIT;
  const database = await createTestDatabase();
  process.env.OPENAI_API_KEY = "security-test-key";
  process.env.PROVIDER_GLOBAL_LIMIT = "3";
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response("unavailable", { status: 502 });
  };
  const request = (body, cookie) =>
    new Request("http://localhost/api/test", {
      method: "POST",
      headers: {
        Origin: "http://localhost",
        "Content-Type": "application/json",
        Cookie: `english_learner=${cookie.repeat(64)}`,
      },
      body: JSON.stringify(body),
    });
  try {
    assert.equal(
      (await lessonSpeech(request({ spokenText: "I get up at seven." }, "a"))).status,
      502,
    );
    assert.equal((await tutorSpeech(request({ input: "Hello there." }, "b"))).status, 502);
    assert.equal(
      (
        await debate(
          request(
            { action: "analyze", content: "A small habit can make a big difference. ".repeat(4) },
            "c",
          ),
        )
      ).status,
      502,
    );
    const blocked = await lessonSpeech(request({ spokenText: "I get up at seven." }, "d"));
    assert.equal(blocked.status, 429);
    assert.ok(Number(blocked.headers.get("Retry-After")) > 0);
    assert.equal(blocked.headers.get("Cache-Control"), "no-store");
    assert.equal(calls, 3, "Rotating a learner cookie must not create a new aggregate budget");

    assert.equal((await conversation(request({ action: "start" }, "e"))).status, 429);
    assert.equal(
      (
        await debate(
          request(
            { action: "analyze", content: "A small habit can make a big difference. ".repeat(4) },
            "e",
          ),
        )
      ).status,
      429,
    );
    const form = new FormData();
    form.set("consent", "true");
    form.set("target", "Hello there.");
    form.set("audio", new File(["audio"], "recording.webm", { type: "audio/webm" }));
    form.set(
      "file",
      new File(["A small habit can make a big difference. ".repeat(4)], "lesson.txt", {
        type: "text/plain",
      }),
    );
    for (const handler of [speechScore, upload]) {
      assert.equal(
        (
          await handler(
            new Request("http://localhost/api/test", {
              method: "POST",
              headers: { Origin: "http://localhost" },
              body: form,
            }),
          )
        ).status,
        429,
      );
    }
    assert.equal(calls, 3);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    if (originalLimit === undefined) delete process.env.PROVIDER_GLOBAL_LIMIT;
    else process.env.PROVIDER_GLOBAL_LIMIT = originalLimit;
    await database.close();
  }
});

test("all write APIs reject oversized chunked bodies before parsing or calling providers", async () => {
  const originalToken = process.env.CONTENT_EDITOR_TOKEN;
  process.env.CONTENT_EDITOR_TOKEN = "security-test-editor-token-32-characters";
  try {
    for (const [handler, limit, multipart] of [
      [tutorSpeech, 24_000],
      [conversation, 384_000],
      [learning, 2_000_000],
      [contentAdmin, 2_000_000],
      [debate, 256_000],
      [upload, 1024 * 1024 + 64_000, true],
      [speechScore, 10 * 1024 * 1024 + 65536, true],
    ]) {
      let cancelled = false;
      let reads = 0;
      const request = new Request("http://localhost/api/test", {
        method: "POST",
        headers: {
          Origin: "http://localhost",
          Cookie: `english_learner=${"a".repeat(64)}`,
          Authorization: `Bearer ${process.env.CONTENT_EDITOR_TOKEN}`,
          "Content-Type": multipart ? "multipart/form-data; boundary=test" : "application/json",
        },
        duplex: "half",
        body: new ReadableStream(
          {
            pull(controller) {
              if (reads++ === 0) controller.enqueue(new Uint8Array(limit + 1));
              else controller.close();
            },
            cancel() {
              cancelled = true;
            },
          },
          { highWaterMark: 0 },
        ),
      });
      assert.equal((await handler(request)).status, 413, handler.toString().slice(0, 100));
      await setImmediate();
      assert.equal(cancelled, true);
    }
  } finally {
    if (originalToken === undefined) delete process.env.CONTENT_EDITOR_TOKEN;
    else process.env.CONTENT_EDITOR_TOKEN = originalToken;
  }
});
