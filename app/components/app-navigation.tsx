"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, House, MessagesSquare, Layers3 } from "lucide-react";
import { cn } from "@/lib/utils";
export const navigation = [
  { href: "/", label: "Hôm nay", shortLabel: "Hôm nay", icon: House },
  { href: "/roadmap", label: "Bài học", shortLabel: "Bài học", icon: BookOpen },
  {
    href: "/daily-speaking",
    label: "Nói chuyện",
    shortLabel: "Nói chuyện",
    icon: MessagesSquare,
  },
  { href: "/review", label: "Ôn tập", shortLabel: "Ôn tập", icon: Layers3 },
] as const;
export function AppNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      className={mobile ? "mobile-nav" : "side-nav"}
      aria-label={mobile ? "Điều hướng trên điện thoại" : "Điều hướng chính"}
    >
      {navigation.map(({ href, label, shortLabel, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(!mobile && "nav-item", pathname === href && "active")}
          aria-current={pathname === href ? "page" : undefined}
        >
          <Icon aria-hidden="true" size={mobile ? 22 : 20} />
          <span>{mobile ? shortLabel : label}</span>
        </Link>
      ))}
    </nav>
  );
}
