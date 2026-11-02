import { isBodyTooLarge, limitedBody } from "../request-body.ts";
import { createHash, timingSafeEqual } from "node:crypto";
import { getDb } from "../../db/client.ts";
import { isSameOrigin } from "../same-origin.ts";
import { previewLessons } from "../../content/baseline.ts";
import {
  contentIssues,
  newDraft,
  validDraft,
  type ContentDraft,
} from "../../content/governance.ts";
import { validateLexicon } from "../../content/lexicon.ts";
import { readLexicon } from "../../content/repository.ts";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
function roleOf(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const configured = [
    process.env.CONTENT_EDITOR_TOKEN,
    process.env.CONTENT_REVIEWER_TOKEN,
    process.env.CONTENT_ADMIN_TOKEN,
  ];
  // A shared token would defeat separation of duties, so reject that configuration.
  if (configured.filter(Boolean).length !== new Set(configured.filter(Boolean)).size) return null;
  for (const [i, secret] of configured.entries())
    if (
      secret &&
      secret.length >= 32 &&
      Buffer.byteLength(token) === Buffer.byteLength(secret) &&
      timingSafeEqual(Buffer.from(token), Buffer.from(secret))
    )
      return ["editor", "reviewer", "admin"][i];
  return null;
}
function fail(message: string, status: number, code = "CONTENT_ERROR") {
  return Response.json(
    {
      error: { code, messageVi: message, requestId: crypto.randomUUID(), retryable: status >= 500 },
    },
    { status, headers },
  );
}
export async function GET(request: Request) {
  const role = roleOf(request);
  if (!role)
    return fail("Cần khóa truy cập của biên tập viên, người duyệt hoặc quản trị viên.", 403);
  try {
    const db = getDb();
    const lexicon = await readLexicon();
    const documents = await db.contentDocument.findMany({ orderBy: { updatedAt: "desc" } });
    const audit = await db.contentAudit.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    return Response.json(
      {
        role,
        lexicon: lexicon
          ? {
              version: lexicon.version,
              count: lexicon.entries.length,
              approvedBy: lexicon.approvedBy,
            }
          : null,
        documents: documents.map((row) => {
          const draft = JSON.parse(row.draftJson) as ContentDraft;
          return {
            id: row.id,
            revision: row.revision,
            status: row.status,
            draft,
            ...contentIssues(draft, lexicon),
          };
        }),
        audit,
      },
      { headers },
    );
  } catch {
    return fail("Chưa đọc được kho nội dung. Hãy kiểm tra database và migration.", 503);
  }
}
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail("Yêu cầu không hợp lệ.", 403);
  const role = roleOf(request);
  if (!role) return fail("Bạn chưa có quyền thao tác nội dung.", 403);
  let body;
  try {
    body = await limitedBody(request, 2_000_000).json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
  } catch (error) {
    if (isBodyTooLarge(error)) return fail("Dữ liệu quá lớn.", 413);
    return fail("JSON không hợp lệ.", 400);
  }
  const permissions: Record<string, string> = {
    seed: "editor",
    create: "editor",
    save: "editor",
    submit: "editor",
    approve: "reviewer",
    lexicon: "reviewer",
    publish: "admin",
    unpublish: "admin",
    rollback: "admin",
    audio: "reviewer",
  };
  if (permissions[body.action] !== role) {
    try {
      await getDb().contentAudit.create({
        data: {
          documentId: typeof body.id === "string" ? body.id.slice(0, 100) : "unknown",
          revision: Number.isSafeInteger(body.revision) ? body.revision : 0,
          actor: role,
          action: "denied",
          dataJson: JSON.stringify({ attemptedAction: String(body.action).slice(0, 80) }),
        },
      });
    } catch {
      /* Denial remains enforced even if audit storage is unavailable. */
    }
    return fail("Vai trò của bạn không được thực hiện thao tác này.", 403);
  }
  try {
    const db = getDb();
    if (body.action === "lexicon") {
      if (!validateLexicon(body.lexicon))
        return fail(
          "Bộ từ cần đúng 1.500 lemma duy nhất, forms không mâu thuẫn, nghĩa Việt và URL nguồn HTTPS.",
          422,
        );
      await db.$transaction(async (tx) => {
        await tx.coreLexicon.create({
          data: { id: body.lexicon.version, dataJson: JSON.stringify(body.lexicon) },
        });
        await tx.contentAudit.create({
          data: {
            documentId: "core-lexicon",
            revision: 1,
            actor: role,
            action: "lexicon",
            dataJson: JSON.stringify({
              version: body.lexicon.version,
              approvedBy: body.lexicon.approvedBy,
            }),
          },
        });
      });
      return Response.json({ ok: true }, { headers });
    }
    if (body.action === "seed" || body.action === "create") {
      const drafts = body.action === "seed" ? previewLessons.map(newDraft) : [body.draft];
      if (!drafts.every(validDraft)) return fail("Nội dung bài học không hợp lệ.", 422);
      await db.$transaction(async (tx) => {
        for (const draft of drafts) {
          const id = draft.lesson.slug;
          if (await tx.contentDocument.findUnique({ where: { id } })) continue;
          draft.lesson.revision = 1;
          draft.audio = {};
          await tx.contentDocument.create({ data: { id, draftJson: JSON.stringify(draft) } });
          await tx.contentAudit.create({
            data: {
              documentId: id,
              revision: 1,
              actor: role,
              action: "create",
              dataJson: JSON.stringify(draft),
            },
          });
        }
      });
      return Response.json({ ok: true }, { headers });
    }
    if (typeof body.id !== "string" || body.id.length > 100 || !Number.isSafeInteger(body.revision))
      return fail("Thiếu ID hoặc revision.", 400);
    const result = await db.$transaction(async (tx) => {
      const row = await tx.contentDocument.findUnique({ where: { id: body.id } });
      if (!row) return { message: "Không tìm thấy bài học.", status: 404 };
      if (row.revision !== body.revision)
        return { message: "Bài đã thay đổi. Tải lại trước khi thao tác.", status: 409 };
      let draft = JSON.parse(row.draftJson) as ContentDraft;
      let status = row.status;
      let revision = row.revision;
      let publishedJson = row.publishedJson;
      const lexRow = await tx.coreLexicon.findFirst({ orderBy: { createdAt: "desc" } });
      const lexicon = lexRow ? JSON.parse(lexRow.dataJson) : null;
      if (body.action === "save") {
        if (
          !validDraft(body.draft) ||
          body.draft.lesson.slug !== row.id ||
          body.draft.lesson.id !== draft.lesson.id
        )
          return { message: "Dữ liệu không hợp lệ hoặc đã đổi định danh bài.", status: 422 };
        revision++;
        draft = { ...body.draft, lesson: { ...body.draft.lesson, revision }, audio: {} };
        status = "draft";
      } else if (body.action === "submit") {
        if (status !== "draft") return { message: "Chỉ bản nháp mới được gửi duyệt.", status: 409 };
        status = "review";
      } else if (body.action === "approve") {
        if (status !== "review")
          return { message: "Bài chưa ở trạng thái chờ duyệt.", status: 409 };
        const issues = contentIssues(draft, lexicon, false).issues;
        if (issues.length) return { message: issues.join("\n"), status: 422 };
        status = "approved";
      } else if (body.action === "audio") {
        if (status !== "approved")
          return { message: "Chỉ gắn audio sau khi nội dung được duyệt.", status: 409 };
        const candidate = { ...draft, audio: body.audio };
        if (!validDraft(candidate)) return { message: "Audio manifest không hợp lệ.", status: 422 };
        const issues = contentIssues(candidate, lexicon).issues;
        if (issues.length) return { message: issues.join("\n"), status: 422 };
        draft = {
          ...candidate,
          audio: Object.fromEntries(
            Object.entries(candidate.audio).map(([key, audio]) => [
              key,
              { ...audio, textHash: createHash("sha256").update(audio.text).digest("hex") },
            ]),
          ),
        };
      } else if (body.action === "publish") {
        if (status !== "approved")
          return { message: "Cần người duyệt phê duyệt phiên bản này trước.", status: 409 };
        const issues = contentIssues(draft, lexicon).issues;
        if (issues.length) return { message: issues.join("\n"), status: 422 };
        status = "published";
        publishedJson = JSON.stringify(draft);
      } else if (body.action === "unpublish") {
        publishedJson = null;
        status = "draft";
      } else if (body.action === "rollback") {
        if (typeof body.auditId !== "string")
          return { message: "Chọn phiên bản đã xuất bản trong lịch sử.", status: 400 };
        const audit = await tx.contentAudit.findUnique({ where: { id: body.auditId } });
        if (!audit || audit.documentId !== row.id || audit.action !== "publish")
          return { message: "Không có bản xuất bản để khôi phục.", status: 404 };
        const snapshot = JSON.parse(audit.dataJson) as ContentDraft;
        const issues = contentIssues(snapshot, lexicon).issues;
        if (issues.length) return { message: issues.join("\n"), status: 422 };
        publishedJson = audit.dataJson;
        // Keep the in-progress draft and its revision; rollback switches only the learner snapshot.
      }
      await tx.contentDocument.update({
        where: { id: row.id },
        data: { status, revision, draftJson: JSON.stringify(draft), publishedJson },
      });
      await tx.contentAudit.create({
        data: {
          documentId: row.id,
          revision,
          actor: role,
          action: body.action,
          dataJson:
            body.action === "rollback"
              ? JSON.stringify({ auditId: body.auditId })
              : JSON.stringify(draft),
        },
      });
      return null;
    });
    if (result)
      return fail(
        result.message,
        result.status,
        result.status === 409 ? "CONTENT_REVISION_MISMATCH" : "CONTENT_GATE_FAILED",
      );
    return Response.json({ ok: true }, { headers });
  } catch {
    return fail("Chưa lưu được. Kiểm tra phiên bản/bộ từ trùng và thử lại.", 503);
  }
}
