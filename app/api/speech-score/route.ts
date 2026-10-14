import { scoreTranscript } from "./scoring";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const MAX_TARGET_LENGTH = 500;
const AUDIO_TYPES = new Set(["audio/webm", "audio/mp4", "audio/mpeg", "audio/mp3", "audio/ogg", "audio/wav", "audio/x-m4a"]);

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Chưa cấu hình OPENAI_API_KEY." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Bản ghi gửi lên không hợp lệ." }, { status: 400 });
  }

  const audio = form.get("audio");
  const target = form.get("target");
  if (!(audio instanceof File) || typeof target !== "string" || !target.trim() || target.length > MAX_TARGET_LENGTH) {
    return Response.json({ error: "Thiếu bản ghi hoặc câu mẫu không hợp lệ." }, { status: 400 });
  }
  if (!audio.size || audio.size > MAX_AUDIO_BYTES) {
    return Response.json({ error: "Bản ghi phải nhỏ hơn 10 MB." }, { status: 413 });
  }
  const audioType = audio.type.split(";")[0].toLowerCase();
  if (!AUDIO_TYPES.has(audioType)) {
    return Response.json({ error: "Định dạng ghi âm chưa được hỗ trợ." }, { status: 415 });
  }

  const openAIForm = new FormData();
  openAIForm.append("file", audio, audio.name || "recording.webm");
  openAIForm.append("model", "gpt-4o-mini-transcribe");
  openAIForm.append("language", "en");
  openAIForm.append("response_format", "json");

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: openAIForm,
    });
    if (!response.ok) {
      return Response.json({ error: "OpenAI chưa thể nhận diện bản ghi. Vui lòng thử lại." }, { status: 502 });
    }

    const body = await response.json() as { text?: unknown };
    if (typeof body.text !== "string") {
      return Response.json({ error: "Không nhận được nội dung bản ghi." }, { status: 502 });
    }
    const result = scoreTranscript(target.trim(), body.text);
    return Response.json({ transcript: body.text.trim(), ...result }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Không thể kết nối đến OpenAI. Vui lòng thử lại." }, { status: 502 });
  }
}
