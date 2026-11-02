"use client";
import Link from "next/link";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { ArrowRight, Check, Clock3, Headphones, Mic, BookmarkCheck } from "lucide-react";
import { curriculum } from "../content/curriculum";
import { getPracticeLesson } from "../content/practice";
import { dateKey, lessonAccess, nextLesson, sessionKey } from "../learning/progress";
import { sessionStages } from "../learning/session-plan";
import type { LearningStore } from "../learning/use-learning";
import { Artwork } from "./artwork";

const stageIcons = [Headphones, Mic, BookmarkCheck];

export function Dashboard({
  store,
  now,
  onStart,
}: {
  store: LearningStore;
  now: Date | null;
  onStart: (week?: number, day?: number) => void;
}) {
  const { state } = store;
  const profile = state.profile!;
  const selectedKey = sessionKey(state.activeWeek, state.activeDay, profile.role);
  const active = Object.values(state.sessions).find(
    (session) =>
      !session.finishedAt &&
      (session.key === selectedKey || session.key.startsWith(`${selectedKey}-r`)),
  );
  const lesson = (active
    ? { week: state.activeWeek, day: state.activeDay }
    : nextLesson(state)) ?? { week: state.activeWeek, day: state.activeDay };
  const courseModule = curriculum[lesson.week - 1];
  const practice = getPracticeLesson(lesson.week, lesson.day, profile.role, profile.name);
  const capped = (state.dailySeconds[dateKey(now ?? new Date())] ?? 0) >= 3600;
  const completed = lessonAccess(state, lesson.week, lesson.day).status === "completed";
  const review = store.personalization?.memory.reviews.find(
    (item) => item.dueAt <= new Date().toISOString(),
  );

  return (
    <div className="dashboard">
      <header className="welcome-heading">
        <div>
          <span className="eyebrow">HÔM NAY CỦA {profile.name.toLocaleUpperCase("vi")}</span>
          <h1>
            Giao tiếp mỗi ngày<span className="heading-dot">.</span>
          </h1>
          <p>Một tình huống. Nghe để hiểu, nói để kết nối.</p>
        </div>
      </header>
      <div className="today-practice">
        {review && (
          <aside className="principle-card mb-4" aria-label="Ôn tập phù hợp với bạn">
            <strong>Đến lúc dùng lại một câu</strong>
            <p lang="en">{review.english}</p>
            <p className="helper">{review.labelVi} · Gợi ý từ kết quả học đã lưu.</p>
            <Link href="/daily-speaking" onClick={() => store.setReviewId(review.id)}>
              Luyện lại cùng Alex
            </Link>
          </aside>
        )}
        <section className="hero-card" aria-labelledby="today-lesson-title">
          <div className="hero-copy">
            <Badge>
              {active ? "TIẾP TỤC TÌNH HUỐNG" : "TÌNH HUỐNG HÔM NAY"} · TUẦN {lesson.week} · NGÀY{" "}
              {lesson.day}
            </Badge>
            <h2 id="today-lesson-title">{practice.title}</h2>
            <p>{practice.situation}</p>
            <div className="today-goal">
              <span>Mục tiêu giao tiếp</span>
              <strong>{practice.goal}</strong>
            </div>
            <div className="hero-meta">
              <span>
                <Clock3 aria-hidden="true" size={16} />
                Khoảng 12 phút
              </span>
              <span>
                <Headphones aria-hidden="true" size={16} />
                Nghe & nói · 3 bước
              </span>
            </div>
            <Button
              disabled={capped}
              onClick={() => onStart(lesson.week, lesson.day)}
              className="hero-cta"
            >
              {completed && !active
                ? "Học lại bài"
                : active
                  ? "Tiếp tục buổi học"
                  : "Bắt đầu buổi học"}
              <ArrowRight aria-hidden="true" size={18} />
            </Button>
            {capped ? (
              <p className="lesson-lock-note">
                Đã đủ 60 phút học hôm nay. Tiến độ đã lưu, hãy tiếp tục vào ngày mai.
              </p>
            ) : (
              <small className="hero-bottom">
                {active
                  ? `Đã lưu · Bước ${active.stage + 1}/3: ${sessionStages[active.stage].label}`
                  : "Có thể dừng và quay lại bất cứ lúc nào."}
              </small>
            )}
          </div>
          <div className="hero-art">
            <Artwork scene={practice.art} priority />
            <span>{courseModule.vi}</span>
          </div>
        </section>
        <section className="pipeline-section" aria-labelledby="pipeline-title">
          <div className="section-heading">
            <div>
              <h2 id="pipeline-title">Nghe một chút. Nói nhiều hơn.</h2>
              <p>Đi lần lượt 3 bước, cùng một tình huống.</p>
            </div>
          </div>
          <ol className="lesson-pipeline">
            {sessionStages.map((stage, index) => {
              const Icon = stageIcons[index];
              const done = active?.completed.includes(stage.id);
              return (
                <li
                  className={`lesson-pipeline-step ${done ? "done" : ""}`}
                  key={stage.id}
                  aria-current={active?.stage === index ? "step" : undefined}
                >
                  <span className="pipeline-step-number">
                    {done ? (
                      <Check aria-hidden="true" size={18} />
                    ) : (
                      <Icon aria-hidden="true" size={18} />
                    )}
                  </span>
                  <div>
                    <small>
                      BƯỚC {index + 1} · {stage.minutes} PHÚT{done ? " · ĐÃ XONG" : ""}
                    </small>
                    <strong>{stage.label}</strong>
                    <p>
                      {index === 0
                        ? "Nghe đoạn ngắn, nắm ý rồi xem lời thoại khi cần."
                        : index === 1
                          ? "Trả lời → ứng biến → hỏi lại. Dùng thông tin thật của bạn."
                          : "Nói lại một ý theo cách của bạn, giữ một câu để dùng hôm nay."}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
      <div className="today-footer">
        <p>
          <BookmarkCheck aria-hidden="true" size={16} /> Tiến độ tự lưu trên thiết bị này.
        </p>
        <Link className="text-link" href="/roadmap">
          Đổi tình huống <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>
    </div>
  );
}
