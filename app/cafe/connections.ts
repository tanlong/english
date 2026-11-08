import { getDb } from "../db/client.ts";
import { isSameOrigin } from "../api/same-origin.ts";
import {
  adminOf,
  modelCatalog,
  encryptSecret,
  publicConnection,
  reserveUsage,
  callProvider,
  markProviderFailure,
} from "./providers.ts";
import { bodyOf, errorResponse, fail, json, tenantId, textField } from "./http.ts";

export async function handleAdvanced(request: Request): Promise<Response> {
  try {
    if ((request.method !== "GET" || request.headers.has("origin")) && !isSameOrigin(request))
      fail(403, "FORBIDDEN", "Yêu cầu không hợp lệ.");
    const [resource, provider, action, extra] = new URL(request.url).pathname
      .replace(/^\/api\/advanced\/?/, "")
      .split("/")
      .filter(Boolean);
    const db = getDb();
    if (request.method === "GET" && resource === "capabilities") {
      const ready =
        process.env.CAFE_ALLOW_LEARNER_AI === "true" &&
        !!(await db.cafeConnection.findFirst({
          where: { tenantId: tenantId(), enabled: true, status: "healthy" },
          select: { id: true },
        }));
      return json({
        textAi: ready,
        mode: ready ? "advanced_ready" : "free",
        browserTts: true,
        browserStt: "P1",
        data: "device_profile",
        monitoring: "disabled",
      });
    }
    const principal = adminOf(request);
    const scope = { tenantId: principal.tenantId };
    const actor = principal.role;
    if (extra) fail(404, "NOT_FOUND", "Không tìm thấy thao tác.");
    if (request.method === "GET" && resource === "usage")
      return json({
        usage: await db.cafeUsage.findMany({
          where: { ...scope, day: new Date().toISOString().slice(0, 10) },
        }),
        audit: await db.cafeAudit.findMany({
          where: scope,
          orderBy: { createdAt: "desc" },
          take: 30,
        }),
      });
    if (resource !== "connections") fail(404, "NOT_FOUND", "Không tìm thấy kết nối.");
    if (request.method === "GET" && !provider)
      return json({
        role: actor,
        models: modelCatalog(),
        entitled: process.env.CAFE_ALLOW_LEARNER_AI === "true",
        connections: (await db.cafeConnection.findMany({ where: scope })).map(publicConnection),
      });
    if (!["gemini", "groq"].includes(provider))
      fail(400, "INVALID_INPUT", "Nhà cung cấp chưa được hỗ trợ.");
    const id = `${scope.tenantId}:${provider}`;
    if (request.method === "PUT" && !action) {
      const body = await bodyOf(request);
      const allowed = modelCatalog()[provider as "gemini" | "groq"];
      const integer = (v: unknown, min: number, max: number) =>
        Number.isSafeInteger(v) && (v as number) >= min && (v as number) <= max;
      if (
        body.provider !== provider ||
        typeof body.model !== "string" ||
        !allowed.includes(body.model) ||
        !textField(body.credential, 500) ||
        !integer(body.dailyRequests, 1, 100_000) ||
        !integer(body.userDailyRequests, 1, Number(body.dailyRequests)) ||
        !integer(body.timeoutMs, 1000, 30_000) ||
        !integer(body.maxOutputTokens, 256, 4096)
      )
        fail(400, "INVALID_INPUT", "Kiểm tra model được cho phép, khóa mới và giới hạn sử dụng.");
      const encrypted = encryptSecret((body.credential as string).trim(), id);
      const data = {
        ...scope,
        provider,
        model: body.model as string,
        ...encrypted,
        dailyRequests: body.dailyRequests as number,
        userDailyRequests: body.userDailyRequests as number,
        timeoutMs: body.timeoutMs as number,
        maxOutputTokens: body.maxOutputTokens as number,
        status: "draft",
        enabled: false,
        retryAt: null,
        testingUntil: null,
      };
      const row = await db.$transaction(async (tx) => {
        const result = await tx.cafeConnection.upsert({
          where: { id },
          create: { id, ...data },
          update: { ...data, revision: { increment: 1 } },
        });
        await tx.cafeAudit.create({ data: { ...scope, provider, actor, action: "configure" } });
        return result;
      });
      return json(publicConnection(row));
    }
    const connection = await db.cafeConnection.findFirst({ where: { id, ...scope } });
    if (!connection) fail(404, "NOT_FOUND", "Kết nối chưa được cấu hình.");
    if (request.method === "DELETE" && !action) {
      await db.$transaction(async (tx) => {
        await tx.cafeConnection.delete({ where: { id, ...scope } });
        await tx.cafeAudit.create({ data: { ...scope, provider, actor, action: "remove" } });
      });
      return json({ removed: true });
    }
    if (request.method !== "POST" || !["test", "activate", "disable"].includes(action))
      fail(404, "NOT_FOUND", "Không tìm thấy thao tác.");
    if (action === "test") {
      if (
        connection.retryAt &&
        connection.retryAt.getTime() > Date.now() &&
        connection.status === "rate_limited"
      )
        fail(429, "PROVIDER_RATE_LIMITED", "Nhà cung cấp yêu cầu chờ trước khi thử lại.");
      await db.$transaction(async (tx) => {
        const count = await tx.cafeAudit.count({
          where: { ...scope, action: "test", createdAt: { gt: new Date(Date.now() - 60_000) } },
        });
        if (count >= 5) fail(429, "TEST_LIMIT", "Chờ một phút trước khi kiểm tra lại.");
        const updated = await tx.cafeConnection.updateMany({
          where: {
            id,
            revision: connection.revision,
            OR: [{ testingUntil: null }, { testingUntil: { lte: new Date() } }],
          },
          data: {
            enabled: false,
            testingUntil: new Date(Date.now() + connection.timeoutMs + 5000),
            status: "testing",
          },
        });
        if (!updated.count) fail(409, "TEST_PENDING", "Đang kiểm tra hoặc cấu hình đã thay đổi.");
        await reserveUsage(tx, connection, "admin");
        await tx.cafeAudit.create({ data: { ...scope, provider, actor, action: "test" } });
      });
      let status: string;
      try {
        await callProvider(connection, {
          npc: "Barista Cat",
          topic: "ordering",
          level: "A1",
          message: "Hello!",
        });
        status = "healthy";
        await db.cafeConnection.updateMany({
          where: { id, revision: connection.revision },
          data: { status, retryAt: null, testingUntil: null },
        });
      } catch (error) {
        status = await markProviderFailure(connection, error);
      }
      const latest = await db.cafeConnection.findFirst({
        where: { id, revision: connection.revision },
      });
      if (!latest) fail(409, "CONFIG_CHANGED", "Cấu hình đã đổi. Hãy kiểm tra phiên bản mới.");
      await db.cafeAudit.create({ data: { ...scope, provider, actor, action: `test_${status}` } });
      return json(publicConnection(latest));
    }
    await db.$transaction(async (tx) => {
      if (action === "activate") {
        if (process.env.CAFE_ALLOW_LEARNER_AI !== "true")
          fail(403, "NOT_ENTITLED", "Người vận hành chưa cho phép dùng AI trong café.");
        const updated = await tx.cafeConnection.updateMany({
          where: {
            id,
            ...scope,
            status: "healthy",
            revision: connection.revision,
            dailyRequests: { gt: 0 },
          },
          data: { enabled: true },
        });
        if (!updated.count)
          fail(412, "CONNECTION_UNHEALTHY", "Cần kiểm tra thành công trước khi bật.");
        await tx.cafeConnection.updateMany({
          where: { ...scope, id: { not: id } },
          data: { enabled: false },
        });
      } else
        await tx.cafeConnection.update({
          where: { id, ...scope },
          data: {
            enabled: false,
            status: "disabled",
            revision: { increment: 1 },
            testingUntil: null,
          },
        });
      await tx.cafeAudit.create({ data: { ...scope, provider, actor, action } });
    });
    return json(publicConnection(await db.cafeConnection.findUniqueOrThrow({ where: { id } })));
  } catch (error) {
    return errorResponse(error);
  }
}
