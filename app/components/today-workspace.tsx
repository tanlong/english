"use client";

import Link from "next/link";
import { ArrowRight, MessagesSquare, Speech } from "lucide-react";
import { useLearningStore } from "../learning/provider";

const features = [
  {
    id: "ipa",
    href: "/ipa",
    icon: Speech,
    tone: "blue",
    title: "Phát âm IPA",
    description: "Nghe từng âm, xem khẩu hình và ghi âm để luyện phát âm rõ hơn.",
    action: "Luyện phát âm",
  },
  {
    id: "debate",
    href: "/debate",
    icon: MessagesSquare,
    tone: "violet",
    title: "Luyện tranh luận",
    description: "Nghe một chủ đề, chia sẻ quan điểm và tập phản biện bằng tiếng Anh.",
    action: "Tập phản biện",
  },
];

export function TodayWorkspace() {
  const store = useLearningStore();
  return (
    <div className="natural-workspace">
      <header className="natural-welcome">
        <span className="eyebrow">HÔM NAY</span>
        <h1>Chào {store.state.profile!.name}. Mình học một chút nhé.</h1>
        <p>Luyện phát âm và diễn đạt quan điểm bằng tiếng Anh.</p>
      </header>
      <section className="today-features" aria-labelledby="today-features-title">
        <div className="today-section-heading">
          <h2 id="today-features-title">Chọn cách luyện tập</h2>
          <p>Tập trung vào một kỹ năng, theo nhịp của bạn.</p>
        </div>
        <div className="today-feature-grid">
          {features.map(({ id, href, icon: Icon, tone, title, description, action }) => (
            <Link
              key={id}
              href={href}
              className="today-feature-card"
              data-tone={tone}
              aria-labelledby={`today-${id}-title`}
              aria-describedby={`today-${id}-description`}
            >
              <div className="today-feature-top">
                <span className="natural-feature-icon">
                  <Icon size={24} aria-hidden="true" />
                </span>
              </div>
              <h3 id={`today-${id}-title`}>{title}</h3>
              <p id={`today-${id}-description`}>{description}</p>
              <span className="today-feature-action">
                {action} <ArrowRight size={18} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
