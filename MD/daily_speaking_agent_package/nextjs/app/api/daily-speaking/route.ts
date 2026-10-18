import { NextRequest, NextResponse } from "next/server";
import { DAILY_SPEAKING_SYSTEM_PROMPT } from "../../../lib/daily-speaking-agent";

export const runtime = "nodejs";

type Turn = { role: "user" | "assistant"; content: string };

function validHistory(value: unknown): Turn[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-16).flatMap((turn): Turn[] => {
    if (!turn || typeof turn !== "object") return [];
    const t = turn as Record<string, unknown>;
    if ((t.role !== "user" && t.role !== "assistant") || typeof t.content !== "string") return [];
    return [{ role: t.role, content: t.content.slice(0, 1500) }];
  });
}

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Missing server-side OPENAI_API_KEY" }, { status: 503 });
  }
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim().slice(0, 1500) : "";
    if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const history = validHistory(body.history);
    const mode = ["free", "guided", "review"].includes(body.mode) ? body.mode : "free";
    const pace = body.pace === "slow" ? "slow" : "normal";
    const topic = typeof body.topic === "string" ? body.topic.slice(0, 80) : "Daily life";
    const endSession = body.endSession === true;
    const action = body.action === "explain" ? "explain" : "conversation";
    const explanationMode = ["asNeeded", "always", "onRequest"].includes(body.explanationMode)
      ? body.explanationMode : "asNeeded";
    const lastCoach = typeof body.lastCoach === "string" ? body.lastCoach.slice(0, 1500) : "";
    const context = `Current mode: ${mode}. Pace: ${pace}. Learner topic: ${topic}. ` +
      `Vietnamese explanation mode: ${explanationMode}. Approved lessons available: Lesson 01 — My Daily Routine only. ` +
      (action === "explain"
        ? `Explain the most recent coach question or phrase in short, clear Vietnamese. Coach message: ${JSON.stringify(lastCoach)}. Set reply to an empty string and explanationVi to the explanation. Do not ask a new question or assess speaking.`
        : endSession
          ? "End the session now. Give a compact evidence-based English recap with a Vietnamese note on the key corrections and 30-second exercise. No new question."
          : "Continue the live English conversation; keep reply short and ask at most one question. Put Vietnamese guidance in explanationVi per the selected explanation mode.");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions: DAILY_SPEAKING_SYSTEM_PROMPT + "\n\nSession context:\n" + context,
        input: [...history, { role: "user", content: message }],
        text: {
          format: {
            type: "json_schema",
            name: "daily_speaking_bilingual_reply",
            strict: true,
            schema: {
              type: "object",
              properties: {
                reply: { type: "string" },
                explanationVi: { type: "string" },
              },
              required: ["reply", "explanationVi"],
              additionalProperties: false,
            },
          },
        },
        max_output_tokens: endSession ? 650 : 350,
      }),
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data?.error?.message || "AI request failed" }, { status: 502 });
    }
    const resultText = (data.output || [])
      .flatMap((item: { content?: { type?: string; text?: string }[] }) => item.content || [])
      .filter((part: { type?: string }) => part.type === "output_text")
      .map((part: { text?: string }) => part.text || "")
      .join("\n")
      .trim();
    const result = JSON.parse(resultText) as { reply?: unknown; explanationVi?: unknown };
    const reply = typeof result.reply === "string" ? result.reply.trim().slice(0, 2500) : "";
    const explanationVi = typeof result.explanationVi === "string" ? result.explanationVi.trim().slice(0, 1800) : "";
    return NextResponse.json({
      reply: action === "explain" ? "" : reply || "Could you tell me a little more?",
      explanationVi,
    });
  } catch {
    return NextResponse.json({ error: "Unable to process practice request" }, { status: 500 });
  }
}
