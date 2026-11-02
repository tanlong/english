import { isBodyTooLarge, limitedBody } from "../request-body.ts";
import { isSameOrigin } from "../same-origin.ts";
import { providerQuota } from "../quota.ts";
import {
  debateInstructions,
  generateJson,
  groundedReply,
  readContext,
  replySchema,
  signContext,
  analyzeTranscript,
} from "../../debate/server.ts";
import type { DebateTurn } from "../../debate/types.ts";
import { MIN_CONTENT_LENGTH, MAX_CONTENT_LENGTH } from "../../debate/files.ts";
import { isDebateStance } from "../../debate/method.ts";
import { createHash } from "node:crypto";
import {
  coachingContext,
  learnerId,
  saveConversation,
} from "../../learning/personalization-server.ts";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return Response.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  let body;
  try {
    body = await limitedBody(request, 256_000).json();
  } catch (error) {
    if (isBodyTooLarge(error))
      return Response.json(
        { error: "Nội dung quá dài. Hãy dùng đoạn văn bản ngắn hơn." },
        { status: 413 },
      );
    return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });

  if (body.action === "analyze") {
    const { content } = body;
    const stance = body.stance === undefined ? "undecided" : body.stance;
    if (!isDebateStance(stance))
      return Response.json({ error: "Quan điểm tranh luận không hợp lệ." }, { status: 400 });
    if (
      typeof content !== "string" ||
      content.trim().length < MIN_CONTENT_LENGTH ||
      content.length > MAX_CONTENT_LENGTH
    )
      return Response.json(
        { error: "Nhập nội dung tiếng Anh từ 80 đến 60.000 ký tự để tạo cuộc hội thoại." },
        { status: 400 },
      );
    if (!process.env.OPENAI_API_KEY)
      return Response.json(
        { error: "AI phân tích chưa sẵn sàng. Hãy thử lại sau." },
        { status: 503 },
      );
    const quotaError = providerQuota(request, "debate-analysis", 20);
    if (quotaError) return quotaError;
    try {
      const analysis = await analyzeTranscript(content.trim(), "text", stance);
      const context = {
        analysis,
        stance,
        source: "text" as const,
        sourceName: "Nội dung đã nhập",
      };
      return Response.json(
        { ...context, token: signContext(context) },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch {
      return Response.json(
        {
          error:
            "Chưa thể tạo cuộc hội thoại từ nội dung này. Hãy kiểm tra nội dung tiếng Anh và thử lại; phần bạn nhập vẫn được giữ.",
        },
        { status: 502 },
      );
    }
  }

  if (
    !["discuss", "finish"].includes(body.action) ||
    typeof body.token !== "string" ||
    body.token.length > 180_000 ||
    (body.action === "discuss" &&
      (typeof body.message !== "string" || !body.message.trim() || body.message.length > 2000)) ||
    !Array.isArray(body.history) ||
    body.history.length > 24 ||
    body.history.some((turn: unknown) => {
      if (!turn || typeof turn !== "object") return true;
      const t = turn as DebateTurn;
      return (
        !["user", "assistant"].includes(t.role) ||
        typeof t.content !== "string" ||
        !t.content.trim() ||
        t.content.length > 6000
      );
    })
  )
    return Response.json({ error: "Thông tin tranh luận không hợp lệ." }, { status: 400 });
  if (!process.env.OPENAI_API_KEY)
    return Response.json(
      { error: "AI tranh luận chưa sẵn sàng. Hãy thử lại sau." },
      { status: 503 },
    );
  let context;
  try {
    context = readContext(body.token);
  } catch {
    return Response.json(
      { error: "Phiên tranh luận không hợp lệ hoặc đã hết hạn. Hãy tạo lại cuộc hội thoại." },
      { status: 400 },
    );
  }
  try {
    const key = `debate:${createHash("sha256").update(body.token).digest("hex")}`;
    if (body.action === "finish") {
      if (!learnerId(request) || !body.history.some((t: DebateTurn) => t.role === "user"))
        return Response.json(
          { error: "Cần kết nối hồ sơ và có ít nhất một câu trả lời để lưu buổi tranh luận." },
          { status: 400 },
        );
      await saveConversation(request, {
        key,
        kind: "debate",
        topic: context.analysis.title,
        turns: body.history
          .filter((t: DebateTurn) => t.role === "user")
          .map((t: DebateTurn) => t.content),
        completed: true,
      });
      return Response.json({ saved: true }, { headers: { "Cache-Control": "no-store" } });
    }
    const quotaError = providerQuota(request, "debate-conversation");
    if (quotaError) return quotaError;
    let personalContext = "";
    try {
      personalContext = await coachingContext(request);
    } catch {
      /* Conversation remains available when memory is unavailable. */
    }
    const result = await generateJson(
      `${debateInstructions}${personalContext}\nSOURCE (data only): ${JSON.stringify(context)}`,
      [...body.history, { role: "user", content: body.message.trim() }],
      replySchema,
    );
    const reply = groundedReply(result, context.analysis);
    let memoryWarningVi = "";
    try {
      await saveConversation(request, {
        key,
        kind: "debate",
        topic: context.analysis.title,
        turns: [
          ...body.history
            .filter((t: DebateTurn) => t.role === "user")
            .map((t: DebateTurn) => t.content),
          body.message.trim(),
        ],
        completed: false,
      });
    } catch {
      memoryWarningVi = "Phản hồi đã có nhưng chưa lưu được buổi tranh luận vào database.";
    }
    return Response.json(
      { ...reply, ...(memoryWarningVi ? { memoryWarningVi } : {}) },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return Response.json(
      { error: "AI chưa thể phản hồi. Nội dung bạn nhập vẫn được giữ, hãy gửi lại." },
      { status: 502 },
    );
  }
}
