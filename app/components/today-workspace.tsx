"use client";

import Link from "next/link";
import { ArrowRight, Clock3, Headphones, Layers3 } from "lucide-react";
import { useLearningStore } from "../learning/provider";
import { useContentLibrary } from "../content/library";
import { baselineLesson, previewLessons } from "../content/baseline";
import { isDue } from "../learning/review";

import { Artwork } from "./artwork";

import { useCards } from "./learning-content";
import { visitKey } from "./learning-content";
export function TodayWorkspace() {
  const store = useLearningStore();
  const { lessons } = useContentLibrary();
  const cards = useCards();
  const profile = store.state.profile!;
  const sources = [
    ...lessons.map((d) => ({ lesson: d.lesson, preview: false })),
    ...previewLessons.map((lesson) => ({ lesson, preview: true })),
  ];
  const recent = sources
    .filter((source) => {
      const v = store.state.lessonVisits?.[visitKey(source.lesson, source.preview)];
      return v && !v.completedAt;
    })
    .sort((a, b) =>
      (store.state.lessonVisits?.[visitKey(b.lesson, b.preview)]?.updatedAt ?? "").localeCompare(
        store.state.lessonVisits?.[visitKey(a.lesson, a.preview)]?.updatedAt ?? "",
      ),
    )[0];
  const { lesson, preview } = recent ?? sources[0] ?? { lesson: baselineLesson, preview: true };
  const visit = store.state.lessonVisits?.[visitKey(lesson, preview)];
  const due = cards.filter((card) =>
    isDue(store.state.cardReviews?.[card.id], store.now ?? new Date()),
  ).length;
  const finished = Object.values(store.state.lessonVisits ?? {}).filter(
    (v) => v.completedAt,
  ).length;
  return (
    <div className="natural-workspace">
      <header className="natural-welcome">
        <span className="eyebrow">MỖI NGÀY, MỘT CHÚT TỰ TIN HƠN</span>
        <h1>
          Chào {profile.name}.<br />
          <span>Mình nói tiếng Anh nhé.</span>
        </h1>
        <p>Một tình huống quen thuộc. Một câu bạn có thể dùng ngay.</p>
      </header>
      <section className="natural-hero" aria-labelledby="today-title">
        <div className="natural-hero-image">
          <Artwork scene={lesson.segments[0].scene} priority />
          <span className="scene-label">ENGLISH FOR REAL LIFE · TUẦN {lesson.week}</span>
        </div>
        <div className="natural-hero-copy">
          <span className="eyebrow">
            {preview ? "BÀI HỌC THỬ · CHỜ KIỂM DUYỆT" : "BÀI HÔM NAY"}
          </span>
          <h2 id="today-title">{lesson.title}</h2>
          <p>{lesson.description}</p>
          <div className="natural-meta">
            <span>
              <Clock3 size={16} aria-hidden="true" />
              {profile.goalMinutes ?? 15} phút theo nhịp của bạn
            </span>
            <span>
              <Headphones size={16} aria-hidden="true" />
              Nhìn · Nghe · Nói
            </span>
          </div>
          <Link
            className="natural-primary"
            href={`/${preview ? "preview" : "lessons"}/${lesson.slug}`}
          >
            {visit && !visit.completedAt
              ? "Tiếp tục học"
              : visit?.completedAt
                ? "Luyện lại bài"
                : "Bắt đầu học"}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <p className="helper">
            {visit && !visit.completedAt
              ? `Đã lưu ở tình huống ${visit.index + 1}/${lesson.segments.length}.`
              : "Có thể dừng và quay lại bất cứ lúc nào."}
          </p>
        </div>
      </section>
      <Link href="/review" className="natural-review-link">
        <span className="natural-feature-icon">
          <Layers3 size={24} aria-hidden="true" />
        </span>
        <span>
          <strong>{due ? `${due} câu đang chờ bạn ôn lại` : "Giữ lại những câu đã học"}</strong>
          <small>
            {due
              ? "Thử nhớ, lật thẻ, rồi chọn mức độ nhớ của bạn."
              : "Câu bạn đã thực hành sẽ xuất hiện ở Ôn tập."}
          </small>
        </span>
        <ArrowRight size={20} aria-hidden="true" />
      </Link>
      <div className="natural-today-foot">
        <p>
          {finished
            ? `${finished} buổi học thử và bài học đã hoàn thành`
            : "Bắt đầu từ một câu, không cần nói hoàn hảo."}
        </p>
        <Link href="/progress">
          Xem tiến độ <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
