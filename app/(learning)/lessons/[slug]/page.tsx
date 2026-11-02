import { notFound } from "next/navigation";
import { publishedLessons } from "@/app/content/repository";
import { LessonWorkspace } from "@/app/components/lesson-workspace";
export const dynamic = "force-dynamic";
export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const publication = (await publishedLessons()).find((item) => item.lesson.slug === slug);
  if (!publication) notFound();
  return (
    <LessonWorkspace
      key={`${publication.lesson.id}:${publication.lesson.revision}`}
      lesson={publication.lesson}
      publication={publication}
    />
  );
}
