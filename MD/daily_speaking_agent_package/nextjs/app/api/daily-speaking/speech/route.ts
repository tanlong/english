import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Missing server-side OPENAI_API_KEY" }, { status: 503 });
  }
  try {
    const body = await request.json();
    const input = typeof body?.input === "string" ? body.input.trim().slice(0, 800) : "";
    if (!input) return NextResponse.json({ error: "Speech text required" }, { status: 400 });
    const pace = body.pace === "slow" ? "Speak clearly at a slightly slower pace." : "Speak at a natural conversational pace.";
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
        voice: process.env.OPENAI_TTS_VOICE || "onyx",
        input,
        instructions: `Warm and friendly adult American English tutor. ${pace} Speak naturally, without a dramatic radio voice.`,
        response_format: "mp3",
      }),
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ error: "Speech synthesis failed" }, { status: 502 });
    return new NextResponse(await response.arrayBuffer(), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Unable to synthesize speech" }, { status: 500 });
  }
}
