"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useContentLibrary } from "../content/library";
import { previewLessons, type BaselineLesson } from "../content/baseline";

import { Artwork } from "./artwork";

import { PageHeading } from "./page-heading";

export function LessonsWorkspace() {
  const { lessons, loading, error } = useContentLibrary();
  const [topic, setTopic] = useState("all");
  const categories = [
    ["all", "Tất cả"],
    ["everyday", "Xã hội & đời sống"],
    ["workplace", "Công việc"],
    ["communication", "Giao tiếp ứng xử"],
  ];
  return (
    <div className="natural-workspace">
      <PageHeading
        eyebrow="HỌC TỪ TÌNH HUỐNG THẬT"
        title="Bạn muốn nói về điều gì?"
        text="Nhìn để hiểu ngữ cảnh. Nghe một câu. Thử nói bằng lời của bạn."
      />
      <div className="natural-filters" role="group" aria-label="Chọn nhóm bài">
        {categories.map(([value, label]) => (
          <button key={value} aria-pressed={topic === value} onClick={() => setTopic(value)}>
            {label}
          </button>
        ))}
      </div>
      {loading && <p role="status">Đang tải bài học…</p>}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {!!lessons.length && (
        <div className="natural-lesson-grid">
          {lessons
            .filter((d) => topic === "all" || d.lesson.topic === topic)
            .map(({ lesson }) => (
              <LessonTile key={lesson.id} lesson={lesson} />
            ))}
        </div>
      )}
      {!loading && !lessons.length && (
        <p className="helper">
          Giáo trình chính thức đang được kiểm duyệt. Bạn có thể trải nghiệm luồng học bằng bản học
          thử bên dưới.
        </p>
      )}
      <div className="natural-section-heading">
        <h2>Không gian học thử</h2>
        <span>Nháp · chưa xuất bản</span>
      </div>
      <div className="natural-lesson-grid">
        {previewLessons
          .filter((l) => topic === "all" || l.topic === topic)
          .map((lesson) => (
            <LessonTile key={lesson.id} lesson={lesson} preview />
          ))}
      </div>
      {topic === "workplace" && !lessons.some((l) => l.lesson.topic === "workplace") && (
        <p className="natural-empty">
          Bài công việc đang chờ biên soạn và duyệt. Bạn có thể luyện hội thoại cùng Alex ở mục Nói
          chuyện.
        </p>
      )}
      <Link href="/path" className="natural-inline-link">
        Khám phá lộ trình 52 tuần <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}
function LessonTile({ lesson, preview = false }: { lesson: BaselineLesson; preview?: boolean }) {
  return (
    <Link
      className="natural-lesson-tile"
      href={`/${preview ? "preview" : "lessons"}/${lesson.slug}`}
    >
      <Artwork scene={lesson.segments[0].scene} />
      <div>
        <span className="eyebrow">
          {preview ? "HỌC THỬ" : `TUẦN ${lesson.week}`} ·{" "}
          {lesson.topic === "communication" ? "GIAO TIẾP ỨNG XỬ" : "ĐỜI SỐNG"}
        </span>
        <h2 lang="en">{lesson.title}</h2>
        <p>{lesson.description}</p>
        <span className="natural-inline-link">
          {preview ? "Xem bài học thử" : "Mở bài học"} <ArrowRight size={16} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
