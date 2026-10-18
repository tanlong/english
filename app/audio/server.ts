import { createHash } from "node:crypto";
import { getDb } from "../db/client.ts";

// ponytail: coalesce within one server process; use a DB lease for multiple workers.
const pending = new Map<string, Promise<ArrayBuffer | null>>();
const maxAudioBytes = 5 * 1024 * 1024;

export async function getSpeech(
  spokenText: string,
  voice: string,
  model = "gpt-4o-mini-tts",
  instructions = "Speak naturally in American English, with clear pronunciation and conversational intonation. Do not add words.",
) {
  const payload = JSON.stringify({
    model,
    voice,
    input: spokenText,
    instructions,
    response_format: "mp3",
    speed: 1,
  });
  const keyHash = createHash("sha256").update(payload).digest("hex");
  const pendingKey = `${process.env.DATABASE_URL ?? "default"}:${keyHash}`;
  const existing = pending.get(pendingKey);
  if (existing) return existing;

  const task = (async () => {
    const db = getDb();
    const saved = await db.ttsAudio.findUnique({ where: { key: keyHash } });
    if (saved) return new Uint8Array(saved.audio).buffer;
    const key = process.env.OPENAI_API_KEY;
    if (!key) return null;
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: payload,
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error("TTS request failed");
    const audio = await response.arrayBuffer();
    if (!audio.byteLength || audio.byteLength > maxAudioBytes) throw new Error("Invalid TTS audio");
    const stored = await db.ttsAudio.upsert({
      where: { key: keyHash },
      create: { key: keyHash, requestJson: payload, audio: new Uint8Array(audio) },
      update: {},
    });
    return new Uint8Array(stored.audio).buffer;
  })();
  pending.set(pendingKey, task);
  try {
    return await task;
  } finally {
    pending.delete(pendingKey);
  }
}
