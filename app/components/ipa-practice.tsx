"use client";

import { useRef, useState } from "react";
import { ArrowLeft, Check, ExternalLink, Play, RotateCcw } from "lucide-react";
import { ipaGroups, ipaReference, ipaSounds, type IpaGroup, type IpaSound } from "../content/ipa";
import { useLearningStore } from "../learning/provider";
import { stopAudio } from "../audio/client";
import { cn } from "@/lib/utils";
import { AudioButton } from "./audio-button";
import { PageHeading } from "./page-heading";
import { RecordingPractice } from "./recording-practice";
import { IpaMouthDiagram } from "./ipa-mouth-diagram";
import { SearchInput } from "./search-input";
import { Badge } from "./ui/badge";
import { Button, buttonVariants } from "./ui/button";
import { Card } from "./ui/card";

export function IpaPractice() {
  const store = useLearningStore();
  const [selected, setSelected] = useState(ipaSounds[0].id);
  const [group, setGroup] = useState<IpaGroup | "all">("all");
  const [query, setQuery] = useState("");
  const [showVideo, setShowVideo] = useState(false);
  const chart = useRef<HTMLHeadingElement>(null);
  const practice = useRef<HTMLHeadingElement>(null);
  const practiced = store.state.ipaPracticed ?? [];
  const current = ipaSounds.find((sound) => sound.id === selected)!;
  const search = query.trim().toLocaleLowerCase("vi").replaceAll("/", "").replaceAll("ː", "");
  const filtered = ipaSounds.filter(
    (sound) =>
      (group === "all" || sound.group === group) &&
      `${sound.symbol} ${sound.britishSymbol ?? ""} ${sound.word} ${sound.meaning} ${sound.id}`
        .toLocaleLowerCase("vi")
        .includes(search),
  );

  function choose(id: string) {
    stopAudio();
    setSelected(id);
    if (window.matchMedia("(max-width: 1050px)").matches) {
      requestAnimationFrame(() => {
        practice.current?.focus({ preventScroll: true });
        practice.current?.scrollIntoView({ block: "start" });
      });
    }
  }

  function togglePracticed() {
    store.setState((old) => {
      const ids = old.ipaPracticed ?? [];
      return {
        ...old,
        ipaPracticed: ids.includes(selected)
          ? ids.filter((id) => id !== selected)
          : [...ids, selected],
      };
    });
  }

  return (
    <div className="ipa-page">
      <PageHeading
        eyebrow="CHỌN ÂM → NGHE MẪU → TỰ NÓI"
        title="Luyện IPA"
        text="Mỗi lần một âm. Xem cách đặt miệng, nghe từ mẫu, rồi tự nói và đối chiếu."
      />
      <Card
        className="mb-6 flex flex-wrap items-center justify-between gap-5 p-6 max-[480px]:p-5"
        render={<section />}
        aria-label="Tiến độ luyện IPA"
      >
        <div className="min-w-0 flex-1 basis-[240px]">
          <p className="mb-2 font-semibold">
            {practiced.length}/{ipaSounds.length} âm đã luyện
          </p>
          <progress value={practiced.length} max={ipaSounds.length} aria-label="Số âm đã luyện" />
          <p className="mt-2 mb-0 text-xs text-muted-foreground">
            Tự đánh dấu sau khi luyện. Tiến độ lưu trên thiết bị này.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setShowVideo((value) => !value)}
            aria-expanded={showVideo}
            aria-controls="ipa-video"
          >
            <Play aria-hidden="true" size={18} />
            {showVideo ? "Ẩn video tham khảo" : "Xem video tham khảo"}
          </Button>
          <a
            className={cn(buttonVariants({ variant: "outline" }))}
            href={ipaReference.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            Mở playlist
            <ExternalLink aria-hidden="true" size={16} />
          </a>
        </div>
      </Card>

      <Card
        id="ipa-video"
        className="mb-6 overflow-hidden"
        render={<section />}
        hidden={!showVideo}
      >
        <div className="p-5">
          <h2 className="mb-2 text-lg">
            {ipaReference.title} · {ipaReference.author}
          </h2>
          <p className="mb-0 text-sm text-muted-foreground">
            Bắt đầu từ video giới thiệu; chọn bài tiếp theo trong playlist. Nếu video không phát
            được tại đây, dùng “Mở playlist”.
          </p>
        </div>
        {showVideo && (
          <iframe
            className="aspect-video w-full border-0"
            title="42 Ngày Phát Âm · Dan Hauer"
            src={`https://www.youtube-nocookie.com/embed/${ipaReference.videoId}?list=${ipaReference.playlistId}&rel=0`}
            allow="encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
      </Card>

      <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start gap-6 max-[1050px]:grid-cols-1">
        <Card
          className="p-6 max-[480px]:p-5"
          render={<section />}
          aria-labelledby="ipa-chart-title"
        >
          <h2 ref={chart} id="ipa-chart-title" tabIndex={-1} className="text-lg outline-none">
            Chọn âm để luyện
          </h2>
          <p className="text-sm text-muted-foreground">
            40 mục Anh-Mỹ và 4 âm Anh-Anh bổ sung. Dấu / / thể hiện âm, không phải tên chữ cái.
          </p>
          <p className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <span
              aria-hidden="true"
              className="size-3 shrink-0 rounded border border-red-200 bg-red-50"
            />
            Nền đỏ nhạt: âm Anh-Anh bổ sung. Nhãn UK: ký hiệu Anh-Anh tương ứng.
          </p>
          <div className="mb-4 flex">
            <SearchInput
              aria-label="Tìm âm IPA"
              placeholder="Tìm ký hiệu, từ hoặc nghĩa…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div role="group" aria-label="Nhóm âm IPA" className="mb-5 flex flex-wrap gap-2">
            {[{ id: "all", label: "Tất cả" }, ...ipaGroups].map((item) => (
              <Button
                key={item.id}
                variant={group === item.id ? "default" : "outline"}
                size="sm"
                aria-pressed={group === item.id}
                onClick={() => setGroup(item.id as IpaGroup | "all")}
              >
                {item.label}
              </Button>
            ))}
          </div>
          {ipaGroups.map((item) => {
            const sounds = filtered.filter((sound) => sound.group === item.id);
            if (!sounds.length) return null;
            return (
              <section key={item.id} className="mb-6 last:mb-0" aria-label={item.label}>
                <h3 className="mb-3 text-base">
                  {item.label}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    · {sounds.length}
                  </span>
                </h3>
                <div className="grid grid-cols-4 gap-2 max-[390px]:grid-cols-3">
                  {sounds.map((sound) => (
                    <Button
                      key={sound.id}
                      variant="outline"
                      className={cn(
                        "relative min-h-[86px] min-w-0 flex-col gap-1 px-1 py-3 font-normal",
                        sound.accent === "en-GB" &&
                          "border-red-200 bg-red-50 text-red-900 hover:border-red-400 hover:bg-red-100",
                        selected === sound.id &&
                          (sound.accent === "en-GB"
                            ? "border-red-500 bg-red-100 ring-2 ring-red-200"
                            : "border-primary bg-accent text-blue-strong"),
                      )}
                      aria-label={`Âm /${sound.symbol}/ · ${sound.word}${sound.accent === "en-GB" ? " · Anh-Anh" : ""}`}
                      data-accent={sound.accent ?? "en-US"}
                      aria-pressed={selected === sound.id}
                      onClick={() => choose(sound.id)}
                    >
                      <span className="text-2xl leading-none">/{sound.symbol}/</span>
                      <span className="text-xs" lang="en">
                        {sound.word}
                      </span>
                      {sound.accent === "en-GB" && (
                        <span className="text-[12px] font-semibold">Anh-Anh</span>
                      )}
                      {sound.britishSymbol && (
                        <span className="rounded bg-red-50 px-1 text-[12px] text-red-900">
                          UK /{sound.britishSymbol}/
                        </span>
                      )}
                      {practiced.includes(sound.id) && (
                        <Check
                          aria-label="Đã luyện"
                          size={14}
                          className="absolute top-1 right-1 text-teal"
                        />
                      )}
                    </Button>
                  ))}
                </div>
              </section>
            );
          })}
          {!filtered.length && (
            <div role="status" className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Không tìm thấy âm phù hợp.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setGroup("all");
                }}
              >
                Xem tất cả âm
              </Button>
            </div>
          )}
        </Card>

        <Card
          className="sticky top-6 p-6 max-[1050px]:static max-[480px]:p-5"
          render={<section />}
          aria-labelledby="ipa-practice-title"
        >
          <Button
            variant="link"
            className="mb-3 hidden max-[1050px]:inline-flex"
            onClick={() => {
              chart.current?.focus({ preventScroll: true });
              chart.current?.scrollIntoView({ block: "start" });
            }}
          >
            <ArrowLeft aria-hidden="true" size={16} />
            Chọn âm khác
          </Button>
          <Badge
            className={cn(current.accent === "en-GB" && "border-red-200 bg-red-50 text-red-900")}
          >
            {ipaGroups.find((item) => item.id === current.group)!.label}
            {current.accent === "en-GB" && " · Anh-Anh"}
          </Badge>
          <h2
            ref={practice}
            id="ipa-practice-title"
            tabIndex={-1}
            className="mt-4 mb-2 text-4xl outline-none"
          >
            Âm /{current.symbol}/
          </h2>
          <IpaSoundPractice key={current.id} sound={current} />
          <Button
            className="mt-5 w-full"
            variant={practiced.includes(selected) ? "outline" : "default"}
            aria-pressed={practiced.includes(selected)}
            onClick={togglePracticed}
          >
            <Check aria-hidden="true" size={18} />
            {practiced.includes(selected) ? "Đã luyện · Bỏ đánh dấu" : "Đánh dấu đã luyện"}
          </Button>
        </Card>
      </div>
      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        Video tham khảo:{" "}
        <a href={ipaReference.href} target="_blank" rel="noopener noreferrer">
          {ipaReference.title} · {ipaReference.author}
        </a>
        . Ghi chú và bài luyện được viết riêng cho ứng dụng. Đối chiếu thêm với{" "}
        <a href="https://soundsamerican.net/" target="_blank" rel="noopener noreferrer">
          bảng âm Sounds American
        </a>{" "}
        và{" "}
        <a
          href="https://cambridgeveritas.com/tools/accent-enhancer"
          target="_blank"
          rel="noopener noreferrer"
        >
          bảng âm Anh-Anh
        </a>
        . Tham khảo thêm cách tạo âm tại{" "}
        <a href="https://soundsofspeech.uiowa.edu/" target="_blank" rel="noopener noreferrer">
          Sounds of Speech · University of Iowa
        </a>
        .
      </p>
    </div>
  );
}

