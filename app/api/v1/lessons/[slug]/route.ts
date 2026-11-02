import { publishedLessons } from "../../../../content/repository.ts";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const lesson = (await publishedLessons()).find((draft) => draft.lesson.slug === slug);
    return lesson
      ? Response.json(lesson, { headers: { "Cache-Control": "no-store" } })
      : Response.json({ error: "Bài học chưa được xuất bản." }, { status: 404 });
  } catch {
    return Response.json({ error: "Chưa tải được bài học." }, { status: 503 });
  }
}
