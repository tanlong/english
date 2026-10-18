"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  BookOpenText,
  Check,
  FileText,
  LoaderCircle,
  MessageCircleMore,
  Mic2,
  Send,
  ShieldCheck,
  Square,
  TriangleAlert,
} from "lucide-react";
import type { DebateReply, DebateSession, DebateTurn } from "@/app/debate/types";
import {
  SOURCE_ACCEPT,
  sourceFileError,
  MIN_CONTENT_LENGTH,
  MAX_CONTENT_LENGTH,
} from "@/app/debate/files";
import { PageHeading } from "./page-heading";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { FormField } from "./form-field";
import { Checkbox } from "./ui/checkbox";
import { AudioButton } from "./audio-button";
import { splitLearningText } from "@/app/debate/vocabulary";
import { useSpeechInput } from "@/app/audio/use-speech-input";
import { stopAudio } from "@/app/audio/client";
import { useLearningStore } from "@/app/learning/provider";
import {
  debatePhrases,
  precSteps,
  practiceTopics,
  stanceLabels,
  type DebateStance,
} from "@/app/debate/method";

type Message =
  { role: "user"; content: string } | ({ role: "assistant"; content: string } & DebateReply);
const sourceLabels = { text: "NỘI DUNG ĐÃ NHẬP", txt: "TỆP VĂN BẢN TXT", srt: "TỆP PHỤ ĐỀ SRT" };

function DebateText({ text }: { text: string }) {
  return splitLearningText(text).map((part, index) =>
    part.kind ? (
      <span
        key={index}
        className="debate-learning-word"
        data-vocabulary={part.kind}
        title={part.meaning ? `Cụm tự nhiên: ${part.meaning}` : "Từ trong bộ 3.000 từ thông dụng"}
      >
        {part.text}
      </span>
    ) : (
      part.text
    ),
  );
}

