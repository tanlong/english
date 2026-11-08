"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Mic, Send, Square } from "lucide-react";
import { useLearningStore } from "../learning/provider";

import { type BaselineLesson, type PhraseLevel } from "../content/baseline";

import { useSpeechInput } from "../audio/use-speech-input";
import { stopAudio } from "../audio/client";
import { useActivityClock } from "../learning/use-activity-clock";
import type { ContentDraft } from "../content/governance";
import { Artwork } from "./artwork";
import { Button } from "./ui/button";
import { AudioButton } from "./audio-button";

import { visitKey } from "./learning-content";
type LessonWorkspaceProps = {
  lesson: BaselineLesson;
  preview?: boolean;
  publication?: ContentDraft;
};

export function LessonWorkspace(props: LessonWorkspaceProps) {
  const store = useLearningStore();
  const key = visitKey(props.lesson, props.preview ?? false);
  const index = Math.min(
    store.state.lessonVisits?.[key]?.index ?? 0,
    props.lesson.segments.length - 1,
  );
  const [level, setLevel] = useState<PhraseLevel>("basic");
  const [translation, setTranslation] = useState(store.state.profile?.vietnameseHelp !== false);
  const [micConsent, setMicConsent] = useState(false);
  const lastInteraction = useRef(0);
  return (
    <LessonSegmentWorkspace
      key={`${key}:${props.lesson.segments[index].id}`}
      {...props}
      index={index}
      level={level}
      setLevel={setLevel}
      translation={translation}
      setTranslation={setTranslation}
      micConsent={micConsent}
      setMicConsent={setMicConsent}
      lastInteraction={lastInteraction}
    />
  );
}

