"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Coffee, History, Trash2, X } from "lucide-react";
import { PageHeading } from "../components/page-heading";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { cafeRequest } from "./client";
import { CafeChat } from "./chat";
import { npcs, topics, type CafeSession } from "./content";

type Visit = Pick<CafeSession, "id" | "npcId" | "topicId" | "level" | "status"> & {
  createdAt: string;
};
const filters = [
  ["all", "Tất cả"],
  ["active", "Đang mở"],
  ["ended", "Đã kết thúc"],
] as const;
const dateFormat = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

export function CafeHistory() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filter, setFilter] = useState("all");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [session, setSession] = useState<CafeSession>();
  const locked = useRef(false);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const refresh = useCallback(async () => {
    setVisits(await cafeRequest<Visit[]>("/api/cafe/conversations"));
    setLoaded(true);
  }, []);
  useEffect(() => {
    void cafeRequest("/api/learning")
      .then(refresh)
      .catch((e: Error) => {
        setError(e.message);
        setLoaded(true);
      });
  }, [refresh]);
  async function perform(action: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa thực hiện được. Hãy thử lại.");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  function resume(id: string) {
    void perform(async () => {
      setSession(await cafeRequest<CafeSession>(`/api/cafe/conversations/${id}`));
    });
  }
  const shown = visits.filter((visit) => filter === "all" || visit.status === filter);
  return (
    <div className="cafe-history-page natural-workspace">
      <PageHeading
        eyebrow="NHẬT KÝ GHÉ QUÁN"
        title="Quản lý hội thoại"
        text="Tiếp tục buổi đang mở, xem lại tổng kết hoặc dọn những cuộc trò chuyện cũ."
      />
      <div className="cafe-history-toolbar">
        <div className="natural-filters" role="group" aria-label="Lọc hội thoại">
          {filters.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label} · {visits.filter((visit) => value === "all" || visit.status === value).length}
            </button>
          ))}
        </div>
        <Link href="/english/cafe" className="natural-inline-link">
          <Coffee size={18} aria-hidden="true" /> Ghé quán
        </Link>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}{" "}
          <Button variant="outline" disabled={busy} onClick={() => void perform(refresh)}>
            Thử lại
          </Button>
        </p>
      )}
      {!loaded && <p role="status">Đang tải nhật ký…</p>}
      {busy && <p role="status">Đang cập nhật hội thoại…</p>}
      <ul className="cafe-visit-list" aria-label="Nhật ký ghé quán" aria-busy={busy}>
        {shown.map((visit) => {
          const npc = npcs.find((item) => item.id === visit.npcId)!;
          const active = visit.status === "active";
          return (
            <li key={visit.id} className="cafe-visit">
              <div className="cafe-visit-info">
                <span className="cafe-visit-avatar" aria-hidden="true">
                  {npc.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")}
                </span>
                <div>
                  <div className="cafe-visit-heading">
                    <h2>{npc.name}</h2>
                    <Badge variant={active ? "warning" : "secondary"}>
                      {active ? "Đang mở" : "Đã kết thúc"}
                    </Badge>
                  </div>
                  <p>
                    {topics[visit.topicId].label} · {visit.level}
                  </p>
                  <time dateTime={visit.createdAt}>
                    {dateFormat.format(new Date(visit.createdAt))}
                  </time>
                </div>
              </div>
              <div className="cafe-visit-actions">
                <Button
                  variant={active ? "default" : "outline"}
                  disabled={busy}
                  onClick={(event) => {
                    lastTrigger.current = event.currentTarget;
                    resume(visit.id);
                  }}
                >
                  {active ? "Tiếp tục" : "Xem tổng kết"}
                  <ArrowRight size={16} aria-hidden="true" />
                </Button>
                {active && (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void perform(async () => {
                        await cafeRequest(`/api/cafe/conversations/${visit.id}/end`, {
                          requestId: crypto.randomUUID(),
                        });
                        await refresh();
                      })
                    }
                  >
                    <X size={16} aria-hidden="true" /> Huỷ buổi
                  </Button>
                )}
                <Button variant="ghost" disabled={busy} onClick={() => setDeleteId(visit.id)}>
                  <Trash2 size={16} aria-hidden="true" /> Xoá
                </Button>
              </div>
              {deleteId === visit.id && (
                <div
                  className="cafe-visit-confirm"
                  role="group"
                  aria-label="Xác nhận xoá hội thoại"
                >
                  <p>Xoá hội thoại này và các thẻ liên quan? Thao tác này không thể hoàn tác.</p>
                  <div className="cafe-visit-actions">
                    <Button variant="outline" disabled={busy} onClick={() => setDeleteId(null)}>
                      Giữ lại
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={busy}
                      onClick={() =>
                        void perform(async () => {
                          await cafeRequest(
                            `/api/cafe/conversations/${visit.id}`,
                            undefined,
                            "DELETE",
                          );
                          setDeleteId(null);
                          await refresh();
                        })
                      }
                    >
                      Xác nhận xoá
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {loaded && !shown.length && !error && (
        <div className="cafe-history-empty">
          <History size={32} aria-hidden="true" />
          <h2>
            {!visits.length
              ? "Chưa có hội thoại nào."
              : filter === "active"
                ? "Không có hội thoại đang mở."
                : "Chưa có hội thoại đã kết thúc."}
          </h2>
          <p>Ghé quán và chọn một người bạn để bắt đầu trò chuyện.</p>
        </div>
      )}
      {visits.length === 30 && <p className="helper">Hiển thị 30 buổi ghé quán gần nhất.</p>}
      {session && (
        <CafeChat
          key={session.id}
          npcId={session.npcId}
          initialSession={session}
          aiReady={false}
          motionPaused
          onState={() => {}}
          onResume={resume}
          onSaved={() => void refresh().catch((e: Error) => setError(e.message))}
          onClose={() => {
            setSession(undefined);
            void refresh().catch((e: Error) => setError(e.message));
            requestAnimationFrame(() => lastTrigger.current?.focus());
          }}
        />
      )}
    </div>
  );
}
