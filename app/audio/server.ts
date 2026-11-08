import { createHash } from "node:crypto";
import { getDb } from "../db/client.ts";
import { limitedBody } from "../api/request-body.ts";

// ponytail: coalesce within one server process; use a DB lease for multiple workers.
const pending = new Map<string, Promise<ArrayBuffer | null>>();
const maxAudioBytes = 5 * 1024 * 1024;

export async function getSpeech(
  spokenText: string,
  voice: string,
  model = "gpt-4o-mini-tts",
  instructions = "Speak naturally in American English, with clear pronunciation and conversational intonation. Do not add words.",
  cacheOwner?: string | null,
) {
  const payload = JSON.stringify({
    model,
    voice,
    input: spokenText,
    instructions,
    response_format: "mp3",
    speed: 1,
  });
  return cachedSpeech(payload, cacheOwner, async () => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return null;
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: payload,
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error("TTS request failed");
    return response.arrayBuffer();
  });
}

export async function getGeminiSpeech(
  text: string,
  voice: string,
  style: string,
  cacheOwner?: string,
) {
  const payload = JSON.stringify({
    model: process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-lite-tts",
    store: false,
    input: [
      {
        type: "user_input",
        content: [
          {
            type: "text",
            text,
            annotations: [{ type: "speech_metadata", style }],
          },
        ],
      },
    ],
    response_format: { type: "audio", mime_type: "audio/wav" },
    generation_config: { speech_config: [{ voice }] },
  });
  return cachedSpeech(payload, cacheOwner, async () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: payload,
      redirect: "error",
      signal: AbortSignal.timeout(45_000),
    });
    if (!response.ok) throw new Error("Gemini speech request failed");
    const body = await limitedBody(response, 7 * 1024 * 1024).json();
    if (body?.status !== "completed" || !Array.isArray(body.steps))
      throw new Error("Invalid Gemini speech response");
    const parts = body.steps
      .filter((step: { type?: string }) => step?.type === "model_output")
      .flatMap((step: { content?: unknown[] }) => (Array.isArray(step.content) ? step.content : []))
      .filter((part: { type?: string }) => part?.type === "audio");
    const part = parts.at(-1);
    if (
      part?.mime_type !== "audio/wav" ||
      typeof part.data !== "string" ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(part.data) ||
      part.data.length % 4 !== 0
    )
      throw new Error("Invalid Gemini speech audio");
    const audio = Buffer.from(part.data, "base64");
    if (
      audio.length < 44 ||
      audio.toString("ascii", 0, 4) !== "RIFF" ||
      audio.toString("ascii", 8, 12) !== "WAVE"
    )
      throw new Error("Invalid Gemini WAV audio");
    return new Uint8Array(audio).buffer;
  });
}

async function cachedSpeech(
  payload: string,
  cacheOwner: string | null | undefined,
  generate: () => Promise<ArrayBuffer | null>,
) {
  const hash = createHash("sha256").update(payload).digest("hex");
  // Undefined is reserved for allowlisted authored content; null disables personal persistence.
  const keyHash = cacheOwner ? `private:${cacheOwner}:${hash}` : hash;
  const pendingKey = `${process.env.DATABASE_URL ?? "default"}:${cacheOwner === null ? "ephemeral:" : ""}${keyHash}`;
  const existing = pending.get(pendingKey);
  if (existing) return existing;

  const task = (async () => {
    const db = getDb();
    const canCache =
      cacheOwner === undefined ||
      (cacheOwner !== null &&
        Boolean(await db.learner.findUnique({ where: { id: cacheOwner }, select: { id: true } })));
    const saved = canCache ? await db.ttsAudio.findUnique({ where: { key: keyHash } }) : null;
    if (saved) return new Uint8Array(saved.audio).buffer;
    const audio = await generate();
    if (!audio) return null;
    if (!audio.byteLength || audio.byteLength > maxAudioBytes) throw new Error("Invalid TTS audio");
    if (!canCache) return audio;
    const stored = await db.$transaction(async (tx) => {
      // A deletion while the provider was running must not recreate private cache entries.
      if (
        cacheOwner &&
        !(await tx.learner.findUnique({ where: { id: cacheOwner }, select: { id: true } }))
      )
        return null;
      return tx.ttsAudio.upsert({
        where: { key: keyHash },
        create: { key: keyHash, requestJson: payload, audio: new Uint8Array(audio) },
        update: {},
      });
    });
    return stored ? new Uint8Array(stored.audio).buffer : audio;
  })();
  pending.set(pendingKey, task);
  try {
    return await task;
  } finally {
    pending.delete(pendingKey);
  }
}
