"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
export const navigation = [
  { href: "/english/cafe", label: "Cà phê vỉa hè", shortLabel: "Cà phê", icon: Coffee },
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
          aria-label={mobile ? shortLabel : label}
          title={label}
        >
          <Icon aria-hidden="true" size={mobile ? 22 : 20} />
          <span>{mobile ? shortLabel : label}</span>
        </Link>
      ))}
    </nav>
  );
}