function LessonSegmentWorkspace({
  lesson,
  preview = false,
  publication,
  index,
  level,
  setLevel,
  translation,
  setTranslation,
  micConsent,
  setMicConsent,
  lastInteraction,
}: LessonWorkspaceProps & {
  index: number;
  level: PhraseLevel;
  setLevel: (level: PhraseLevel) => void;
  translation: boolean;
  setTranslation: (value: boolean) => void;
  micConsent: boolean;
  setMicConsent: (value: boolean) => void;
  lastInteraction: RefObject<number>;
}) {
  const store = useLearningStore();
  const key = visitKey(lesson, preview);
  const visit = store.state.lessonVisits?.[key];
  const segment = lesson.segments[index];
  const [draft, setDraft] = useState(
    visit?.drafts?.[segment.id] ?? visit?.answers[segment.id] ?? "",
  );
  const [feedback, setFeedback] = useState<{ reply: string; explanationVi: string } | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const requestRef = useRef(false);
  const requestController = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      requestController.current?.abort();
      stopAudio();
    },
    [],
  );
  const [done, setDone] = useState(false);
  const [samplePlaying, setSamplePlaying] = useState(false);
  const phrase = segment[level];
  function updateDraft(text: string) {
    setDraft(text);
    store.setState((old) => ({
      ...old,
      lessonVisits: {
        ...old.lessonVisits,
        [key]: {
          ...old.lessonVisits?.[key],
          cancelledAt: undefined,
          revision: lesson.revision,
          index,
          updatedAt: new Date().toISOString(),
          answers: old.lessonVisits?.[key]?.answers ?? {},
          drafts: { ...old.lessonVisits?.[key]?.drafts, [segment.id]: text },
        },
      },
    }));
  }
  const speech = useSpeechInput({
    value: draft,
    onChange: updateDraft,
    maxLength: 1500,
    disabled: pending,
    onStart: stopAudio,
    consent: { value: micConsent, set: setMicConsent },
  });
  useActivityClock(
    store,
    key,
    lesson.revision,
    samplePlaying,
    speech.listening,
    done || pending,
    lastInteraction,
  );
  function save(indexToSave = index, completed = false, answer?: string) {
    const at = new Date().toISOString();
    store.setState((old) => ({
      ...old,
      lessonVisits: {
        ...old.lessonVisits,
        [key]: {
          revision: lesson.revision,
          index: indexToSave,
          updatedAt: at,
          ...(old.lessonVisits?.[key]?.completedAt
            ? { completedAt: old.lessonVisits[key].completedAt }
            : {}),
          ...(completed ? { completedAt: at } : {}),
          answers: {
            ...old.lessonVisits?.[key]?.answers,
            ...(answer ? { [segment.id]: answer } : {}),
          },
          drafts: old.lessonVisits?.[key]?.drafts ?? {},
          activitySeconds: old.lessonVisits?.[key]?.activitySeconds ?? {},
        },
      },
    }));
  }
  async function send() {
    if (!draft.trim() || requestRef.current || speech.listening) return;
    requestRef.current = true;
    setPending(true);
    setError("");
    setFeedback(null);
    const controller = new AbortController();
    requestController.current = controller;
    save(index, false, draft.trim());
    try {
      const response = await fetch("/api/daily-speaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "conversation",
          mode: "guided",
          message: draft.trim(),
          topic: lesson.title.slice(0, 80),
          history: [{ role: "assistant", content: segment.prompt }],
          lastCoach: segment.prompt,
        }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Alex chưa phản hồi được.");
      if (typeof data.reply !== "string" || typeof data.explanationVi !== "string")
        throw new Error("Phản hồi chưa hợp lệ. Thử lại nhé.");
      setFeedback({ reply: data.reply, explanationVi: data.explanationVi });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa nhận được phản hồi.");
    } finally {
      setPending(false);
      requestRef.current = false;
    }
  }
  if (done)
    return (
      <section className="natural-finish">
        <span className="natural-feature-icon">
          <Check size={32} aria-hidden="true" />
        </span>
        <span className="eyebrow">BẠN VỪA THỰC HÀNH {lesson.segments.length} TÌNH HUỐNG</span>
        <h1>Mang một câu vào ngày hôm nay.</h1>
        <p>
          Những câu đã thực hành được giữ lại để bạn ôn. Đây là ghi nhận hoạt động học, không phải
          đánh giá trình độ.
        </p>
        <Link className="natural-primary" href="/review">
          Ôn lại câu vừa học <ArrowRight size={18} aria-hidden="true" />
        </Link>
        <Link className="natural-inline-link" href="/">
          Về Hôm nay
        </Link>
      </section>
    );
  return (
    <div className="natural-lesson-player">
      <div className="natural-player-top">
        <Link href="/roadmap">
          <ArrowLeft size={16} aria-hidden="true" /> Bài học
        </Link>
        <span>
          {index + 1} / {lesson.segments.length} tình huống
        </span>
      </div>
      <progress max={lesson.segments.length} value={index + 1} aria-label="Vị trí trong bài" />
      {preview && (
        <p className="natural-preview-note">
          Bản học thử · Nội dung, ảnh và audio chưa qua đầy đủ kiểm duyệt. IPA được ẩn.
        </p>
      )}
      <header>
        <span className="eyebrow">NHÌN → NGHE → NÓI → ỨNG DỤNG</span>
        <h1 lang="en">{lesson.title}</h1>
      </header>
      {lesson.wisdom && (
        <section className="natural-wisdom">
          <span className="eyebrow">MỘT Ý NHỎ ĐỂ THỰC HÀNH</span>
          <h2 lang="en">{lesson.wisdom.ideaEn}</h2>
          {translation && <p>{lesson.wisdom.ideaVi}</p>}
          <p>{lesson.wisdom.situation}</p>
          <details>
            <summary>Xem hội thoại gợi ý</summary>
            {lesson.wisdom.dialogue.map((t, i) => (
              <div className="natural-dialogue" key={i}>
                <strong>{t.role}</strong>
                <p lang="en">{t.en}</p>
                {translation && <p className="helper">{t.vi}</p>}
              </div>
            ))}
          </details>
          <p className="helper">{lesson.wisdom.interpretation}</p>
          {!preview && (
            <p className="helper">
              Chương {lesson.wisdom.chapter} ·{" "}
              <a href={lesson.wisdom.textSource} target="_blank" rel="noreferrer">
                Văn bản nguồn
              </a>{" "}
              ·{" "}
              <a href={lesson.wisdom.academicSource} target="_blank" rel="noreferrer">
                Nguồn học thuật
              </a>
            </p>
          )}
        </section>
      )}
      <section className="natural-scene-card">
        <Artwork key={segment.id} scene={segment.scene} priority />
        <div className="natural-scene-copy">
          <div className="natural-levels" role="group" aria-label="Mức câu mẫu">
            {(["basic", "better", "natural"] as const).map((value) => (
              <button
                key={value}
                aria-pressed={level === value}
                onClick={() => {
                  stopAudio();
                  setLevel(value);
                }}
              >
                {value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
          <h2 lang="en">{phrase.en}</h2>
          {translation && <p lang="vi">{phrase.vi}</p>}
          <div className="natural-audio-row">
            {preview ? (
              <AudioButton
                text={phrase.en}
                label="Nghe câu mẫu"
                variant="outline"
                onPlaybackChange={setSamplePlaying}
              />
            ) : (
              <audio
                key={`${segment.id}:${level}`}
                controls
                preload="none"
                onPlay={() => setSamplePlaying(true)}
                onPause={() => setSamplePlaying(false)}
                onEnded={() => setSamplePlaying(false)}
                src={publication?.audio[`${segment.id}:${level}`]?.url}
                aria-label="Nghe câu mẫu đã duyệt"
              />
            )}
            <button
              className="natural-text-toggle"
              onClick={() => setTranslation(!translation)}
              aria-pressed={translation}
            >
              {translation ? "Ẩn tiếng Việt" : "Hiện tiếng Việt"}
            </button>
          </div>
        </div>
      </section>
      <section className="natural-response">
        <span className="eyebrow">ĐẾN LƯỢT BẠN</span>
        <h2 lang="en">{segment.prompt}</h2>
        <p className="helper">Trả lời theo cuộc sống của bạn. Không cần giống câu mẫu.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <label htmlFor="natural-answer">Câu trả lời của bạn</label>
          <textarea
            id="natural-answer"
            lang="en"
            value={draft}
            onChange={(e) => updateDraft(e.target.value)}
            maxLength={1500}
            rows={3}
            placeholder="I usually…"
            disabled={pending}
          />
          {speech.micSupported && (
            <label className="natural-consent">
              <input
                type="checkbox"
                checked={speech.micConsent}
                disabled={speech.listening}
                onChange={(e) => speech.setMicConsent(e.target.checked)}
              />
              Tôi đồng ý dùng nhận diện giọng nói. Kiểm tra chữ trước khi gửi.
            </label>
          )}
          {speech.micError && (
            <p className="field-error" role="alert">
              {speech.micError}
            </p>
          )}
          <div className="natural-response-actions">
            <Button
              type="button"
              className="natural-mic"
              variant={speech.listening ? "destructive" : "outline"}
              disabled={!speech.micSupported || !speech.micConsent || pending}
              aria-label={speech.listening ? "Dừng mic" : "Bấm để nói"}
              aria-pressed={speech.listening}
              onClick={speech.toggleMic}
            >
              {speech.listening ? (
                <Square size={22} aria-hidden="true" />
              ) : (
                <Mic size={22} aria-hidden="true" />
              )}
            </Button>
            <span className="helper" role="status">
              {speech.listening ? "Đang nghe…" : "Có thể nhập chữ thay cho micro."}
            </span>
            <Button type="submit" disabled={!draft.trim() || pending || speech.listening}>
              <Send size={17} aria-hidden="true" />
              {pending ? "Đang xử lý…" : "Gửi câu trả lời"}
            </Button>
          </div>
        </form>
        {feedback && (
          <div className="natural-feedback" role="status">
            <span className="eyebrow">ALEX · GỢI Ý TỪ AI</span>
            <p lang="en">{feedback.reply}</p>
            {translation && feedback.explanationVi && <p lang="vi">{feedback.explanationVi}</p>}
            <button
              className="natural-text-toggle"
              onClick={() => {
                setFeedback(null);
                document.getElementById("natural-answer")?.focus();
              }}
            >
              Thử nói lại
            </button>
          </div>
        )}
        {error && (
          <div className="natural-feedback" role="alert">
            <p>{error}</p>
            <p className="helper">
              Câu trả lời đã lưu. Bạn có thể đối chiếu câu mẫu, thử gửi lại hoặc tiếp tục; chưa có
              đánh giá AI cho lượt này.
            </p>
          </div>
        )}
      </section>
      <footer className="natural-player-footer">
        <Button
          variant="outline"
          disabled={index === 0 || pending || speech.listening}
          onClick={() => {
            const next = index - 1;
            save(next);
            stopAudio();
          }}
        >
          Câu trước
        </Button>
        <Button
          disabled={!visit?.answers[segment.id] || pending || speech.listening}
          onClick={() => {
            stopAudio();
            if (index === lesson.segments.length - 1) {
              save(index, true);
              setDone(true);
            } else {
              save(index + 1);
            }
          }}
        >
          {index === lesson.segments.length - 1 ? "Hoàn thành bài" : "Tiếp theo"}
          <ArrowRight size={17} aria-hidden="true" />
        </Button>
      </footer>
    </div>
  );
}
