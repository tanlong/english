import { getDb } from "../db/client.ts";
import { learnerId } from "../learning/personalization-server.ts";
import { isSameOrigin } from "../api/same-origin.ts";
import { findNpc, topics, scriptedReply, type CafeReply, type CafeSummary } from "./content.ts";
import { bodyOf, errorResponse, fail, json, tenantId, textField } from "./http.ts";
import { callProvider, markProviderFailure, reserveUsage } from "./providers.ts";
import { sceneConfig } from "./scenes.ts";
import { getGeminiSpeech } from "../audio/server.ts";
import { providerQuota } from "../api/quota.ts";
import { cafeVocabulary } from "./vocabulary.ts";
import { npcSpeechProfiles, npcSpeechStyle } from "./speech-profiles.ts";

async function speechResponse(request: Request, npcId: string, text: string, owner?: string) {
  const npc = findNpc(npcId);
  if (!npc) fail(404, "NOT_FOUND", "Không tìm thấy người bạn này.");
  const quotaError = providerQuota(request, "cafe-npc-speech", 120);
  if (quotaError) return quotaError;
  const audio = await getGeminiSpeech(
    text,
    npcSpeechProfiles[npc.id].voice,
    npcSpeechStyle(npc.id),
    owner,
  );
  if (!audio) fail(503, "VOICE_UNAVAILABLE", "Giọng AI chưa sẵn sàng. Hãy thử lại sau.");
  return new Response(audio, {
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "no-store",
      "X-Request-Id": crypto.randomUUID(),
    },
  });
}

