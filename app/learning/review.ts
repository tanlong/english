export const REVIEW_VERSION = "leitner-v1";
export type ReviewRating = "again" | "hard" | "good" | "easy";
export type CardReview = {
  version: typeof REVIEW_VERSION;
  dueAt: string;
  intervalDays: number;
  reviewedAt: string;
  rating: ReviewRating;
  eventId: string;
  count: number;
};
export type LessonVisit = {
  revision: number;
  index: number;
  updatedAt: string;
  completedAt?: string;
  answers: Record<string, string>;
  drafts?: Record<string, string>;
  activitySeconds?: Partial<Record<"listening" | "speaking" | "reading" | "writing", number>>;
};
export function scheduleReview(
  previous: CardReview | undefined,
  rating: ReviewRating,
  eventId: string,
  now = new Date(),
): CardReview {
  if (previous?.eventId === eventId) return previous;
  const intervalDays =
    rating === "again"
      ? 0
      : rating === "hard"
        ? 1
        : rating === "good"
          ? Math.max(2, (previous?.intervalDays ?? 0) * 2)
          : Math.max(4, (previous?.intervalDays ?? 0) * 3);
  return {
    version: REVIEW_VERSION,
    dueAt: new Date(
      now.getTime() + (intervalDays ? intervalDays * 86_400_000 : 600_000),
    ).toISOString(),
    intervalDays,
    reviewedAt: now.toISOString(),
    rating,
    eventId,
    count: (previous?.count ?? 0) + 1,
  };
}
export function isDue(review: CardReview | undefined, now = new Date()) {
  return !review || Date.parse(review.dueAt) <= now.getTime();
}
export function parseReviews(value: unknown): Record<string, CardReview> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([id, r]) => {
      const item = r as CardReview | null;
      return (
        id.length < 200 &&
        item &&
        item.version === REVIEW_VERSION &&
        Number.isFinite(Date.parse(item.dueAt)) &&
        Number.isFinite(Date.parse(item.reviewedAt)) &&
        Number.isFinite(item.intervalDays) &&
        item.intervalDays >= 0 &&
        item.intervalDays <= 36500 &&
        ["again", "hard", "good", "easy"].includes(item.rating) &&
        typeof item.eventId === "string" &&
        item.eventId.length <= 200 &&
        Number.isSafeInteger(item.count) &&
        item.count > 0
      );
    }),
  );
}
export function parseVisits(value: unknown): Record<string, LessonVisit> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([id, v]) => {
      const visit = v as LessonVisit | null;
      if (
        !visit ||
        id.length > 200 ||
        !Number.isInteger(visit.revision) ||
        visit.revision < 1 ||
        !Number.isInteger(visit.index) ||
        visit.index < 0 ||
        visit.index > 1000 ||
        !Number.isFinite(Date.parse(visit.updatedAt)) ||
        (visit.completedAt !== undefined && !Number.isFinite(Date.parse(visit.completedAt)))
      )
        return [];
      const validEntries = (items: unknown) =>
        Object.fromEntries(
          Object.entries(
            items && typeof items === "object" && !Array.isArray(items) ? items : {},
          ).filter(
            ([key, answer]) =>
              key.length < 200 && typeof answer === "string" && answer.length <= 1500,
          ),
        );
      return [
        [
          id,
          {
            revision: visit.revision,
            index: visit.index,
            updatedAt: visit.updatedAt,
            ...(visit.completedAt ? { completedAt: visit.completedAt } : {}),
            answers: validEntries(visit.answers),
            drafts: validEntries(visit.drafts),
            ...(visit.activitySeconds && typeof visit.activitySeconds === "object"
              ? {
                  activitySeconds: Object.fromEntries(
                    Object.entries(visit.activitySeconds).filter(
                      ([skill, n]) =>
                        ["listening", "speaking", "reading", "writing"].includes(skill) &&
                        typeof n === "number" &&
                        Number.isFinite(n) &&
                        n >= 0 &&
                        n <= 31_536_000,
                    ),
                  ),
                }
              : {}),
          },
        ],
      ];
    }),
  );
}
