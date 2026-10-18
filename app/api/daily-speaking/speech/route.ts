import { getSpeech } from "../../../audio/server.ts";
import { isSameOrigin } from "../../same-origin.ts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return Response.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  let body;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 24_000)
      return Response.json({ error: "Nội dung đọc quá dài." }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Yêu cầu giọng đọc không hợp lệ." }, { status: 400 });
  }
  if (!body || typeof body.input !== "string" || !body.input.trim() || body.input.length > 4000)
    return Response.json({ error: "Nội dung đọc không hợp lệ." }, { status: 400 });
  try {
    const audio = await getSpeech(
      body.input.trim(),
      process.env.OPENAI_TTS_VOICE || "cedar",
      process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
      "You are AI Lead, a warm adult male-sounding American English conversation partner chatting one-on-one. Use relaxed everyday delivery with varied intonation that follows the meaning: stress meaningful words, soften unstressed words, and use natural connected speech. Group words into thought phrases with brief pauses, keeping short acknowledgments light and questions curious. Keep pronunciation easy to understand at a comfortable conversational pace. Avoid a flat word-by-word reading, exaggerated teacher diction, or an announcer performance. Read only the given English text; do not add words, filler sounds, or laughter.",
    );
    if (!audio)
      return Response.json(
        { error: "Giọng AI Lead hiện chưa sẵn sàng. Bạn hãy thử lại sau." },
        { status: 503 },
      );
    return new Response(audio, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Chưa phát được giọng AI Lead. Bạn có thể bấm Nghe lại để thử." },
      { status: 502 },
    );
  }
}
