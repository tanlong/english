"use client";
import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AudioLines, House, List, MessagesSquare, MessageCircleMore } from "lucide-react";
import { cn } from "@/lib/utils";
export const navigation = [
  { href: "/", label: "Hôm nay", shortLabel: "Hôm nay", icon: House },
  { href: "/roadmap", label: "Danh sách bài học", shortLabel: "Bài học", icon: List },
  {
    href: "/daily-speaking",
    label: "Luyện giao tiếp",
    shortLabel: "Giao tiếp",
    icon: MessagesSquare,
  },
  { href: "/ipa", label: "Luyện IPA", shortLabel: "IPA", icon: AudioLines },
  {
    href: "/debate",
    label: "Tranh luận",
    shortLabel: "Tranh luận",
    icon: MessageCircleMore,
  },
] as const;
export function AppNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      className={mobile ? "mobile-nav" : "side-nav"}
      aria-label={mobile ? "Điều hướng trên điện thoại" : "Điều hướng chính"}
    >
      {navigation.map(({ href, label, shortLabel, icon: Icon }, index) => (
        <Fragment key={href}>
          {!mobile && index === 2 && (
            <span className="nav-label nav-practice-start">LUYỆN THÊM</span>
          )}
          <Link
            href={href}
            className={cn(!mobile && "nav-item", pathname === href && "active")}
            aria-current={pathname === href ? "page" : undefined}
          >
            <Icon aria-hidden="true" size={mobile ? 22 : 20} />
            <span>{mobile ? shortLabel : label}</span>
          </Link>
        </Fragment>
      ))}
    </nav>
  );
}
