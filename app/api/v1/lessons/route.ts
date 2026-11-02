import { publishedLessons } from "../../../content/repository.ts";
export const runtime = "nodejs";
export async function GET() {
  try {
    return Response.json(
      { lessons: await publishedLessons() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "Chưa tải được bài học. Hãy thử lại." }, { status: 503 });
  }
}