function IpaSoundPractice({ sound }: { sound: IpaSound }) {
  const [target, setTarget] = useState(() => (Math.random() < 0.5 ? 0 : 1));
  const [heard, setHeard] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const options = [{ word: sound.word, ipa: sound.ipa }, sound.pair];
  const locale = sound.accent ?? "en-US";
  return (
    <div>
      <p className="mb-4 text-muted-foreground">
        <span className="font-semibold text-foreground" lang="en">
          {sound.word}
        </span>{" "}
        /{sound.ipa}/ · {sound.meaning}
      </p>
      {sound.britishSymbol && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          Anh-Anh tương ứng: /{sound.britishSymbol}/. Từ nghe mẫu bên dưới dùng giọng Anh-Mỹ.
        </p>
      )}
      <div className="mb-5 rounded-xl border bg-background p-4">
        <h3 className="mb-2 text-base">Cách đặt miệng</h3>
        <IpaMouthDiagram sound={sound} />
        <p className="mb-0 text-sm leading-relaxed text-muted-foreground">{sound.tip}</p>
      </div>
      <div className="mb-5 flex flex-wrap gap-3">
        <AudioButton text={sound.word} locale={locale} label="Nghe từ mẫu" />
        <AudioButton
          text={sound.word}
          locale={locale}
          speed={0.8}
          label="Nghe chậm · 0.8×"
          variant="outline"
        />
      </div>
      <section className="rounded-xl border p-4" aria-label="Tự kiểm tra nghe">
        <h3 className="mb-2 text-base">Nghe và chọn từ</h3>
        <p className="text-sm text-muted-foreground">Nghe hết từ mẫu, rồi chọn từ bạn vừa nghe.</p>
        <AudioButton
          key={round}
          text={options[target].word}
          locale={locale}
          label="Nghe từ cần chọn"
          variant="outline"
          onPlayed={() => setHeard(true)}
        />
        <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="Chọn từ vừa nghe">
          {options.map((option, index) => (
            <Button
              key={option.word}
              variant="outline"
              disabled={!heard || answer !== null}
              aria-pressed={answer === index}
              className={cn(
                answer !== null && index === target && "border-teal bg-teal-soft text-teal",
              )}
              onClick={() => setAnswer(index)}
            >
              <span lang="en">{option.word}</span>
            </Button>
          ))}
        </div>
        {answer !== null && (
          <p role="status" className="mt-3 mb-0 text-sm leading-relaxed">
            <strong>{answer === target ? "Đúng rồi!" : "Thử nghe lại nhé."}</strong> Từ vừa nghe:{" "}
            <span lang="en">{options[target].word}</span> /{options[target].ipa}/.
          </p>
        )}
        <Button
          className="mt-2"
          variant="link"
          onClick={() => {
            stopAudio();
            setTarget(Math.random() < 0.5 ? 0 : 1);
            setHeard(false);
            setAnswer(null);
            setRound((value) => value + 1);
          }}
        >
          <RotateCcw aria-hidden="true" size={16} />
          Thử lượt khác
        </Button>
      </section>
      <div className="mt-5">
        <RecordingPractice target={sound.word} />
      </div>
      <p className="mt-3 mb-0 text-xs leading-relaxed text-muted-foreground">
        Tự nói lại từ mẫu và nghe bản thu để đối chiếu. Nhận diện chữ chỉ đo độ khớp từ, không chấm
        độ chuẩn của từng âm IPA.
      </p>
    </div>
  );
}
