"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, MessagesSquare, Mic, X } from "lucide-react";
import { Npc } from "./npc";

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
  const dialog = useRef<HTMLDialogElement>(null);
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
          <Npc id="mr_pink" state="notice" />
        </div>
        <div>
          <span className="cafe-kicker">LEARNING GUIDE</span>
          <h2 id="cafe-guide-title">Mr. Pink</h2>
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
        <p className="cafe-guide-intro">
          Có những góc học đang được giấu khỏi menu. Mr. Pink đưa bạn tới đó.
        </p>
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
