"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Flame,
  Headphones,
  House,
  Lightbulb,
  ListChecks,
  LoaderCircle,
  Mic2,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Sparkles,
  Square,
  Target,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { editorialSources, flashcards, patterns, qa, sentences, story, timeline, upgradeExamples, verifiedNaturalPhrases } from "./data";

type View = "home" | "session" | "learn" | "practice" | "story";
type PracticeMode = "cards" | "repeat" | "qa" | "dictation" | "shadowing" | "speaking";

const repetition = [
  "I usually get up around 5:40.",
  "I drop him off at school.",
  "On the way to work, I get some breakfast.",
  "I’m back at my desk by one.",
  "I wrap things up and head home.",
];

const shadowing = [
  "I usually get up / around five forty.",
  "After dropping him off / I usually stop / to get some breakfast / on the way to work.",
  "I take the elevator / up to the seventh floor / and clock in.",
  "I work as a BA / so most of my job involves / business analysis / and UI/UX design.",
];

const practiceModes: { id: PracticeMode; label: string; detail: string }[] = [
  { id: "cards", label: "Flashcards", detail: "12 thẻ" },
  { id: "repeat", label: "Lặp lại", detail: "5 × mỗi câu" },
  { id: "qa", label: "Phản xạ Q&A", detail: "20 câu hỏi" },
  { id: "dictation", label: "Chính tả", detail: "Nghe & viết" },
  { id: "shadowing", label: "Shadowing", detail: "4 đoạn" },
  { id: "speaking", label: "Thử thách nói", detail: "30s → 2 phút" },
];

const sessionSteps = [
  { minutes: 2, label: "Khởi động tai", detail: "Nghe và đọc theo 2 câu mở đầu" },
  { minutes: 4, label: "Học câu trọng tâm", detail: "Hiểu ý, nghe và nói lại 4 câu" },
  { minutes: 3, label: "Basic → Natural", detail: "Nâng cấp 4 cách diễn đạt" },
  { minutes: 3, label: "Phản xạ Q&A", detail: "Trả lời trước khi xem gợi ý" },
  { minutes: 2, label: "Shadowing", detail: "Bám theo nhịp của 2 đoạn" },
  { minutes: 1, label: "Tự kể", detail: "Nói liên tục bằng từ khóa" },
] as const;

if (sessionSteps.reduce((sum, item) => sum + item.minutes, 0) !== 15) {
  throw new Error("Timeline học phải có tổng thời lượng đúng 15 phút.");
}

const audioCache = new Map<string, string>();
let activeAudio: HTMLAudioElement | null = null;
let latestPlayRequest = 0;

async function speak(text: string, speed = 1) {
  const cleanText = text.replaceAll("/", "").replaceAll("\n", " ").trim();
  const cacheKey = `${speed}:${cleanText}`;
  const requestId = ++latestPlayRequest;
  let audioUrl = audioCache.get(cacheKey);

  activeAudio?.pause();
  if (!audioUrl) {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleanText, speed }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(body.error ?? "Không thể tạo giọng đọc.");
    }
    audioUrl = URL.createObjectURL(await response.blob());
    audioCache.set(cacheKey, audioUrl);
  }

  if (requestId !== latestPlayRequest) return;
  activeAudio = new Audio(audioUrl);
  await activeAudio.play();
}

