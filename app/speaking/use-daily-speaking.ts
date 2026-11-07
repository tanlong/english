"use client";
import { useEffect, useRef, useState } from "react";
import { playTts, stopAudio } from "../audio/client";
import { speakingScenarios } from "./scenarios";
import { useSpeechInput } from "../audio/use-speech-input";
import { isSpokenVersions, type SpokenVersions } from "./feedback";
import { previewLessons } from "../content/baseline";
import { useContentLibrary } from "../content/library";
import { useLearningStore } from "../learning/provider";
type Action = "start" | "conversation" | "retry" | "hint" | "skip" | "explain" | "end";
type Reply = {
  reply: string;
  translationVi?: string;
  explanationVi: string;
  speakingVersions?: SpokenVersions;
};
type Turn = {
  role: "user" | "assistant";
  content: string;
  translationVi?: string;
  explanationVi?: string;
  speakingVersions?: SpokenVersions;
  kind?: "hint";
  source?: "text" | "speech";
};
export function useDailySpeaking() {
  const learning = useLearningStore();
  const library = useContentLibrary();
  const savedReview = learning.personalization?.memory.reviews.find(
    (item) => item.id === learning.reviewId,
  );
  const practiced = [
    ...previewLessons.map((lesson) => ({ lesson, prefix: "preview:" })),
    ...library.lessons.map(({ lesson }) => ({ lesson, prefix: "" })),
  ].flatMap(({ lesson, prefix }) =>
    lesson.segments
      .filter(
        (segment) =>
          learning.state.lessonVisits?.[`${prefix}${lesson.id}:r${lesson.revision}`]?.answers[
            segment.id
          ],
      )
      .map((segment) => ({
        id: segment.id,
        english: segment.basic.en,
        vietnamese: segment.basic.vi,
      })),
  );
  const review = savedReview ?? practiced[0];
  const sessionId = useRef("");
  const [memoryWarning, setMemoryWarning] = useState("");
  const [mode, setMode] = useState("free");
  const [topic, setTopic] = useState("Daily routine");
  const [scenarioId, setScenarioId] = useState<string>(speakingScenarios[0].id);
  const [retrying, setRetrying] = useState(false);
  const [duration, setDuration] = useState(10);
  const [pace, setPace] = useState("normal");
  const [explanationMode, setExplanationMode] = useState("asNeeded");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [summary, setSummary] = useState<Reply | null>(null);
  const [active, setActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [draft, setDraft] = useState("");
  const [source, setSource] = useState<"text" | "speech">("text");
  const [pending, setPending] = useState<Action | null>(null);
  const [error, setError] = useState("");
  const [audioError, setAudioError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [hints, setHints] = useState(0);
  const requestRef = useRef<AbortController | null>(null);
  const audioRun = useRef(0);
  const mounted = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const coachIndex = turns.findLastIndex(
    (turn) => turn.role === "assistant" && turn.kind !== "hint",
  );
  const lastCoach = turns[coachIndex]?.content ?? "";
  const scenario =
    mode === "roleplay" ? speakingScenarios.find((item) => item.id === scenarioId) : undefined;
  const canRetry =
    active &&
    turns.some((turn) => turn.role === "user") &&
    /^(Sai|Cần sửa|Cách nói khác):/i.test(turns[coachIndex]?.explanationVi ?? "");
  const spoken = turns.filter((turn) => turn.role === "user" && turn.source === "speech").length;
  const typed = turns.filter((turn) => turn.role === "user" && turn.source !== "speech").length;
  // Reserve room for the recap; the server sees every learner turn in this session.
  const atLimit = turns.length >= 116;
  const { micSupported, micConsent, setMicConsent, listening, micError, toggleMic } =
    useSpeechInput({
      value: draft,
      onChange: (text) => {
        setDraft(text);
        setSource("speech");
      },
      maxLength: 1500,
      disabled: !!pending || !active || atLimit,
      onStart: stopVoice,
    });
  const locked = !!pending || listening;
  function stopVoice() {
    audioRun.current++;
    stopAudio();
    setPlaying(false);
  }
  useEffect(() => {
    mounted.current = true;
    const audioGeneration = audioRun;
    const hide = () => {
      if (document.visibilityState !== "visible") {
        stopVoice();
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      mounted.current = false;
      requestRef.current?.abort();
      audioGeneration.current++;
      stopAudio();
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);
  useEffect(() => {
    if (!active) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = Math.min(2, (now - previous) / 1000);
      previous = now;
      if (document.visibilityState === "visible") setSeconds((value) => value + delta);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [turns, pending]);
  useEffect(() => {
    if (summary) summaryRef.current?.focus();
  }, [summary]);
  async function speak(text: string) {
    stopVoice();
    const run = audioRun.current;
    setPlaying(true);
    setAudioError("");
    try {
      await playTts({ spokenText: text, voice: "cedar", speed: pace === "slow" ? 0.82 : 1 });
    } catch (e) {
      if (
        mounted.current &&
        run === audioRun.current &&
        e instanceof Error &&
        e.message !== "Đã dừng âm thanh."
      )
        setAudioError(
          e.name === "NotAllowedError"
            ? "Trình duyệt chưa cho phép tự phát. Bấm Nghe lại để nghe phản hồi."
            : e.message,
        );
    } finally {
      if (mounted.current && run === audioRun.current) setPlaying(false);
    }
  }
  async function ask(action: Action, clearDraft = false) {
    if (requestRef.current || listening) return;
    if ((action === "conversation" || action === "retry") && (!draft.trim() || atLimit)) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setPending(action);
    setError("");
    stopVoice();
    setAudioError("");
    try {
      if (action === "start") {
        await learning.syncLearning();
        sessionId.current = crypto.randomUUID();
      }
      const history =
        action === "start" ? [] : turns.map(({ role, content }) => ({ role, content }));
      const response = await fetch("/api/daily-speaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          sessionId: sessionId.current,
          reviewId: learning.reviewId,
          message: action === "conversation" || action === "retry" ? draft.trim() : "",
          history,
          mode,
          reviewText: mode === "review" ? (review?.english ?? "") : "",
          topic: mode === "free" ? topic : (scenario?.topic ?? "Daily routine"),
          ...(scenario && { scenarioId: scenario.id }),
          pace,
          explanationMode,
          lastCoach: action === "start" ? "" : lastCoach,
        }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Alex chưa thể phản hồi. Hãy thử lại.");
      if (
        typeof data.reply !== "string" ||
        (data.translationVi !== undefined && typeof data.translationVi !== "string") ||
        typeof data.explanationVi !== "string" ||
        (data.speakingVersions !== undefined && !isSpokenVersions(data.speakingVersions)) ||
        (action === "explain" ? !data.explanationVi.trim() : !data.reply.trim())
      )
        throw new Error("Phản hồi chưa đầy đủ. Hãy thử lại.");
      if (controller.signal.aborted || !mounted.current) return;
      setMemoryWarning(data.memoryWarningVi ?? "");
      if (clearDraft) {
        setDraft("");
        setSource("text");
      }
      if (action === "explain") {
        setTurns((old) =>
          old.map((turn, index) =>
            index === coachIndex ? { ...turn, explanationVi: data.explanationVi } : turn,
          ),
        );
      } else if (action === "end") {
        setRetrying(false);
        setSummary(data);
        setActive(false);
        window.dispatchEvent(new Event("learning-personalization-updated"));
      } else {
        const next: Turn[] = action === "start" ? [] : [...turns];
        if (action === "conversation" || action === "retry") {
          next.push({ role: "user", content: draft.trim(), source });
          setDraft("");
          setSource("text");
          setRetrying(false);
        }
        next.push({
          role: "assistant",
          content: data.reply,
          translationVi: data.translationVi,
          explanationVi: data.explanationVi,
          speakingVersions: data.speakingVersions,
          ...(action === "hint" ? { kind: "hint" as const } : {}),
        });
        setTurns(next);
        if (action === "hint") setHints((value) => value + 1);
        if (action === "skip") setRetrying(false);
        if (action === "start") {
          setRetrying(false);
          setSummary(null);
          setSeconds(0);
          setHints(0);
          setDraft("");
          setSource("text");
          setActive(true);
        }
        window.requestAnimationFrame(() => inputRef.current?.focus());
      }
      if (autoSpeak && data.reply && document.visibilityState === "visible") void speak(data.reply);
    } catch (e) {
      if (!controller.signal.aborted && mounted.current)
        setError(e instanceof Error ? e.message : "Không kết nối được. Hãy thử lại.");
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
      if (mounted.current) setPending(null);
    }
  }
  function sendDraft() {
    const text = draft.trim();
    const action: Action = /^(hint|gợi ý)[.!?]?$/i.test(text)
      ? "hint"
      : /^(vietnamese|explain|translate|giải thích(?: tiếng việt)?|tiếng việt)[.!?]?$/i.test(text)
        ? "explain"
        : /^(skip|bỏ qua)[.!?]?$/i.test(text)
          ? "skip"
          : /^(end session|stop|kết thúc|dừng)[.!?]?$/i.test(text)
            ? "end"
            : retrying
              ? "retry"
              : "conversation";
    void ask(action, action !== "conversation");
  }
  return {
    mode,
    memoryWarning,
    review,
    setMode,
    topic,
    setTopic,
    scenario,
    scenarioId,
    setScenarioId,
    chooseScenario: (id: string) => {
      if (active || requestRef.current || listening) return;
      const selected = speakingScenarios.find((item) => item.id === id);
      if (!selected) return;
      setScenarioId(id);
      setMode("roleplay");
    },
    canRetry,
    retrying,
    beginRetry: () => {
      if (!canRetry || locked || atLimit) return;
      stopVoice();
      setRetrying(true);
      inputRef.current?.focus();
    },
    cancelRetry: () => setRetrying(false),
    duration,
    setDuration,
    pace,
    setPace,
    explanationMode,
    setExplanationMode,
    turns,
    summary,
    active,
    seconds,
    draft,
    pending,
    error,
    audioError,
    playing,
    autoSpeak,
    setAutoSpeak,
    micSupported,
    micConsent,
    setMicConsent,
    listening,
    micError,
    hints,
    logRef,
    summaryRef,
    inputRef,
    lastCoach,
    spoken,
    typed,
    atLimit,
    locked,
    stopVoice,
    speak,
    ask,
    sendDraft,
    toggleMic,
    updateDraft: (text: string) => {
      setDraft(text);
      setSource("text");
    },
  };
}
