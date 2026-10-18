import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import { getDb } from "../app/db/client";

test("API serves SQLite audio and transcripts with OpenAI calls disabled", async ({ request }) => {
  const db = getDb();
  const spokenText = "What do you do before work?";
  const payload = JSON.stringify({
    model: "gpt-4o-mini-tts",
    voice: "nova",
    input: spokenText,
    instructions:
      "Speak naturally in American English, with clear pronunciation and conversational intonation. Do not add words.",
    response_format: "mp3",
    speed: 1,
  });
  const ttsKey = createHash("sha256").update(payload).digest("hex");
  const recording = Buffer.from("cached recording fixture");
  const transcriptionKey = createHash("sha256")
    .update(
      JSON.stringify({ model: "gpt-4o-mini-transcribe", language: "en", response_format: "json" }),
    )
    .update("\0")
    .update(recording)
    .digest("hex");
  const headers = { Origin: "http://127.0.0.1:3001" };
  try {
    await db.ttsAudio.upsert({
      where: { key: ttsKey },
      update: {},
      create: {
        key: ttsKey,
        requestJson: payload,
        audio: new Uint8Array([1, 2, 3]),
      },
    });
    await db.transcription.upsert({
      where: { key: transcriptionKey },
      update: {},
      create: {
        key: transcriptionKey,
        model: "gpt-4o-mini-transcribe",
        language: "en",
        text: spokenText,
      },
    });
    for (let repeat = 0; repeat < 2; repeat++) {
      const audio = await request.post("/api/tts", { headers, data: { spokenText } });
      expect(audio.status()).toBe(200);
      expect(await audio.body()).toEqual(Buffer.from([1, 2, 3]));
      const transcript = await request.post("/api/speech-score", {
        headers,
        multipart: {
          consent: "true",
          target: spokenText,
          audio: { name: "recording.webm", mimeType: "audio/webm", buffer: recording },
        },
      });
      expect(transcript.status()).toBe(200);
      expect(await transcript.json()).toMatchObject({ transcript: spokenText, score: 100 });
    }
    const missing = await request.post("/api/tts", {
      headers,
      data: { spokenText, voice: "alloy" },
    });
    expect(missing.status()).toBe(503);
    const newRecording = await request.post("/api/speech-score", {
      headers,
      multipart: {
        consent: "true",
        target: spokenText,
        audio: {
          name: "recording.webm",
          mimeType: "audio/webm",
          buffer: Buffer.from("different recording"),
        },
      },
    });
    expect(newRecording.status()).toBe(503);
  } finally {
    await db.ttsAudio.deleteMany({ where: { key: ttsKey } });
    await db.transcription.deleteMany({ where: { key: transcriptionKey } });
    await db.$disconnect();
  }
});