function TTSButton({ text, speed = 1, className, ariaLabel, children }: { text: string; speed?: number; className?: string; ariaLabel: string; children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);

  const play = async () => {
    setLoading(true);
    try {
      await speak(text, speed);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Không thể tạo giọng đọc.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className={`tts-button ${className ?? ""}`} onClick={play} disabled={loading} aria-busy={loading} aria-label={ariaLabel}>
      <span className="tts-content">{children}</span>
      {loading && <LoaderCircle className="tts-loader" aria-hidden="true" />}
    </button>
  );
}

type SpeechScore = {
  score: number;
  transcript: string;
  missingWords: string[];
  feedback: string;
};

function RecordingPractice({ target }: { target: string }) {
  const [expanded, setExpanded] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [result, setResult] = useState<SpeechScore | null>(null);
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<number | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const playbackRef = useRef<HTMLAudioElement | null>(null);
  const disposedRef = useRef(false);

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const stopRecording = () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setRecording(false);
  };

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.min(value + 1, 30)), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      releaseStream();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  const clearAttempt = () => {
    playbackRef.current?.pause();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
    setAudioUrl(null);
    setAudioBlob(null);
    setPlaying(false);
    setResult(null);
    setError("");
    setSeconds(0);
  };

  const togglePlayback = async () => {
    const player = playbackRef.current;
    if (!player) return;
    if (!player.paused) {
      player.pause();
      return;
    }
    try {
      player.currentTime = 0;
      await player.play();
    } catch {
      setError("Không thể phát bản ghi. Hãy thu lại rồi thử thêm một lần.");
    }
  };

  const startRecording = async () => {
    if (preparing || recording) return;
    setPreparing(true);
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Trình duyệt này chưa hỗ trợ ghi âm. Hãy thử Chrome, Edge hoặc Safari mới nhất.");
      setPreparing(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      if (disposedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const preferredType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, preferredType ? { mimeType: preferredType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      let started = false;
      const confirmStarted = () => {
        if (started || disposedRef.current) return;
        started = true;
        clearAttempt();
        setRecording(true);
        setPreparing(false);
        timeoutRef.current = window.setTimeout(stopRecording, 30_000);
      };
      recorder.onstart = confirmStarted;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || preferredType || "audio/webm" });
        releaseStream();
        if (disposedRef.current) return;
        if (!blob.size) {
          setError("Chưa ghi nhận được âm thanh. Hãy kiểm tra micro rồi thử lại.");
          return;
        }
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        setAudioBlob(blob);
        setAudioUrl(url);
      };
      recorder.onerror = () => {
        setRecording(false);
        setPreparing(false);
        releaseStream();
        setError("Có lỗi khi ghi âm. Hãy thử lại.");
      };
      recorder.start(250);
      if (recorder.state !== "recording") throw new Error("Recorder did not start");
      confirmStarted();
    } catch (cause) {
      releaseStream();
      const denied = cause instanceof DOMException && (cause.name === "NotAllowedError" || cause.name === "PermissionDeniedError");
      const busy = cause instanceof DOMException && cause.name === "NotReadableError";
      setError(denied
        ? "Micro đang bị chặn. Hãy cho phép quyền micro trong trình duyệt rồi thử lại."
        : busy
          ? "Micro đang được ứng dụng khác sử dụng. Hãy đóng ứng dụng đó rồi thử lại."
          : "Không thể mở micro. Hãy kiểm tra thiết bị rồi thử lại.");
    } finally {
      if (!disposedRef.current) setPreparing(false);
    }
  };

  const scoreRecording = async () => {
    if (!audioBlob) return;
    setScoring(true);
    setError("");
    try {
      const extension = audioBlob.type.includes("mp4") ? "m4a" : audioBlob.type.includes("ogg") ? "ogg" : "webm";
      const form = new FormData();
      form.append("audio", audioBlob, `recording.${extension}`);
      form.append("target", target);
      const response = await fetch("/api/speech-score", { method: "POST", body: form });
      const body = await response.json().catch(() => ({})) as Partial<SpeechScore> & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Chưa thể chấm bản ghi.");
      setResult(body as SpeechScore);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Chưa thể chấm bản ghi. Hãy thử lại.");
    } finally {
      setScoring(false);
    }
  };

  return (
    <section className={expanded ? "recording-practice open" : "recording-practice"} aria-labelledby="recording-title">
      <button className="recording-toggle" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} disabled={recording || preparing}>
        <span className="recording-icon"><Mic2 aria-hidden="true" /></span>
        <span><strong id="recording-title">Luyện nói & chấm điểm</strong><small>Thu một câu, nghe lại rồi kiểm tra</small></span>
        <ChevronRight aria-hidden="true" />
      </button>
      {expanded && (
        <div className="recording-body">
          {!audioBlob && (
            <div className="recording-start">
              <button className={recording ? "app-action record-button recording" : "app-action record-button"} onClick={recording ? stopRecording : startRecording} disabled={preparing} aria-busy={preparing}>
                {preparing ? <LoaderCircle className="button-spinner" aria-hidden="true" /> : recording ? <Square size={18} fill="currentColor" aria-hidden="true" /> : <Mic2 size={20} aria-hidden="true" />}
                {preparing ? "Đang mở micro…" : recording ? "Dừng ghi" : "Bắt đầu thu"}
              </button>
              <span className="recording-time">{preparing ? "Vui lòng đợi một chút" : recording ? `Đang thu · 0:${String(seconds).padStart(2, "0")} / 0:30` : "Tối đa 30 giây"}</span>
            </div>
          )}

          {audioBlob && audioUrl && (
            <div className="recording-review">
              <span className="recording-status" role="status"><Check size={18} aria-hidden="true" /> Đã thu · 0:{String(Math.max(seconds, 1)).padStart(2, "0")}</span>
              <div className="recording-actions">
                <button className={playing ? "app-action playback-button playing" : "app-action playback-button"} onClick={togglePlayback}>
                  {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} fill="currentColor" aria-hidden="true" />}
                  {playing ? "Tạm dừng" : "Nghe lại"}
                </button>
                <button className="app-action secondary-button" onClick={clearAttempt} disabled={scoring}><RotateCcw size={17} aria-hidden="true" /> Thu lại</button>
                <button className="app-action score-button" onClick={scoreRecording} disabled={scoring} aria-busy={scoring} aria-label={scoring ? "Đang chấm điểm" : undefined}>
                  {scoring ? <LoaderCircle className="tts-loader" aria-hidden="true" /> : <><Sparkles size={18} aria-hidden="true" /> Chấm điểm</>}
                </button>
              </div>
              <audio ref={playbackRef} src={audioUrl} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
            </div>
          )}

          {error && <p className="recording-error" role="alert">{error}</p>}

          {result && (
            <div className="score-result" aria-live="polite">
              <div className="score-value"><strong>{result.score}</strong><span>/100</span><small>Độ khớp nội dung</small></div>
              <div className="score-copy">
                <strong>{result.feedback}</strong>
                <p><span>Máy nhận được:</span> “{result.transcript || "Chưa nhận diện được lời nói."}”</p>
                {result.missingWords.length > 0 && <p><span>Nên nghe lại:</span> {result.missingWords.join(", ")}</p>}
              </div>
            </div>
          )}

          <p className="recording-note">Bản ghi chỉ được gửi tới OpenAI khi bạn bấm “Chấm điểm” và không được lưu trong ứng dụng. Điểm phản ánh độ khớp nội dung máy nhận diện, không phải phân tích âm vị.</p>
        </div>
      )}
    </section>
  );
}

