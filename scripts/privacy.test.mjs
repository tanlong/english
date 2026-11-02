import assert from "node:assert/strict";
import { test } from "node:test";
import { GET, DELETE } from "../app/api/learning/route.ts";
import { POST as speech } from "../app/api/daily-speaking/speech/route.ts";
import { POST as transcription } from "../app/api/speech-score/route.ts";
import { createTestDatabase } from "./test-database.mjs";

test("personal audio caches are private and deleting a learner removes their cached content", async () => {
  const database = await createTestDatabase();
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const originalEnabled = process.env.ENABLE_CLOUD_SPEECH;
  process.env.OPENAI_API_KEY = "privacy-test-key";
  process.env.ENABLE_CLOUD_SPEECH = "true";
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls++;
    return String(url).endsWith("transcriptions")
      ? Response.json({ text: "My personal answer." })
      : new Response(new Uint8Array([1, 2, 3]));
  };
  const speechRequest = (cookie) =>
    new Request("http://localhost/api/daily-speaking/speech", {
      method: "POST",
      headers: { Origin: "http://localhost", "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ input: "My personal answer." }),
    });
  const transcriptionRequest = (cookie) => {
    const form = new FormData();
    form.set("consent", "true");
    form.set("target", "My personal answer.");
    form.set("audio", new File(["private recording"], "recording.webm", { type: "audio/webm" }));
    return new Request("http://localhost/api/speech-score", {
      method: "POST",
      headers: { Origin: "http://localhost", Cookie: cookie },
      body: form,
    });
  };
  try {
    const cookies = [];
    for (let i = 0; i < 2; i++) {
      const identity = await GET(new Request("http://localhost/api/learning"));
      cookies.push(identity.headers.get("Set-Cookie").split(";")[0]);
    }
    for (const cookie of cookies) {
      assert.equal((await speech(speechRequest(cookie))).status, 200);
      assert.equal((await transcription(transcriptionRequest(cookie))).status, 200);
    }
    assert.equal(calls, 4, "Personal content must not be cached across learners");
    delete process.env.OPENAI_API_KEY;
    for (const cookie of cookies) {
      assert.equal((await speech(speechRequest(cookie))).status, 200);
      assert.equal((await transcription(transcriptionRequest(cookie))).status, 200);
    }
    assert.equal(
      (
        await DELETE(
          new Request("http://localhost/api/learning", {
            method: "DELETE",
            headers: { Origin: "http://localhost", Cookie: cookies[0] },
          }),
        )
      ).status,
      200,
    );
    // Reconnect with the old browser identity: deleted private content must still be absent.
    await GET(new Request("http://localhost/api/learning", { headers: { Cookie: cookies[0] } }));
    assert.equal((await speech(speechRequest(cookies[0]))).status, 503);
    assert.equal((await transcription(transcriptionRequest(cookies[0]))).status, 503);
    assert.equal((await speech(speechRequest(cookies[1]))).status, 200);
    assert.equal((await transcription(transcriptionRequest(cookies[1]))).status, 200);
    assert.equal((await speech(speechRequest(""))).status, 503);
    assert.equal((await transcription(transcriptionRequest(""))).status, 503);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    if (originalEnabled === undefined) delete process.env.ENABLE_CLOUD_SPEECH;
    else process.env.ENABLE_CLOUD_SPEECH = originalEnabled;
    await database.close();
  }
});

test("a deleted identity cannot be recreated while private provider requests are in flight", async () => {
  const database = await createTestDatabase();
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const originalEnabled = process.env.ENABLE_CLOUD_SPEECH;
  process.env.ENABLE_CLOUD_SPEECH = "true";
  let release;
  try {
    for (const kind of ["speech", "transcription"]) {
      process.env.OPENAI_API_KEY = "privacy-test-key";
      let started;
      const providerStarted = new Promise((resolve) => {
        started = resolve;
      });
      const providerWait = new Promise((resolve) => {
        release = resolve;
      });
      globalThis.fetch = async () => {
        started();
        await providerWait;
        return kind === "speech"
          ? new Response(new Uint8Array([4, 5, 6]))
          : Response.json({ text: "Private answer." });
      };
      const initial = await GET(new Request("http://localhost/api/learning"));
      const cookie = initial.headers.get("Set-Cookie").split(";")[0];
      const request = (identity) => {
        if (kind === "speech")
          return new Request("http://localhost/api/daily-speaking/speech", {
            method: "POST",
            headers: { Origin: "http://localhost", Cookie: identity },
            body: JSON.stringify({ input: "Private answer." }),
          });
        const form = new FormData();
        form.set("consent", "true");
        form.set("target", "Private answer.");
        form.set("audio", new File(["private audio"], "recording.webm", { type: "audio/webm" }));
        return new Request("http://localhost/api/speech-score", {
          method: "POST",
          headers: { Origin: "http://localhost", Cookie: identity },
          body: form,
        });
      };
      const handler = kind === "speech" ? speech : transcription;
      const pending = handler(request(cookie));
      await providerStarted;
      assert.equal(
        (
          await DELETE(
            new Request("http://localhost/api/learning", {
              method: "DELETE",
              headers: { Origin: "http://localhost", Cookie: cookie },
            }),
          )
        ).status,
        200,
      );
      const reconnected = await GET(
        new Request("http://localhost/api/learning", { headers: { Cookie: cookie } }),
      );
      const nextCookie = reconnected.headers.get("Set-Cookie")?.split(";")[0] ?? cookie;
      release();
      assert.equal((await pending).status, 200);
      delete process.env.OPENAI_API_KEY;
      assert.equal(
        (await handler(request(nextCookie))).status,
        503,
        `${kind} must not restore deleted content`,
      );
      assert.notEqual(nextCookie, cookie, "A deleted identity must receive a new token");
    }
  } finally {
    release?.();
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    if (originalEnabled === undefined) delete process.env.ENABLE_CLOUD_SPEECH;
    else process.env.ENABLE_CLOUD_SPEECH = originalEnabled;
    await database.close();
  }
});
