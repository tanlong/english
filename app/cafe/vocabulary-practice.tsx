"use client";

import { Check, Eye, EyeOff, Lightbulb, Volume2 } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "../components/ui/button";
import { useLearningStore } from "../learning/provider";
import { isDue, scheduleReview, type ReviewRating } from "../learning/review";
import { cafeVocabulary, type CafeVocabularyWord } from "./vocabulary";

function VocabularyExample({
  word,
  id,
  visible,
}: {
  word: CafeVocabularyWord;
  id: string;
  visible: boolean;
}) {
  return (
    <blockquote>
      <p lang="en">{word.example}</p>
      <p id={id} hidden={!visible} lang="vi" className="cafe-vocabulary-translation">
        {word.exampleVi}
      </p>
    </blockquote>
  );
}

export function CafeVocabulary({
  topic,
  npcName,
  speak,
}: {
  topic: string;
  npcName: string;
  speak: (text: string) => void;
}) {
  const store = useLearningStore();
  const [revealed, setRevealed] = useState<string | null>(null);
  const [openExample, setOpenExample] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const idBase = useId();
  const reviewExampleId = `${idBase}-review`;
  const words = cafeVocabulary[topic] ?? [];
  const newWords = words.filter((word) => !store.state.cardReviews?.[word.id]);
  const dueWords = words.filter(
    (word) =>
      store.state.cardReviews?.[word.id] &&
      isDue(store.state.cardReviews[word.id], store.now ?? new Date()),
  );
  const review = dueWords[0];

  function learn(selected: CafeVocabularyWord[]) {
    const now = new Date();
    const eventId = crypto.randomUUID();
    store.setState((old) => ({
      ...old,
      cardReviews: {
        ...old.cardReviews,
        ...Object.fromEntries(
          selected.map((word) => [
            word.id,
            old.cardReviews?.[word.id] ?? scheduleReview(undefined, "good", eventId, now),
          ]),
        ),
      },
    }));
    setNotice("Đã lưu từ đã học. Lần ôn đầu sau 2 ngày.");
  }

  function rate(rating: ReviewRating) {
    if (!review || revealed !== review.id) return;
    const now = new Date();
    const eventId = crypto.randomUUID();
    store.setState((old) => {
      if (!isDue(old.cardReviews?.[review.id], now)) return old;
      return {
        ...old,
        cardReviews: {
          ...old.cardReviews,
          [review.id]: scheduleReview(old.cardReviews?.[review.id], rating, eventId, now),
        },
      };
    });
    setRevealed(null);
    setNotice(rating === "again" ? "Đã hẹn ôn lại sau 10 phút." : "Đã lưu lịch ôn tiếp theo.");
  }

  return (
    <>
      {notice && (
        <p className="cafe-mode" role="status">
          {notice}
        </p>
      )}
      {!!newWords.length && (
        <>
          <section className="cafe-vocabulary" aria-labelledby="cafe-vocabulary-title">
            <div className="cafe-vocabulary-heading">
              <span className="cafe-kicker">CÙNG {npcName.toLocaleUpperCase("vi-VN")}</span>
              <p className="cafe-vocabulary-progress" role="status">
                {words.length - newWords.length}/{words.length} từ đã học
              </p>
            </div>
            <h3 id="cafe-vocabulary-title">5 từ trước khi trò chuyện</h3>
            <p className="cafe-vocabulary-hint">
              <Lightbulb size={14} aria-hidden="true" />
              Nghe câu mẫu, nói lại rồi đánh dấu khi đã hiểu.
            </p>
            <ol className="cafe-vocabulary-list">
              {newWords.map((word, index) => {
                const exampleId = `${idBase}-${index}`;
                const open = openExample === word.id;
                return (
                  <li key={word.id}>
                    <div className="cafe-vocabulary-term">
                      <h4 lang="en">{word.english}</h4>
                      <p className="cafe-vocabulary-meaning">{word.vietnamese}</p>
                    </div>
                    <VocabularyExample word={word} id={exampleId} visible={open} />
                    <p className="cafe-vocabulary-usage">
                      <Lightbulb size={14} aria-hidden="true" />
                      {word.usageVi}
                    </p>
                    <div
                      className="cafe-vocabulary-actions"
                      role="group"
                      aria-label={`Thao tác với từ ${word.english}`}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`${open ? "Ẩn" : "Hiện"} nghĩa tiếng Việt: ${word.example}`}
                        title="Nghĩa tiếng Việt"
                        aria-expanded={open}
                        aria-controls={exampleId}
                        onClick={() => setOpenExample(open ? null : word.id)}
                      >
                        {open ? (
                          <EyeOff size={18} aria-hidden="true" />
                        ) : (
                          <Eye size={18} aria-hidden="true" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Nghe từ và câu: ${word.english}`}
                        title="Nghe từ và câu"
                        onClick={() => speak(`${word.english}. ${word.example}`)}
                      >
                        <Volume2 size={18} aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cafe-vocabulary-learn"
                        aria-label={`Đã học: ${word.english}`}
                        title="Đã học"
                        onClick={() => learn([word])}
                      >
                        <Check size={18} aria-hidden="true" />
                        Đã học
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
          <section
            className="cafe-vocabulary cafe-vocabulary-completion"
            aria-label="Hoàn tất học từ"
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-describedby="cafe-vocabulary-review-note"
              onClick={() => learn(newWords)}
            >
              <Check size={16} aria-hidden="true" />
              Đã học các từ trên
            </Button>
            <p id="cafe-vocabulary-review-note" className="cafe-vocabulary-usage">
              Từ đã học sẽ quay lại khi đến hạn ôn.
            </p>
          </section>
        </>
      )}
      {review && (
        <section
          className="cafe-vocabulary cafe-vocabulary-review"
          aria-labelledby="cafe-vocabulary-review-title"
        >
          <div className="cafe-vocabulary-heading">
            <span className="cafe-kicker">CÙNG {npcName.toLocaleUpperCase("vi-VN")}</span>
            <p className="cafe-vocabulary-progress">{dueWords.length} từ</p>
          </div>
          <h3 id="cafe-vocabulary-review-title">Ôn từ đến hạn</h3>
          <p className="cafe-vocabulary-hint">
            <Lightbulb size={14} aria-hidden="true" />
            Nói từ tiếng Anh trước khi mở đáp án.
          </p>
          <h4 className="cafe-vocabulary-prompt">{review.vietnamese}</h4>
          {revealed === review.id ? (
            <>
              <h4 lang="en">{review.english}</h4>
              <VocabularyExample
                key={review.id}
                word={review}
                id={reviewExampleId}
                visible={openExample === review.id}
              />
              <p className="cafe-vocabulary-usage">
                <Lightbulb size={14} aria-hidden="true" />
                {review.usageVi}
              </p>
              <div className="cafe-actions">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`${openExample === review.id ? "Ẩn" : "Hiện"} nghĩa tiếng Việt: ${review.example}`}
                  title="Nghĩa tiếng Việt"
                  aria-expanded={openExample === review.id}
                  aria-controls={reviewExampleId}
                  onClick={() => setOpenExample(openExample === review.id ? null : review.id)}
                >
                  {openExample === review.id ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Nghe từ và câu: ${review.english}`}
                  title="Nghe từ và câu"
                  onClick={() => speak(`${review.english}. ${review.example}`)}
                >
                  <Volume2 size={18} aria-hidden="true" />
                </Button>
              </div>
              <div className="cafe-actions" role="group" aria-label="Bạn nhớ từ này thế nào?">
                {(
                  [
                    ["again", "Chưa nhớ"],
                    ["hard", "Khó"],
                    ["good", "Nhớ"],
                    ["easy", "Dễ"],
                  ] as const
                ).map(([rating, label]) => (
                  <Button
                    key={rating}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => rate(rating)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <Button type="button" onClick={() => setRevealed(review.id)}>
              <Eye size={16} aria-hidden="true" />
              Xem đáp án
            </Button>
          )}
        </section>
      )}
    </>
  );
}