function Logo() {
  return (
    <div className="logo" aria-label="Daily Flow English">
      <span className="logo-mark"><Sparkles size={22} aria-hidden="true" /></span>
      <span>Daily<span>Flow</span></span>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [learnTab, setLearnTab] = useState<"sentences" | "patterns">("sentences");
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("cards");
  const [completed, setCompleted] = useState<number[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("daily-flow-progress");
    if (saved) setCompleted(JSON.parse(saved));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("daily-flow-progress", JSON.stringify(completed));
  }, [completed, ready]);

  const progress = Math.round((completed.length / sentences.length) * 100);
  const navigate = (next: View) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Bỏ qua điều hướng</a>
      <aside className="sidebar">
        <Logo />
        <nav className="side-nav" aria-label="Điều hướng chính">
          <NavButton active={view === "home"} icon={<House />} label="Tổng quan" onClick={() => navigate("home")} />
          <NavButton active={view === "session"} icon={<Clock3 />} label="15 phút" onClick={() => navigate("session")} />
          <NavButton active={view === "learn"} icon={<BookOpen />} label="Học bài" onClick={() => navigate("learn")} />
          <NavButton active={view === "practice"} icon={<Brain />} label="Luyện tập" onClick={() => navigate("practice")} />
          <NavButton active={view === "story"} icon={<ListChecks />} label="Full story" onClick={() => navigate("story")} />
        </nav>
        <div className="side-spacer" />
        <div className="mini-goal">
          <span className="goal-icon"><Target size={20} aria-hidden="true" /></span>
          <div><strong>Mục tiêu hôm nay</strong><small>15 phút học & ôn</small></div>
        </div>
        <div className="profile-button">
          <CircleUserRound aria-hidden="true" />
          <span><strong>Long</strong><small>Beginner · A2</small></span>
          <Settings size={18} aria-hidden="true" />
        </div>
      </aside>

      <div className="page-wrap">
        <header className="mobile-header">
          <Logo />
          <div className="streak"><Flame size={17} aria-hidden="true" /> 7 ngày</div>
        </header>
        <main id="main" tabIndex={-1}>
          {view === "home" && <Dashboard progress={progress} completed={completed.length} onNavigate={navigate} onStart={() => { setSentenceIndex(Math.min(completed.length, 27)); navigate("learn"); }} />}
          {view === "session" && <SessionView />}
          {view === "learn" && (
            <LearnView
              index={sentenceIndex}
              setIndex={setSentenceIndex}
              completed={completed}
              setCompleted={setCompleted}
              tab={learnTab}
              setTab={setLearnTab}
            />
          )}
          {view === "practice" && <PracticeView mode={practiceMode} setMode={setPracticeMode} />}
          {view === "story" && <StoryView />}
        </main>
        <p className="ai-disclosure"><Sparkles size={14} aria-hidden="true" /> Giọng đọc AI do OpenAI tạo, không phải giọng người thật.</p>
      </div>

      <nav className="bottom-nav" aria-label="Điều hướng di động">
        <NavButton active={view === "home"} icon={<House />} label="Tổng quan" onClick={() => navigate("home")} />
        <NavButton active={view === "session"} icon={<Clock3 />} label="15 phút" onClick={() => navigate("session")} />
        <NavButton active={view === "learn"} icon={<BookOpen />} label="Học bài" onClick={() => navigate("learn")} />
        <NavButton active={view === "practice"} icon={<Brain />} label="Luyện tập" onClick={() => navigate("practice")} />
        <NavButton active={view === "story"} icon={<ListChecks />} label="Story" onClick={() => navigate("story")} />
      </nav>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button className={active ? "nav-item active" : "nav-item"} aria-current={active ? "page" : undefined} onClick={onClick}>{icon}<span>{label}</span></button>;
}

function Dashboard({ progress, completed, onNavigate, onStart }: { progress: number; completed: number; onNavigate: (v: View) => void; onStart: () => void }) {
  return (
    <div className="page-content dashboard">
      <div className="eyebrow-row">
        <span className="eyebrow">LESSON 01</span>
        <span className="streak desktop-streak"><Flame size={17} aria-hidden="true" /> 7 ngày liên tiếp</span>
      </div>
      <section className="hero-card">
        <div className="hero-copy">
          <span className="level-pill"><Sparkles size={16} aria-hidden="true" /> Natural Everyday English</span>
          <h1>My Daily<br /><em>Routine</em></h1>
          <p>Kể về một ngày điển hình bằng những cụm từ tự nhiên, dễ nhớ và dùng được ngay.</p>
          <button className="app-action primary-button" onClick={onStart}><Play size={19} fill="currentColor" aria-hidden="true" />{progress ? "Tiếp tục học" : "Bắt đầu bài học"}</button>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="sun"><span>5:40</span><small>AM</small></div>
          <span className="floating-chip chip-one">get up</span>
          <span className="floating-chip chip-two">head out</span>
          <span className="floating-chip chip-three">clock in</span>
          <div className="city-shape building-one" />
          <div className="city-shape building-two" />
          <div className="road" />
        </div>
      </section>

      <section className="progress-section" aria-labelledby="progress-title">
        <div className="section-heading">
          <div><span className="kicker">LỘ TRÌNH CỦA BẠN</span><h2 id="progress-title">Học từng bước nhỏ</h2></div>
          <strong className="percent">{progress}%</strong>
        </div>
        <div className="progress-track"><span style={{ width: `${Math.max(progress, 4)}%` }} /></div>
        <p className="progress-note">Đã thành thạo {completed}/28 câu · Tiến độ được lưu tự động</p>
      </section>

      <section className="study-grid" aria-label="Các hoạt động học">
        <ActivityCard icon={<BookOpen />} title="Học từng câu" detail="English · IPA · Tiếng Việt" meta={`${completed}/28 câu`} color="indigo" onClick={() => onNavigate("learn")} />
        <ActivityCard icon={<Brain />} title="Luyện phản xạ" detail="Flashcards · Q&A · Dictation" meta="6 chế độ" color="mint" onClick={() => onNavigate("practice")} />
        <ActivityCard icon={<Mic2 />} title="Thử thách nói" detail="Nói liền mạch theo gợi ý" meta="30s → 2 phút" color="orange" onClick={() => onNavigate("practice")} />
      </section>

      <section className="today-card">
        <div className="today-title"><span><Clock3 size={20} aria-hidden="true" /></span><div><small>ÔN NHANH HÔM NAY</small><h2>Một ngày của bạn, bằng tiếng Anh</h2></div></div>
        <div className="micro-stats"><div><strong>9</strong><span>cấu trúc cốt lõi</span></div><div><strong>12</strong><span>flashcards</span></div><div><strong>20</strong><span>câu phản xạ</span></div></div>
        <button className="app-action session-cta" onClick={() => onNavigate("session")}><Play size={17} fill="currentColor" aria-hidden="true" /> Bắt đầu 15 phút</button>
      </section>

      <Timeline />
    </div>
  );
}

