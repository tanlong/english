import { notFound } from "next/navigation";
import { previewLessons } from "@/app/content/baseline";
import { LessonWorkspace } from "@/app/components/lesson-workspace";
export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = previewLessons.find((item) => item.slug === slug);
  if (!lesson) notFound();
  return <LessonWorkspace key={`${lesson.id}:${lesson.revision}`} lesson={lesson} preview />;
}
