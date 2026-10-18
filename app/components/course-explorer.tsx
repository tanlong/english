"use client";
import { SearchInput } from "./search-input";
import { Badge } from "@/app/components/ui/badge";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, Check, ChevronRight, ShieldCheck, Target } from "lucide-react";
import { curriculum, months, roles, roleScenarios, studyDays } from "../content/curriculum";
import type { LearningStore } from "../learning/use-learning";
import { lessonAccess } from "../learning/progress";
import { Artwork } from "./artwork";
import { PageHeading } from "./page-heading";
import { ComboboxField } from "./select-combobox";
import { roadmapArt } from "../content/roadmap-art";
const dayOptions = studyDays.map((label, index) => ({
  value: String(index + 1),
  label: `Ngày ${index + 1} · ${label}`,
}));
export function Roadmap({
  store,
  onStart,
}: {
  store: LearningStore;
  onStart: (week: number, day: number) => void;
}) {
  const [month, setMonth] = useState(curriculum[store.state.activeWeek - 1].month);
  const [query, setQuery] = useState("");
  const [day, setDay] = useState(1);
  const [selected, setSelected] = useState(store.state.activeWeek);
  const [context, setContext] = useState("all");
  const preview = useRef<HTMLHeadingElement>(null);
  const current = curriculum[selected - 1];
  const selectedAccess = lessonAccess(store.state, selected, day);
  const filtered = curriculum.filter(
    (m) =>
      (context === "all" || (context === "work" ? m.workplace : !m.workplace)) &&
      (query
        ? `${m.title} ${m.vi} ${m.week}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())
        : context !== "all" || m.month === month),
  );
  return (
    <>
      <PageHeading
        eyebrow="CHỌN CHỦ ĐỀ · CHỌN BUỔI · BẮT ĐẦU"
        title="Danh sách bài học"
        text="Học theo tuần hoặc tìm tình huống bạn cần. Mỗi buổi gồm 3 bước, khoảng 12 phút."
      />
      <div className="roadmap-toolbar">
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm chủ đề hoặc số tuần…"
          aria-label="Tìm tuần học"
        />
        <div className="segmented" role="group" aria-label="Chọn ngữ cảnh giao tiếp">
          {[
            ["all", "Tất cả"],
            ["everyday", "Đời sống"],
            ["work", "Công việc"],
          ].map(([value, label]) => (
            <button
              key={value}
              aria-pressed={context === value}
              onClick={() => {
                setContext(value);
                setQuery("");
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="roadmap-month-select">
        <ComboboxField
          id="roadmap-month"
          label="Giai đoạn học"
          options={months.map((m, i) => ({
            value: String(i + 1),
            label: `Tháng ${i + 1} · ${m.vi}`,
          }))}
          value={String(month)}
          onValueChange={(value) => {
            const nextMonth = Number(value);
            setMonth(nextMonth);
            setSelected(curriculum.find((item) => item.month === nextMonth)!.week);
            setDay(1);
            setQuery("");
            setContext("all");
          }}
        />
        <p>52 tuần gợi ý. Bạn có thể chọn bất kỳ chủ đề nào.</p>
      </div>
      <div className="roadmap-layout">
        <Card className="week-list" render={<section />}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                {query || context !== "all"
                  ? "CHỦ ĐỀ PHÙ HỢP"
                  : `THÁNG ${month} · ${months[month - 1].level}`}
              </span>
              <h2>
                {query || context !== "all" ? `${filtered.length} chủ đề` : months[month - 1].vi}
              </h2>
            </div>
          </div>
          {filtered.map((m) => {
            const finished = Array.from(
              { length: 6 },
              (_, i) => lessonAccess(store.state, m.week, i + 1).status === "completed",
            ).every(Boolean);
            return (
              <button
                key={m.week}
                className={`week-row ${selected === m.week ? "active" : ""}`}
                aria-pressed={selected === m.week}
                aria-label={`Tuần ${m.week} ${m.title}, ${finished ? "đã hoàn thành" : "có thể học"}`}
                onClick={() => {
                  setSelected(m.week);
                  if (window.matchMedia("(max-width: 900px)").matches) {
                    requestAnimationFrame(() => {
                      preview.current?.focus({ preventScroll: true });
                      preview.current?.scrollIntoView({ block: "start" });
                    });
                  }
                }}
              >
                <Image
                  className="week-artwork"
                  src={roadmapArt[m.week - 1]}
                  alt=""
                  sizes="(max-width: 767px) 56px, 76px"
                />
                <span>
                  <strong>{m.title}</strong>
                  <small>
                    {m.vi} · {m.checkpoint ? "Mốc đánh giá / bài luyện" : "6 buổi luyện tập"}
                  </small>
                </span>
                {finished ? (
                  <Check aria-hidden="true" size={18} />
                ) : m.checkpoint ? (
                  <Target aria-hidden="true" size={18} />
                ) : (
                  <ChevronRight aria-hidden="true" size={18} />
                )}
              </button>
            );
          })}
          {!filtered.length && (
            <p className="empty-state">Chưa tìm thấy chủ đề. Thử từ khóa khác.</p>
          )}
        </Card>
        <Card className="module-preview" render={<section />}>
          <div className="module-preview-copy">
            <Badge>
              TUẦN {current.week} · {current.level} MỤC TIÊU
            </Badge>
            <h2 ref={preview} tabIndex={-1}>
              {current.title}
            </h2>
            <p>{current.vi}. Luyện hiểu ý, tự diễn đạt và chuyển sang tình huống mới.</p>
            <span className="eyebrow">BẠN SẼ LUYỆN</span>
            <p>{current.principle}</p>
            <ComboboxField
              id="module-day"
              label="Chọn buổi trong tuần"
              options={dayOptions}
              value={String(day)}
              onValueChange={(value) => setDay(Number(value))}
            />
            <Button onClick={() => onStart(selected, day)} variant="default">
              {selectedAccess.status === "completed" ? "Học lại bài" : "Mở bài luyện"}
              <ArrowRight aria-hidden="true" size={18} />
            </Button>
          </div>
          <div className="module-art square">
            <Image
              src={roadmapArt[current.week - 1]}
              alt={`Minh họa chủ đề ${current.title}`}
              sizes="(max-width: 900px) 100vw, 45vw"
            />
          </div>
        </Card>
      </div>
    </>
  );
}
export function RoleplayHub({
  store,
  onStart,
}: {
  store: LearningStore;
  onStart: (week: number, day: number) => void;
}) {
  const role = store.state.profile!.role;
  const scenario = roleScenarios[role];
  const access = lessonAccess(store.state, 20, 1);
  return (
    <>
      <PageHeading
        eyebrow="CONVERSATION STUDIO"
        title="Cuộc trò chuyện tiếp theo bắt đầu ở đây."
        text="Kịch bản công sở giả định, phản hồi có hướng dẫn và câu hỏi chuyển tình huống. Nội dung đang chờ duyệt."
      />
      <div className="role-grid">
        {roles.map((r) => (
          <button
            key={r.id}
            className={`role-card ${role === r.id ? "active" : ""}`}
            aria-pressed={role === r.id}
            onClick={() => store.saveProfile({ ...store.state.profile!, role: r.id })}
          >
            <span>{r.short}</span>
            <strong>{r.label}</strong>
            {role === r.id && <Check aria-hidden="true" size={18} />}
          </button>
        ))}
      </div>
      <Card className="roleplay-hero">
        <div className="roleplay-art">
          <Artwork scene="office" priority />
        </div>
        <div className="roleplay-copy">
          <Badge>{roles.find((r) => r.id === role)?.label} · TUẦN 20</Badge>
          <h2>{scenario.title}</h2>
          <p>{scenario.goal}</p>
          <div className="chunk-list">
            {scenario.chunks.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
          <div className="prompt-preview">
            <small>ĐỒNG NGHIỆP SẼ HỎI</small>
            <p lang="en">“{scenario.opening}”</p>
          </div>
          <Button onClick={() => onStart(20, 1)} variant="default">
            {access.status === "completed" ? "Học lại theo vai trò" : "Mở buổi học theo vai trò"}
            <ArrowRight aria-hidden="true" size={18} />
          </Button>
          <p className="helper">
            Vào bài luyện 3 bước: nghe mẫu, tự phản hồi và chọn một câu để dùng trong công việc. Có
            lựa chọn nói hoặc nhập chữ.
          </p>
        </div>
      </Card>
      <div className="notice">
        <ShieldCheck aria-hidden="true" size={20} />
        <p>
          Luyện trả lời theo tình huống có sẵn. Muốn trò chuyện tự do, hãy mở Luyện giao tiếp hằng
          ngày. Các tình huống ngân hàng đều là giả định.
        </p>
      </div>
    </>
  );
}
