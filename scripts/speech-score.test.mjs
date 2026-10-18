import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../app/api/speech-score/route.ts";
import { createTestDatabase } from "./test-database.mjs";

test("transcription uses SQLite first, separates recordings and never caches failures", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const originalEnabled = process.env.ENABLE_CLOUD_SPEECH;
  const database = await createTestDatabase();
  const { db } = database;
  process.env.ENABLE_CLOUD_SPEECH = "true";
  process.env.OPENAI_API_KEY = "test-key";
  let calls = 0;
  function request(
    consent,
    origin = "http://127.0.0.1:3000",
    bytes = "test audio",
    target = "I get breakfast on the way to work.",
  ) {
    const form = new FormData();
    form.set("consent", consent);
    form.set("target", target);
    form.set("audio", new File([bytes], "recording.webm", { type: "audio/webm" }));
    // Next dev can reconstruct request.url with localhost while the browser uses 127.0.0.1.
    return new Request("http://localhost:3000/api/speech-score", {
      method: "POST",
      headers: { Origin: origin, Host: "127.0.0.1:3000" },
      body: form,
    });
  }
  const upstream = async (_url, options) => {
    calls++;
    assert.equal(options.body.get("model"), "gpt-4o-mini-transcribe");
    assert.equal(options.body.get("language"), "en");
    assert.equal(options.body.get("file").name, "recording.webm");
    await new Promise((resolve) => setTimeout(resolve, 10));
    return Response.json({ text: "I get breakfast on the way to work." });
  };
  globalThis.fetch = upstream;
  try {
    assert.equal((await POST(request("true", "http://evil.test"))).status, 403);
    const denied = await POST(request("false"));
    assert.equal(denied.status, 400);
    assert.match((await denied.json()).error, /Cần đồng ý/);
    assert.equal(calls, 0);
    const responses = await Promise.all([POST(request("true")), POST(request("true"))]);
    for (const response of responses) {
      assert.equal(response.status, 200);
      assert.equal((await response.json()).score, 100);
    }
    assert.equal(calls, 1);
    assert.equal(await db.transcription.count(), 1);
    delete process.env.OPENAI_API_KEY;
    process.env.ENABLE_CLOUD_SPEECH = "false";
    await db.$disconnect();
    assert.equal((await POST(request("true"))).status, 200);
    const otherTarget = await POST(request("true", undefined, "test audio", "I take the bus."));
    assert.equal(otherTarget.status, 200);
    assert.ok(
      (await otherTarget.json()).score < 100,
      "Score is recalculated for the current target",
    );
    assert.equal(calls, 1);
    assert.equal((await POST(request("true", undefined, "uncached audio"))).status, 503);
    process.env.ENABLE_CLOUD_SPEECH = "true";
    process.env.OPENAI_API_KEY = "test-key";
    globalThis.fetch = async () => {
      throw new TypeError("fetch failed");
    };
    const failed = await POST(request("true", undefined, "new recording"));
    assert.equal(failed.status, 502);
    assert.match((await failed.json()).error, /Chưa thể kiểm tra bản ghi/);
    assert.equal(await db.transcription.count(), 1);
    globalThis.fetch = upstream;
    assert.equal((await POST(request("true", undefined, "new recording"))).status, 200);
    assert.equal(calls, 2);
    assert.equal(await db.transcription.count(), 2);
    await db.$executeRawUnsafe('DROP TABLE "Transcription"');
    assert.equal((await POST(request("true"))).status, 502);
    assert.equal(calls, 2, "An unavailable database must not trigger a paid API call");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    if (originalEnabled === undefined) delete process.env.ENABLE_CLOUD_SPEECH;
    else process.env.ENABLE_CLOUD_SPEECH = originalEnabled;
    await database.close();
  }
});