function ActivityCard({ icon, title, detail, meta, color, onClick }: { icon: React.ReactNode; title: string; detail: string; meta: string; color: string; onClick: () => void }) {
  return (
    <button className="activity-card" onClick={onClick}>
      <span className={`activity-icon ${color}`}>{icon}</span>
      <span className="activity-copy"><strong>{title}</strong><small>{detail}</small><b>{meta}</b></span>
      <ChevronRight aria-hidden="true" />
    </button>
  );
}

function Timeline() {
  return (
    <section className="timeline-section" aria-labelledby="timeline-title">
      <div className="section-heading"><div><span className="kicker">TIMELINE METHOD</span><h2 id="timeline-title">Nhìn một lần, kể cả ngày</h2></div></div>
      <div className="timeline-list">
        {timeline.map(([time, title, detail], index) => (
          <div className="timeline-item" key={time}>
            <time>{time}</time><span className="timeline-dot">{index + 1}</span><div><strong>{title}</strong><p>{detail}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LearnView({ index, setIndex, completed, setCompleted, tab, setTab }: { index: number; setIndex: (i: number) => void; completed: number[]; setCompleted: React.Dispatch<React.SetStateAction<number[]>>; tab: "sentences" | "patterns"; setTab: (t: "sentences" | "patterns") => void }) {
  const item = sentences[index];
  const isDone = completed.includes(index);
  const markDone = () => setCompleted((old) => isDone ? old.filter((n) => n !== index) : [...old, index]);

  return (
    <div className="page-content inner-page">
      <PageTitle kicker="LESSON 01" title="Học bài" description="Nghe, đọc theo cụm và hiểu ý trước khi chuyển câu." />
      <div className="segmented" role="tablist" aria-label="Nội dung học">
        <button role="tab" aria-selected={tab === "sentences"} onClick={() => setTab("sentences")}>28 câu mẫu</button>
        <button role="tab" aria-selected={tab === "patterns"} onClick={() => setTab("patterns")}>9 cấu trúc</button>
      </div>
      {tab === "sentences" ? (
        <section className="lesson-workspace">
          <div className="lesson-index">
            <div className="counter-line"><span>Câu {index + 1} / {sentences.length}</span><span>{completed.length} đã học</span></div>
            <div className="step-track"><span style={{ width: `${((index + 1) / sentences.length) * 100}%` }} /></div>
          </div>
          <article className="sentence-card">
            <TTSButton className="app-icon-action sound-button" text={item.en} speed={0.9} ariaLabel="Nghe câu tiếng Anh bằng giọng đọc AI"><Volume2 aria-hidden="true" /></TTSButton>
            <span className="card-label">ENGLISH</span>
            <h2>{item.en}</h2>
            <p className="ipa">{item.ipa}</p>
            <div className="translation"><span>TIẾNG VIỆT</span><p>{item.vi}</p></div>
            <div className="coach-tip"><Lightbulb aria-hidden="true" /><p><strong>Mẹo luyện nói</strong> Nghe một lần, đọc theo cụm 3 lần, sau đó nói lại mà không nhìn.</p></div>
          </article>
          <RecordingPractice key={item.en} target={item.en} />
          <div className="lesson-actions">
            <button className="app-action secondary-button" disabled={index === 0} onClick={() => setIndex(index - 1)}><ArrowLeft aria-hidden="true" /> Câu trước</button>
            <button className={isDone ? "app-action done-button completed" : "app-action done-button"} onClick={markDone}><Check aria-hidden="true" /> {isDone ? "Đã thành thạo" : "Đánh dấu đã học"}</button>
            <button className="app-action primary-button small" disabled={index === sentences.length - 1} onClick={() => setIndex(index + 1)}>Câu tiếp <ArrowRight aria-hidden="true" /></button>
          </div>
          <div className="sentence-picker" aria-label="Chọn câu">
            {sentences.map((_, i) => <button key={i} className={`${i === index ? "current" : ""} ${completed.includes(i) ? "done" : ""}`} onClick={() => setIndex(i)} aria-label={`Câu ${i + 1}${completed.includes(i) ? ", đã học" : ""}`}>{completed.includes(i) ? <Check size={14} /> : i + 1}</button>)}
          </div>
        </section>
      ) : (
        <section className="pattern-grid">
          {patterns.map(([formula, example], i) => <article className="pattern-card" key={formula}><span>{String(i + 1).padStart(2, "0")}</span><h2>{formula}</h2><p>{example}</p><TTSButton className="app-icon-action" text={example} speed={0.9} ariaLabel={`Nghe ví dụ ${formula}`}><Volume2 aria-hidden="true" /></TTSButton></article>)}
        </section>
      )}
    </div>
  );
}

function PracticeView({ mode, setMode }: { mode: PracticeMode; setMode: (m: PracticeMode) => void }) {
  return (
    <div className="page-content inner-page">
      <PageTitle kicker="LUYỆN TẬP" title="Biến kiến thức thành phản xạ" description="Chọn một hoạt động ngắn và luyện đến khi câu bật ra tự nhiên." />
      <div className="practice-layout">
        <nav className="practice-menu" aria-label="Chế độ luyện tập">
          {practiceModes.map((item, index) => <button key={item.id} className={mode === item.id ? "active" : ""} onClick={() => setMode(item.id)}><span>{index + 1}</span><div><strong>{item.label}</strong><small>{item.detail}</small></div><ChevronRight aria-hidden="true" /></button>)}
        </nav>
        <section className="practice-stage">
          {mode === "cards" && <FlashcardPractice />}
          {mode === "repeat" && <RepetitionPractice />}
          {mode === "qa" && <QA />}
          {mode === "dictation" && <Dictation />}
          {mode === "shadowing" && <Shadowing />}
          {mode === "speaking" && <SpeakingChallenge />}
        </section>
      </div>
    </div>
  );
}

function FlashcardPractice() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const next = (delta: number) => { setIndex((index + delta + flashcards.length) % flashcards.length); setFlipped(false); };
  return (
    <div className="practice-panel">
      <PracticeHeader label="FLASHCARDS" title="Nhớ theo cả câu" text="Đọc tiếng Việt, tự nói tiếng Anh rồi mới lật thẻ." count={`${index + 1}/${flashcards.length}`} />
      <button className={flipped ? "flashcard flipped" : "flashcard"} onClick={() => setFlipped(!flipped)} aria-label={flipped ? "Ẩn đáp án" : "Lật thẻ xem đáp án"}>
        <span>{flipped ? "ĐÁP ÁN" : "NÓI BẰNG TIẾNG ANH"}</span>
        <strong>{flipped ? flashcards[index][1] : flashcards[index][0]}</strong>
        <small>{flipped ? "Chạm để quay lại" : "Chạm để lật thẻ"}</small>
      </button>
      {flipped && <TTSButton className="app-action listen-link" text={flashcards[index][1]} speed={0.9} ariaLabel="Nghe đáp án bằng giọng đọc AI"><Volume2 aria-hidden="true" /> Nghe đáp án</TTSButton>}
      <div className="practice-controls"><button className="app-icon-action" onClick={() => next(-1)} aria-label="Thẻ trước"><ArrowLeft /></button><button className="app-action primary-button small" onClick={() => next(1)}>Thẻ tiếp <ArrowRight /></button></div>
    </div>
  );
}

function RepetitionPractice() {
  const [counts, setCounts] = useState<number[]>(Array(5).fill(0));
  const total = counts.reduce((a, b) => a + b, 0);
  return (
    <div className="practice-panel">
      <PracticeHeader label="REPETITION DRILL" title="Nói 5 lần mỗi câu" text="Bấm vào vòng tròn sau mỗi lần đọc to." count={`${total}/25 lượt`} />
      <div className="repeat-list">
        {repetition.map((text, i) => <article key={text}><TTSButton className="app-icon-action mini-sound" text={text} speed={0.9} ariaLabel={`Nghe câu ${i + 1} bằng giọng đọc AI`}><Volume2 /></TTSButton><p>{text}</p><button className="app-icon-action repeat-count" onClick={() => setCounts((old) => old.map((n, j) => j === i ? Math.min(5, n + 1) : n))}>{counts[i] === 5 ? <Check /> : `${counts[i]}/5`}</button></article>)}
      </div>
      <button className="app-action reset-link" onClick={() => setCounts(Array(5).fill(0))}><RotateCcw aria-hidden="true" /> Làm lại</button>
    </div>
  );
}

function QA() {
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(false);
  return (
    <div className="practice-panel">
      <PracticeHeader label="QUESTION & ANSWER" title="Trả lời ngay, đừng dịch" text="Nghe câu hỏi và trả lời thành tiếng trước khi xem gợi ý." count={`${index + 1}/${qa.length}`} />
      <div className="qa-card"><TTSButton className="app-icon-action sound-button" text={qa[index][0]} speed={0.95} ariaLabel="Nghe câu hỏi bằng giọng đọc AI"><Volume2 aria-hidden="true" /></TTSButton><span>QUESTION</span><h2>{qa[index][0]}</h2>{show ? <div className="answer-reveal"><div><small>SUGGESTED ANSWER</small><p>{qa[index][1]}</p></div><TTSButton className="app-icon-action inline-sound" text={qa[index][1]} speed={0.9} ariaLabel="Nghe câu trả lời bằng giọng đọc AI"><Volume2 aria-hidden="true" /></TTSButton></div> : <button className="app-action reveal-button" onClick={() => setShow(true)}><Lightbulb aria-hidden="true" /> Xem câu trả lời</button>}</div>
      <div className="practice-controls"><button className="app-icon-action" disabled={index === 0} onClick={() => { setIndex(index - 1); setShow(false); }}><ArrowLeft /></button><button className="app-action primary-button small" disabled={index === qa.length - 1} onClick={() => { setIndex(index + 1); setShow(false); }}>Câu tiếp <ArrowRight /></button></div>
    </div>
  );
}

function Dictation() {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "right" | "wrong">("idle");
  const target = sentences[[0, 10, 24, 26][index]].en;
  const normalize = (value: string) => value.toLowerCase().replace(/[.,’']/g, "").replace(/\s+/g, " ").trim();
  const check = () => setStatus(normalize(answer) === normalize(target) ? "right" : "wrong");
  return (
    <div className="practice-panel">
      <PracticeHeader label="DICTATION" title="Nghe và viết lại" text="Bạn có thể nghe nhiều lần. Chấm câu không ảnh hưởng kết quả." count={`${index + 1}/4`} />
      <div className="dictation-card"><TTSButton className="app-action listen-big" text={target} speed={0.78} ariaLabel="Nghe câu chính tả bằng giọng đọc AI"><Headphones aria-hidden="true" /><span>Nghe câu</span></TTSButton><label htmlFor="dictation">Câu bạn nghe được</label><textarea id="dictation" rows={3} value={answer} onChange={(e) => { setAnswer(e.target.value); setStatus("idle"); }} placeholder="Type what you hear..." />{status !== "idle" && <div className={`feedback ${status}`} role="status">{status === "right" ? <><Check /> Chính xác! Nghe và nói lại thêm một lần nhé.</> : <><X /> Chưa khớp. Gợi ý: “{target.split(" ").slice(0, 3).join(" ")}...”</>}</div>}<button className="app-action primary-button small full" disabled={!answer.trim()} onClick={check}><Check aria-hidden="true" /> Kiểm tra</button></div>
      <div className="dot-pages">{[0,1,2,3].map((n) => <button key={n} aria-label={`Câu chính tả ${n + 1}`} className={n === index ? "active" : ""} onClick={() => { setIndex(n); setAnswer(""); setStatus("idle"); }} />)}</div>
    </div>
  );
}

function Shadowing() {
  const [index, setIndex] = useState(0);
  return (
    <div className="practice-panel">
      <PracticeHeader label="SHADOWING" title="Nói theo nhịp, không đọc từng từ" text="Dấu gạch chéo là điểm ngắt tự nhiên. Nghe rồi bám theo nhịp câu." count={`${index + 1}/${shadowing.length}`} />
      <div className="shadow-card"><div className="wave" aria-hidden="true">{Array.from({ length: 24 }).map((_, i) => <i key={i} style={{ height: `${18 + ((i * 13) % 42)}px` }} />)}</div><p>{shadowing[index].split("/").map((chunk, i) => <span key={i}>{chunk.trim()}</span>)}</p><TTSButton className="app-action primary-button" text={shadowing[index]} speed={0.78} ariaLabel="Nghe đoạn shadowing bằng giọng đọc AI"><Play size={18} fill="currentColor" /> Nghe đoạn mẫu</TTSButton></div>
      <div className="practice-controls"><button className="app-icon-action" disabled={index === 0} onClick={() => setIndex(index - 1)}><ArrowLeft /></button><button className="app-action primary-button small" disabled={index === shadowing.length - 1} onClick={() => setIndex(index + 1)}>Đoạn tiếp <ArrowRight /></button></div>
    </div>
  );
}

function SpeakingChallenge() {
  const levels = [{ time: 30, name: "Khởi động", words: "5:40 · son · school · office · work · lunch · home" }, { time: 60, name: "Tăng tốc", words: "motorcycle · breakfast · B3 · coffee · BA · UI/UX · coworkers" }, { time: 120, name: "Kể trọn ngày", words: "Chỉ nhìn timeline và kể bằng lời của bạn" }];
  const [level, setLevel] = useState(0);
  const [left, setLeft] = useState(levels[0].time);
  const [running, setRunning] = useState(false);
  useEffect(() => { if (!running) return; const timer = window.setInterval(() => setLeft((n) => { if (n <= 1) { setRunning(false); return 0; } return n - 1; }), 1000); return () => clearInterval(timer); }, [running]);
  const choose = (i: number) => { setLevel(i); setLeft(levels[i].time); setRunning(false); };
  const format = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  return (
    <div className="practice-panel">
      <PracticeHeader label="SPEAKING CHALLENGE" title="Nói liên tục, không cần hoàn hảo" text="Mục tiêu là đúng ý → liên tục → tự nhiên." count={`Level ${level + 1}`} />
      <div className="level-switch">{levels.map((item, i) => <button key={item.name} className={i === level ? "active" : ""} onClick={() => choose(i)}><span>{i + 1}</span>{item.name}</button>)}</div>
      <div className="timer-card"><span>THỜI GIAN CÒN LẠI</span><strong>{format}</strong><p>{levels[level].words}</p><div><button className="app-action timer-main" onClick={() => left === 0 ? setLeft(levels[level].time) : setRunning(!running)}>{running ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}{left === 0 ? "Làm lại" : running ? "Tạm dừng" : "Bắt đầu nói"}</button><button className="app-icon-action timer-reset" onClick={() => { setLeft(levels[level].time); setRunning(false); }} aria-label="Đặt lại bộ đếm"><RotateCcw /></button></div></div>
    </div>
  );
}

function PracticeHeader({ label, title, text, count }: { label: string; title: string; text: string; count: string }) {
  return <header className="practice-header"><div><span>{label}</span><h2>{title}</h2><p>{text}</p></div><b>{count}</b></header>;
}

function SessionView() {
  const [step, setStep] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(sessionSteps[0].minutes * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const totalSeconds = sessionSteps.reduce((sum, item) => sum + item.minutes * 60, 0);
  const elapsedBefore = sessionSteps.slice(0, step).reduce((sum, item) => sum + item.minutes * 60, 0);
  const elapsed = finished ? totalSeconds : elapsedBefore + sessionSteps[step].minutes * 60 - secondsLeft;
  const progress = Math.round((elapsed / totalSeconds) * 100);

  useEffect(() => {
    if (!running || finished) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current > 1) return current - 1;
        if (step === sessionSteps.length - 1) {
          setRunning(false);
          setFinished(true);
          return 0;
        }
        const next = step + 1;
        setStep(next);
        return sessionSteps[next].minutes * 60;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [finished, running, step]);

  const goToStep = (next: number, keepRunning = false) => {
    setStep(next);
    setSecondsLeft(sessionSteps[next].minutes * 60);
    setFinished(false);
    setRunning(keepRunning);
  };
  const reset = () => goToStep(0);
  const next = () => {
    if (step < sessionSteps.length - 1) return goToStep(step + 1, running);
    setFinished(true);
    setRunning(false);
    setSecondsLeft(0);
  };
  const time = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return (
    <div className="page-content inner-page session-page">
      <PageTitle kicker="DAILY FLOW" title="Một phiên học trọn vẹn trong 15 phút" description="Học ít nhưng đủ vòng: nghe → hiểu → nhớ → phản xạ → tự nói." />
      <div className="session-overview" aria-label="Tiến độ phiên học">
        <div><span>TIẾN ĐỘ TỔNG</span><strong>{progress}%</strong></div>
        <div className="session-progress"><span style={{ width: `${progress}%` }} /></div>
        <p>Bước {step + 1}/{sessionSteps.length} · {Math.ceil((totalSeconds - elapsed) / 60)} phút còn lại</p>
      </div>

      <div className="session-layout">
        <nav className="session-timeline" aria-label="Timeline 15 phút">
          {sessionSteps.map((item, index) => {
            const done = finished || index < step;
            return (
              <button key={item.label} className={`${index === step ? "active" : ""} ${done ? "done" : ""}`} aria-current={index === step ? "step" : undefined} onClick={() => goToStep(index)}>
                <span className="session-step-dot">{done ? <Check size={16} /> : index + 1}</span>
                <span className="session-step-copy"><strong>{item.label}</strong><small>{item.minutes} phút · {item.detail}</small></span>
              </button>
            );
          })}
        </nav>

        <section className="session-player" aria-labelledby="session-step-title">
          {finished ? (
            <div className="session-finished">
              <span><Check size={35} aria-hidden="true" /></span>
              <small>HOÀN THÀNH 15 PHÚT</small>
              <h2>Great work today!</h2>
              <p>Bạn đã đi đủ một vòng nghe, học, nhớ và nói. Ngày mai chỉ cần lặp lại thêm một lần.</p>
              <button className="app-action primary-button small" onClick={reset}><RotateCcw aria-hidden="true" /> Học lại từ đầu</button>
            </div>
          ) : (
            <>
              <header className="session-player-head">
                <div><span>CHẶNG {step + 1} · {sessionSteps[step].minutes} PHÚT</span><h2 id="session-step-title">{sessionSteps[step].label}</h2></div>
                <div className="session-clock" role="timer" aria-label={`Còn ${time}`}><Clock3 aria-hidden="true" /><strong>{time}</strong></div>
              </header>
              <p className="session-live" aria-live="polite">Đang ở chặng {step + 1}: {sessionSteps[step].label}</p>
              <SessionTask step={step} />
              <div className="session-controls">
                <button className="app-icon-action session-reset" onClick={reset} aria-label="Làm lại toàn bộ phiên học"><RotateCcw /></button>
                <button className="app-action timer-main" onClick={() => setRunning(!running)}>{running ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}{running ? "Tạm dừng" : elapsed ? "Tiếp tục" : "Bắt đầu"}</button>
                <button className="app-action session-next" onClick={next}>{step === sessionSteps.length - 1 ? "Hoàn tất" : "Chặng tiếp"}<ArrowRight /></button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function SessionTask({ step }: { step: number }) {
  if (step === 0 || step === 1) {
    const indexes = step === 0 ? [0, 1] : [10, 13, 24, 26];
    return <div className="session-sentences">{indexes.map((index) => <article key={index}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{sentences[index].en}</strong><small>{sentences[index].vi}</small></div><TTSButton className="app-icon-action" text={sentences[index].en} speed={0.88} ariaLabel={`Nghe câu ${index + 1} bằng giọng đọc AI`}><Volume2 /></TTSButton></article>)}</div>;
  }

  if (step === 2) {
    return <div className="session-reveals">{flashcards.slice(2, 6).map(([vi, en]) => <details key={en}><summary><span>{vi}</span><small>Chạm để xem Natural English</small></summary><div><strong>{en}</strong><TTSButton className="app-icon-action" text={en} speed={0.9} ariaLabel="Nghe câu trả lời bằng giọng đọc AI"><Volume2 /></TTSButton></div></details>)}</div>;
  }

  if (step === 3) {
    return <div className="session-reveals">{qa.slice(7, 11).map(([question, answer]) => <details key={question}><summary><span>{question}</span><small>Trả lời thành tiếng trước khi mở</small></summary><div><strong>{answer}</strong><TTSButton className="app-icon-action" text={`${question} ${answer}`} speed={0.92} ariaLabel="Nghe câu hỏi và trả lời bằng giọng đọc AI"><Volume2 /></TTSButton></div></details>)}</div>;
  }

  if (step === 4) {
    return <div className="session-shadow">{shadowing.slice(0, 2).map((text, index) => <article key={text}><span>ĐOẠN {index + 1}</span><p>{text.split("/").map((chunk, i) => <strong key={i}>{chunk.trim()}</strong>)}</p><TTSButton className="app-action primary-button small" text={text} speed={0.78} ariaLabel={`Nghe đoạn shadowing ${index + 1}`}><Headphones /> Nghe & nói theo</TTSButton></article>)}</div>;
  }

  return <div className="session-speak"><Mic2 aria-hidden="true" /><span>KHÔNG NHÌN BÀI MẪU</span><h3>Kể lại ngày của bạn</h3><p>5:40 · son · school · breakfast · office · BA · lunch · 5:30 · home</p><small>Không cần đúng 100%. Hãy ưu tiên nói liên tục và tự nhiên.</small></div>;
}

function StoryView() {
  return (
    <div className="page-content inner-page story-page">
      <PageTitle kicker="FULL STORY" title="My Daily Routine" description="Đọc theo ý, theo cụm — không học thuộc từng chữ." />
      <div className="story-layout">
        <article className="story-card"><div className="story-toolbar"><span>Natural Everyday English</span><TTSButton className="app-action" text={story} speed={0.84} ariaLabel="Nghe toàn bài bằng giọng đọc AI"><Volume2 aria-hidden="true" /> Nghe toàn bài</TTSButton></div>{story.split("\n\n").map((p, i) => <div className="story-paragraph" key={i}><p>{p}</p><TTSButton className="app-icon-action inline-sound" text={p} speed={0.86} ariaLabel={`Nghe đoạn ${i + 1} bằng giọng đọc AI`}><Volume2 aria-hidden="true" /></TTSButton></div>)}</article>
        <aside className="story-aside"><span>ĐÍCH ĐẾN</span><h2>Nói 2–3 phút về một ngày của bạn</h2><ul><li><Check /> Dùng các cụm quen thuộc</li><li><Check /> Nói liên tục, không dịch</li><li><Check /> Không cần giống mẫu 100%</li></ul><blockquote>“Correct ideas. Smooth flow. Natural English.”</blockquote></aside>
      </div>
      <section className="upgrade-card">
        <span className="kicker">BASIC → BETTER → NATURAL</span>
        <div className="upgrade-list">
          {upgradeExamples.map(([basic, better, natural], index) => (
            <article className="upgrade-flow" key={natural} aria-label={`Nhóm nâng cấp câu ${index + 1}`}>
              <div><span><small>Basic</small><p>{basic}</p></span><TTSButton className="app-icon-action inline-sound" text={basic} speed={0.9} ariaLabel={`Nghe câu Basic nhóm ${index + 1}`}><Volume2 aria-hidden="true" /></TTSButton></div>
              <ArrowRight aria-hidden="true" />
              <div><span><small>Better</small><p>{better}</p></span><TTSButton className="app-icon-action inline-sound" text={better} speed={0.9} ariaLabel={`Nghe câu Better nhóm ${index + 1}`}><Volume2 aria-hidden="true" /></TTSButton></div>
              <ArrowRight aria-hidden="true" />
              <div><span><small>Natural</small><p>{natural}</p></span><TTSButton className="app-icon-action inline-sound" text={natural} speed={0.88} ariaLabel={`Nghe câu Natural nhóm ${index + 1}`}><Volume2 aria-hidden="true" /></TTSButton></div>
            </article>
          ))}
        </div>
      </section>
      <details className="source-panel">
        <summary>
          <span><ListChecks aria-hidden="true" /><span><strong>Nguồn & phương pháp biên tập</strong><small>American English · kiểm chứng nghĩa, ngữ cảnh và cách nói thực tế</small></span></span>
          <ChevronRight aria-hidden="true" />
        </summary>
        <div className="source-panel-body">
          <ol>
            <li><strong>Cambridge</strong><span>Xác minh nghĩa, cách dùng, IPA và phát âm.</span></li>
            <li><strong>COCA</strong><span>Đối chiếu tần suất và ngữ cảnh American English.</span></li>
            <li><strong>YouGlish US</strong><span>Nghe lại cụm từ qua nhiều người nói và tình huống thực tế.</span></li>
          </ol>
          <div className="source-links">
            {editorialSources.map((source) => <a key={source.name} href={source.href} target="_blank" rel="noreferrer"><strong>{source.name}</strong><span>{source.role}</span></a>)}
          </div>
          <div className="verified-phrases">
            <strong>Cụm cốt lõi đã đối chiếu</strong>
            <ul>{verifiedNaturalPhrases.map((item) => <li key={item.phrase}><span>{item.phrase}</span><a href={item.dictionary} target="_blank" rel="noreferrer">Cambridge</a><a href={item.usage} target="_blank" rel="noreferrer">YouGlish</a></li>)}</ul>
          </div>
        </div>
      </details>
    </div>
  );
}

function PageTitle({ kicker, title, description }: { kicker: string; title: string; description: string }) {
  return <header className="page-title"><span className="kicker">{kicker}</span><h1>{title}</h1><p>{description}</p></header>;
}
