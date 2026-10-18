"use client";
import Link from "next/link";
import { formatTime } from "@/lib/format";

import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Clock3, Pause, Play } from "lucide-react";
import { getPracticeLesson } from "../content/practice";
import { studyDays, roles } from "../content/curriculum";
import {
  addActiveSeconds,
  addAttempt,
  completeStage,
  stageReady,
  dateKey,
  nextLesson,
  sessionKey,
  type Attempt,
} from "../learning/progress";
import { sessionStages } from "../learning/session-plan";
import type { LearningStore } from "../learning/use-learning";
import { stopAudio } from "../audio/client";
import { Activity } from "./lesson-activities";

export function SessionPlayer({
  store,
  sessionId,
  onExit,
}: {
  store: LearningStore;
  sessionId: string;
  onExit: () => void;
}) {
  const session = store.state.sessions[sessionId];
  const [running, setRunning] = useState(false);
  const lastTick = useRef(0);
  const activityTitle = useRef<HTMLHeadingElement>(null);
  const previousStage = useRef(session?.stage);
  const today = dateKey();
  const capped = (store.state.dailySeconds[today] ?? 0) >= 3600;
  const role =
    roles.find((r) => {
      const base = sessionKey(session?.week ?? 1, session?.day ?? 1, r.id);
      return sessionId === base || sessionId.startsWith(`${base}-r`);
    })?.id ??
    store.state.profile?.role ??
    "general";
  const lesson = getPracticeLesson(
    session?.week ?? 1,
    session?.day ?? 1,
    role,
    store.state.profile?.name,
  );
  const stage = sessionStages[session?.stage ?? 0];
  const elapsed = session?.seconds[session.stage] ?? 0;
  useEffect(() => {
    if (!running || !session || capped || session.finishedAt) return;
    lastTick.current = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = Math.min(2, (now - lastTick.current) / 1000);
      lastTick.current = now;
      if (document.visibilityState === "visible")
        store.setState((old) => addActiveSeconds(old, sessionId, delta));
    }, 1000);
    return () => window.clearInterval(timer);
    // Session state changes every tick; keep the clock attached to the current stage only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, sessionId, session?.stage, !!session?.finishedAt, capped]);
  useEffect(() => {
    const pause = () => {
      setRunning(false);
      stopAudio();
    };
    const visibility = () => {
      if (document.visibilityState !== "visible") pause();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("learning-external-update", pause);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("learning-external-update", pause);
      stopAudio();
    };
  }, []);
  useEffect(() => {
    setRunning(false);
    stopAudio();
    if (previousStage.current !== session?.stage) {
      activityTitle.current?.focus({ preventScroll: true });
      activityTitle.current?.scrollIntoView({ block: "start" });
    }
    previousStage.current = session?.stage;
  }, [session?.stage, capped, !!session?.finishedAt]);
  if (!session)
    return (
      <div className="empty-state">
        <h1>Chưa có buổi học</h1>
        <Button onClick={onExit} variant="default">
          Về hôm nay
        </Button>
      </div>
    );
  const total = session.seconds.reduce((a, b) => a + b, 0);
  const evidence = stageReady(session, stage.id);
  const emit = (kind: Attempt["kind"], answer: string, extra: Partial<Attempt> = {}) =>
    store.updateSession(sessionId, (s) =>
      addAttempt(s, {
        ...extra,
        id: crypto.randomUUID(),
        stage: extra.stage ?? stage.id,
        kind,
        answer,
        at: new Date().toISOString(),
      }),
    );
  const saveDraft = (key: string, value: string) =>
    store.updateSession(sessionId, (s) => ({
      ...s,
      drafts: { ...s.drafts, [key]: value },
    }));
  if (session.finishedAt)
    return (
      <Card className="recap">
        <span className="success-orb">
          <Check aria-hidden="true" size={32} />
        </span>
        <span className="eyebrow">
          ĐÃ HOÀN THÀNH · TUẦN {session.week} · NGÀY {session.day}
        </span>
        <h1>Một bước tiến thật sự.</h1>
        <p>
          Bạn đã nghe mẫu và tự phản hồi. Hãy thử dùng ý vừa học trong một cuộc trò chuyện hôm nay.
        </p>
        <div className="principle-card">
          <span className="eyebrow">CÂU MANG THEO</span>
          <p lang="en">{lesson.target}</p>
          <p>{session.attempts.findLast((a) => a.stage === "reflection")?.answer}</p>
          {session.drafts.reflection && <p>{session.drafts.reflection}</p>}
        </div>
        <div className="recap-stats">
          <div>
            <strong>{formatTime(total)}</strong>
            <span>Thời gian học thực tế</span>
          </div>
          <div>
            <strong>
              {sessionStages.length} / {sessionStages.length}
            </strong>
            <span>Bước đã hoàn thành</span>
          </div>
          <div>
            <strong>{session.attempts.filter((a) => a.kind === "speaking").length}</strong>
            <span>Lượt luyện nói</span>
          </div>
        </div>
        <div className="recap-list">
          {sessionStages.map((s) => (
            <div key={s.id}>
              <Check aria-hidden="true" size={18} />
              <span>{s.label}</span>
              <small>
                {formatTime(session.seconds[sessionStages.indexOf(s)])} / {s.minutes} phút dự kiến
              </small>
            </div>
          ))}
        </div>
        {session.attempts.some((a) => a.kind === "typed") && (
          <p className="helper">Lần sau, thử nói thành tiếng những câu bạn đã viết hôm nay.</p>
        )}
        <div className="button-row">
          <Button
            onClick={() => {
              store.setState((old) => {
                const next = nextLesson(old);
                return next ? { ...old, activeWeek: next.week, activeDay: next.day } : old;
              });
              onExit();
            }}
            variant="default"
          >
            Lưu & về hôm nay <ArrowRight aria-hidden="true" size={18} />
          </Button>
        </div>
        <p className="recap-next">Lần sau, bài tiếp theo sẽ có sẵn ở Hôm nay.</p>
        <div className="button-row lesson-extras" aria-label="Luyện thêm tùy chọn">
          <Link href="/daily-speaking">Trò chuyện tự do với AI Lead</Link>
          <Link href="/ipa">Luyện phát âm</Link>
        </div>
      </Card>
    );
  return (
    <div className="lesson-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">
            TUẦN {session.week} · NGÀY {session.day} · {studyDays[session.day - 1]}
          </span>
          <h1>{lesson.title}</h1>
          <p>{lesson.situation}</p>
          <p className="lesson-goal">
            <strong>Sau bài này:</strong> {lesson.goal}
          </p>
          <p className="helper">
            Phân bổ dự kiến: 80% đời sống/công việc · 20% Đắc Nhân Tâm ({lesson.principle}). Thời
            gian thực tế tùy nhịp học của bạn.
          </p>
        </div>
      </header>
      <div className="stage-summary">
        <span>TIẾN ĐỘ BUỔI HỌC</span>
        <strong>
          {session.completed.length}
          <small>/{sessionStages.length} bước</small>
        </strong>
        <progress
          aria-label="Tiến độ bài học"
          max={sessionStages.length}
          value={session.completed.length}
        />
        <p>{formatTime(total)} thực học · tự lưu tiến độ</p>
      </div>
      <div className="lesson-layout">
        <aside className="stage-sidebar">
          <nav aria-label="3 bước luyện giao tiếp">
            {sessionStages.map((s, i) => (
              <button
                key={s.id}
                className={`stage-item ${session.stage === i ? "active" : ""} ${session.completed.includes(s.id) ? "done" : ""}`}
                aria-current={session.stage === i ? "step" : undefined}
                disabled={!session.completed.includes(s.id) && session.stage !== i}
                onClick={() => {
                  setRunning(false);
                  store.updateSession(sessionId, (old) => ({
                    ...old,
                    stage: i,
                  }));
                }}
              >
                <span className="stage-number">
                  {session.completed.includes(s.id) ? (
                    <Check aria-hidden="true" size={16} />
                  ) : (
                    i + 1
                  )}
                </span>
                <span>
                  <strong>{s.label}</strong>
                  <small>
                    {session.stage === i
                      ? "Đang học"
                      : session.completed.includes(s.id)
                        ? "Đã hoàn thành"
                        : "Chưa học"}
                    {" · "}Khoảng {s.minutes} phút
                  </small>
                </span>
              </button>
            ))}
          </nav>
        </aside>
        <Card className="activity-panel" render={<section />}>
          <header className="activity-heading">
            <div>
              <span className="eyebrow">
                BƯỚC {session.stage + 1} / {sessionStages.length}
              </span>
              <h2 ref={activityTitle} tabIndex={-1}>
                {stage.label}
              </h2>
            </div>
            <span className="timer" role="timer">
              <Clock3 aria-hidden="true" size={18} />
              {formatTime(elapsed)}
            </span>
          </header>
          <p className="activity-detail">{stage.detail}</p>
          {capped ? (
            <div className="empty-state">
              <Clock3 aria-hidden="true" size={32} />
              <h3>Bạn đã học đủ thời gian hôm nay.</h3>
              <p>Tiến độ đã lưu. Hãy quay lại vào ngày mai để tiếp tục.</p>
            </div>
          ) : (
            <Activity
              key={`${lesson.id}-${stage.id}`}
              stage={stage.id}
              lesson={lesson}
              session={session}
              store={store}
              emit={emit}
              saveDraft={saveDraft}
            />
          )}
          <footer className="activity-footer">
            <div className="session-timer-control">
              <Button
                disabled={capped}
                size="icon"
                aria-label={running ? "Tạm dừng" : "Bắt đầu tính giờ"}
                title={running ? "Tạm dừng tính giờ" : "Bắt đầu tính giờ"}
                onClick={() => {
                  if (running) stopAudio();
                  setRunning((r) => !r);
                }}
                variant="outline"
              >
                {running ? (
                  <Pause aria-hidden="true" size={18} />
                ) : (
                  <Play aria-hidden="true" size={18} />
                )}
              </Button>
              <span>
                {running ? "Đang tính giờ" : "Tính giờ tùy chọn"}
                <small>Thời lượng chỉ là gợi ý</small>
              </span>
            </div>
            <p id="stage-next-hint" className="stage-next-hint" role="status">
              {evidence
                ? session.stage === sessionStages.length - 1
                  ? "Đã sẵn sàng. Xem lại những gì bạn vừa học."
                  : `Đã xong. Tiếp theo: ${sessionStages[session.stage + 1].label}.`
                : stage.id === "visual-listening"
                  ? session.attempts.some(
                      (a) =>
                        a.stage === stage.id &&
                        a.kind === "listening" &&
                        a.contentTrack === "everyday",
                    )
                    ? "Tiếp tục phần nghe Đắc Nhân Tâm và kiểm tra câu trả lời để hoàn thành bước."
                    : "Nghe hội thoại và kiểm tra câu trả lời để tiếp tục."
                  : stage.id === "speaking"
                    ? "Hoàn thành 3 lượt phản hồi để tiếp tục."
                    : "Chọn lúc sử dụng, ghi một câu Đắc Nhân Tâm rồi giữ lại để hoàn thành."}
            </p>
            <Button
              disabled={!evidence}
              aria-describedby="stage-next-hint"
              onClick={() => {
                setRunning(false);
                store.updateSession(sessionId, (s) => completeStage(s));
              }}
              variant="default"
            >
              {session.stage === sessionStages.length - 1 ? "Xem tổng kết" : "Hoàn thành bước"}
              <ArrowRight aria-hidden="true" size={18} />
            </Button>
          </footer>
        </Card>
      </div>
    </div>
  );
}
