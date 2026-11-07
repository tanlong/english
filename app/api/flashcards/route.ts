import { getDb } from "../../db/client.ts";
import { learnerId } from "../../learning/personalization-server.ts";
import { isSameOrigin } from "../same-origin.ts";
import { bodyOf, errorResponse, fail, json, tenantId, textField } from "../../cafe/http.ts";
import type { CafeSummary } from "../../cafe/content.ts";
export const runtime = "nodejs";
async function handle(request: Request) {
  try {
    if ((request.method !== "GET" || request.headers.has("origin")) && !isSameOrigin(request))
      fail(403, "FORBIDDEN", "Yêu cầu không hợp lệ.");
    const user = learnerId(request);
    if (!user) fail(401, "UNAUTHENTICATED", "Hãy kết nối hồ sơ trên thiết bị trước.");
    const db = getDb();
    if (request.method === "GET")
      return json(
        await db.cafeFlashcard.findMany({
          where: { learnerId: user, conversation: { tenantId: tenantId() } },
          select: { id: true, english: true, vietnamese: true, conversationId: true },
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
      );
    const body = await bodyOf(request);
    if (request.method === "DELETE") {
      if (!textField(body.id, 100)) fail(400, "INVALID_INPUT", "Thiếu mã thẻ.");
      await db.cafeFlashcard.deleteMany({
        where: { id: body.id as string, learnerId: user, conversation: { tenantId: tenantId() } },
      });
      return json({ deleted: true });
    }
    if (!textField(body.sessionId, 100) || !textField(body.phraseId, 100))
      fail(400, "INVALID_INPUT", "Thiếu cuộc trò chuyện hoặc câu đã luyện.");
    const session = await db.cafeConversation.findFirst({
      where: {
        id: body.sessionId as string,
        learnerId: user,
        tenantId: tenantId(),
        status: "ended",
      },
    });
    if (!session?.summaryJson)
      fail(404, "NOT_FOUND", "Hãy kết thúc cuộc trò chuyện của bạn trước khi lưu thẻ.");
    const phrase = (JSON.parse(session.summaryJson) as CafeSummary).phrases.find(
      (p) => p.id === body.phraseId,
    );
    if (!phrase) fail(400, "INVALID_INPUT", "Câu này không có trong tổng kết.");
    const key = {
      learnerId: user,
      normalizedPhrase: phrase.english.toLowerCase().replace(/\s+/g, " ").trim(),
      conversationId: session.id,
    };
    const card = await db.cafeFlashcard.upsert({
      where: { learnerId_normalizedPhrase_conversationId: key },
      create: { ...key, english: phrase.english, vietnamese: phrase.vietnamese },
      update: {},
      select: { id: true, english: true, vietnamese: true },
    });
    return json(card);
  } catch (error) {
    return errorResponse(error);
  }
}
export const GET = handle;
export const POST = handle;
export const DELETE = handle;
