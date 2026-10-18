import { curriculum, roles } from "../../content/curriculum.ts";
import { ipaSounds } from "../../content/ipa.ts";
import { getPracticeLesson } from "../../content/practice.ts";
import { getSpeech } from "../../audio/server.ts";
import { isSameOrigin } from "../same-origin.ts";

export const runtime = "nodejs";

const allowedText = new Set<string>([
  ...ipaSounds.flatMap((sound) => [sound.word, sound.pair.word]),
]);
for (const module of curriculum) {
  for (let day = 1; day <= 6; day++) {
    for (const role of roles) {
      const lesson = getPracticeLesson(module.week, day, role.id);
      const lines = lesson.lines.map((line) => line.en);
      allowedText.add(lines.join(" "));
      for (const line of lines) allowedText.add(line);
      allowedText.add(lesson.target);
      allowedText.add(lesson.grammar.en);
      allowedText.add(lines[0]);
      allowedText.add(lesson.transfer);
      allowedText.add(lesson.followup);
      allowedText.add(
        `${lesson.communication.opening} ${lesson.communication.reply} ${lesson.communication.followup}`,
      );
      allowedText.add(lesson.communication.opening);
      allowedText.add(lesson.communication.reply);
      allowedText.add(lesson.communication.short[0]);
      allowedText.add(lesson.communication.followup);
    }
  }
}
allowedText.add("How could you show that you understand the other person?");
allowedText.add("Could you give me one more detail or ask a follow-up question?");

export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return Response.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  if (Number(request.headers.get("content-length")) > 8192)
    return Response.json({ error: "Yêu cầu âm thanh quá lớn." }, { status: 413 });

  let body: { spokenText?: unknown; voice?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yêu cầu âm thanh không hợp lệ." }, { status: 400 });
  }
  if (!body || typeof body !== "object")
    return Response.json({ error: "Yêu cầu âm thanh không hợp lệ." }, { status: 400 });
  const { spokenText, voice = "nova" } = body;
  if (
    typeof spokenText !== "string" ||
    !allowedText.has(spokenText) ||
    (voice !== "nova" && voice !== "alloy")
  )
    return Response.json({ error: "Câu thoại hoặc giọng đọc không hợp lệ." }, { status: 400 });

  try {
    const audio = await getSpeech(spokenText, voice);
    if (!audio)
      return Response.json(
        { error: "Giọng đọc hiện chưa sẵn sàng. Bạn hãy thử lại sau." },
        { status: 503 },
      );
    return new Response(audio, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=3600" },
    });
  } catch {
    return Response.json({ error: "Chưa phát được âm thanh. Bạn hãy thử lại." }, { status: 502 });
  }
}
