"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useContentLibrary } from "../content/library";

import { curriculum } from "../content/curriculum";

import { PageHeading } from "./page-heading";

export function PathWorkspace() {
  const { lessons } = useContentLibrary();
  return (
    <div className="natural-workspace">
      <PageHeading
        eyebrow="12 THÁNG · 52 TUẦN ĐỊNH HƯỚNG"
        title="Đi từng bước, dùng được mỗi ngày."
        text="Lộ trình hướng tới năng lực giao tiếp B1, tùy đầu vào và quá trình luyện tập. Chủ đề dự kiến không đồng nghĩa bài đã xuất bản."
      />
      <div className="natural-path">
        {[
          [1, 13, "Foundation", "Nền tảng hằng ngày"],
          [14, 26, "Social", "Kết nối và lắng nghe"],
          [27, 39, "Workplace", "Giao tiếp trong công việc"],
          [40, 52, "Integration", "Ứng biến và kết nối ý"],
        ].map(([from, to, en, vi]) => (
          <section key={from}>
            <span className="eyebrow">
              TUẦN {from}–{to} · {en}
            </span>
            <h2>{vi}</h2>
            {curriculum
              .filter((w) => w.week >= Number(from) && w.week <= Number(to))
              .map((week) => {
                const available = lessons.filter((d) => d.lesson.week === week.week);
                return (
                  <div className="natural-path-week" key={week.week}>
                    <span>{String(week.week).padStart(2, "0")}</span>
                    <div>
                      <strong lang="en">{week.title}</strong>
                      <small>{week.vi}</small>
                      {available.map(({ lesson }) => (
                        <Link key={lesson.id} href={`/lessons/${lesson.slug}`}>
                          {lesson.title} <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                      ))}
                    </div>
                    {!available.length && <small>Đang chuẩn bị</small>}
                  </div>
                );
              })}
          </section>
        ))}
      </div>
    </div>
  );
}
