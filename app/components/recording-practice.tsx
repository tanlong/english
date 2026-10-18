"use client";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronRight,
  LoaderCircle,
  Mic2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
} from "lucide-react";
import { stopAudio } from "../audio/client";
type SpeechScore = {
  score: number;
  transcript: string;
  missingWords: string[];
  feedback: string;
};
export function RecordingPractice({
  target,
  onRecorded,
}: {
  target: string;
  onRecorded?: () => void;
}) {
  const [consent, setConsent] = useState(false);
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
    stopAudio();
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
      const preferredType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      const recorder = new MediaRecorder(
        stream,
        preferredType ? { mimeType: preferredType } : undefined,
      );
      recorderRef.current = recorder;
      chunksRef.current = [];
      let started = false;
      const confirmStarted = () => {
        if (started || disposedRef.current) return;
        started = true;
        clearAttempt();
        setRecording(true);
        setPreparing(false);
        timeoutRef.current = window.setTimeout(stopRecording, 30000);
      };
      recorder.onstart = confirmStarted;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || preferredType || "audio/webm",
        });
        releaseStream();
        if (disposedRef.current) return;
        if (!blob.size) {
          setError("Chưa ghi nhận được âm thanh. Hãy kiểm tra micro rồi thử lại.");
          return;
        }
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        setAudioBlob(blob);
        onRecorded?.();
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
      const denied =
        cause instanceof DOMException &&
        (cause.name === "NotAllowedError" || cause.name === "PermissionDeniedError");
      const busy = cause instanceof DOMException && cause.name === "NotReadableError";
      setError(
        denied
          ? "Micro đang bị chặn. Hãy cho phép quyền micro trong trình duyệt rồi thử lại."
          : busy
            ? "Micro đang được ứng dụng khác sử dụng. Hãy đóng ứng dụng đó rồi thử lại."
            : "Không thể mở micro. Hãy kiểm tra thiết bị rồi thử lại.",
      );
    } finally {
      if (!disposedRef.current) setPreparing(false);
    }
  };
  const scoreRecording = async () => {
    if (!audioBlob || !consent) return;
    setScoring(true);
    setError("");
    setResult(null);
    try {
      const extension = audioBlob.type.includes("mp4")
        ? "m4a"
        : audioBlob.type.includes("ogg")
          ? "ogg"
          : "webm";
      const form = new FormData();
      form.append("audio", audioBlob, `recording.${extension}`);
      form.append("target", target);
      form.append("consent", "true");
      const response = await fetch("/api/speech-score", {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(45000),
      });
      const body = (await response.json().catch(() => null)) as
        | (Partial<SpeechScore> & {
            error?: string;
          })
        | null;
      if (!response.ok) throw new Error(body?.error ?? "Chưa thể kiểm tra bản ghi. Hãy thử lại.");
      if (
        !body ||
        typeof body.score !== "number" ||
        typeof body.transcript !== "string" ||
        typeof body.feedback !== "string" ||
        !Array.isArray(body.missingWords) ||
        !body.missingWords.every((word) => typeof word === "string")
      )
        throw new Error("Chưa nhận được kết quả kiểm tra. Bản ghi vẫn còn; hãy thử kiểm tra lại.");
      setResult(body as SpeechScore);
    } catch (cause) {
      setError(
        cause instanceof TypeError
          ? "Không thể kết nối. Hãy kiểm tra mạng rồi thử lại. Bản ghi của bạn vẫn còn."
          : cause instanceof Error && (cause.name === "TimeoutError" || cause.name === "AbortError")
            ? "Nhận diện mất quá nhiều thời gian. Bản ghi vẫn còn; hãy thử kiểm tra lại."
            : cause instanceof Error
              ? cause.message
              : "Chưa thể kiểm tra bản ghi. Hãy thử lại.",
      );
    } finally {
      setScoring(false);
    }
  };
  return (
    <section
      className={expanded ? "recording-practice open" : "recording-practice"}
      aria-labelledby="recording-title"
    >
      <button
        className="recording-toggle"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        disabled={recording || preparing}
      >
        <span className="recording-icon">
          <Mic2 aria-hidden="true" />
        </span>
        <span>
          <strong id="recording-title">Thu âm & nghe lại</strong>
          <small>Bản ghi chỉ ở trong phiên này; tối đa 30 giây</small>
        </span>
        <ChevronRight aria-hidden="true" />
      </button>
      {expanded && (
        <div className="recording-body">
          {!audioBlob && (
            <div className="recording-start">
              <Button
                variant={recording ? "destructive" : "default"}
                className={
                  recording ? "app-action record-button recording" : "app-action record-button"
                }
                onClick={recording ? stopRecording : startRecording}
                disabled={preparing}
                aria-busy={preparing}
              >
                {preparing ? (
                  <LoaderCircle className="button-spinner" aria-hidden="true" />
                ) : recording ? (
                  <Square size={18} fill="currentColor" aria-hidden="true" />
                ) : (
                  <Mic2 size={20} aria-hidden="true" />
                )}
                {preparing ? "Đang mở micro…" : recording ? "Dừng ghi" : "Bắt đầu thu"}
              </Button>
              <span className="recording-time">
                {preparing
                  ? "Vui lòng đợi một chút"
                  : recording
                    ? `Đang thu · 0:${String(seconds).padStart(2, "0")} / 0:30`
                    : "Tối đa 30 giây"}
              </span>
            </div>
          )}

          {audioBlob && audioUrl && (
            <div className="recording-review">
              <span className="recording-status" role="status">
                <Check size={18} aria-hidden="true" /> Đã thu · 0:
                {String(Math.max(seconds, 1)).padStart(2, "0")}
              </span>
              <div className="recording-actions">
                <Button
                  variant="outline"
                  className={
                    playing ? "app-action playback-button playing" : "app-action playback-button"
                  }
                  onClick={togglePlayback}
                >
                  {playing ? (
                    <Pause size={18} aria-hidden="true" />
                  ) : (
                    <Play size={18} fill="currentColor" aria-hidden="true" />
                  )}
                  {playing ? "Tạm dừng" : "Nghe lại"}
                </Button>
                <Button
                  variant="outline"
                  className="app-action secondary-button"
                  onClick={clearAttempt}
                  disabled={scoring}
                >
                  <RotateCcw size={18} aria-hidden="true" /> Thu lại
                </Button>
                <label className="consent">
                  <Checkbox checked={consent} onCheckedChange={(checked) => setConsent(checked)} />{" "}
                  Tôi đồng ý gửi bản ghi đến OpenAI để nhận diện lời nói.
                </label>
                <Button
                  className="app-action score-button"
                  onClick={scoreRecording}
                  disabled={scoring || !consent}
                  aria-busy={scoring}
                  aria-label={scoring ? "Đang nhận diện bản ghi" : undefined}
                >
                  {scoring ? (
                    <LoaderCircle className="tts-loader" aria-hidden="true" />
                  ) : (
                    <>
                      <Sparkles size={18} aria-hidden="true" /> Kiểm tra nội dung
                    </>
                  )}
                </Button>
              </div>
              <audio
                ref={playbackRef}
                src={audioUrl}
                preload="metadata"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
              />
            </div>
          )}

          {error && (
            <p className="recording-error" role="alert">
              {error}
            </p>
          )}

          {result && (
            <div className="score-result" aria-live="polite">
              <div className="score-value">
                <strong>{result.score}</strong>
                <span>/100</span>
                <small>Độ khớp nội dung</small>
              </div>
              <div className="score-copy">
                <strong>{result.feedback}</strong>
                <p>
                  <span>Máy nhận được:</span> “{result.transcript || "Chưa nhận diện được lời nói."}
                  ”
                </p>
                {result.missingWords.length > 0 && (
                  <p>
                    <span>Nên nghe lại:</span> {result.missingWords.join(", ")}
                  </p>
                )}
              </div>
            </div>
          )}

          <p className="recording-note">
            Bấm “Kiểm tra nội dung” để xem lời bạn vừa nói có khớp câu mẫu không. Bản thu chỉ giữ
            trong lần luyện này.
          </p>
        </div>
      )}
    </section>
  );
}
