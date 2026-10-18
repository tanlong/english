import assert from "node:assert/strict";
import { test } from "node:test";
import { POST } from "../app/api/tts/route.ts";
import { playTts, stopAudio } from "../app/audio/client.ts";
import { createTestDatabase } from "./test-database.mjs";

function request(spokenText, voice, origin = "http://localhost") {
  return new Request("http://localhost/api/tts", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ spokenText, voice }),
  });
}

test("TTS uses SQLite first, persists MP3 across restarts and shares concurrent generation", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const database = await createTestDatabase();
  const { db } = database;
  process.env.OPENAI_API_KEY = "test-key";
  const calls = [];
  let fail = false;
  const bytes = new Uint8Array([1, 2, 3]);
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    calls.push(body);
    assert.equal(body.model, "gpt-4o-mini-tts");
    assert.equal(body.response_format, "mp3");
    assert.equal(body.speed, 1);
    await new Promise((resolve) => setTimeout(resolve, 10));
    return fail ? new Response("upstream error", { status: 500 }) : new Response(bytes);
  };
  try {
    const text = "What do you do before work?";
    assert.equal((await POST(request("An unapproved sentence."))).status, 400);
    assert.equal((await POST(request(text, "fake"))).status, 400);
    assert.equal((await POST(request(text, "cedar"))).status, 400);
    assert.equal((await POST(request(text, "nova", "http://evil.test"))).status, 403);
    const responses = await Promise.all([POST(request(text)), POST(request(text))]);
    for (const response of responses) {
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("Content-Type"), "audio/mpeg");
      assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
    }
    assert.equal(calls.length, 1);
    assert.equal(calls[0].voice, "nova");
    assert.equal(calls[0].input, text);
    const records = await db.ttsAudio.findMany();
    assert.equal(records.length, 1);
    assert.match(records[0].key, /^[a-f0-9]{64}$/);
    assert.deepEqual(new Uint8Array(records[0].audio), bytes);

    // A fresh module has no memory of the first request; it must read SQLite.
    delete process.env.OPENAI_API_KEY;
    for (const spokenText of [
      "I grab breakfast on my way to work.",
      "I usually get up early. I get breakfast on the way to work.",
      "I usually get up early and grab breakfast on my way to work.",
      "Most tasks are done, but testing may take another day. Let's confirm the next steps.",
      "Happy to help.",
    ])
      assert.equal((await POST(request(spokenText))).status, 503, spokenText);
    await db.$disconnect();
    const restarted = await import(`../app/audio/server.ts?restart=${Date.now()}`);
    assert.deepEqual(new Uint8Array(await restarted.getSpeech(text, "nova")), bytes);
    assert.equal((await POST(request(text))).status, 200);
    assert.equal((await POST(request(text, "alloy"))).status, 503);
    assert.equal(calls.length, 1);

    process.env.OPENAI_API_KEY = "test-key";
    assert.equal((await POST(request(text, "alloy"))).status, 200);
    assert.equal(calls.length, 2);
    assert.equal(calls[1].voice, "alloy");
    assert.equal((await POST(request("Who takes your son to school?"))).status, 200);
    assert.equal(calls[2].input, "Who takes your son to school?");

    fail = true;
    const other = "Could you give me one more detail or ask a follow-up question?";
    assert.equal((await POST(request(other))).status, 502);
    assert.equal(await db.ttsAudio.count(), 3);
    fail = false;
    assert.equal((await POST(request(other))).status, 200);
    assert.equal(calls.length, 5);
    await db.$executeRawUnsafe('DROP TABLE "TtsAudio"');
    assert.equal((await POST(request(text))).status, 502);
    assert.equal(calls.length, 5, "An unavailable database must not trigger a paid API call");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    await database.close();
  }
});

test("playback reuses normal-speed audio; British English uses the device voice and can be stopped", async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  const originalAudio = globalThis.Audio;
  const originalUtterance = globalThis.SpeechSynthesisUtterance;
  const calls = [];
  const rates = [];
  const britishVoice = { lang: "en-GB", name: "British English" };
  let voices = [];
  let spoken;
  let cancelled = 0;
  const synthesis = Object.assign(new EventTarget(), {
    getVoices: () => voices,
    speak: (utterance) => {
      spoken = utterance;
    },
    cancel: () => {
      cancelled++;
    },
  });
  globalThis.window = { speechSynthesis: synthesis };
  globalThis.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
    }
  };
  globalThis.Audio = class {
    play() {
      rates.push(this.playbackRate);
      queueMicrotask(() => this.onended?.());
      return Promise.resolve();
    }
    pause() {}
  };
  globalThis.fetch = async (_url, options) => {
    calls.push(JSON.parse(options.body));
    return new Response(new Uint8Array([1, 2, 3]));
  };
  try {
    await playTts({ spokenText: "Hello", speed: 0.85 });
    await playTts({ spokenText: "Hello", voice: "alloy", speed: 0.8 });
    assert.deepEqual(calls, [
      { spokenText: "Hello", voice: "nova" },
      { spokenText: "Hello", voice: "alloy" },
    ]);
    assert.deepEqual(rates, [0.85, 0.8]);

    const playback = playTts({ spokenText: "hear", locale: "en-GB" });
    voices = [britishVoice];
    synthesis.dispatchEvent(new Event("voiceschanged"));
    await Promise.resolve();
    assert.equal(spoken.text, "hear");
    assert.equal(spoken.voice, britishVoice);
    assert.equal(spoken.lang, "en-GB");
    assert.equal(spoken.rate, 1);
    const stopped = assert.rejects(playback, /Đã dừng âm thanh/);
    stopAudio();
    await stopped;
    assert.equal(cancelled, 1);
    assert.equal(calls.length, 2);

    voices = [{ lang: "en-US" }];
    await assert.rejects(playTts({ spokenText: "hear", locale: "en-GB" }), /chưa có giọng en-GB/);
    assert.equal(calls.length, 2);

    voices = [{ lang: "en-US" }, britishVoice];
    const british = playTts({ spokenText: "hear", locale: "en-GB", speed: 0.8 });
    assert.equal(spoken.lang, "en-GB");
    assert.equal(spoken.voice, britishVoice);
    assert.equal(spoken.rate, 0.8);
    spoken.onend();
    await british;
    assert.equal(calls.length, 2, "British playback must use the device's British voice");
    voices = [{ lang: "en-US" }];
    await assert.rejects(playTts({ spokenText: "hear", locale: "en-GB" }), /chưa có giọng en-GB/);
    assert.equal(calls.length, 2, "A missing British voice must not fall back to US TTS");
  } finally {
    stopAudio();
    globalThis.fetch = originalFetch;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    if (originalAudio === undefined) delete globalThis.Audio;
    else globalThis.Audio = originalAudio;
    if (originalUtterance === undefined) delete globalThis.SpeechSynthesisUtterance;
    else globalThis.SpeechSynthesisUtterance = originalUtterance;
  }
});
