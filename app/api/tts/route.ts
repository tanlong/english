const MAX_TEXT_LENGTH = 4096;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Chưa cấu hình OPENAI_API_KEY." }, { status: 503 });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const { text, speed = 1 } = (input ?? {}) as { text?: unknown; speed?: unknown };
  if (typeof text !== "string" || !text.trim() || text.length > MAX_TEXT_LENGTH) {
    return Response.json({ error: `Nội dung phải có từ 1 đến ${MAX_TEXT_LENGTH} ký tự.` }, { status: 400 });
  }
  if (typeof speed !== "number" || speed < 0.5 || speed > 1.5) {
    return Response.json({ error: "Tốc độ đọc không hợp lệ." }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "cedar",
        input: text.trim(),
        instructions: "Speak in clear, natural American English for an adult language learner. Use careful pronunciation, friendly intonation, and brief natural pauses.",
        response_format: "mp3",
        speed,
      }),
    });

    if (!response.ok || !response.body) {
      return Response.json({ error: "OpenAI chưa thể tạo giọng đọc. Vui lòng thử lại." }, { status: 502 });
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return Response.json({ error: "Không thể kết nối đến OpenAI. Vui lòng thử lại." }, { status: 502 });
  }
}
