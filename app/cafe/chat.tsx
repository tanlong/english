"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, Check, Lightbulb, Send, Volume2, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { RecordingPractice } from "../components/recording-practice";
import { SelectCombobox } from "../components/select-combobox";
import { Npc } from "./npc";
import {
  npcs,
  topics,
  type CafeReply,
  type CafeSession,
  type CafeSummary,
  type Level,
  type NpcId,
  type NpcState,
} from "./content";
import { cafeRequest, CafeRequestError } from "./client";

export function CafeChat({
  npcId,
  initialSession,
  aiReady,
  motionPaused,
  onClose,
  onSaved,
  onState,
  onResume,
}: {
  npcId: NpcId;
  initialSession?: CafeSession;
  aiReady: boolean;
  motionPaused: boolean;
  onClose: () => void;
  onSaved: () => void;
  onState: (state: NpcState) => void;
  onResume: (id: string) => void;
}) {
  const npc = npcs.find((n) => n.id === npcId)!;
  const [topic, setTopic] = useState<string>(
    initialSession?.topicId ?? npc.topics[0] ?? "ordering",
  );
  const [level, setLevel] = useState<Level>(initialSession?.level ?? "A1");
  const [useAi, setUseAi] = useState(false);
  const [session, setSession] = useState<CafeSession | undefined>(initialSession);
  const [summary, setSummary] = useState<CafeSummary | null>(initialSession?.summary ?? null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [npcState, setNpcState] = useState<NpcState>(
    initialSession && !initialSession.summary ? "listening" : "notice",
  );
  const [activeId, setActiveId] = useState("");
  const [hint, setHint] = useState<CafeReply["hints"] | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [confirmClose, setConfirmClose] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const message = useRef<{ id: string; text: string } | null>(null);
  const summaryId = useRef(crypto.randomUUID());
  const locked = useRef(false);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  function reactTo(state: NpcState) {
    clearTimeout(reactionTimer.current);
    setNpcState(state);
    onState(state);
  }
  const hasTurns = (session?.turns.length ?? 0) > 0;
  useEffect(() => {
    dialog.current?.showModal();
    return () => {
      clearTimeout(reactionTimer.current);
      window.speechSynthesis?.cancel();
    };
    // The dialog is remounted when its persona or restored session changes.
  }, []);
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [session?.turns.length]);
  useEffect(() => {
    if (!hasTurns || summary) return;
    const guard = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [hasTurns, summary]);
  function close() {
    if (pending) return;
    if (hasTurns && !summary) setConfirmClose(true);
    else {
      dialog.current?.close();
      onClose();
    }
  }
  async function perform(action: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true;
    setPending(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa kết nối được. Hãy thử lại.");
      reactTo("error");
      if (e instanceof CafeRequestError && e.data.sessionId) setActiveId(e.data.sessionId);
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  function start() {
    void perform(async () => {
      const next = await cafeRequest<CafeSession>("/api/cafe/conversations", {
        npcId,
        topicId: topic,
        level,
        useAi,
      });
      setSession(next);
      reactTo("listening");
      setTimeout(() => input.current?.focus(), 0);
    });
  }
  function send() {
    if (!session || !draft.trim()) return;
    const text = draft.trim();
    if (!message.current || message.current.text !== text)
      message.current = { id: crypto.randomUUID(), text };
    const current = message.current;
    void perform(async () => {
      reactTo("thinking");
      const result = await cafeRequest<{ turnId: string; reply: CafeReply }>(
        `/api/cafe/conversations/${session.id}/messages`,
        { clientMessageId: current.id, text },
      );
      setSession((s) =>
        s
          ? {
              ...s,
              turns: [
                ...s.turns.filter((t) => t.clientMessageId !== current.id),
                {
                  id: result.turnId,
                  clientMessageId: current.id,
                  userText: text,
                  reply: result.reply,
                },
              ],
            }
          : s,
      );
      setDraft("");
      setHint(null);
      message.current = null;
      reactTo("talking");
      clearTimeout(reactionTimer.current);
      reactionTimer.current = setTimeout(() => reactTo("listening"), 1600);
      setTimeout(() => input.current?.focus(), 0);
    });
  }
  function finish() {
    if (!session) return;
    void perform(async () => {
      const result = await cafeRequest<CafeSummary>(`/api/cafe/conversations/${session.id}/end`, {
        requestId: summaryId.current,
      });
      setSummary(result);
      setConfirmClose(false);
      reactTo("idle");
      onSaved();
    });
  }
  function speak(text: string) {
    if (!("speechSynthesis" in window)) {
      setError("Thiết bị chưa hỗ trợ đọc câu. Bạn vẫn có thể luyện bằng chữ.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = level === "A1" ? 0.85 : 1;
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang === "en-US");
    if (voice) utterance.voice = voice;
    clearTimeout(reactionTimer.current);
    reactTo("talking");
    utterance.onend = () => reactTo(summary ? "idle" : "listening");
    utterance.onerror = () => {
      reactTo("listening");
      setError("Chưa phát được giọng đọc trên thiết bị.");
    };
    reactionTimer.current = setTimeout(() => reactTo("listening"), 15_000);
    window.speechSynthesis.speak(utterance);
  }
  return (
    <dialog
      ref={dialog}
      className="cafe-dialog"
      data-paused={motionPaused}
      aria-labelledby="cafe-chat-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <header className="cafe-dialog-header">
        <div className="cafe-dialog-avatar">
          <Npc id={npcId} state={npcState} paused={motionPaused} />
        </div>
        <div>
          <span className="cafe-kicker">ENGLISH COFFEE CORNER</span>
          <h2 id="cafe-chat-title">{summary ? "Một chút mang về" : npc.name}</h2>
          <p>
            {topics[topic].label} · {level}
          </p>
        </div>
        <button
          type="button"
          className="cafe-icon-button"
          aria-label="Đóng trò chuyện"
          disabled={pending}
          onClick={close}
        >
          <X size={22} />
        </button>
      </header>
      <div className="cafe-dialog-content">
        {error && (
          <p className="field-error" role="alert">
            {error}
            {activeId && (
              <Button variant="outline" onClick={() => onResume(activeId)}>
                Tiếp tục buổi đang mở
              </Button>
            )}
          </p>
        )}
        {confirmClose ? (
          <section className="cafe-close-confirm">
            <h3>Kết thúc cuộc trò chuyện?</h3>
            <p>Các câu đã gửi được lưu. Bạn có thể xem tổng kết và chọn câu mang về.</p>
            <div className="cafe-actions">
              <Button disabled={pending} onClick={finish}>
                Kết thúc & xem tổng kết
              </Button>
              <Button variant="outline" onClick={() => setConfirmClose(false)}>
                Tiếp tục luyện
              </Button>
            </div>
          </section>
        ) : summary ? (
          <section className="cafe-summary">
            <p>{summary.noteVi}</p>
            <h3>Câu bạn đã nói</h3>
            {summary.learnerSentences.length ? (
              <ul>
                {summary.learnerSentences.map((s, i) => (
                  <li key={i} lang="en">
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Buổi này chưa có câu trả lời.</p>
            )}
            <h3>Cách nói để thử lần sau</h3>
            {summary.phrases.map((phrase) => (
              <article className="cafe-phrase" key={phrase.id}>
                <p lang="en">{phrase.english}</p>
                <small>{phrase.vietnamese}</small>
                <div className="cafe-actions">
                  <Button variant="outline" onClick={() => speak(phrase.english)}>
                    <Volume2 size={16} />
                    Nghe mẫu
                  </Button>
                  <Button
                    disabled={pending || saved.includes(phrase.id)}
                    onClick={() =>
                      void perform(async () => {
                        await cafeRequest("/api/flashcards", {
                          phraseId: phrase.id,
                          sessionId: session!.id,
                        });
                        setSaved((s) => [...s, phrase.id]);
                        onSaved();
                      })
                    }
                  >
                    {saved.includes(phrase.id) ? (
                      <>
                        <Check size={16} />
                        Đã lưu
                      </>
                    ) : (
                      <>
                        <BookOpen size={16} />
                        Lưu flashcard
                      </>
                    )}
                  </Button>
                </div>
              </article>
            ))}
          </section>
        ) : !session ? (
          <section className="cafe-chat-setup">
            <p>{npc.description}</p>
            <label>
              Chủ đề
              <SelectCombobox
                id="cafe-topic"
                label="Chủ đề"
                container={dialog}
                positionMethod="fixed"
                options={npc.topics.map((id) => ({ value: id, label: topics[id].label }))}
                value={topic}
                onValueChange={setTopic}
              />
            </label>
            <fieldset>
              <legend>Chọn nhịp trò chuyện</legend>
              <div className="cafe-levels">
                {(["A1", "A2", "B1"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={level === l}
                    onClick={() => setLevel(l)}
                  >
                    <strong>{l}</strong>
                    <span>
                      {l === "A1"
                        ? "Bắt đầu nhẹ nhàng"
                        : l === "A2"
                          ? "Thêm một chút ý"
                          : "Kể chuyện tự nhiên"}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
            {aiReady && (
              <label className="cafe-optin">
                <input
                  type="checkbox"
                  checked={useAi}
                  onChange={(e) => setUseAi(e.target.checked)}
                />
                <span>
                  Dùng AI đã kết nối. Câu bạn gửi và các lượt gần đây sẽ được gửi tới nhà cung cấp.
                </span>
              </label>
            )}
            <p className="cafe-mode">
              {useAi
                ? "AI có giới hạn · tự về bài mẫu khi cần"
                : "Bài luyện theo kịch bản · không cần API key"}
            </p>
            <Button disabled={pending} onClick={start}>
              {pending ? "Đang chuẩn bị…" : "Bắt đầu trò chuyện"}
              <ArrowRight size={18} />
            </Button>
          </section>
        ) : (
          <>
            <p className="cafe-mode" role="status">
              {session.mode === "scripted"
                ? "Bài luyện theo kịch bản"
                : "AI đã kết nối · phản hồi có thể chuyển về bài mẫu"}
            </p>
            <div
              ref={log}
              className="cafe-chat-log"
              role="log"
              aria-label={`Hội thoại với ${npc.name}`}
              aria-live="polite"
            >
              <article className="cafe-bubble partner">
                <small>{npc.name}</small>
                <p lang="en">{session.greeting}</p>
                <button className="cafe-text-button" onClick={() => speak(session.greeting)}>
                  <Volume2 size={16} />
                  Nghe câu
                </button>
              </article>
              {session.turns.map((turn) => (
                <div key={turn.id}>
                  <article className="cafe-bubble learner">
                    <small>Bạn</small>
                    <p lang="en">{turn.userText}</p>
                  </article>
                  {turn.reply ? (
                    <article className="cafe-bubble partner">
                      <small>
                        {npc.name} · {turn.reply.sourceMode === "scripted" ? "Bài mẫu" : "AI"}
                      </small>
                      <p lang="en">{turn.reply.replyEn}</p>
                      {turn.reply.fallbackReason && (
                        <p className="cafe-fallback">{turn.reply.fallbackReason}</p>
                      )}
                      <details>
                        <summary>Giải thích tiếng Việt</summary>
                        <p>{turn.reply.explanationVi}</p>
                        {turn.reply.correction && (
                          <p>
                            Cần sửa: <span lang="en">{turn.reply.correction.basicEn}</span> ·{" "}
                            {turn.reply.correction.explanationVi}
                          </p>
                        )}
                      </details>
                      <button
                        className="cafe-text-button"
                        onClick={() => speak(turn.reply!.replyEn)}
                      >
                        <Volume2 size={16} />
                        Nghe câu
                      </button>
                    </article>
                  ) : (
                    <p>Lượt gửi bị gián đoạn. Hãy kết thúc buổi này hoặc thử gửi lại.</p>
                  )}
                </div>
              ))}
              {pending && <p className="cafe-mode">Đang chuẩn bị phản hồi…</p>}
            </div>
            {hint && (
              <div className="cafe-hints">
                {Object.entries(hint).map(([kind, text]) => (
                  <p key={kind}>
                    <strong>
                      {kind === "basic" ? "Basic" : kind === "better" ? "Better" : "Natural"}
                    </strong>
                    <span lang="en">{text}</span>
                  </p>
                ))}
              </div>
            )}
            <form
              className="cafe-composer"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <label htmlFor="cafe-answer">Câu trả lời của bạn</label>
              <textarea
                id="cafe-answer"
                ref={input}
                value={draft}
                maxLength={800}
                disabled={pending}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
              />
              <div className="cafe-actions">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    void perform(async () => {
                      const result = await cafeRequest<{ hints: CafeReply["hints"] }>(
                        `/api/cafe/conversations/${session.id}/hint`,
                        { kind: "all" },
                      );
                      setHint(result.hints);
                    })
                  }
                >
                  <Lightbulb size={16} />
                  Gợi ý
                </Button>
                <span className="cafe-char-count">{draft.length}/800</span>
                <Button type="submit" disabled={pending || !draft.trim()}>
                  <Send size={16} />
                  Gửi câu trả lời
                </Button>
              </div>
            </form>
            <RecordingPractice />
            <Button variant="ghost" disabled={pending} onClick={finish}>
              Kết thúc & xem tổng kết
            </Button>
          </>
        )}
        <p className="cafe-draft-note">
          Mẫu luyện và gợi ý đang chờ duyệt nội dung. Không có điểm phát âm.
        </p>
      </div>
    </dialog>
  );
}
