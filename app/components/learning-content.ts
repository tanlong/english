"use client";

import { useLearningStore } from "../learning/provider";
import { useContentLibrary } from "../content/library";
import { previewLessons, cardId, type BaselineLesson } from "../content/baseline";

export const visitKey = (lesson: BaselineLesson, preview: boolean) =>
  `${preview ? "preview:" : ""}${lesson.id}:r${lesson.revision}`;
export const reviewKey = (
  lesson: BaselineLesson,
  segment: BaselineLesson["segments"][number],
  preview: boolean,
) => `${preview ? "preview:" : ""}${cardId(lesson, segment)}`;
export function useCards() {
  const store = useLearningStore();
  const library = useContentLibrary();
  const sources = [
    ...library.lessons.map((draft) => ({ lesson: draft.lesson, preview: false, draft })),
    ...previewLessons.map((lesson) => ({ lesson, preview: true, draft: undefined })),
  ];
  return sources.flatMap(({ lesson, preview, draft }) =>
    lesson.segments.flatMap((segment) =>
      store.state.lessonVisits?.[visitKey(lesson, preview)]?.answers[segment.id]
        ? [
            {
              lesson,
              segment,
              preview,
              draft,
              id: reviewKey(lesson, segment, preview),
            },
          ]
        : [],
    ),
  );
}
