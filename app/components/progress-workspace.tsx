"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLearningStore } from "../learning/provider";

import { dateKey } from "../learning/progress";

import { PageHeading } from "./page-heading";

export function ProgressWorkspace() {
  const store = useLearningStore();
  const visits = Object.entries(store.state.lessonVisits ?? {});
  const published = visits.filter(([id]) => !id.startsWith("preview:"));
  const preview = visits.filter(([id]) => id.startsWith("preview:"));
  const reviews = Object.values(store.state.cardReviews ?? {});
  return (
    <div className="natural-workspace">
      <PageHeading
        eyebrow="TỪ NHỮNG GÌ BẠN ĐÃ THỰC HÀNH"
        title="Mỗi câu nói đều là một bước tiến."
        text="Theo dõi hoạt động đã lưu của bạn. Số liệu này không xác nhận trình độ CEFR hoặc chứng chỉ B1."
      />
      <section className="natural-progress-stats">
        {[
          [published.filter(([, v]) => v.completedAt).length, "Bài chính thức hoàn thành"],
          [visits.reduce((n, [, v]) => n + Object.keys(v.answers).length, 0), "Câu trả lời đã lưu"],
          [reviews.reduce((n, r) => n + r.count, 0), "Lượt tự đánh giá ôn thẻ"],
        ].map(([n, label]) => (
          <div key={label}>
            <strong>{n}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>
      <section className="natural-progress-detail">
        <h2>Nhịp học của bạn</h2>
        <p>
          Mục tiêu: {store.state.profile?.goalMinutes ?? 15} phút/ngày. Bạn có thể nghỉ hoặc tiếp
          tục theo thời gian của mình.
        </p>
        <p>
          {preview.filter(([, v]) => v.completedAt).length} bài học thử hoàn thành ·{" "}
          {Math.floor((store.state.dailySeconds[dateKey(store.now ?? new Date())] ?? 0) / 60)} phút
          hoạt động ước lượng hôm nay.
        </p>
        <p className="helper">
          1.500 từ cốt lõi đang chờ phê duyệt. Chưa có số liệu độ phủ chính thức. Thời gian hoạt
          động được ước lượng khi màn hình đang mở và có tương tác trong 30 giây gần nhất; không
          phải đánh giá năng lực.
        </p>
        <table>
          <caption>Thời lượng hoạt động trong bài học (ước lượng)</caption>
          <tbody>
            {(
              [
                ["listening", "Nghe"],
                ["speaking", "Nói qua micro"],
                ["reading", "Đọc / xem tình huống"],
                ["writing", "Nhập câu trả lời"],
              ] as const
            ).map(([skill, label]) => (
              <tr key={skill}>
                <td>{label}</td>
                <td>
                  {Math.floor(
                    visits.reduce((n, [, v]) => n + (v.activitySeconds?.[skill] ?? 0), 0),
                  )}{" "}
                  giây
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Link className="natural-inline-link" href="/path">
          Xem lộ trình định hướng <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
