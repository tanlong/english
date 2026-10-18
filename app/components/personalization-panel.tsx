"use client";
import { useState } from "react";
import type { LearningStore } from "../learning/use-learning";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function PersonalizationPanel({ store }: { store: LearningStore }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [english, setEnglish] = useState("");
  const [vietnamese, setVietnamese] = useState("");
  const [usageVi, setUsageVi] = useState("");
  async function act(action: string, fields: Record<string, string>) {
    setBusy(true);
    setError("");
    try {
      await store.personalize(action, fields);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa lưu được.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="settings-panel" render={<section aria-label="Bộ nhớ học tập" />}>
      <h2>Bộ nhớ học tập của bạn</h2>
      <p>{store.personalization?.memory.summaryVi ?? "Đang kết nối hồ sơ học tập…"}</p>
      <p className="helper">
        Nhận xét AI là gợi ý để luyện, không phải chứng nhận trình độ hay phát âm. Bạn có thể bỏ một
        ghi nhớ chưa phù hợp.
      </p>
      {store.personalization?.memory.reviews.map((item) => (
        <div key={item.id} className="my-4 border-b pb-3">
          <strong>{item.labelVi}</strong>
          <p lang="en">{item.english}</p>
          <p className="helper">{item.evidenceVi}</p>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => void act("dismiss-review", { reviewId: item.id })}
          >
            Bỏ ghi nhớ
          </Button>
        </div>
      ))}
      <details className="model-answer">
        <summary>Kho câu mẫu do bạn duyệt</summary>
        <p className="helper">
          Chỉ những câu bạn duyệt và lưu ở đây mới được dùng làm mẫu riêng cho AI Lead. Đọc kỹ nghĩa
          và cách dùng trước khi lưu.
        </p>
        {store.personalization?.examples.map((example) => (
          <div key={example.id} className="my-4 border-b pb-3">
            <p lang="en">{example.english}</p>
            <p>{example.vietnamese}</p>
            <p className="helper">{example.usageVi}</p>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void act("delete-example", { exampleId: example.id })}
            >
              Xóa câu mẫu
            </Button>
          </div>
        ))}
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (await act("approve-example", { english, vietnamese, usageVi })) {
              setEnglish("");
              setVietnamese("");
              setUsageVi("");
            }
          }}
        >
          <label className="field">
            Câu tiếng Anh
            <Input
              lang="en"
              required
              maxLength={1500}
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
            />
          </label>
          <label className="field">
            Nghĩa tiếng Việt
            <Input
              required
              maxLength={1500}
              value={vietnamese}
              onChange={(e) => setVietnamese(e.target.value)}
            />
          </label>
          <label className="field">
            Ghi chú cách dùng
            <Input
              required
              maxLength={1500}
              value={usageVi}
              onChange={(e) => setUsageVi(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={busy}>
            Duyệt & lưu mẫu
          </Button>
        </form>
      </details>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </Card>
  );
}
