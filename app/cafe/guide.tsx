"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, MessagesSquare, Mic, Square, Volume2, X } from "lucide-react";
import { Npc } from "./npc";
import { npcs } from "./content";
import { useNpcSpeech } from "./voice";
import { Button } from "../components/ui/button";

const corners = [
  {
    href: "/ipa",
    icon: Mic,
    title: "Luyện phát âm",
    description: "Luyện âm IPA, xem khẩu hình và ghi âm lại câu của bạn.",
  },
  {
    href: "/debate",
    icon: MessagesSquare,
    title: "Tranh luận",
    description: "Nghe tình huống và tập phản biện bằng tiếng Anh.",
  },
] as const;

export function CafeGuide({ onClose }: { onClose: () => void }) {
  const guide = npcs.find((npc) => npc.id === "mr_pink")!;
  const dialog = useRef<HTMLDialogElement>(null);
  const [talking, setTalking] = useState(false);
  const speech = useNpcSpeech("mr_pink", "A1", setTalking);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => {
      if (element?.open) element.close();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="cafe-dialog cafe-guide"
      aria-labelledby="cafe-guide-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="cafe-dialog-header">
        <div className="cafe-dialog-avatar">
          <Npc id="mr_pink" state={talking ? "talking" : "notice"} />
        </div>
        <div>
          <span className="cafe-kicker">LEARNING GUIDE</span>
          <h2 id="cafe-guide-title">{guide.name}</h2>
          <p>Chọn một góc luyện tập</p>
        </div>
        <button
          type="button"
          className="cafe-icon-button"
          aria-label="Đóng hướng dẫn"
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </header>
      <div className="cafe-dialog-content">
        <p className="cafe-mode" role="status">
          {speech.notice || "Giọng nói AI · Gemini · Anh-Mỹ"}
        </p>
        <p className="cafe-guide-intro">
          Có những góc học đang được giấu khỏi menu. {guide.name} đưa bạn tới đó.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            if (talking) speech.stop();
            else void speech.speak(guide.greeting);
          }}
        >
          {talking ? (
            <Square size={16} aria-hidden="true" />
          ) : (
            <Volume2 size={16} aria-hidden="true" />
          )}
          {talking ? "Dừng giọng" : `Nghe ${guide.name}`}
        </Button>
        {speech.error && (
          <p className="field-error" role="alert">
            {speech.error}
          </p>
        )}
        <div className="cafe-guide-corners">
          {corners.map(({ href, icon: Icon, title, description }) => (
            <Link key={href} href={href} className="cafe-guide-card" onClick={onClose}>
              <span className="cafe-guide-icon">
                <Icon aria-hidden="true" size={20} />
              </span>
              <span>
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
          ))}
        </div>
      </div>
    </dialog>
  );
}
