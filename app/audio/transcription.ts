import { createHash } from "node:crypto";
import { getDb } from "../db/client.ts";

type TranscriptionResult = { text: string } | { error: string; status: number };
// ponytail: coalesce within one server process; use a DB lease for multiple workers.
const pending = new Map<string, Promise<TranscriptionResult>>();
const options = { model: "gpt-4o-mini-transcribe", language: "en", response_format: "json" };

// Callers handle consent and persistence; uploaded clips use this without the recording cache.
export async function transcribeFile(
  audio: File,
  timeoutMs = 40_000,
): Promise<TranscriptionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey)
    return {
      error: "Nhận diện lời nói hiện chưa sẵn sàng. Bạn vẫn có thể nghe lại bản ghi.",
      status: 503,
    };
  const form = new FormData();
  form.append("file", audio, audio.name || "recording.webm");
  for (const [name, value] of Object.entries(options)) form.append(name, value);
  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) return { error: "Chưa nhận diện được lời nói. Bạn hãy thử lại.", status: 502 };
  const body = (await response.json()) as { text?: unknown } | null;
  if (!body || typeof body.text !== "string")
    return { error: "Không nhận được nội dung bản ghi.", status: 502 };
  return { text: body.text.trim() };
}

export async function getTranscription(
  audio: File,
  cacheOwner: string | null = null,
): Promise<TranscriptionResult> {
  const hash = createHash("sha256")
    .update(JSON.stringify(options))
    .update("\0")
    .update(new Uint8Array(await audio.arrayBuffer()))
    .digest("hex");
  const keyHash = cacheOwner ? `private:${cacheOwner}:${hash}` : hash;
  const pendingKey = `${process.env.DATABASE_URL ?? "default"}:${keyHash}`;
  const existing = pending.get(pendingKey);
  if (existing) return existing;

  const task = (async (): Promise<TranscriptionResult> => {
    const db = getDb();
    const canCache =
      cacheOwner !== null &&
      Boolean(await db.learner.findUnique({ where: { id: cacheOwner }, select: { id: true } }));
    const saved = canCache ? await db.transcription.findUnique({ where: { key: keyHash } }) : null;
    if (saved) return { text: saved.text };
    if (process.env.ENABLE_CLOUD_SPEECH !== "true")
      return {
        error:
          "Nhận diện trực tuyến chưa được bật. Bạn vẫn có thể nghe lại và tự đánh giá bản ghi.",
        status: 503,
      };
    const body = await transcribeFile(audio);
    if ("error" in body) return body;

    if (!canCache) return body;
    const stored = await db.$transaction(async (tx) => {
      if (!(await tx.learner.findUnique({ where: { id: cacheOwner! }, select: { id: true } })))
        return null;
      return tx.transcription.upsert({
        where: { key: keyHash },
        create: {
          key: keyHash,
          model: options.model,
          language: options.language,
          text: body.text.trim(),
        },
        update: {},
      });
    });
    return stored ? { text: stored.text } : body;
  })();
  pending.set(pendingKey, task);
  try {
    return await task;
  } finally {
    pending.delete(pendingKey);
  }
}
