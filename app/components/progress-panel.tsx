"use client";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

import { Check, Clock3, Target, TrendingUp } from "lucide-react";
import { curriculum } from "../content/curriculum";
import type { LearningStore } from "../learning/use-learning";
import { PageHeading } from "./page-heading";
import { sessionStages } from "../learning/session-plan";
import { formatTime } from "@/lib/format";
export function ProgressPanel({ store }: { store: LearningStore }) {
  const sessions = Object.values(store.state.sessions);
  const attempts = sessions.flatMap((s) => s.attempts);
  const listening = attempts.filter(
    (a) => a.kind === "listening" && a.correct !== undefined && !a.captions,
  );
  const correct = listening.filter((a) => a.correct).length;
  const minutes = Object.values(store.state.dailySeconds).reduce((a, b) => a + b, 0) / 60;
  const completed = new Set(sessions.filter((s) => s.finishedAt).map((s) => `${s.week}-${s.day}`))
    .size;
  const stats = [
    {
      label: "Buổi đã hoàn thành",
      value: String(completed),
      suffix: "/ 312 buổi",
    },
    {
      label: "Thời gian học thực tế",
      value: Math.floor(minutes).toString(),
      suffix: "phút",
    },
    {
      label: "Nghe luyện không phụ đề",
      value: listening.length ? `${Math.round((correct / listening.length) * 100)}%` : "—",
      suffix: `${correct}/${listening.length} lượt đúng · nội dung đã luyện`,
    },
    {
      label: "Ngày có học thực tế",
      value: String(Object.values(store.state.dailySeconds).filter((n) => n > 0).length),
      suffix: "ngày đã ghi thời gian",
    },
  ];
  const activities = [
    {
      label: "Nghe",
      count: attempts.filter((a) => a.kind === "listening").length,
    },
    {
      label: "Nói / tự xác nhận",
      count: attempts.filter((a) => a.kind === "speaking" || a.kind === "shadowing").length,
    },
    {
      label: "Đọc & viết",
      count: attempts.filter((a) => a.kind === "writing").length,
    },
    {
      label: "Nhập chữ thay nói",
      count: attempts.filter((a) => a.kind === "typed").length,
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="REAL PROGRESS"
        title="Nhìn thấy những bước tiến của bạn."
        text="Thời gian và lượt luyện từ dữ liệu trên thiết bị. Bài luyện và đánh giá độc lập được theo dõi riêng."
      />
      <div className="stats-grid">
        {stats.map((s) => (
          <Card key={s.label} className="stat-card" render={<section />}>
            <span>{s.label}</span>
            <strong>{s.value}</strong>
            <small>{s.suffix}</small>
          </Card>
        ))}
      </div>
      <div className="progress-grid">
        <Card className="settings-panel" render={<section />}>
          <div className="section-heading">
            <h2>Bạn đang luyện những gì?</h2>
            <TrendingUp aria-hidden="true" size={22} />
          </div>
          <div className="activity-bars">
            {activities.map((a, i) => (
              <div key={a.label}>
                <div>
                  <span>{a.label}</span>
                  <strong>{a.count} lượt</strong>
                </div>
                <div className={`bar-track bar-${i}`}>
                  <span
                    style={{
                      width: `${Math.min(100, (a.count / Math.max(1, ...activities.map((a) => a.count))) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <details className="data-table">
            <summary>Xem dữ liệu dạng bảng</summary>
            <table>
              <thead>
                <tr>
                  <th>Kỹ năng</th>
                  <th>Số lượt</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a.label}>
                    <td>{a.label}</td>
                    <td>{a.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </Card>
        <section className="assessment-card">
          <span className="feature-icon violet">
            <Target aria-hidden="true" size={24} />
          </span>
          <h2>Đo khả năng qua tình huống mới.</h2>
          <p>
            Mục tiêu nghe ≥16/20 câu đúng trên hai bộ đề tương đương, độc lập với nội dung đã luyện.
          </p>
          <Badge variant="warning">Chưa có bộ đề đã duyệt</Badge>
          <p>
            Điểm B1 chưa được xác định. Các mốc tuần 13, 26, 39 và 52 cần đánh giá cả nghe, nói,
            đọc, viết.
          </p>
        </section>
      </div>
      <Card className="settings-panel" render={<section />}>
        <h2>Nhật ký buổi học</h2>
        {!sessions.length ? (
          <p className="empty-state">Buổi học đầu tiên của bạn sẽ xuất hiện ở đây.</p>
        ) : (
          <div className="session-history">
            {sessions
              .slice()
              .reverse()
              .map((s) => (
                <div key={s.key}>
                  <span className="small-icon">
                    {s.finishedAt ? (
                      <Check aria-hidden="true" size={18} />
                    ) : (
                      <Clock3 aria-hidden="true" size={18} />
                    )}
                  </span>
                  <span>
                    <strong>
                      Tuần {s.week} · {curriculum[s.week - 1].title}
                    </strong>
                    <small>
                      Ngày {s.day} · {s.completed.length}/{sessionStages.length} bước ·{" "}
                      {s.key.split("-")[2]}
                      {s.key.match(/-r(\d+)$/)?.[1] &&
                        ` · Học lại lần ${s.key.match(/-r(\d+)$/)?.[1]}`}
                    </small>
                  </span>
                  <b>{formatTime(s.seconds.reduce((a, b) => a + b, 0))}</b>
                </div>
              ))}
          </div>
        )}
      </Card>
    </>
  );
}