export async function handleCafe(request: Request): Promise<Response> {
  try {
    if ((request.method !== "GET" || request.headers.has("origin")) && !isSameOrigin(request))
      fail(403, "FORBIDDEN", "Yêu cầu không hợp lệ.");
    const path = new URL(request.url).pathname
      .replace(/^\/api\/cafe\/?/, "")
      .split("/")
      .filter(Boolean);
    const [resource, id, action] = path;
    if (request.method === "GET" && resource === "scenes" && path.length === 1)
      return json(sceneConfig);
    if (request.method === "GET" && resource === "npcs" && id && path.length === 2) {
      const npc = findNpc(id);
      return npc ? json(npc) : fail(404, "NOT_FOUND", "Không tìm thấy người bạn này.");
    }
    const user = learnerId(request);
    const db = getDb();
    if (!user || !(await db.learner.findUnique({ where: { id: user }, select: { id: true } })))
      fail(401, "UNAUTHENTICATED", "Hãy tải lại trang để kết nối hồ sơ trên thiết bị.");
    const scope = { learnerId: user, tenantId: tenantId() };
    if (
      request.method === "POST" &&
      resource === "npcs" &&
      action === "speech" &&
      path.length === 3
    ) {
      const npc = findNpc(id);
      if (!npc) fail(404, "NOT_FOUND", "Không tìm thấy người bạn này.");
      const body = await bodyOf(request);
      if (!textField(body.text, 1500))
        fail(400, "INVALID_INPUT", "Câu cần đọc phải từ 1 đến 1.500 ký tự.");
      const text = (body.text as string).trim();
      const allowed = new Set([
        npc.greeting,
        ...npc.topics.flatMap((topic) => [
          topics[topic].greeting,
          ...(cafeVocabulary[topic] ?? []).flatMap((word) => [
            word.english,
            word.example,
            `${word.english}. ${word.example}`,
          ]),
        ]),
        ...(npc.id === "sun_king" ? ["Ki, ki, ki!"] : []),
      ]);
      if (!allowed.has(text)) fail(400, "INVALID_INPUT", "Chỉ đọc câu mẫu của nhân vật này.");
      return await speechResponse(request, npc.id, text);
    }
    if (resource !== "conversations" || path.length > 3)
      fail(404, "NOT_FOUND", "Không tìm thấy thao tác.");
    if (request.method === "GET" && !id) {
      return json(
        (
          await db.cafeConversation.findMany({
            where: scope,
            select: {
              id: true,
              npcId: true,
              topicId: true,
              level: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 30,
          })
        ).map((session) => ({ ...session, npcId: findNpc(session.npcId)?.id ?? session.npcId })),
      );
    }
    if (request.method === "POST" && !id) {
      const body = await bodyOf(request);
      const npc = findNpc(body.npcId);
      if (
        !npc ||
        typeof body.topicId !== "string" ||
        !(npc.topics as readonly string[]).includes(body.topicId) ||
        typeof body.level !== "string" ||
        !["A1", "A2", "B1"].includes(body.level) ||
        (body.useAi !== undefined && typeof body.useAi !== "boolean")
      )
        fail(400, "INVALID_INPUT", "Chọn nhân vật, chủ đề và trình độ hợp lệ.");
      if ((await db.cafeConversation.count({ where: scope })) >= 200)
        fail(429, "STORAGE_LIMIT", "Hãy xóa các cuộc trò chuyện cũ trước khi tạo thêm.");
      const useAi =
        body.useAi === true &&
        process.env.CAFE_ALLOW_LEARNER_AI === "true" &&
        !!(await db.cafeConnection.findFirst({
          where: { tenantId: scope.tenantId, status: "healthy", enabled: true },
          select: { id: true },
        }));
      try {
        const session = await db.cafeConversation.create({
          data: {
            ...scope,
            activeKey: `${scope.tenantId}:${user}`,
            npcId: npc.id,
            topicId: body.topicId as string,
            level: body.level as string,
            useAi,
          },
        });
        return json({ ...sessionView(session), turns: [] }, 201);
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
          const active = await db.cafeConversation.findFirst({
            where: { ...scope, status: "active" },
            select: { id: true },
          });
          return json(
            {
              code: "ACTIVE_SESSION",
              error: "Bạn đang có một cuộc trò chuyện. Hãy tiếp tục hoặc kết thúc trước.",
              sessionId: active?.id,
            },
            409,
          );
        }
        throw error;
      }
    }
    if (!id) fail(404, "NOT_FOUND", "Không tìm thấy cuộc trò chuyện.");
    const session = await db.cafeConversation.findFirst({
      where: { id, ...scope },
      include: { turns: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
    });
    if (!session) fail(404, "NOT_FOUND", "Không tìm thấy cuộc trò chuyện.");
    if (request.method === "GET" && !action)
      return json({
        ...sessionView(session),
        turns: session.turns.map((t) => ({
          id: t.id,
          clientMessageId: t.clientMessageId,
          userText: t.userText,
          reply: t.replyJson ? JSON.parse(t.replyJson) : null,
        })),
      });
    if (request.method === "DELETE" && !action) {
      const removed = await db.cafeConversation.deleteMany({
        where: { id, ...scope, busyUntil: { lte: new Date() } },
      });
      if (!removed.count) fail(409, "TURN_PENDING", "Chờ lượt trả lời hiện tại hoàn tất.");
      return json({ deleted: true });
    }
    if (request.method !== "POST") fail(404, "NOT_FOUND", "Không tìm thấy thao tác.");
    const body = await bodyOf(request);
    if (action === "speech") {
      if (!textField(body.text, 1500))
        fail(400, "INVALID_INPUT", "Câu cần đọc phải từ 1 đến 1.500 ký tự.");
      const text = (body.text as string).trim();
      const summary = session.summaryJson ? (JSON.parse(session.summaryJson) as CafeSummary) : null;
      const allowed = new Set([
        topics[session.topicId].greeting,
        findNpc(session.npcId)?.greeting ?? "",
        ...session.turns.flatMap((turn) =>
          turn.replyJson ? [(JSON.parse(turn.replyJson) as CafeReply).replyEn] : [],
        ),
        ...(summary?.phrases.map((phrase) => phrase.english) ?? []),
      ]);
      if (!allowed.has(text))
        fail(400, "INVALID_INPUT", "Chỉ đọc câu của nhân vật đã lưu trong buổi này.");
      return await speechResponse(request, session.npcId, text, user);
    }
    if (action === "hint")
      return json({
        hints: topics[session.topicId].hints,
        explanationVi: topics[session.topicId].explanationVi,
        sourceMode: "scripted",
      });
    if (action === "explain") {
      const turn = session.turns.find((t) => t.id === body.turnId);
      if (!turn?.replyJson) fail(404, "NOT_FOUND", "Không tìm thấy lượt trả lời.");
      return json({ explanationVi: (JSON.parse(turn.replyJson) as CafeReply).explanationVi });
    }
    if (action === "end") {
      if (!textField(body.requestId, 100)) fail(400, "INVALID_INPUT", "Thiếu mã yêu cầu.");
      if (session.summaryJson) return json(JSON.parse(session.summaryJson));
      return await db.$transaction(async (tx) => {
        const current = await tx.cafeConversation.findFirst({ where: { id, ...scope } });
        if (current?.summaryJson) return json(JSON.parse(current.summaryJson));
        const updated = await tx.cafeConversation.updateMany({
          where: { id, ...scope, status: "active", busyUntil: { lte: new Date() } },
          data: { status: "ended", activeKey: null, endedAt: new Date() },
        });
        if (!updated.count) fail(409, "TURN_PENDING", "Chờ lượt hiện tại hoàn tất rồi thử lại.");
        const turns = await tx.cafeTurn.findMany({
          where: { conversationId: id },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        });
        const phrases = new Map<string, string>();
        for (const turn of turns) {
          if (!turn.replyJson) continue;
          const reply = JSON.parse(turn.replyJson) as CafeReply;
          phrases.set(reply.hints.natural, reply.explanationVi);
        }
        const summary: CafeSummary = {
          learnerSentences: turns.map((t) => t.userText),
          turns: turns.length,
          noteVi:
            turns.length < 2
              ? "Chưa đủ dữ liệu để đánh giá. Đây là những câu bạn đã thực sự viết."
              : "Đây là những câu bạn đã luyện. Chưa có đánh giá phát âm; câu gợi ý là cách diễn đạt tham khảo, không phải lỗi của bạn.",
          phrases: [...phrases].map(([english, vietnamese], i) => ({
            id: `phrase-${i}`,
            english,
            vietnamese,
          })),
        };
        await tx.cafeConversation.update({
          where: { id },
          data: { summaryJson: JSON.stringify(summary) },
        });
        return json(summary);
      });
    }
    if (action !== "messages") fail(404, "NOT_FOUND", "Không tìm thấy thao tác.");
    if (!textField(body.clientMessageId, 100) || !textField(body.text, 800))
      fail(400, "INVALID_INPUT", "Nhập câu từ 1 đến 800 ký tự và mã lượt gửi.");
    const messageId = body.clientMessageId as string;
    const text = (body.text as string).trim();
    const reserved = await db.$transaction(async (tx) => {
      const previous = await tx.cafeTurn.findUnique({
        where: {
          conversationId_clientMessageId: { conversationId: id, clientMessageId: messageId },
        },
      });
      if (previous) {
        if (previous.userText !== text)
          fail(409, "IDEMPOTENCY_CONFLICT", "Mã lượt gửi đã dùng cho nội dung khác.");
        if (previous.replyJson)
          return {
            existing: { turnId: previous.id, reply: JSON.parse(previous.replyJson) as CafeReply },
          };
      }
      const current = await tx.cafeConversation.findUniqueOrThrow({ where: { id } });
      if (current.status !== "active") fail(409, "SESSION_ENDED", "Cuộc trò chuyện đã kết thúc.");
      if (current.busyUntil.getTime() > Date.now())
        fail(409, "TURN_PENDING", "Lượt trước đang được xử lý. Thử gửi lại sau vài giây.");
      const count = await tx.cafeTurn.count({ where: { conversationId: id } });
      if (count >= 60 && !previous)
        fail(429, "SESSION_LIMIT", "Hãy kết thúc và bắt đầu buổi mới sau 60 lượt.");
      const reply = scriptedReply(
        session.topicId,
        session.level,
        count,
        text,
        findNpc(session.npcId)?.role,
      );
      if (previous) {
        // A crashed request is recovered without re-calling or re-charging the provider.
        reply.fallbackReason = "Lượt trước bị gián đoạn; tiếp tục bằng bài mẫu.";
        await tx.cafeTurn.update({
          where: { id: previous.id },
          data: { replyJson: JSON.stringify(reply) },
        });
        return { existing: { turnId: previous.id, reply } };
      }
      const busyUntil = new Date(Date.now() + 40_000);
      await tx.cafeConversation.update({ where: { id }, data: { busyUntil } });
      const turn = await tx.cafeTurn.create({
        data: { conversationId: id, clientMessageId: messageId, userText: text },
      });
      return { turn, reply, busyUntil };
    });
    if (reserved.existing) return json(reserved.existing);
    let reply = reserved.reply!;
    if (session.useAi && process.env.CAFE_ALLOW_LEARNER_AI === "true") {
      const connection = await db.cafeConnection.findFirst({
        where: {
          tenantId: scope.tenantId,
          enabled: true,
          status: "healthy",
          OR: [{ retryAt: null }, { retryAt: { lte: new Date() } }],
        },
      });
      if (connection) {
        try {
          await db.$transaction((tx) => reserveUsage(tx, connection, user));
          const generated = await callProvider(connection, {
            persona: findNpc(session.npcId),
            topic: session.topicId,
            level: session.level,
            recentTurns: session.turns.slice(-8).map((t) => ({
              learner: t.userText,
              partner: t.replyJson ? (JSON.parse(t.replyJson) as CafeReply).replyEn : "",
            })),
            message: text,
          });
          if (generated.correction && generated.correction.userSaid !== text)
            throw new Error("Ungrounded correction");
          const stillActive = await db.cafeConnection.findFirst({
            where: { id: connection.id, revision: connection.revision, enabled: true },
          });
          if (stillActive) reply = generated;
          else reply.fallbackReason = "Kết nối đã thay đổi; tiếp tục bằng bài mẫu.";
        } catch (error) {
          // Quota rejection does not mark a working connection unhealthy.
          if (!(error instanceof Error && "code" in error && error.code === "QUOTA_EXCEEDED"))
            await markProviderFailure(connection, error);
          reply.fallbackReason =
            "AI chưa sẵn sàng hoặc đã chạm giới hạn; đang dùng bài luyện theo kịch bản.";
          await db.cafeAudit.create({
            data: {
              tenantId: scope.tenantId,
              provider: connection.provider,
              actor: "learner",
              action: "fallback",
            },
          });
        }
      } else reply.fallbackReason = "AI chưa sẵn sàng; đang dùng bài luyện theo kịch bản.";
    }
    await db.$transaction(async (tx) => {
      await tx.cafeTurn.update({
        where: { id: reserved.turn!.id },
        data: { replyJson: JSON.stringify(reply) },
      });
      await tx.cafeConversation.updateMany({
        where: { id, busyUntil: reserved.busyUntil },
        data: { busyUntil: new Date(0) },
      });
    });
    return json({ turnId: reserved.turn!.id, reply });
  } catch (error) {
    return errorResponse(error);
  }
}

function sessionView(session: {
  id: string;
  npcId: string;
  topicId: string;
  level: string;
  useAi: boolean;
  status: string;
  summaryJson: string | null;
}) {
  return {
    id: session.id,
    npcId: findNpc(session.npcId)?.id ?? session.npcId,
    role: findNpc(session.npcId)?.role ?? "conversation",
    topicId: session.topicId,
    level: session.level,
    status: session.status,
    mode: session.useAi ? "ai" : "scripted",
    greeting: findNpc(session.npcId)?.greeting ?? topics[session.topicId].greeting,
    summary: session.summaryJson ? JSON.parse(session.summaryJson) : null,
  };
}
