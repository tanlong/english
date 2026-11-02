"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((event: {
        results: ArrayLike<{
          isFinal: boolean;
          0: {
            transcript: string;
          };
        }>;
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};
const subscribeToSpeechSupport = () => () => {};
const speechSupported = () =>
  Boolean(
    (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition,
  );
const serverSpeechSupported = () => false;
export function useSpeechInput(options: {
  value: string;
  onChange: (text: string) => void;
  maxLength: number;
  disabled: boolean;
  onStart?: () => void;
  consent?: { value: boolean; set: (value: boolean) => void };
}) {
  const config = useRef(options);
  useEffect(() => {
    config.current = options;
  });
  const micSupported = useSyncExternalStore(
    subscribeToSpeechSupport,
    speechSupported,
    serverSpeechSupported,
  );
  const [localConsent, setLocalConsent] = useState(false);
  const micConsent = options.consent?.value ?? localConsent;
  const setMicConsent = options.consent?.set ?? setLocalConsent;
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState("");
  const recognitionRef = useRef<Recognition | null>(null);
  const micWanted = useRef(false);
  const micRestart = useRef<number | null>(null);
  const mounted = useRef(false);
  function abortMic() {
    micWanted.current = false;
    if (micRestart.current !== null) window.clearTimeout(micRestart.current);
    micRestart.current = null;
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.onresult = recognition.onerror = recognition.onend = null;
      recognition.abort();
      recognitionRef.current = null;
    }
    if (mounted.current) setListening(false);
  }
  useEffect(() => {
    mounted.current = true;
    const hide = () => {
      if (document.visibilityState !== "visible") abortMic();
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      mounted.current = false;
      abortMic();
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);
  useEffect(() => {
    if (options.disabled) abortMic();
  }, [options.disabled]);
  function toggleMic() {
    if (micWanted.current) {
      micWanted.current = false;
      if (micRestart.current !== null) {
        abortMic();
      } else {
        try {
          recognitionRef.current?.stop();
        } catch {
          abortMic();
        }
      }
      return;
    }
    if (config.current.disabled) return;
    if (!micConsent) {
      setMicError("Tích ô đồng ý chuyển giọng nói thành chữ trước khi bật micro.");
      return;
    }
    const speechWindow = window as SpeechWindow;
    const Constructor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Constructor) {
      setMicError("Trình duyệt chưa hỗ trợ nhận diện giọng nói. Bạn vẫn có thể nhập câu trả lời.");
      return;
    }
    config.current.onStart?.();
    setMicError("");
    const recognition = new Constructor();
    recognitionRef.current = recognition;
    micWanted.current = true;
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    const limit = config.current.maxLength;
    let prefix = config.current.value.trim();
    let transcript = "";
    recognition.onresult = (event) => {
      if (recognitionRef.current !== recognition) return;
      transcript = Array.from(event.results)
        .map((result) => result[0].transcript.trim())
        .filter(Boolean)
        .join(" ");
      if (!transcript) return;
      const text = [prefix, transcript].filter(Boolean).join(" ");
      config.current.onChange(text.slice(0, limit));
      if (text.length >= limit) {
        setMicError(
          `Đã đủ ${limit.toLocaleString("vi-VN")} ký tự cho một lượt. Hãy kiểm tra và gửi câu trả lời rồi nói tiếp.`,
        );
        micWanted.current = false;
        recognition.stop();
      }
    };
    recognition.onerror = (event) => {
      if (recognitionRef.current !== recognition) return;
      // A pause is recoverable; onend reconnects while the learner still wants the mic.
      if (event.error === "no-speech") return;
      setMicError(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Chưa được cấp quyền micro. Hãy cho phép micro trong trình duyệt hoặc nhập câu trả lời."
          : "Chưa nhận được giọng nói. Hãy thử mic lại hoặc nhập câu trả lời.",
      );
      abortMic();
    };
    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      if (micWanted.current && mounted.current && document.visibilityState === "visible") {
        // Results reset on each browser recognition run. Keep its latest text once,
        // including interim words, before accepting the next run's cumulative results.
        prefix = [prefix, transcript].filter(Boolean).join(" ").slice(0, limit);
        transcript = "";
        micRestart.current = window.setTimeout(() => {
          micRestart.current = null;
          if (!micWanted.current || recognitionRef.current !== recognition) return;
          try {
            recognition.start();
          } catch {
            abortMic();
            setMicError("Micro đã ngắt. Phần chữ đã nhận vẫn còn; hãy bấm mic để nói tiếp.");
          }
        }, 250);
      } else {
        micWanted.current = false;
        recognitionRef.current = null;
        setListening(false);
      }
    };
    try {
      setListening(true);
      recognition.start();
    } catch {
      abortMic();
      setMicError("Không mở được micro. Bạn vẫn có thể nhập câu trả lời.");
    }
  }
  return { micSupported, micConsent, setMicConsent, listening, micError, toggleMic };
}
