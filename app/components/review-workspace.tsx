"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Layers3, RotateCcw } from "lucide-react";
import { useLearningStore } from "../learning/provider";

import { isDue, scheduleReview, type ReviewRating } from "../learning/review";

import { stopAudio } from "../audio/client";

import { Artwork } from "./artwork";
import { Button } from "./ui/button";
import { AudioButton } from "./audio-button";
import { PageHeading } from "./page-heading";

import { useCards } from "./learning-content";
export function ReviewWorkspace() {
  const store = useLearningStore();
  const cards = useCards();
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  const [front, setFront] = useState<"vi" | "en">("vi");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [rated, setRated] = useState<string[]>([]);
  const [lastRating, setLastRating] = useState("");
  const submitLock = useRef(false);
  const currentCardRef = useRef<HTMLElement>(null);
  const due = cards.filter(
    (card) =>
      isDue(store.state.cardReviews?.[card.id], store.now ?? new Date()) &&
      !rated.includes(card.id),
  );
  const card = due.find((item) => item.id === selectedCardId) ?? due[0];
  const flipped = card?.id === flippedCardId;
  function rate(rating: ReviewRating) {
    if (!card || !flipped || submitLock.current) return;
    submitLock.current = true;
    const eventId = crypto.randomUUID();
    store.setState((old) => ({
      ...old,
      cardReviews: {
        ...old.cardReviews,
        [card.id]: scheduleReview(old.cardReviews?.[card.id], rating, eventId),
      },
    }));
    setLastRating(rating === "again" ? "Đã hẹn ôn lại sau 10 phút." : "Đã lưu lịch ôn tiếp theo.");
    setRated((old) => [...old, card.id]);
    setFlippedCardId(null);
    stopAudio();
    window.setTimeout(() => {
      submitLock.current = false;
    }, 250);
  }
  return (
    <div className="natural-workspace natural-review">
      <PageHeading
        eyebrow="NHỚ LẠI, RỒI MỚI LẬT THẺ"
        title="Một câu quen, thêm một lần nhớ."
        text="Thử nói câu tiếng Anh trước khi xem đáp án. Bạn tự chọn mức độ nhớ của mình."
      />
      {lastRating && (
        <p className="helper" role="status">
          {lastRating}
        </p>
      )}
      {!card ? (
        <section className="natural-empty">
          <Layers3 size={40} aria-hidden="true" />
          <h2>{cards.length ? "Bạn đã ôn xong các câu đến hạn." : "Chưa có câu nào để ôn."}</h2>
          <p>
            {cards.length
              ? `${rated.length} thẻ vừa ôn. Quay lại khi thẻ đến hạn tiếp theo.`
              : "Hoàn thành một lượt trả lời trong bài học để thêm câu vào đây."}
          </p>
          <Link className="natural-primary" href="/roadmap">
            Chọn bài học <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </section>
      ) : (
        <>
          <div className="natural-review-toolbar">
            <span>
              {due.length} thẻ đến hạn · {card.preview ? "Học thử" : "Bài đã duyệt"}
            </span>
            <button
              className="natural-text-toggle"
              onClick={() => {
                setFront((v) => (v === "vi" ? "en" : "vi"));
                setFlippedCardId(null);
                stopAudio();
              }}
            >
              {front === "vi" ? "Mặt trước: Tiếng Việt" : "Mặt trước: English"}
            </button>
          </div>
          <div className="natural-review-body">
            <section
              ref={currentCardRef}
              className="natural-review-current"
              aria-label="Thẻ đang ôn"
              aria-live="polite"
              tabIndex={-1}
            >
              <article className="natural-flashcard" key={card.id}>
                <Artwork scene={card.segment.scene} />
                <div className="natural-flashcard-copy">
                  <span className="eyebrow">
                    {card.lesson.title} · {flipped ? "ĐÁP ÁN" : "THỬ NHỚ CÂU NÀY"}
                  </span>
                  <h2 lang={front}>{card.segment.basic[front]}</h2>
                  {flipped ? (
                    <div className="natural-flashcard-answer">
                      <p lang={front === "vi" ? "en" : "vi"}>
                        {card.segment.basic[front === "vi" ? "en" : "vi"]}
                      </p>
                      {card.preview ? (
                        <AudioButton
                          text={card.segment.basic.en}
                          label="Nghe phát âm"
                          variant="outline"
                        />
                      ) : (
                        <audio
                          controls
                          preload="none"
                          src={card.draft?.audio[`${card.segment.id}:basic`]?.url}
                          aria-label="Nghe phát âm"
                        />
                      )}
                    </div>
                  ) : (
                    <Button onClick={() => setFlippedCardId(card.id)}>
                      <RotateCcw size={18} aria-hidden="true" />
                      Lật thẻ
                    </Button>
                  )}
                </div>
              </article>
              {flipped && (
                <div className="natural-ratings" role="group" aria-label="Bạn nhớ câu này thế nào?">
                  {(
                    [
                      ["again", "Chưa nhớ"],
                      ["hard", "Khó"],
                      ["good", "Nhớ"],
                      ["easy", "Dễ"],
                    ] as const
                  ).map(([value, label]) => (
                    <Button key={value} variant="outline" onClick={() => rate(value)}>
                      {label}
                    </Button>
                  ))}
                </div>
              )}
            </section>
            <section className="natural-review-deck" aria-labelledby="review-deck-title">
              <div className="natural-review-deck-heading">
                <h2 id="review-deck-title">Thẻ đến hạn</h2>
                <p>Chọn một thẻ để ôn.</p>
              </div>
              <ul className="natural-review-cards" aria-label="Các thẻ đến hạn">
                {due.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={item.id === card.id}
                      onClick={() => {
                        setSelectedCardId(item.id);
                        setFlippedCardId(null);
                        stopAudio();
                        if (window.matchMedia("(max-width: 760px)").matches)
                          window.requestAnimationFrame(() => {
                            currentCardRef.current?.focus({ preventScroll: true });
                            currentCardRef.current?.scrollIntoView({ block: "start" });
                          });
                      }}
                    >
                      <Artwork scene={item.segment.scene} sizes="(max-width: 640px) 45vw, 200px" />
                      <span lang={front}>{item.segment.basic[front]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
      <div className="natural-section-heading">
        <h2>Luyện thêm khi cần</h2>
      </div>
      <div className="natural-extra-links">
        <Link href="/ipa">
          Luyện phát âm IPA <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link href="/daily-speaking">
          Dùng lại câu cùng Alex <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
