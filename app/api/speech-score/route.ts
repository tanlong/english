import { scoreTranscript } from "./scoring.ts";
import { isSameOrigin } from "../same-origin.ts";
import { getTranscription } from "../../audio/transcription.ts";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const MAX_TARGET_LENGTH = 500;
const AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/wav",
  "audio/x-m4a",
]);

export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return Response.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const length = Number(request.headers.get("content-length"));
  if (length > MAX_AUDIO_BYTES + 65536)
    return Response.json({ error: "Bản ghi quá lớn." }, { status: 413 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Bản ghi gửi lên không hợp lệ." }, { status: 400 });
  }

  if (form.get("consent") !== "true")
    return Response.json({ error: "Cần đồng ý gửi bản ghi trước khi nhận diện." }, { status: 400 });
  const audio = form.get("audio");
  const target = form.get("target");
  if (
    !(audio instanceof File) ||
    typeof target !== "string" ||
    !target.trim() ||
    target.length > MAX_TARGET_LENGTH
  ) {
    return Response.json({ error: "Thiếu bản ghi hoặc câu mẫu không hợp lệ." }, { status: 400 });
  }
  if (!audio.size || audio.size > MAX_AUDIO_BYTES) {
    return Response.json({ error: "Bản ghi phải nhỏ hơn 10 MB." }, { status: 413 });
  }
  const audioType = audio.type.split(";")[0].toLowerCase();
  if (!AUDIO_TYPES.has(audioType)) {
    return Response.json({ error: "Định dạng ghi âm chưa được hỗ trợ." }, { status: 415 });
  }

  try {
    const body = await getTranscription(audio);
    if ("error" in body) return Response.json({ error: body.error }, { status: body.status });
    const result = scoreTranscript(target.trim(), body.text);
    return Response.json(
      { transcript: body.text.trim(), ...result },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return Response.json({ error: "Chưa thể kiểm tra bản ghi. Bạn hãy thử lại." }, { status: 502 });
  }
}
