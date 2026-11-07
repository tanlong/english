"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Checkbox } from "./ui/checkbox";
import { FormField } from "@/app/components/form-field";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Check,
  AudioLines,
  BriefcaseBusiness,
  Coffee,
  ChevronLeft,
  Clock3,
  Eye,
  EyeOff,
  Download,
  Hotel,
  Lightbulb,
  LoaderCircle,
  MessagesSquare,
  MessageSquareText,
  Mic2,
  RotateCcw,
  Send,
  Settings2,
  Square,
  Volume2,
} from "lucide-react";
import { ComboboxField } from "./select-combobox";
import { useDailySpeaking } from "@/app/speaking/use-daily-speaking";
import { formatTime } from "@/lib/format";
import { downloadFile } from "@/lib/download";
import { speakingScenarios } from "@/app/speaking/scenarios";
import { SpokenVersions } from "./spoken-versions";
const scenarioIcons = [Coffee, BriefcaseBusiness, Hotel, MessagesSquare];
export function DailySpeaking() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsToggleRef = useRef<HTMLButtonElement>(null);
  const mobileSettingsToggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (settingsOpen) settingsToggleRef.current?.focus();
  }, [settingsOpen]);
  function closeSettings() {
    setSettingsOpen(false);
    mobileSettingsToggleRef.current?.focus();
  }
  const {
    mode,
    setMode,
    topic,
    setTopic,
    scenario,
    scenarioId,
    setScenarioId,
    chooseScenario,
    canRetry,
    retrying,
    beginRetry,
    cancelRetry,
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
    updateDraft,
    memoryWarning,
    review,
  } = useDailySpeaking();
  const corrections = turns
    .filter(
      (turn) => turn.role === "assistant" && /^(Sai|Cần sửa):/i.test(turn.explanationVi ?? ""),
    )
    .slice(-3);
  const alternatives = turns
    .filter(
      (turn) => turn.role === "assistant" && /^Cách nói khác:/i.test(turn.explanationVi ?? ""),
    )
    .slice(-3);
  const preparing = !active && !turns.length && !summary;
  return (
    <div className={`daily-speaking ${preparing ? "speaking-setup" : ""}`}>
      <h1 className="sr-only">Nói chuyện cùng Alex</h1>
      {memoryWarning && (
        <p className="field-error" role="alert">
          {memoryWarning}
        </p>
      )}
      {review && (
        <p className="helper">
          Ôn theo bộ nhớ của bạn: <span lang="en">{review.english}</span>. Alex sẽ tạo cơ hội dùng
          lại câu trong tình huống mới.
        </p>
      )}
      {!active && (
        <div className="natural-filters" role="group" aria-label="Chế độ Alex">
          {[
            ["guided", "Guided Talk"],
            ["free", "Free Talk"],
            ["review", "Review"],
          ].map(([value, label]) => (
            <button
              key={value}
              disabled={!!pending || (value === "review" && !review)}
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {!active && (
        <section className="speaking-scenarios" aria-labelledby="speaking-scenarios-title">
          <div className="section-heading">
            <div>
              <h2 id="speaking-scenarios-title">Hôm nay bạn muốn nói chuyện gì?</h2>
              <p>Chọn bối cảnh trước, rồi bấm Bắt đầu trò chuyện.</p>
            </div>
            <Button disabled={locked} onClick={() => void ask("start")} variant="default">
              {pending === "start" ? (
                <LoaderCircle aria-hidden="true" size={18} className="spin" />
              ) : (
                <MessagesSquare aria-hidden="true" size={18} />
              )}
              {summary ? "Bắt đầu buổi mới" : "Bắt đầu trò chuyện"}
            </Button>
          </div>
          <div className="speaking-scenario-grid" role="group" aria-label="Tình huống luyện nói">
            <button
              className="speaking-scenario"
              disabled={!!pending}
              aria-pressed={mode === "free"}
              onClick={() => setMode("free")}
            >
              <MessagesSquare aria-hidden="true" size={22} />
              <small>TỰ DO</small>
              <strong>Chuyện hằng ngày</strong>
              <span>Nói về cuộc sống theo chủ đề bạn chọn.</span>
            </button>
            {speakingScenarios.map((item, index) => {
              const Icon = scenarioIcons[index];
              return (
                <button
                  key={item.id}
                  className="speaking-scenario"
                  disabled={!!pending}
                  aria-pressed={mode === "roleplay" && scenarioId === item.id}
                  onClick={() => chooseScenario(item.id)}
                >
                  <Icon aria-hidden="true" size={22} />
                  <small>{item.category}</small>
                  <strong>{item.title}</strong>
                  <span>{item.goal}</span>
                </button>
              );
            })}
            <button
              className="speaking-scenario"
              disabled={!!pending}
              aria-pressed={mode === "guided"}
              onClick={() => setMode("guided")}
            >
              <AudioLines aria-hidden="true" size={22} />
              <small>THEO BÀI</small>
              <strong>My Daily Routine</strong>
              <span>Luyện cách kể một ngày của bạn theo Lesson 01.</span>
            </button>
          </div>
        </section>
      )}
      <div
        className={`speaking-layout grid items-start gap-6 transition-[grid-template-columns] duration-200 motion-reduce:transition-none max-[1050px]:grid-cols-1 ${settingsOpen ? "grid-cols-[400px_minmax(0,1fr)]" : "grid-cols-[64px_minmax(0,1fr)]"}`}
      >
        <Card
          aria-label="Thiết lập buổi luyện"
          className={`speaking-settings overflow-hidden ${settingsOpen ? "p-6 max-[1050px]:fixed max-[1050px]:top-4 max-[1050px]:left-4 max-[1050px]:z-40 max-[1050px]:max-h-[calc(100dvh-2rem)] max-[1050px]:w-[calc(100%-2rem)] max-[1050px]:max-w-[400px] max-[1050px]:overflow-y-auto max-[1050px]:shadow-xl max-[480px]:p-5" : "p-2 max-[1050px]:hidden"}`}
          render={<section />}
          onKeyDown={(event) => {
            if (event.key === "Escape" && settingsOpen) closeSettings();
          }}
        >
          <div className="speaking-coach flex items-center gap-3 [&_h2]:m-0 [&_h2]:text-lg [&_p]:mt-1 [&_p]:mb-0 [&_p]:text-[14px] [&_p]:text-muted-foreground">
            {settingsOpen && (
              <>
                <span className="speaking-avatar grid size-13 shrink-0 place-items-center rounded-2xl bg-teal-soft text-teal">
                  <MessagesSquare aria-hidden="true" size={26} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 id="speaking-settings-title">Alex</h2>
                  <p>Bạn luyện nói cùng AI</p>
                </div>
              </>
            )}
            <Button
              ref={settingsToggleRef}
              size="icon"
              variant="ghost"
              aria-label={settingsOpen ? "Thu gọn thiết lập" : "Mở thiết lập"}
              title={settingsOpen ? "Thu gọn thiết lập" : "Mở thiết lập"}
              aria-expanded={settingsOpen}
              aria-controls="speaking-settings-content"
              onClick={() => (settingsOpen ? closeSettings() : setSettingsOpen(true))}
            >
              {settingsOpen ? (
                <ChevronLeft aria-hidden="true" size={20} />
              ) : (
                <Settings2 aria-hidden="true" size={20} />
              )}
            </Button>
          </div>
          <div id="speaking-settings-content" hidden={!settingsOpen}>
            <fieldset
              disabled={active || !!pending}
              className="speaking-options mt-4 min-w-0 border-0 p-0"
            >
              <legend className="sr-only">Thiết lập buổi luyện</legend>
              <ComboboxField
                id="speaking-mode"
                label="Chế độ"
                value={mode}
                onValueChange={setMode}
                disabled={active || !!pending}
                options={[
                  { value: "free", label: "Free Talk · Trò chuyện tự do" },
                  { value: "guided", label: "Guided Lesson · Theo bài" },
                  { value: "review", label: "Review · Dùng lại câu đã luyện" },
                  { value: "roleplay", label: "Roleplay · Đóng vai tình huống" },
                ]}
              />
              {mode === "roleplay" && (
                <ComboboxField
                  id="speaking-scenario"
                  label="Tình huống"
                  value={scenarioId}
                  onValueChange={setScenarioId}
                  disabled={active || !!pending}
                  options={speakingScenarios.map((item) => ({ value: item.id, label: item.title }))}
                />
              )}
              {mode !== "roleplay" && (
                <>
                  <ComboboxField
                    id="speaking-topic"
                    label="Chủ đề"
                    value={topic}
                    onValueChange={setTopic}
                    disabled={active || !!pending || mode !== "free"}
                    options={[
                      { value: "Daily routine", label: "Thói quen hằng ngày" },
                      { value: "Work and coworkers", label: "Công việc và đồng nghiệp" },
                      { value: "Family", label: "Gia đình" },
                      { value: "Food and coffee", label: "Ăn uống và cà phê" },
                      { value: "Weekend plans", label: "Kế hoạch cuối tuần" },
                      { value: "Shopping", label: "Mua sắm" },
                    ]}
                  />
                  <ComboboxField
                    id="speaking-lesson"
                    label="Bài học"
                    value="lesson-01"
                    onValueChange={() => {}}
                    disabled
                    options={[{ value: "lesson-01", label: "Lesson 01 · My Daily Routine" }]}
                  />
                </>
              )}
              <ComboboxField
                id="speaking-duration"
                label="Thời lượng mục tiêu"
                value={String(duration)}
                onValueChange={(value) => setDuration(Number(value))}
                disabled={active || !!pending}
                options={[5, 10, 15].map((minutes) => ({
                  value: String(minutes),
                  label: `${minutes} phút`,
                }))}
              />
            </fieldset>
            <ComboboxField
              id="speaking-pace"
              label="Tốc độ"
              value={pace}
              disabled={locked}
              onValueChange={(value) => {
                stopVoice();
                setPace(value);
              }}
              options={[
                { value: "slow", label: "Slow · Chậm, câu ngắn" },
                { value: "normal", label: "Normal · Tự nhiên" },
              ]}
            />
            <ComboboxField
              id="speaking-explanation"
              label="Giải thích tiếng Việt"
              value={explanationMode}
              disabled={locked}
              onValueChange={setExplanationMode}
              options={[
                { value: "asNeeded", label: "Khi cần" },
                { value: "always", label: "Luôn hiển thị" },
                { value: "onRequest", label: "Chỉ khi bấm hỏi" },
              ]}
            />
            <label className="speaking-check flex min-h-11 items-start gap-2.5 py-2 text-[14px] text-muted-foreground [&_input]:mt-0.5 [&_input]:size-[18px] [&_input]:shrink-0 [&_input]:accent-primary">
              <Checkbox
                checked={autoSpeak}
                disabled={!!pending}
                onCheckedChange={(checked) => {
                  setAutoSpeak(checked);
                  if (!checked) stopVoice();
                }}
              />
              Tự phát giọng Alex
            </label>
            <p className="helper">
              Hội thoại hiển thị trong buổi này. Các câu trả lời và kết quả được lưu vào database để
              gợi ý ôn tập. Bạn có thể tải hội thoại và xem hoặc bỏ ghi nhớ trong Cài đặt.
            </p>
          </div>
        </Card>

        <div className="speaking-conversation-shell">
          <div className="speaking-session">
            <Card
              aria-labelledby="conversation-title"
              className="speaking-conversation overflow-hidden"
              render={<section />}
            >
              <header className="speaking-conversation-header flex flex-wrap items-center justify-between gap-4 border-b p-6 max-[480px]:p-5 [&_h2]:m-0 [&_h2]:text-lg [&_p]:mt-1 [&_p]:mb-0 [&_p]:text-[14px] [&_p]:text-muted-foreground">
                <Button
                  ref={mobileSettingsToggleRef}
                  className="min-[1051px]:hidden"
                  size="icon"
                  variant="outline"
                  aria-label="Mở thiết lập"
                  aria-expanded={settingsOpen}
                  aria-controls="speaking-settings-content"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings2 aria-hidden="true" size={18} />
                </Button>
                <div className="min-w-0 flex-1 basis-[180px]">
                  <h2 id="conversation-title">
                    {scenario?.title ?? "Một cuộc trò chuyện nhỏ, mỗi ngày"}
                  </h2>
                  <p aria-live="polite">
                    {pending
                      ? "Alex đang chuẩn bị phản hồi…"
                      : listening
                        ? "Đang nghe bạn nói…"
                        : playing
                          ? "Alex đang nói…"
                          : summary
                            ? "Đã kết thúc"
                            : active
                              ? retrying
                                ? "Thử nói lại theo cách của bạn"
                                : "Đến lượt bạn"
                              : "Sẵn sàng khi bạn muốn nói"}
                  </p>
                </div>
                <span
                  className="speaking-clock inline-flex items-center gap-2 rounded-lg bg-teal-soft px-3 py-2 text-sm text-teal tabular-nums"
                  aria-label={`Đã luyện ${Math.floor(seconds / 60)} phút ${Math.floor(seconds % 60)} giây`}
                >
                  <Clock3 aria-hidden="true" size={18} />
                  {formatTime(seconds)} / {duration}′
                </span>
              </header>
              <div className="speaking-mission" aria-label="Mục tiêu buổi nói">
                <span className="speaking-coach-icon">
                  <MessagesSquare aria-hidden="true" size={22} />
                </span>
                <div>
                  <strong>Alex{scenario ? ` · ${scenario.alexRole}` : " · Bạn hội thoại"}</strong>
                  <p>
                    {scenario
                      ? `Bạn là ${scenario.learnerRole.toLocaleLowerCase("vi")}. ${scenario.goal}`
                      : mode === "guided"
                        ? "Nghe câu hỏi, kể về một ngày của bạn và thử hỏi lại."
                        : "Kể một điều về bạn, nghe phản hồi và hỏi lại khi sẵn sàng."}
                  </p>
                  {scenario && (
                    <details className="speaking-phrase-help">
                      <summary>Mẫu câu để bắt đầu</summary>
                      <div>
                        {scenario.phrases.map((phrase) => (
                          <span key={phrase} lang="en">
                            {phrase}
                          </span>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
              <div
                className={`speaking-log overflow-y-auto overscroll-contain bg-background p-6 max-[480px]:p-4 ${preparing ? "min-h-[220px]" : "h-[440px] max-[480px]:h-[320px]"}`}
                role="log"
                aria-label="Hội thoại với Alex"
                aria-live="polite"
                aria-relevant="additions text"
                ref={logRef}
              >
                {!turns.length && (
                  <div className="speaking-empty mx-auto grid min-h-full max-w-[420px] place-content-center justify-items-center text-center [&>svg]:text-teal [&_h3]:mb-0 [&_p]:text-muted-foreground">
                    <MessagesSquare aria-hidden="true" size={40} />
                    <h3>Không cần nói hoàn hảo.</h3>
                    <p className="helper">
                      Nội dung trò chuyện được gửi đến OpenAI khi bạn bắt đầu hoặc gửi câu trả lời.
                    </p>
                  </div>
                )}
                {turns.map((turn, index) => (
                  <SpeakingTurn
                    key={`${summary ? "summary" : "active"}:${index}:${turn.content}`}
                    turn={turn}
                    canRetry={
                      canRetry &&
                      turn ===
                        turns.findLast((item) => item.role === "assistant" && item.kind !== "hint")
                    }
                    locked={locked}
                    atLimit={atLimit}
                    onRetry={beginRetry}
                    onSpeak={(text) => void speak(text)}
                  />
                ))}
                {pending && (
                  <p
                    className="speaking-pending flex items-center gap-2 text-sm text-muted-foreground"
                    role="status"
                  >
                    <LoaderCircle aria-hidden="true" size={18} className="spin" />
                    {pending === "end"
                      ? "Alex đang tổng kết buổi luyện…"
                      : pending === "explain"
                        ? "Alex đang giải thích…"
                        : "Alex đang chuẩn bị phản hồi…"}
                  </p>
                )}
              </div>
            </Card>
            <Card
              aria-label="Trả lời và hỗ trợ"
              className="speaking-controls p-5 [&>.button-row]:gap-2"
              render={<aside />}
            >
              <h2 className="speaking-controls-title" hidden={preparing}>
                Trả lời & hỗ trợ
              </h2>
              <div className="button-row" hidden={preparing}>
                <Button
                  disabled={!!pending || listening || !(summary?.reply || lastCoach)}
                  onClick={() => (playing ? stopVoice() : void speak(summary?.reply || lastCoach))}
                  variant="outline"
                >
                  {playing ? (
                    <Square aria-hidden="true" size={16} />
                  ) : (
                    <Volume2 aria-hidden="true" size={18} />
                  )}
                  {playing ? "Dừng âm thanh" : "Nghe lại"}
                </Button>
                <Button
                  disabled={!active || locked || atLimit}
                  onClick={() => void ask("hint")}
                  variant="outline"
                >
                  <Lightbulb aria-hidden="true" size={18} />
                  Gợi ý
                </Button>
              </div>
              {audioError && (
                <p className="field-error" role="alert">
                  {audioError}
                </p>
              )}
              {error && (
                <p className="helper">
                  <Link href="/preview/my-daily-routine">
                    Luyện với câu mẫu có sẵn trong khi chờ Alex kết nối.
                  </Link>
                </p>
              )}
              {error && (
                <p className="field-error" role="alert">
                  {error}
                </p>
              )}
              {active && seconds >= duration * 60 && (
                <p className="helper" role="status">
                  Đã đến thời lượng mục tiêu. Bạn có thể tiếp tục nói hoặc kết thúc để xem tổng kết.
                </p>
              )}
              {active && atLimit && (
                <p className="helper" role="status">
                  Buổi này đã có nhiều lượt luyện. Hãy kết thúc để xem tổng kết rồi mở buổi mới.
                </p>
              )}
              <form
                hidden={preparing}
                onSubmit={(event) => {
                  event.preventDefault();
                  sendDraft();
                }}
              >
                {retrying && (
                  <div className="speaking-retry-note" role="status">
                    <span>
                      <RotateCcw aria-hidden="true" size={18} />
                      Nói lại câu vừa được góp ý. Alex sẽ đối chiếu với lượt trước.
                    </span>
                    <Button type="button" variant="link" disabled={locked} onClick={cancelRetry}>
                      Hủy luyện lại
                    </Button>
                  </div>
                )}
                <FormField className="mb-0" id="speaking-answer" label="Câu trả lời của bạn">
                  <Textarea
                    className="min-h-[100px] text-sm md:text-sm"
                    id="speaking-answer"
                    ref={inputRef}
                    lang="en"
                    value={draft}
                    onChange={(event) => updateDraft(event.target.value)}
                    disabled={!active || locked || atLimit}
                    maxLength={1500}
                    rows={3}
                    placeholder={
                      retrying
                        ? "Thử diễn đạt lại câu của bạn…"
                        : scenario
                          ? "I'd like…"
                          : "This morning, I…"
                    }
                    aria-describedby="speaking-input-help"
                  />
                </FormField>
                <p className="helper" id="speaking-input-help">
                  {listening
                    ? "Đang nghe liên tục… Bấm Dừng mic khi nói xong, rồi kiểm tra chữ trước khi gửi."
                    : micSupported
                      ? "Dừng mic, kiểm tra chữ rồi gửi. Tối đa 1.500 ký tự mỗi lượt."
                      : "Nhập câu trả lời và kiểm tra trước khi bấm Gửi."}
                </p>
                {micSupported ? (
                  <label className="speaking-check flex min-h-11 items-start gap-2.5 py-2 text-[14px] text-muted-foreground [&_input]:mt-0.5 [&_input]:size-[18px] [&_input]:shrink-0 [&_input]:accent-primary">
                    <Checkbox
                      checked={micConsent}
                      disabled={listening}
                      onCheckedChange={(checked) => setMicConsent(checked)}
                    />
                    Tôi đồng ý dùng tính năng chuyển giọng nói thành chữ.
                  </label>
                ) : (
                  <p className="helper">
                    Trình duyệt chưa hỗ trợ nhận diện giọng nói. Bạn vẫn có thể nhập câu trả lời.
                  </p>
                )}
                {micError && (
                  <p className="field-error" role="alert">
                    {micError}
                  </p>
                )}
                <div className="speaking-send-row mt-4 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    size="icon"
                    className="size-12 rounded-full"
                    variant={listening ? "destructive" : "outline"}
                    disabled={!active || !!pending || !micSupported || !micConsent || atLimit}
                    aria-pressed={listening}
                    aria-label={listening ? "Dừng mic" : "Bấm để nói"}
                    title={listening ? "Dừng mic" : "Bấm để nói"}
                    onClick={toggleMic}
                  >
                    {listening ? (
                      <Square aria-hidden="true" size={18} />
                    ) : (
                      <Mic2 aria-hidden="true" size={18} />
                    )}
                  </Button>
                  <Button
                    type="submit"
                    className="min-h-12 rounded-full px-5"
                    aria-label="Gửi câu trả lời"
                    title="Gửi câu trả lời"
                    disabled={!active || locked || !draft.trim() || atLimit}
                    variant="default"
                  >
                    <Send aria-hidden="true" size={18} />
                    Gửi
                  </Button>
                </div>
              </form>
              <div
                className="speaking-session-footer mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-3"
                hidden={preparing}
              >
                <p className="helper" data-testid="speaking-counts">
                  {spoken} lượt qua mic · {typed} lượt nhập chữ · {hints} gợi ý
                </p>
                <Button disabled={!active || locked} onClick={() => void ask("end")} variant="link">
                  <Check aria-hidden="true" size={18} />
                  Kết thúc & ôn lại
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
      {summary && (
        <Card
          ref={summaryRef}
          tabIndex={-1}
          role="region"
          aria-labelledby="speaking-summary-title"
          className="speaking-summary mt-6 p-7 wrap-anywhere max-[480px]:p-5 [&>p[lang=en]]:mt-2 [&>p[lang=en]]:mb-0 [&>p[lang=en]]:leading-[1.8] [&>p[lang=en]]:whitespace-pre-wrap"
        >
          <span className="eyebrow">END & REVIEW</span>
          <h2 id="speaking-summary-title">Nhìn lại cuộc trò chuyện</h2>
          <p className="helper">
            Buổi nói dài {formatTime(seconds)} · {spoken} lượt qua mic · {typed} lượt nhập chữ. Phản
            hồi dựa trên nội dung, chưa đánh giá phát âm.
          </p>
          <p lang="en">{summary.reply}</p>
          {summary.translationVi && <SpeakingTranslation text={summary.translationVi} />}
          {summary.explanationVi && (
            <SpeakingExplanation text={summary.explanationVi} title="Tổng kết tiếng Việt" />
          )}
          <div className="speaking-recap-stats">
            <div>
              <strong>{spoken}</strong>
              <span>Lượt qua mic</span>
            </div>
            <div>
              <strong>{typed}</strong>
              <span>Lượt nhập chữ</span>
            </div>
            <div>
              <strong>{formatTime(seconds)}</strong>
              <span>Thời lượng buổi</span>
            </div>
          </div>
          {corrections.length > 0 && (
            <section className="speaking-recap-corrections" aria-label="Góp ý đã luyện">
              <h3>Giữ lại để luyện lần sau</h3>
              {corrections.map((turn, index) => (
                <div key={index}>
                  <SpeakingExplanation text={turn.explanationVi!} title={`Góp ý ${index + 1}`} />
                  {turn.speakingVersions && (
                    <SpokenVersions
                      versions={turn.speakingVersions}
                      onSpeak={(text) => void speak(text)}
                      disabled={locked}
                    />
                  )}
                </div>
              ))}
            </section>
          )}
          {alternatives.length > 0 && (
            <section className="speaking-recap-corrections" aria-label="Cách nói khác đã gặp">
              <h3>Thêm cách diễn đạt</h3>
              {alternatives.map((turn, index) => (
                <div key={index}>
                  <SpeakingExplanation text={turn.explanationVi!} title="Câu của bạn đã đúng" />
                  {turn.speakingVersions && (
                    <SpokenVersions
                      versions={turn.speakingVersions}
                      onSpeak={(text) => void speak(text)}
                      disabled={locked}
                    />
                  )}
                </div>
              ))}
            </section>
          )}
          <div className="button-row speaking-recap-actions">
            <Button
              variant="outline"
              onClick={() =>
                downloadFile(
                  turns
                    .map(
                      (turn) =>
                        `${turn.role === "assistant" ? "Alex" : "Bạn"}: ${turn.content}${turn.translationVi ? `\nNghĩa: ${turn.translationVi}` : ""}${turn.explanationVi ? `\n${turn.explanationVi}` : ""}${turn.speakingVersions ? `\nBản ngắn gọn: ${turn.speakingVersions.short.en}\n${turn.speakingVersions.short.vi}\nBản đầy đủ: ${turn.speakingVersions.full.en}\n${turn.speakingVersions.full.vi}` : ""}${turn.speakingVersions?.grammar ? `\nBản đúng ngữ pháp: ${turn.speakingVersions.grammar.en}\n${turn.speakingVersions.grammar.vi}` : ""}`,
                    )
                    .join("\n\n") +
                    `\n\nTổng kết: ${summary.reply}\n${summary.translationVi ?? ""}\n${summary.explanationVi}`,
                  "natural-english-hoi-thoai.txt",
                  "text/plain;charset=utf-8",
                )
              }
            >
              <Download aria-hidden="true" size={18} />
              Tải hội thoại
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function SpeakingTurn({
  turn,
  canRetry,
  locked,
  atLimit,
  onRetry,
  onSpeak,
}: {
  turn: ReturnType<typeof useDailySpeaking>["turns"][number];
  canRetry: boolean;
  locked: boolean;
  atLimit: boolean;
  onRetry: () => void;
  onSpeak: (text: string) => void;
}) {
  const [translationVisible, setTranslationVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const translationId = useId();
  const feedbackId = useId();
  const translationLabel = translationVisible ? "Ẩn nghĩa tiếng Việt" : "Hiện nghĩa tiếng Việt";
  const feedbackLabel = `${feedbackVisible ? "Ẩn" : "Xem"} góp ý${turn.speakingVersions ? " và cách nói" : ""}`;

  return (
    <article
      className={`speaking-turn mb-4 max-w-[92%] rounded-2xl border bg-card px-[18px] py-4 wrap-anywhere max-[480px]:max-w-full [&.user]:ml-auto [&.user]:bg-accent [&>strong]:text-xs [&>strong]:text-muted-foreground [&>p]:mt-2 [&>p]:mb-0 [&>p]:leading-[1.8] [&>p]:whitespace-pre-wrap ${turn.role}`}
    >
      <div className="speaking-turn-heading">
        <strong>
          {turn.role === "assistant"
            ? turn.kind === "hint"
              ? "Alex · Gợi ý"
              : "Alex"
            : turn.source === "speech"
              ? "Bạn · Qua mic"
              : "Bạn · Nhập chữ"}
        </strong>
        {turn.role === "assistant" && (
          <div className="speaking-turn-actions">
            {turn.translationVi && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={translationLabel}
                title={translationLabel}
                aria-expanded={translationVisible}
                aria-controls={translationId}
                onClick={() => setTranslationVisible((value) => !value)}
              >
                {translationVisible ? (
                  <EyeOff aria-hidden="true" size={18} />
                ) : (
                  <Eye aria-hidden="true" size={18} />
                )}
              </Button>
            )}
            {(turn.explanationVi || turn.speakingVersions) && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={feedbackLabel}
                title={feedbackLabel}
                aria-expanded={feedbackVisible}
                aria-controls={feedbackId}
                onClick={() => setFeedbackVisible((value) => !value)}
              >
                <MessageSquareText aria-hidden="true" size={18} />
              </Button>
            )}
            {canRetry && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Thử nói lại"
                title="Thử nói lại"
                disabled={locked || atLimit}
                onClick={onRetry}
              >
                <RotateCcw aria-hidden="true" size={18} />
              </Button>
            )}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Nghe phản hồi của Alex"
              title="Nghe phản hồi này"
              disabled={locked}
              onClick={() => onSpeak(turn.content)}
            >
              <Volume2 aria-hidden="true" size={17} />
            </Button>
          </div>
        )}
      </div>
      <p lang="en">{turn.content}</p>
      {turn.role === "assistant" && turn.translationVi && (
        <div className="speaking-translation mt-2">
          <p
            id={translationId}
            hidden={!translationVisible}
            lang="vi"
            className="my-2.5 min-w-0 text-xs leading-relaxed text-muted-foreground italic large-text:text-base whitespace-pre-wrap"
          >
            {turn.translationVi}
          </p>
        </div>
      )}
      {(turn.explanationVi || turn.speakingVersions) && (
        <div id={feedbackId} hidden={!feedbackVisible}>
          {turn.explanationVi && (
            <SpeakingExplanation text={turn.explanationVi} title="Giải thích tiếng Việt" />
          )}
          {turn.speakingVersions && (
            <SpokenVersions versions={turn.speakingVersions} onSpeak={onSpeak} disabled={locked} />
          )}
        </div>
      )}
    </article>
  );
}

function SpeakingTranslation({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const label = visible ? "Ẩn nghĩa tiếng Việt" : "Hiện nghĩa tiếng Việt";
  return (
    <div className="speaking-translation mt-2 flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-blue-strong"
        aria-label={label}
        title={label}
        aria-expanded={visible}
        aria-controls={id}
        onClick={() => setVisible((value) => !value)}
      >
        {visible ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
      </Button>
      <p
        id={id}
        hidden={!visible}
        lang="vi"
        className="my-2.5 min-w-0 text-xs leading-relaxed text-muted-foreground italic large-text:text-base whitespace-pre-wrap"
      >
        {text}
      </p>
    </div>
  );
}

function SpeakingExplanation({ text, title }: { text: string; title: string }) {
  return (
    <div
      className="speaking-vietnamese mt-3.5 rounded-r-lg border-l-[4px] border-teal bg-teal-soft px-3.5 py-2.5 text-sm text-teal wrap-anywhere [&>strong]:text-xs [&_p]:mt-3 [&_p]:mb-0 [&_p]:whitespace-pre-wrap"
      lang="vi"
    >
      <strong>{/^Cách nói khác:/i.test(text) ? "Câu của bạn đã đúng" : title}</strong>
      {text
        .trim()
        .replace(/^Bạn nói\s+([\s\S]+?)\s+Câu đúng là\s+/i, "Cần sửa: $1\n\nGợi ý sửa: ")
        .replace(/^Sai:/i, "Cần sửa:")
        .replace(/\n\s*\nGợi ý đúng:/i, "\n\nGợi ý sửa:")
        .split(/\n\s*\n/)
        .map((paragraph, index) => {
          const label = paragraph.match(/^(Cần sửa|Gợi ý sửa|Cách nói khác):\s*/);
          return (
            <p key={index}>
              {label ? (
                <>
                  <strong>{label[1]}:</strong> {paragraph.slice(label[0].length)}
                </>
              ) : (
                paragraph
              )}
            </p>
          );
        })}
    </div>
  );
}