export function VideoDebate() {
  const learning = useLearningStore();
  const [refreshingTopic, setRefreshingTopic] = useState(false);
  const [topicError, setTopicError] = useState("");
  const [finished, setFinished] = useState(false);
  const [memoryWarning, setMemoryWarning] = useState("");
  const [inputMode, setInputMode] = useState<"text" | "file">("text");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [stance, setStance] = useState<DebateStance>("undecided");
  const [session, setSession] = useState<DebateSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<"analyze" | "discuss" | "finish" | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const [chatError, setChatError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const contentField = useRef<HTMLTextAreaElement>(null);
  const fileField = useRef<HTMLInputElement>(null);
  const consentField = useRef<HTMLElement>(null);
  const replyField = useRef<HTMLTextAreaElement>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const latestReply = useRef<HTMLElement>(null);
  const { micSupported, micConsent, setMicConsent, listening, micError, toggleMic } =
    useSpeechInput({
      value: draft,
      onChange: setDraft,
      maxLength: 2000,
      disabled: Boolean(busy) || !session || finished,
      onStart: stopAudio,
    });

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible")
        void learning.refreshPersonalization().catch(() => {});
    };
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    refresh();
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [learning.refreshPersonalization]);
  useEffect(() => {
    if (session) resultsHeading.current?.focus({ preventScroll: true });
  }, [session]);
  useEffect(() => {
    if (messages.length)
      latestReply.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [messages.length]);
  useEffect(() => {
    if (!busy && !listening && messages.length) replyField.current?.focus({ preventScroll: true });
  }, [busy, listening, messages.length]);

  function changeMode(mode: "text" | "file") {
    if (mode === inputMode) return;
    setInputMode(mode);
    setFile(null);
    setConsent(false);
    setAnalysisError("");
  }

  function insertStarter(starter: string) {
    if (busy || listening) return;
    const next = `${draft}${draft.trim() ? "\n" : ""}${starter}`;
    if (next.length > 2000) {
      setChatError("Ô trả lời đã gần đủ 2.000 ký tự. Hãy rút ngắn trước khi thêm câu gợi ý.");
      return;
    }
    setDraft(next);
    setChatError("");
    replyField.current?.focus();
  }

  async function post(body: unknown, path = "/api/debate") {
    const abort = new AbortController();
    controller.current = abort;
    const multipart = body instanceof FormData;
    const timeout = window.setTimeout(() => abort.abort(), 170_000);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: multipart ? undefined : { "Content-Type": "application/json" },
        body: multipart ? body : JSON.stringify(body),
        signal: abort.signal,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "AI chưa sẵn sàng. Hãy thử lại.");
      return result;
    } finally {
      window.clearTimeout(timeout);
      controller.current = null;
    }
  }

  async function analyze(event: FormEvent) {
    event.preventDefault();
    if (busy || listening || controller.current) return;
    const length = content.trim().length;
    const sourceError =
      inputMode === "file"
        ? file
          ? sourceFileError(file)
          : "Hãy chọn tệp TXT hoặc SRT để tạo cuộc hội thoại."
        : !length
          ? "Nhập hoặc dán nội dung tiếng Anh để tạo cuộc hội thoại."
          : length < MIN_CONTENT_LENGTH
            ? `Nội dung cần ít nhất ${MIN_CONTENT_LENGTH} ký tự. Cần thêm ${MIN_CONTENT_LENGTH - length} ký tự để AI có đủ nội dung tranh luận.`
            : content.length > MAX_CONTENT_LENGTH
              ? "Nội dung vượt quá 60.000 ký tự. Hãy rút ngắn và thử lại."
              : "";
    if (sourceError) {
      setAnalysisError(sourceError);
      (inputMode === "text" ? contentField.current : fileField.current)?.focus();
      return;
    }
    if (!consent) {
      setAnalysisError(
        "Tích ô đồng ý gửi nội dung đến OpenAI bên trên, rồi bấm tạo cuộc hội thoại.",
      );
      consentField.current?.focus();
      return;
    }
    setBusy("analyze");
    setAnalysisError("");
    try {
      let result: DebateSession;
      if (inputMode === "file" && file) {
        const body = new FormData();
        body.append("file", file);
        body.append("consent", "true");
        body.append("stance", stance);
        result = await post(body, "/api/debate/upload");
      } else {
        result = await post({ action: "analyze", content: content.trim(), stance });
      }
      setSession(result);
      setFinished(false);
      setMemoryWarning("");
      const opening = result.analysis.questions[0];
      setMessages([
        {
          role: "assistant",
          content: opening,
          reply: opening,
          translationVi: "",
          scope: "in_scope",
          warningVi: "",
          evidenceIds: [],
        },
      ]);
      setDraft("");
      setChatError("");
    } catch (error) {
      setAnalysisError(
        error instanceof Error && error.name !== "AbortError"
          ? error.message
          : "Tạo hội thoại quá lâu hoặc đã bị ngắt. Nội dung của bạn vẫn được giữ; hãy thử lại.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function discuss(event: FormEvent) {
    event.preventDefault();
    if (!session || !draft.trim() || busy || listening || controller.current || finished) return;
    const answer = draft.trim();
    const history: DebateTurn[] = messages
      .slice(-24)
      .map(({ role, content }) => ({ role, content }));
    setBusy("discuss");
    setChatError("");
    try {
      const result: DebateReply = await post({
        action: "discuss",
        token: session.token,
        message: answer,
        history,
      });
      setMemoryWarning(
        (result as DebateReply & { memoryWarningVi?: string }).memoryWarningVi ?? "",
      );
      setMessages((previous) => [
        ...previous,
        { role: "user", content: answer },
        { ...result, role: "assistant", content: result.reply },
      ]);
      setDraft("");
    } catch (error) {
      setChatError(
        error instanceof Error && error.name !== "AbortError"
          ? error.message
          : "Phản hồi bị ngắt. Nội dung bạn nhập vẫn được giữ, hãy gửi lại.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function finishDebate() {
    if (!session || busy || listening || finished) return;
    setBusy("finish");
    setChatError("");
    try {
      await post({
        action: "finish",
        token: session.token,
        history: messages.slice(-24).map(({ role, content }) => ({ role, content })),
      });
      setFinished(true);
      window.dispatchEvent(new Event("learning-personalization-updated"));
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Chưa lưu được buổi tranh luận.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="debate-page">
      <PageHeading
        eyebrow="ĐỌC HIỂU · LUYỆN TƯ DUY"
        title="Tranh luận"
        text="Tranh luận A2–B1 bằng câu ngắn, từ quen thuộc và từng ý rõ ràng theo phương pháp P–R–E–C."
      />
      <Card
        render={<section aria-labelledby="debate-input-title" />}
        className="debate-input-panel"
      >
        <div className="debate-section-title">
          <span className="feature-icon blue">
            <FileText size={22} aria-hidden="true" />
          </span>
          <div>
            <h2 id="debate-input-title">Tạo cuộc hội thoại tranh luận</h2>
            <p>
              Nhập nội dung hoặc tải TXT, SRT; AI giúp bạn nêu quan điểm, lý do và ví dụ thực tế.
            </p>
          </div>
        </div>
        <div className="segmented" aria-label="Cách nhập nội dung">
          <button
            type="button"
            aria-pressed={inputMode === "text"}
            disabled={Boolean(busy) || listening}
            onClick={() => changeMode("text")}
          >
            Nhập nội dung
          </button>
          <button
            type="button"
            aria-pressed={inputMode === "file"}
            disabled={Boolean(busy) || listening}
            onClick={() => changeMode("file")}
          >
            Tải tệp TXT / SRT
          </button>
        </div>
        <form onSubmit={analyze} noValidate aria-busy={busy === "analyze"}>
          {inputMode === "text" ? (
            <FormField
              id="debate-content"
              label="Nội dung dùng để tranh luận"
              hint="Nhập hoặc dán đoạn văn, bài viết hay hội thoại tiếng Anh từ 80 đến 60.000 ký tự."
            >
              <Textarea
                ref={contentField}
                className="text-[14px] large-text:text-base"
                id="debate-content"
                rows={7}
                required
                minLength={MIN_CONTENT_LENGTH}
                maxLength={MAX_CONTENT_LENGTH}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Dán nội dung tiếng Anh mà bạn muốn thảo luận tại đây…"
                disabled={Boolean(busy) || listening}
                aria-describedby="debate-content-hint"
              />
              <small className="helper">{content.length}/60.000 ký tự</small>
            </FormField>
          ) : (
            <FormField
              id="debate-source-file"
              label="Chọn tệp TXT hoặc SRT"
              hint="Tối đa 1 MB, hỗ trợ UTF-8/UTF-16. Nội dung tiếng Anh từ 80 đến 60.000 ký tự; SRT được bỏ số thứ tự và mốc thời gian."
            >
              <Input
                ref={fileField}
                className="text-[14px] large-text:text-base"
                id="debate-source-file"
                type="file"
                accept={SOURCE_ACCEPT}
                disabled={Boolean(busy) || listening}
                aria-describedby="debate-source-file-hint"
                onChange={(event) => {
                  const selected = event.target.files?.[0] ?? null;
                  setFile(selected);
                  setConsent(false);
                  setAnalysisError(selected ? sourceFileError(selected) : "");
                }}
              />
            </FormField>
          )}
          {inputMode === "text" && (
            <details className="debate-topic-picker">
              <summary>Chọn chủ đề luyện nhanh</summary>
              <p className="helper">
                Chọn để điền nội dung mẫu vào ô trên. Bạn có thể sửa trước khi tạo hội thoại.
              </p>
              <div className="debate-topic-grid">
                {practiceTopics.map((topic) => (
                  <Button
                    key={topic.id}
                    type="button"
                    variant="outline"
                    disabled={Boolean(busy) || listening}
                    onClick={() => {
                      setContent(topic.content);
                      setConsent(false);
                      setAnalysisError("");
                      contentField.current?.focus();
                    }}
                  >
                    {topic.label}
                  </Button>
                ))}
              </div>
              <section
                className="mt-4 rounded-lg border bg-accent/40 p-4"
                aria-label="Bài tranh luận dành cho bạn"
                data-testid="personalized-debate"
              >
                <strong>Bài dành cho bạn · Tự cập nhật</strong>
                {learning.personalization ? (
                  <>
                    <h3 className="mt-2 text-base">{learning.personalization.topic.label}</h3>
                    <p className="helper">{learning.personalization.topic.reasonVi}</p>
                    <p className="helper">
                      Mục tiêu ôn: <span lang="en">{learning.personalization.topic.focusEn}</span>
                    </p>
                    <Button
                      type="button"
                      disabled={Boolean(busy) || listening}
                      onClick={() => {
                        setContent(learning.personalization!.topic.content);
                        setConsent(false);
                        setAnalysisError("");
                        contentField.current?.focus();
                      }}
                    >
                      Luyện bài này
                    </Button>
                  </>
                ) : (
                  <p className="helper" role="status">
                    {learning.syncError
                      ? "Chưa kết nối được dữ liệu học tập. Bạn vẫn có thể chọn chủ đề mẫu phía trên."
                      : "Đang chọn một bài phù hợp với hồ sơ của bạn…"}
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  disabled={refreshingTopic || Boolean(busy) || listening}
                  onClick={async () => {
                    setRefreshingTopic(true);
                    setTopicError("");
                    try {
                      await learning.personalize("refresh-topic");
                    } catch (e) {
                      setTopicError(e instanceof Error ? e.message : "Chưa cập nhật được gợi ý.");
                    } finally {
                      setRefreshingTopic(false);
                    }
                  }}
                >
                  {refreshingTopic ? "Đang cập nhật…" : "Cập nhật bài gợi ý"}
                </Button>
                <p className="helper">
                  Chỉ một bài gợi ý, thay mới theo kết quả học và ngày học. Nội dung bạn đang soạn
                  chỉ đổi khi bấm Luyện bài này.
                </p>
                {topicError && (
                  <p className="field-error" role="alert">
                    {topicError}
                  </p>
                )}
              </section>
            </details>
          )}
          <fieldset className="debate-stance" disabled={Boolean(busy) || listening}>
            <legend>Quan điểm bạn muốn luyện</legend>
            <div className="button-row">
              {(Object.entries(stanceLabels) as [DebateStance, string][]).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  variant={stance === value ? "secondary" : "outline"}
                  aria-pressed={stance === value}
                  onClick={() => setStance(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </fieldset>
          <p className="helper">
            Nội dung được gửi đến OpenAI để tạo cuộc hội thoại. Tệp tải lên không được lưu trong ứng
            dụng.
          </p>
          <label className="check-field">
            <Checkbox
              ref={consentField}
              checked={consent}
              disabled={Boolean(busy) || listening}
              onCheckedChange={(checked) => setConsent(checked === true)}
            />
            <span>Tôi đồng ý gửi nội dung này đến OpenAI để tạo cuộc hội thoại tranh luận.</span>
          </label>
          {analysisError && (
            <p className="field-error" role="alert">
              {analysisError}
            </p>
          )}
          <Button type="submit" disabled={Boolean(busy) || listening}>
            {busy === "analyze" ? (
              <LoaderCircle className="spin" size={18} aria-hidden="true" />
            ) : (
              <MessageCircleMore size={18} aria-hidden="true" />
            )}
            {busy === "analyze" ? "Đang tạo cuộc hội thoại…" : "Tạo cuộc hội thoại"}
          </Button>
          {busy === "analyze" && (
            <p className="helper" role="status">
              AI đang đọc nội dung, đối chiếu câu trích và chuẩn bị câu hỏi tranh luận…
            </p>
          )}
        </form>
      </Card>

      {!session && (
        <div className="debate-steps" aria-label="Các bước tranh luận">
          <div>
            <span className="small-icon">
              <FileText size={18} aria-hidden="true" />
            </span>
            <h3>Chọn nội dung</h3>
            <p>Nhập trực tiếp hoặc tải tệp TXT, SRT về chủ đề bạn muốn thảo luận.</p>
          </div>
          <div>
            <span className="small-icon">
              <BookOpenText size={18} aria-hidden="true" />
            </span>
            <h3>Nắm ý và cách diễn đạt</h3>
            <p>Xem ý chính, mức CEFR gợi ý và những câu then chốt Anh–Việt.</p>
          </div>
          <div>
            <span className="small-icon">
              <ShieldCheck size={18} aria-hidden="true" />
            </span>
            <h3>Tranh luận có căn cứ</h3>
            <p>Đồng ý hoặc phản biện cùng AI, với cảnh báo khi lạc chủ đề hay thiếu bằng chứng.</p>
          </div>
        </div>
      )}

      {session && (
        <div className="debate-workspace">
          <div className="debate-source-column">
            <Card
              render={<section aria-labelledby="debate-results-title" />}
              className="debate-result-panel"
            >
              <div className="debate-source-meta">
                <span className="eyebrow">{sourceLabels[session.source]}</span>
                <span className="debate-level">{session.analysis.level}</span>
              </div>
              <h2 id="debate-results-title" ref={resultsHeading} tabIndex={-1}>
                {session.analysis.title}
              </h2>
              <p className="helper">Nguồn: {session.sourceName}</p>
              <p className="helper">
                Trình độ gợi ý để học nội dung này; đây là ước lượng của AI, không phải điểm trình
                độ của bạn.
              </p>
              <dl className="debate-difficulty">
                <div>
                  <dt>Từ vựng</dt>
                  <dd>{session.analysis.difficulty.vocabularyVi}</dd>
                </div>
                <div>
                  <dt>Cấu trúc câu</dt>
                  <dd>{session.analysis.difficulty.grammarVi}</dd>
                </div>
              </dl>
              <h3>Nội dung chính</h3>
              <p>{session.analysis.summaryVi}</p>
              <ul className="debate-main-points">
                {session.analysis.mainPoints.map((point, index) => (
                  <li key={index}>
                    <Check size={16} aria-hidden="true" />
                    <div>
                      {point.textVi}
                      <small>{point.evidenceIds.join(" · ")}</small>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
            <Card
              render={<section aria-labelledby="debate-key-title" />}
              className="debate-result-panel"
            >
              <h2 id="debate-key-title">Câu then chốt</h2>
              <p className="helper">Câu trích được lấy nguyên văn từ nội dung bạn cung cấp.</p>
              <div className="debate-key-list">
                {session.analysis.keySentences.map((sentence, index) => (
                  <article key={index} className="debate-key-sentence">
                    <div className="debate-quote-meta">
                      <span>{sentence.evidenceId}</span>
                    </div>
                    <blockquote lang="en">
                      <DebateText text={sentence.english} />
                    </blockquote>
                    <p>{sentence.vietnamese}</p>
                    <small>{sentence.usageVi}</small>
                  </article>
                ))}
              </div>
            </Card>
            <details className="debate-evidence">
              <summary>Xem nội dung trích làm căn cứ ({session.analysis.evidence.length})</summary>
              {session.analysis.evidence.map((e) => (
                <p key={e.id}>
                  <strong>{e.id}</strong>
                  <span lang="en">
                    <DebateText text={e.text} />
                  </span>
                </p>
              ))}
            </details>
          </div>
          <Card
            render={<section aria-labelledby="debate-chat-title" />}
            className="debate-chat-panel"
          >
            <div className="debate-section-title">
              <span className="feature-icon teal">
                <MessageCircleMore size={22} aria-hidden="true" />
              </span>
              <div>
                <h2 id="debate-chat-title">Cuộc hội thoại tranh luận</h2>
                <p>Cách luyện A2–B1 · Quan điểm → Lý do → Ví dụ → Kết luận.</p>
              </div>
            </div>
            <div className="notice">
              <ShieldCheck size={18} aria-hidden="true" />
              <p>
                AI dựa trên nội dung đã cung cấp. Câu ngoài chủ đề hoặc chưa đủ căn cứ sẽ có cảnh
                báo.
              </p>
            </div>
            <p className="helper debate-vocabulary-note">
              <span className="debate-learning-word">Chữ đỏ</span>: từ trong bộ 3.000 từ thông dụng
              và cụm diễn đạt tự nhiên. Bấm loa ở mỗi câu để nghe tiếng Anh.
            </p>
            <p className="helper">
              Quan điểm mở đầu: <strong>{stanceLabels[session.stance ?? "undecided"]}</strong>. Bạn
              có thể thay đổi suy nghĩ khi trao đổi.
            </p>
            <div
              className="debate-messages"
              role="log"
              aria-label="Hội thoại tranh luận"
              aria-live="polite"
              aria-relevant="additions"
              aria-busy={busy === "discuss"}
            >
              {messages.map((message, index) => (
                <article
                  key={index}
                  ref={index === messages.length - 1 ? latestReply : undefined}
                  className={`debate-message debate-message-${message.role}`}
                >
                  <div className="debate-message-header">
                    <strong className="debate-speaker">
                      {message.role === "user" ? "Bạn" : "AI · Bạn tranh luận"}
                    </strong>
                    <AudioButton
                      text={message.content}
                      voice="cedar"
                      label="Nghe câu này"
                      variant="ghost"
                      iconOnly
                      disabled={listening}
                    />
                  </div>
                  {message.role === "assistant" && message.warningVi && (
                    <div className="notice warning" role="alert">
                      <TriangleAlert size={18} aria-hidden="true" />
                      <p>
                        <strong>Cảnh báo: </strong>
                        {message.warningVi}
                      </p>
                    </div>
                  )}
                  <p lang="en">
                    <DebateText text={message.content} />
                  </p>
                  {message.role === "assistant" && (
                    <>
                      {message.translationVi && (
                        <p className="debate-translation">{message.translationVi}</p>
                      )}
                      {message.evidenceIds.length > 0 && (
                        <small className="debate-citations">
                          Căn cứ từ nội dung: {message.evidenceIds.join(" · ")}
                        </small>
                      )}
                    </>
                  )}
                </article>
              ))}
            </div>
            {messages.length === 1 && session.analysis.questions.length > 1 && (
              <div className="debate-starters">
                <p>Câu hỏi khác để thảo luận:</p>
                {session.analysis.questions.slice(1).map((question) => (
                  <Button
                    key={question}
                    variant="outline"
                    type="button"
                    disabled={Boolean(busy) || listening}
                    onClick={() => {
                      setDraft(question);
                      replyField.current?.focus();
                    }}
                  >
                    <span lang="en">
                      <DebateText text={question} />
                    </span>
                  </Button>
                ))}
              </div>
            )}
            <form onSubmit={discuss} className="debate-composer" aria-busy={busy === "discuss"}>
              <details className="debate-method" open>
                <summary>Luyện theo 4 bước P–R–E–C</summary>
                <p className="helper">
                  Mỗi lần nói một ý. Bấm câu gợi ý để thêm vào phần trả lời, rồi viết hoặc nói tiếp
                  bằng lời của bạn.
                </p>
                <div className="debate-prec-grid">
                  {precSteps.map((step) => (
                    <Button
                      key={step.key}
                      type="button"
                      variant="outline"
                      disabled={Boolean(busy) || listening}
                      className="debate-prec-step"
                      title={`${step.name}: ${step.meaning}`}
                      onClick={() => insertStarter(step.starter)}
                    >
                      <strong>
                        {step.key} · {step.label}
                      </strong>
                      <span lang="en">
                        <DebateText text={`${step.starter.trim()}…`} />
                      </span>
                      <small>{step.meaning}</small>
                    </Button>
                  ))}
                </div>
                <details className="debate-phrase-bank">
                  <summary>Câu tranh luận tự nhiên & phản biện lịch sự</summary>
                  <p className="helper">
                    Hiểu ý bạn → Nêu ý khác → Lý do → Ví dụ. Giữ cách nói tôn trọng người đối thoại.
                  </p>
                  {Object.entries(debatePhrases).map(([english, vietnamese]) => (
                    <Button
                      key={english}
                      type="button"
                      variant="ghost"
                      disabled={Boolean(busy) || listening}
                      className="debate-phrase"
                      onClick={() => insertStarter(`${english} `)}
                    >
                      <span lang="en">
                        <DebateText text={english} />
                      </span>
                      <small>{vietnamese}</small>
                    </Button>
                  ))}
                </details>
              </details>
              <FormField
                id="debate-reply"
                label="Quan điểm hoặc câu hỏi của bạn"
                hint="Không cần viết đủ 4 bước trong một lượt. AI sẽ hỏi tiếp để bạn phát triển ý. Bạn cũng có thể hỏi bằng tiếng Việt."
              >
                <Textarea
                  ref={replyField}
                  className="text-[14px] large-text:text-base"
                  id="debate-reply"
                  required
                  maxLength={2000}
                  rows={3}
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setChatError("");
                  }}
                  placeholder="I agree with this point because…"
                  disabled={Boolean(busy) || listening}
                  aria-describedby="debate-reply-hint"
                />
              </FormField>
              {micSupported ? (
                <label className="check-field">
                  <Checkbox
                    checked={micConsent}
                    disabled={Boolean(busy) || listening}
                    onCheckedChange={(checked) => setMicConsent(checked === true)}
                  />
                  <span>Tôi đồng ý dùng tính năng chuyển giọng nói thành chữ.</span>
                </label>
              ) : (
                <p className="helper">
                  Trình duyệt chưa hỗ trợ nhận diện giọng nói. Bạn vẫn có thể nhập câu trả lời.
                </p>
              )}
              <div className="debate-voice-controls">
                <Button
                  type="button"
                  size="icon"
                  variant={listening ? "destructive" : "outline"}
                  disabled={Boolean(busy) || !micSupported}
                  aria-pressed={listening}
                  aria-label={listening ? "Dừng mic" : "Trả lời bằng giọng nói"}
                  title={listening ? "Dừng mic" : "Trả lời bằng giọng nói"}
                  aria-describedby="debate-voice-help"
                  onClick={toggleMic}
                >
                  {listening ? (
                    <Square size={18} aria-hidden="true" />
                  ) : (
                    <Mic2 size={18} aria-hidden="true" />
                  )}
                </Button>
                <p id="debate-voice-help" className="helper" role="status">
                  {listening
                    ? "Đang nghe tiếng Anh… Bấm Dừng mic khi nói xong."
                    : "Nói tiếng Anh, kiểm tra hoặc sửa phần chữ rồi bấm Gửi quan điểm. Tối đa 2.000 ký tự/lượt."}
                </p>
              </div>
              {micError && (
                <p className="field-error" role="alert">
                  {micError}
                </p>
              )}
              {chatError && (
                <p className="field-error" role="alert">
                  {chatError}
                </p>
              )}
              <div className="debate-composer-actions">
                <small>{draft.length}/2000</small>
                <Button
                  type="submit"
                  disabled={Boolean(busy) || listening || !draft.trim() || finished}
                >
                  {busy === "discuss" ? (
                    <LoaderCircle size={18} className="spin" aria-hidden="true" />
                  ) : (
                    <Send size={18} aria-hidden="true" />
                  )}
                  {busy === "discuss" ? "AI đang phản hồi…" : "Gửi quan điểm"}
                </Button>
              </div>
              <p className="helper debate-session-note">
                Hội thoại hiển thị trong phiên này. Kết thúc và lưu để bộ nhớ dùng các lượt trả lời
                thật cho lần luyện tiếp theo.
              </p>
              {memoryWarning && (
                <p className="field-error" role="alert">
                  {memoryWarning}
                </p>
              )}
              {finished ? (
                <p className="feedback positive" role="status">
                  Đã lưu buổi tranh luận và cập nhật bộ nhớ học tập.
                </p>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={Boolean(busy) || listening || !messages.some((m) => m.role === "user")}
                  onClick={() => void finishDebate()}
                >
                  {busy === "finish" ? "Đang lưu…" : "Kết thúc & lưu buổi tranh luận"}
                </Button>
              )}
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
