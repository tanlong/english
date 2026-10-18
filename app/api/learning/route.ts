import { isSameOrigin } from "../same-origin.ts";
import {
  ensureLearner,
  learnerCookie,
  learnerId,
  readPersonalization,
  saveLearningState,
} from "../../learning/personalization-server.ts";
import { parseState } from "../../learning/progress.ts";
import { getDb } from "../../db/client.ts";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  if (request.headers.has("origin") && !isSameOrigin(request))
    return Response.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  try {
    const identity = await ensureLearner(request);
    const result = await readPersonalization(identity.id);
    return Response.json(result, {
      headers: { ...headers, ...(identity.cookie ? { "Set-Cookie": identity.cookie } : {}) },
    });
  } catch {
    return Response.json(
      { error: "Chưa đọc được dữ liệu cá nhân hoá. Tiến độ trên trình duyệt vẫn được giữ." },
      { status: 503, headers },
    );
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return Response.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const id = learnerId(request);
  if (!id)
    return Response.json({ error: "Hãy tải lại trang để kết nối hồ sơ học tập." }, { status: 401 });
  let body;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 2_000_000)
      return Response.json({ error: "Dữ liệu học tập quá lớn." }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  try {
    const db = getDb();
    if (body.action === "sync") {
      if (
        !body.state ||
        body.state.version !== 2 ||
        !body.state.profile ||
        Object.keys(body.state.sessions ?? {}).length > 4000
      )
        return Response.json({ error: "Hồ sơ học tập không hợp lệ." }, { status: 400 });
      const state = parseState(JSON.stringify(body.state));
      if (!state.profile)
        return Response.json({ error: "Hồ sơ học tập không hợp lệ." }, { status: 400 });
      return Response.json(await saveLearningState(id, state), { headers });
    }
    if (body.action === "refresh-topic")
      await db.learner.update({ where: { id }, data: { topicOffset: { increment: 1 } } });
    else if (body.action === "dismiss-review") {
      if (typeof body.reviewId !== "string" || body.reviewId.length > 2000)
        return Response.json({ error: "Mục ghi nhớ không hợp lệ." }, { status: 400 });
      await db.$transaction(async (tx) => {
        const learner = await tx.learner.findUniqueOrThrow({ where: { id } });
        const dismissed = [
          ...new Set<string>([...JSON.parse(learner.dismissedJson), body.reviewId]),
        ].slice(-200);
        await tx.learner.update({
          where: { id },
          data: { dismissedJson: JSON.stringify(dismissed) },
        });
      });
    } else if (body.action === "approve-example") {
      if (
        ![body.english, body.vietnamese, body.usageVi].every(
          (v) => typeof v === "string" && v.trim() && v.length <= 1500,
        )
      )
        return Response.json(
          { error: "Điền câu tiếng Anh, nghĩa và ghi chú (tối đa 1.500 ký tự/mục)." },
          { status: 400 },
        );
      if ((await db.coachingExample.count({ where: { learnerId: id } })) >= 100)
        return Response.json(
          { error: "Kho mẫu đã đủ 100 câu. Hãy xóa một câu trước khi thêm." },
          { status: 400 },
        );
      await db.coachingExample.upsert({
        where: { learnerId_english: { learnerId: id, english: body.english.trim() } },
        create: {
          learnerId: id,
          english: body.english.trim(),
          vietnamese: body.vietnamese.trim(),
          usageVi: body.usageVi.trim(),
        },
        update: {
          vietnamese: body.vietnamese.trim(),
          usageVi: body.usageVi.trim(),
          approvedAt: new Date(),
        },
      });
    } else if (body.action === "delete-example") {
      if (typeof body.exampleId !== "string" || body.exampleId.length > 100)
        return Response.json({ error: "Câu mẫu không hợp lệ." }, { status: 400 });
      await db.coachingExample.deleteMany({ where: { id: body.exampleId, learnerId: id } });
    } else if (body.action !== "refresh-topic")
      return Response.json({ error: "Thao tác không hợp lệ." }, { status: 400 });
    return Response.json(await readPersonalization(id), { headers });
  } catch {
    return Response.json(
      { error: "Chưa lưu được cá nhân hoá. Dữ liệu trên trình duyệt vẫn được giữ; hãy thử lại." },
      { status: 503, headers },
    );
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request))
    return Response.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  try {
    const id = learnerId(request);
    if (id) await getDb().learner.deleteMany({ where: { id } });
    return Response.json(
      { deleted: true },
      { headers: { ...headers, "Set-Cookie": learnerCookie("", request, true) } },
    );
  } catch {
    return Response.json(
      { error: "Chưa xóa được dữ liệu trên máy chủ. Hãy thử lại." },
      { status: 503, headers },
    );
  }
}
