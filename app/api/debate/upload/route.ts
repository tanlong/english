import { isSameOrigin } from "../../same-origin.ts";
import { analyzeTranscript, signContext } from "../../../debate/server.ts";
import {
  sourceFileError,
  isSrtFile,
  MAX_SOURCE_BYTES,
  MIN_CONTENT_LENGTH,
  MAX_CONTENT_LENGTH,
  readTextFile,
} from "../../../debate/files.ts";
import { readSrtFile } from "../../../debate/srt.ts";
import { isDebateStance } from "../../../debate/method.ts";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return Response.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const maxBody = MAX_SOURCE_BYTES + 64_000;
  if (Number(request.headers.get("content-length")) > maxBody)
    return Response.json({ error: "Tệp vượt quá 1 MB. Hãy chọn tệp nhỏ hơn." }, { status: 413 });
  let form: FormData;
  let tooLarge = false;
  try {
    if (!request.body || !request.headers.get("content-type")?.startsWith("multipart/form-data;"))
      throw new Error("Expected a text file upload");
    let bytes = 0;
    const limited = request.body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          bytes += chunk.byteLength;
          if (bytes > maxBody) {
            tooLarge = true;
            throw new Error("Upload too large");
          }
          controller.enqueue(chunk);
        },
      }),
    );
    form = await new Response(limited, {
      headers: { "Content-Type": request.headers.get("content-type")! },
    }).formData();
  } catch {
    return Response.json(
      {
        error: tooLarge
          ? "Tệp vượt quá 1 MB. Hãy chọn tệp nhỏ hơn."
          : "Tệp tải lên không hợp lệ. Hãy chọn lại tệp TXT hoặc SRT.",
      },
      { status: tooLarge ? 413 : 400 },
    );
  }
  if (form.get("consent") !== "true")
    return Response.json(
      { error: "Cần đồng ý gửi nội dung đến OpenAI trước khi tạo cuộc hội thoại." },
      { status: 400 },
    );
  const file = form.get("file");
  const stance = form.get("stance") ?? "undecided";
  if (!isDebateStance(stance))
    return Response.json({ error: "Quan điểm tranh luận không hợp lệ." }, { status: 400 });
  if (!(file instanceof File))
    return Response.json({ error: "Hãy chọn tệp TXT hoặc SRT để tải lên." }, { status: 400 });
  const subtitle = isSrtFile(file);
  const fileError = sourceFileError(file);
  if (fileError)
    return Response.json(
      { error: fileError },
      { status: file.size > MAX_SOURCE_BYTES ? 413 : 400 },
    );
  if (!process.env.OPENAI_API_KEY)
    return Response.json({ error: "Phân tích tệp cần khóa OpenAI trên máy chủ." }, { status: 503 });
  try {
    let content;
    try {
      content = subtitle ? await readSrtFile(file) : await readTextFile(file);
    } catch {
      return Response.json(
        {
          error:
            "Chưa đọc được tệp. Hãy lưu dạng UTF-8 hoặc UTF-16; với SRT, kiểm tra mốc thời gian và lời thoại.",
        },
        { status: 422 },
      );
    }
    if (content.length < MIN_CONTENT_LENGTH || content.length > MAX_CONTENT_LENGTH)
      return Response.json(
        {
          error:
            "Nội dung tiếng Anh cần từ 80 đến 60.000 ký tự sau khi đọc tệp. Hãy chọn đoạn văn bản hoặc phụ đề phù hợp hơn.",
        },
        { status: 422 },
      );
    const source = subtitle ? ("srt" as const) : ("txt" as const);
    const analysis = await analyzeTranscript(content, source, stance);
    const context = {
      analysis,
      stance,
      source,
      sourceName: file.name.slice(0, 200),
    };
    return Response.json(
      { ...context, token: signContext(context) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      {
        error:
          "Chưa thể phân tích tệp. Tệp bạn chọn vẫn được giữ để thử lại; hãy kiểm tra nội dung tiếng Anh và thử lại.",
      },
      { status: 502 },
    );
  }
}
