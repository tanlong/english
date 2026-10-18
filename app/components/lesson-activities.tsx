"use client";
import { Checkbox } from "./ui/checkbox";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Textarea } from "@/app/components/ui/textarea";
import { useState } from "react";
import { ArrowRight, Check, Eye, Headphones, Mic } from "lucide-react";
import type { PracticeLesson } from "../content/practice";
import type { Attempt, StudySession } from "../learning/progress";
import type { SessionStageId } from "../learning/session-plan";
import type { LearningStore } from "../learning/use-learning";
import { AudioButton } from "./audio-button";
import { SpokenVersions } from "./spoken-versions";
import { SelectCombobox } from "./select-combobox";
import { Artwork } from "./artwork";
import { RecordingPractice } from "./recording-practice";
import type { TtsRequest } from "../audio/client";
type ActivityProps = {
  stage: SessionStageId;
  lesson: PracticeLesson;
  session: StudySession;
  store: LearningStore;
  emit: (kind: Attempt["kind"], answer: string, extra?: Partial<Attempt>) => void;
  saveDraft: (key: string, value: string) => void;
};
const voiceOptions = [
  { value: "nova", label: "Giọng 1" },
  { value: "alloy", label: "Giọng 2" },
];
export function Activity(props: ActivityProps) {
  const { stage } = props;
  if (stage === "visual-listening" || stage === "communication-listening")
    return <ListeningActivity {...props} />;
  if (stage === "shadowing") return <ShadowingActivity {...props} />;
  if (stage === "speaking" || stage === "communication-speaking")
    return <SpeakingActivity {...props} />;
  if (stage === "reflection") return <TakeawayActivity {...props} />;
  return <WritingActivity {...props} />;
}
function ListeningActivity({ lesson, stage, session, emit }: ActivityProps) {
  return (
    <>
      <ListeningTask lesson={lesson} stage={stage} session={session} emit={emit} />
      {stage === "visual-listening" &&
        session.attempts.some(
          (a) => a.stage === stage && a.kind === "listening" && a.contentTrack !== "carnegie",
        ) && (
          <section className="mt-6 border-t pt-5" aria-label="Nghe Đắc Nhân Tâm">
            <Badge variant="violet">Đắc Nhân Tâm · {lesson.principle}</Badge>
            <ListeningTask
              lesson={lesson}
              stage={stage}
              session={session}
              emit={emit}
              communication
            />
          </section>
        )}
    </>
  );
}
function ListeningTask({
  lesson,
  stage,
  session,
  emit,
  communication = stage === "communication-listening",
}: Pick<ActivityProps, "lesson" | "stage" | "session" | "emit"> & { communication?: boolean }) {
  const source = communication ? lesson.communication : null;
  const text = source
    ? `${source.opening} ${source.reply} ${source.followup}`
    : lesson.lines.map((l) => l.en).join(" ");
  const options = source?.choices ?? lesson.choices;
  const correct = source?.correct ?? lesson.correct;
  const contentTrack = communication ? "carnegie" : "everyday";
  const previous = session.attempts.find(
    (a) =>
      a.stage === stage &&
      a.kind === "listening" &&
      (a.contentTrack ?? "everyday") === contentTrack,
  );
  const [heard, setHeard] = useState(false);
  const [replays, setReplays] = useState(0);
  const [selected, setSelected] = useState<number | null>(
    previous ? options.indexOf(previous.answer) : null,
  );
  const [submitted, setSubmitted] = useState(!!previous);
  const [captions, setCaptions] = useState(false);
  const [assisted, setAssisted] = useState(previous?.captions ?? false);
  const [translation, setTranslation] = useState(false);
  const [voice, setVoice] = useState<NonNullable<TtsRequest["voice"]>>("nova");
  return (
    <div className="listening-task">
      {!communication && (
        <div className="scene-frame">
          <Artwork scene={communication ? "office" : lesson.art} priority />
          <span className="scene-label">
            <Headphones aria-hidden="true" size={16} />
            {communication ? "Listen with empathy" : lesson.title}
          </span>
        </div>
      )}
      <div className="audio-toolbar">
        <AudioButton
          text={text}
          voice={voice}
          onPlayed={() => {
            setHeard(true);
            setReplays((n) => n + 1);
          }}
          label={
            communication
              ? heard
                ? "Nghe lại hội thoại Đắc Nhân Tâm"
                : "Nghe hội thoại Đắc Nhân Tâm"
              : heard
                ? "Nghe lại hội thoại"
                : "Nghe hội thoại"
          }
        />
        <div>
          <label htmlFor={communication ? "communication-voice-select" : "voice-select"}>
            Giọng Anh-Mỹ
          </label>
          <SelectCombobox
            id={communication ? "communication-voice-select" : "voice-select"}
            label="Giọng Anh-Mỹ"
            options={voiceOptions}
            value={voice}
            onValueChange={(value) => setVoice(value as NonNullable<TtsRequest["voice"]>)}
          />
        </div>
      </div>
      <p className="helper">
        Nghe hết hội thoại rồi chọn câu trả lời. Bạn có thể đổi giọng để luyện nghe đa dạng.
      </p>
      <fieldset className="choice-fieldset">
        <legend>{source?.question ?? lesson.question}</legend>
        <div className="choices">
          {options.map((choice, i) => (
            <button
              key={choice}
              disabled={submitted}
              aria-pressed={selected === i}
              className={`choice ${selected === i ? "selected" : ""} ${submitted && i === correct ? "correct" : ""}`}
              onClick={() => setSelected(i)}
            >
              <span>{String.fromCharCode(65 + i)}</span>
              {choice}
              {submitted && i === correct && <Check aria-hidden="true" size={18} />}
            </button>
          ))}
        </div>
      </fieldset>
      {!submitted ? (
        <Button
          disabled={selected === null || (!heard && !assisted)}
          onClick={() => {
            setSubmitted(true);
            emit("listening", options[selected!], {
              correct: selected === correct,
              captions: assisted,
              replays,
              contentTrack,
            });
          }}
          variant="default"
        >
          Kiểm tra câu trả lời
          <ArrowRight aria-hidden="true" size={18} />
        </Button>
      ) : (
        <div className={`feedback ${selected === correct ? "positive" : ""}`} role="status">
          <strong>
            {selected === correct
              ? "Bạn đã chọn đúng ý."
              : "Nghe lại rồi đối chiếu phần khác biệt nhé."}
          </strong>
          <p>
            {assisted
              ? "Lần sau, thử nghe trước khi mở lời thoại."
              : "Nghe lại một lần để ghi nhớ cách nói."}
          </p>
        </div>
      )}
      <div className="caption-actions">
        <Button
          disabled={!submitted}
          aria-expanded={captions}
          onClick={() => setCaptions((v) => !v)}
          variant="link"
          className="bg-accent px-3 hover:bg-primary/10 hover:no-underline"
        >
          <Eye aria-hidden="true" size={18} />
          {communication
            ? captions
              ? "Ẩn lời thoại Đắc Nhân Tâm"
              : "Xem lời thoại Đắc Nhân Tâm"
            : captions
              ? "Ẩn lời thoại"
              : "Xem lời thoại sau khi trả lời"}
        </Button>
        {!submitted && (
          <details className="transcript-fallback">
            <summary>Cần phụ đề hoặc không phát được âm thanh?</summary>
            <p>Đọc lời thoại để hiểu ý, rồi thử nghe lại khi có thể.</p>
            <Button
              onClick={() => {
                setAssisted(true);
                setCaptions(true);
              }}
              variant="outline"
            >
              Mở hỗ trợ chữ
            </Button>
          </details>
        )}
      </div>
      {captions && (
        <div className="transcript">
          <span className="eyebrow">LỜI THOẠI</span>
          {source ? (
            <>
              <p lang="en">
                <strong>Đồng nghiệp:</strong> {source.opening}
              </p>
              {translation && <small>{source.meanings[0]}</small>}
              <SpokenVersions
                versions={{
                  short: { en: source.short[0], vi: source.short[1] },
                  full: { en: source.reply, vi: source.meanings[1] },
                }}
                translation={translation}
                voice={voice}
              />
              <p lang="en">{source.followup}</p>
              {translation && <small>{source.meanings[2]}</small>}
            </>
          ) : (
            <>
              <p lang="en">
                <strong>{lesson.lines[0].speaker}:</strong> {lesson.lines[0].en}
              </p>
              {translation && <small>{lesson.lines[0].vi}</small>}
              <p className="helper">
                {lesson.lines[1].speaker} · Hai cách trả lời tự nhiên. Bản ngắn giữ ý chính; bản đầy
                đủ thêm chi tiết của tình huống mẫu. Hãy thay bằng thông tin của bạn.
              </p>
              <SpokenVersions
                versions={{
                  short: { en: lesson.target, vi: lesson.targetVi },
                  full: lesson.lines[1],
                  grammar: lesson.grammar,
                }}
                translation={translation}
                voice={voice}
              />
            </>
          )}
          <Button
            aria-pressed={translation}
            onClick={() => setTranslation((v) => !v)}
            variant="link"
            className="bg-accent px-3 hover:bg-primary/10 hover:no-underline"
          >
            {translation ? "Ẩn gợi ý tiếng Việt" : "Gợi ý tiếng Việt"}
          </Button>
        </div>
      )}
    </div>
  );
}
function ShadowingActivity({ lesson, session, emit }: ActivityProps) {
  const [said, setSaid] = useState(session.attempts.some((a) => a.stage === "shadowing"));
  const [heard, setHeard] = useState(false);
  const [textSupport, setTextSupport] = useState(false);
  return (
    <div className="shadowing-task">
      <div className="scene-frame compact">
        <Artwork scene={lesson.art} />
      </div>
      <div className="target-sentence">
        <span className="eyebrow">NGHE → CHIA CỤM → NÓI CÙNG NHỊP</span>
        <p lang="en">{lesson.target}</p>
      </div>
      <div className="chunk-list">
        {lesson.chunks.map((chunk) => (
          <span key={chunk} lang="en">
            {chunk}
          </span>
        ))}
      </div>
      <div className="button-row">
        <AudioButton
          text={lesson.target}
          voice="alloy"
          speed={0.8}
          label="Nghe chậm · 0.8×"
          variant="outline"
          onPlayed={() => setHeard(true)}
        />
        <AudioButton
          text={lesson.target}
          voice="alloy"
          label="Nhịp tự nhiên · 1×"
          onPlayed={() => setHeard(true)}
        />
      </div>
      <p className="helper">
        Nghe một lượt, lặp từng cụm, rồi nói cả câu. Chú ý từ mang ý chính và ngữ điệu.
      </p>
      {!heard && (
        <details className="transcript-fallback">
          <summary>Thiết bị không phát được âm thanh?</summary>
          <p>Bạn có thể đọc câu mẫu rồi luyện nói thành tiếng.</p>
          <Button
            onClick={() => {
              setTextSupport(true);
              setHeard(true);
            }}
            variant="outline"
          >
            Chuyển sang luyện từ văn bản
          </Button>
        </details>
      )}
      {!said && (
        <Button
          disabled={!heard}
          onClick={() => {
            setSaid(true);
            emit(
              "shadowing",
              textSupport
                ? "Tự xác nhận đã luyện đọc thành tiếng từ văn bản; có hỗ trợ chữ."
                : "Tự xác nhận đã nghe và nói theo câu mẫu.",
              { captions: textSupport },
            );
          }}
          variant="outline"
        >
          <Mic aria-hidden="true" size={18} />
          {textSupport ? "Tôi đã luyện đọc thành tiếng" : "Tôi đã nghe và nói theo"}
        </Button>
      )}
      {said && (
        <p className="feedback positive" role="status">
          Đã lưu lượt luyện. Thử nói lại một lần mà không nhìn câu mẫu nhé.
        </p>
      )}
      <RecordingPractice
        target={lesson.target}
        onRecorded={() => {
          setSaid(true);
          emit("shadowing", "Đã ghi âm luyện theo câu mẫu.");
        }}
      />
    </div>
  );
}
function SpeakingActivity({ lesson, stage, session, store, emit, saveDraft }: ActivityProps) {
  const communication = stage === "communication-speaking";
  const learnerName = store.state.profile?.name ?? "Bạn";
  const prior = session.attempts.filter(
    (a) => a.stage === stage && (a.kind === "typed" || a.kind === "speaking"),
  );
  const [turn, setTurn] = useState(Math.min(prior.length, 2));
  const [mode, setMode] = useState<"spoken" | "typed">("spoken");
  const [recorded, setRecorded] = useState(false);
  const [spoken, setSpoken] = useState(false);
  const prompts = communication
    ? [
        lesson.communication.opening,
        lesson.communication.followup,
        "How could you show that you understand the other person?",
      ]
    : [lesson.lines[0].en, lesson.transfer, lesson.communication.opening];
  const turnGoals = [
    "Trả lời bằng thông tin của bạn, thêm một chi tiết nhỏ.",
    "Thử ứng biến khi tình huống thay đổi. Một câu ngắn cũng được.",
    "Lắng nghe, phản hồi thể hiện quan tâm rồi hỏi lại một câu.",
  ];
  const draftKey = `${stage}-${turn}`;
  const answer = session.drafts[draftKey] ?? "";
  const done = prior.length >= 3;
  return (
    <div className="speaking-task">
      <p className="helper">
        Luyện đóng vai có hướng dẫn · Cùng một tình huống, dùng thông tin thật của bạn.
      </p>
      <div className="speaking-turn-meta">
        <Badge variant="violet">
          {learnerName} · {communication ? "Giao tiếp" : "Lượt của bạn"}
        </Badge>
        <span>{Math.min(prior.length, 3)} / 3 lượt</span>
      </div>
      {!done && (
        <p className="speaking-turn-goal" role="status">
          Lượt {turn + 1}/3 · {turnGoals[turn]}
        </p>
      )}
      {turn === 2 && (
        <p className="helper">
          Đắc Nhân Tâm · {lesson.principle}. Đây là tình huống luyện tập, không phải thông tin thật
          về người đối diện.
        </p>
      )}
      <div className="conversation-turn" key={turn}>
        <span className="avatar" aria-hidden="true">
          <Mic size={20} />
        </span>
        <div>
          <small>{communication ? "Đồng nghiệp" : "Bạn hội thoại"}</small>
          <p lang="en">{prompts[turn]}</p>
          <AudioButton
            text={prompts[turn]}
            label={turn === 2 ? "Nghe người đối diện" : "Nghe câu hỏi"}
            variant="outline"
          />
        </div>
      </div>
      {prior.length > 0 && (
        <details className="model-answer">
          <summary>Xem {prior.length} lượt đã lưu</summary>
          {prior.map((a, i) => (
            <div className="learner-turn" key={a.id}>
              <small>
                {learnerName} · {a.kind === "typed" ? "Nhập chữ" : "Luyện nói"}
              </small>
              <p>{a.answer}</p>
              <span>Lượt {i + 1} đã lưu</span>
            </div>
          ))}
        </details>
      )}
      {!done ? (
        <>
          <div className="segmented">
            <button aria-pressed={mode === "spoken"} onClick={() => setMode("spoken")}>
              Nói thành tiếng
            </button>
            <button aria-pressed={mode === "typed"} onClick={() => setMode("typed")}>
              Nhập câu trả lời
            </button>
          </div>
          {mode === "typed" ? (
            <label className="field">
              Câu trả lời của {learnerName}
              <Textarea
                value={answer}
                maxLength={1000}
                rows={3}
                placeholder="Write your own answer in English…"
                lang="en"
                onChange={(e) => saveDraft(draftKey, e.target.value)}
              />
              <span className="helper">Viết ý bạn muốn nói. Sau đó thử đọc thành tiếng.</span>
            </label>
          ) : (
            <>
              <p>
                {turn === 2
                  ? "Hỏi lại một câu thành tiếng. Có thể thu để tự nghe lại."
                  : "Nghe câu hỏi rồi trả lời thành tiếng. Có thể thu để tự nghe lại."}
              </p>
              <RecordingPractice
                key={turn}
                target={communication || turn === 2 ? lesson.communication.reply : lesson.target}
                onRecorded={() => setRecorded(true)}
              />
              <label className="check-field">
                <Checkbox checked={spoken} onCheckedChange={(checked) => setSpoken(checked)} />
                Tôi đã trả lời thành tiếng
              </label>
            </>
          )}
          <Button
            disabled={
              mode === "typed" ? answer.trim().split(/\s+/).length < 3 : !spoken && !recorded
            }
            onClick={() => {
              emit(
                mode === "typed" ? "typed" : "speaking",
                mode === "typed"
                  ? answer.trim()
                  : recorded
                    ? "Đã thu âm câu trả lời."
                    : "Đã trả lời thành tiếng.",
                { contentTrack: communication || turn === 2 ? "carnegie" : "everyday" },
              );
              setTurn((t) => Math.min(t + 1, 2));
              setRecorded(false);
              setSpoken(false);
            }}
            variant="default"
          >
            {turn < 2 ? "Lưu & nghe câu hỏi tiếp" : "Lưu lượt trả lời"}
            <ArrowRight aria-hidden="true" size={18} />
          </Button>
        </>
      ) : (
        <div className="feedback positive">
          <strong>Đã luyện đủ 3 lượt phản hồi.</strong>
          <p>
            Tự kiểm tra: bạn đã trả lời đúng ý, thêm một chi tiết và hỏi lại người đối diện chưa?
          </p>
        </div>
      )}
      <details className="model-answer" key={`hint-${turn}`}>
        <summary>Bí ý? Mở gợi ý cho lượt này</summary>
        {turn === 0 ? (
          <>
            <p lang="en">{communication ? lesson.communication.reply : lesson.target}</p>
            <p>Thay một chi tiết để câu đúng với bạn. Không cần lặp nguyên văn.</p>
          </>
        ) : turn === 1 ? (
          <>
            <p>Nói điều bạn sẽ làm khác đi, rồi thêm một lý do ngắn.</p>
            <div className="chunk-list">
              {lesson.chunks.map((chunk) => (
                <span key={chunk} lang="en">
                  {chunk}
                </span>
              ))}
            </div>
          </>
        ) : (
          <>
            <p>
              Ghi nhận ý hoặc cảm xúc của người kia, rồi hỏi thêm một chi tiết. Có thể bắt đầu bằng{" "}
              <span lang="en">What, How, When</span> hoặc <span lang="en">Could you…?</span>
            </p>
            <p lang="en">{lesson.communication.reply}</p>
            <p>Nghe lại lời người kia, rồi thử đặt một câu hỏi của riêng bạn.</p>
          </>
        )}
      </details>
      <details className="model-answer">
        <summary>Luyện thêm: nghe và nói theo câu mẫu</summary>
        <ShadowingActivity
          lesson={lesson}
          stage="shadowing"
          session={session}
          store={store}
          emit={(kind, answer, extra) => emit(kind, answer, { ...extra, stage: "shadowing" })}
          saveDraft={saveDraft}
        />
      </details>
    </div>
  );
}
function TakeawayActivity({ lesson, session, emit, saveDraft }: ActivityProps) {
  const previous = session.attempts.findLast(
    (a) => a.stage === "reflection" && a.kind === "takeaway",
  );
  const [useAt, setUseAt] = useState(previous?.answer ?? "");
  const [saved, setSaved] = useState(!!previous);
  const carnegieReflection = session.drafts["carnegie-reflection"] ?? "";
  return (
    <div className="takeaway-task">
      <div className="principle-card">
        <Badge variant="violet">Một câu mang theo</Badge>
        <h3 lang="en">{lesson.target}</h3>
        <AudioButton text={lesson.target} label="Nghe câu mang theo" variant="outline" />
        <p>
          Thử nói lại ý này với một chi tiết của riêng bạn, không nhìn câu mẫu. Sau đó chọn lúc bạn
          sẽ dùng.
        </p>
      </div>
      <fieldset className="choice-fieldset">
        <legend>Bạn sẽ thử dùng ý này khi nào?</legend>
        <div className="choices">
          {[
            "Trong cuộc trò chuyện đời thường",
            "Khi trò chuyện với đồng nghiệp",
            "Ở lần luyện tiếp theo",
          ].map((value) => (
            <button
              key={value}
              className={`choice ${useAt === value ? "selected" : ""}`}
              aria-pressed={useAt === value}
              onClick={() => {
                setUseAt(value);
                setSaved(false);
              }}
            >
              {value}
            </button>
          ))}
        </div>
      </fieldset>
      <section className="my-5" aria-label="Áp dụng Đắc Nhân Tâm">
        <Badge variant="violet">Đắc Nhân Tâm · {lesson.principle}</Badge>
        <label className="field mt-3">
          {lesson.communication.reflection}
          <Textarea
            lang="en"
            rows={2}
            maxLength={1000}
            value={carnegieReflection}
            onChange={(e) => saveDraft("carnegie-reflection", e.target.value)}
          />
        </label>
      </section>
      <details className="model-answer">
        <summary>Thêm câu của bạn hoặc ghi chú (tùy chọn)</summary>
        <label className="field">
          Câu bạn muốn dùng
          <Textarea
            rows={2}
            maxLength={1000}
            value={session.drafts.reflection ?? ""}
            onChange={(e) => saveDraft("reflection", e.target.value)}
          />
        </label>
      </details>
      <Button
        disabled={!useAt || carnegieReflection.trim().split(/\s+/).length < 3 || saved}
        variant="outline"
        onClick={() => {
          emit("takeaway", useAt, { contentTrack: "everyday" });
          emit("writing", carnegieReflection.trim(), { contentTrack: "carnegie" });
          setSaved(true);
        }}
      >
        <Check aria-hidden="true" size={18} />
        {saved ? "Đã lưu ý định áp dụng" : "Giữ lại câu này"}
      </Button>
      {saved && (
        <p className="feedback positive" role="status">
          Đã lưu lựa chọn. Hãy thử nói lại ý này bằng lời của bạn ở lần trò chuyện tới.
        </p>
      )}
    </div>
  );
}
function WritingActivity({ lesson, stage, session, emit, saveDraft }: ActivityProps) {
  const reflection = stage === "reflection";
  const value = session.drafts[stage] ?? "";
  const [saved, setSaved] = useState(session.attempts.some((a) => a.stage === stage));
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  return (
    <div className="writing-task">
      {!reflection && (
        <div className="reading-dialogue">
          <span className="eyebrow">READ THE CONVERSATION</span>
          {lesson.lines.map((l) => (
            <p key={l.en} lang="en">
              <strong>{l.speaker}:</strong> {l.en}
            </p>
          ))}
        </div>
      )}
      {reflection && (
        <div className="principle-card">
          <Badge variant="violet">Kết nối với người khác</Badge>
          <h3>Một câu nhỏ. Một thay đổi thật.</h3>
          <p lang="en">{lesson.communication.followup}</p>
        </div>
      )}
      <label className="field">
        {reflection ? lesson.communication.reflection : lesson.writing}
        <Textarea
          rows={reflection ? 4 : 6}
          value={value}
          maxLength={1500}
          lang="en"
          placeholder={reflection ? "Today, I will…" : "Write a short message in your own words…"}
          onChange={(e) => {
            saveDraft(stage, e.target.value);
            setSaved(false);
          }}
        />
        <span className="helper">
          {words} từ · Bản nháp tự lưu trên thiết bị · {reflection ? "1 câu" : "1–3 câu"}
        </span>
      </label>
      <Button
        disabled={words < 4 || saved}
        onClick={() => {
          emit("writing", value.trim());
          setSaved(true);
        }}
        variant="default"
      >
        <Check aria-hidden="true" size={18} />
        {saved ? "Đã lưu bài viết" : "Lưu bài viết"}
      </Button>
      {saved && (
        <div className="feedback positive" role="status">
          <strong>Đã lưu bài viết của bạn.</strong>
          <p>
            Tự rà soát: ý đã rõ chưa, câu có chủ ngữ và động từ chưa?{" "}
            {words > 60
              ? "Thử rút gọn để người đọc dễ nắm ý hơn."
              : "Thêm một chi tiết cụ thể nếu cần."}{" "}
            Gợi ý này dựa trên độ dài, chưa phải chấm ngữ pháp.
          </p>
        </div>
      )}
      {!reflection && (
        <details className="model-answer">
          <summary>Hai cách nói trong hội thoại</summary>
          <SpokenVersions
            versions={{
              short: { en: lesson.target, vi: lesson.targetVi },
              full: lesson.lines[1],
              grammar: lesson.grammar,
            }}
          />
        </details>
      )}
    </div>
  );
}
