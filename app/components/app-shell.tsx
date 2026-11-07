"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChartNoAxesColumn,
  ChevronRight,
  Clock3,
  Settings,
  Sparkles,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { curriculum } from "@/app/content/curriculum";
import { useLearningStore } from "@/app/learning/provider";
import { dateKey } from "@/app/learning/progress";
import { stopAudio } from "@/app/audio/client";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { Onboarding } from "./profile";
import { AppNavigation, navigation } from "./app-navigation";
export function AppShell({ children }: { children: ReactNode }) {
  const store = useLearningStore();
  const pathname = usePathname();
  const router = useRouter();
  const inSession = ["/session/", "/lessons/", "/preview/"].some((prefix) =>
    pathname.startsWith(prefix),
  );
  const main = useRef<HTMLElement>(null);
  const mobileMenu = useRef<HTMLDialogElement>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  useEffect(() => {
    mobileMenu.current?.close();
    stopAudio();
    main.current?.focus({ preventScroll: true });
    return () => stopAudio();
  }, [pathname]);
  useEffect(() => {
    // Keep existing bookmarks working while the app uses App Router URLs.
    const migrateHash = () => {
      const hash = window.location.hash.slice(1);
      if (!hash || hash === "main") return;
      const [view, id] = hash.split("/");
      const path =
        view === "session" && id
          ? `/session/${encodeURIComponent(id)}`
          : navigation.some((item) => item.href === `/${view}`) ||
              [
                "roadmap",
                "daily-speaking",
                "review",
                "settings",
                "ipa",
                "debate",
                "path",
                "progress",
              ].includes(view)
            ? `/${view}`
            : "/";
      router.replace(path);
    };
    migrateHash();
    window.addEventListener("hashchange", migrateHash);
    return () => window.removeEventListener("hashchange", migrateHash);
  }, [router]);
  if (!store.ready)
    return (
      <main className="boot-state">
        <Logo />
        <p>Đang chuẩn bị không gian học của bạn…</p>
      </main>
    );
  if (!store.state.profile) return <Onboarding store={store} onComplete={() => router.push("/")} />;
  const profile = store.state.profile;
  const activeSeconds = store.state.dailySeconds[dateKey(store.now ?? new Date())] ?? 0;
  const title = pathname.startsWith("/session/")
    ? "Buổi học"
    : (navigation.find((item) => item.href === pathname)?.label ??
      {
        "/": "Hôm nay",
        "/roadmap": "Bài học",
        "/daily-speaking": "Nói chuyện",
        "/review": "Ôn tập",
        "/progress": "Tiến độ",
        "/path": "Lộ trình",
        "/ipa": "Luyện IPA",
        "/debate": "Tranh luận",
        "/wisdom": "Giao tiếp ứng xử",
      }[pathname] ??
      "Cài đặt");
  return (
    <div
      className={cn(
        "app-shell min-h-dvh",
        !inSession && sidebarCollapsed && "sidebar-collapsed",
        inSession && "session-focus",
        profile.largeText && "large-text",
      )}
    >
      <a className="skip-link" href="#main">
        Đến nội dung chính
      </a>
      {!inSession && (
        <aside id="app-sidebar" className="sidebar">
          <Link href="/" className="brand-link" aria-label="Natural English · Trang hôm nay">
            <Logo />
          </Link>
          <AppNavigation />
          <div className="sidebar-bottom">
            <Link
              className="nav-item"
              href="/progress"
              aria-label="Tiến độ của bạn"
              title="Tiến độ của bạn"
            >
              <ChartNoAxesColumn aria-hidden="true" size={18} />
              <span>Tiến độ của bạn</span>
            </Link>
            <Link
              className={cn("nav-item", pathname === "/settings" && "active")}
              href="/settings"
              aria-label="Cài đặt"
              title="Cài đặt"
              aria-current={pathname === "/settings" ? "page" : undefined}
            >
              <Settings aria-hidden="true" size={18} />
              <span>Cài đặt</span>
            </Link>
            <Link
              className={cn(
                "nav-item upgrade-nav",
                pathname === "/settings/upgrade/connections" && "active",
              )}
              href="/settings/upgrade/connections"
              aria-label="Nâng cấp / Upgrade"
              title="Nâng cấp / Upgrade"
              aria-current={pathname === "/settings/upgrade/connections" ? "page" : undefined}
            >
              <Sparkles aria-hidden="true" size={18} />
              <span>Nâng cấp / Upgrade</span>
            </Link>
            <button
              type="button"
              className="nav-item sidebar-toggle"
              aria-label={sidebarCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
              title={sidebarCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
              aria-expanded={!sidebarCollapsed}
              aria-controls="app-sidebar"
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen aria-hidden="true" size={20} />
              ) : (
                <PanelLeftClose aria-hidden="true" size={20} />
              )}
              <span>Thu gọn thanh bên</span>
            </button>
          </div>
        </aside>
      )}
      <div className="page-wrap">
        <header className="topbar">
          {inSession ? (
            <Link
              className="session-home"
              href="/"
              aria-label="Về hôm nay · tiến độ đã lưu"
              title="Về hôm nay"
            >
              <ArrowLeft aria-hidden="true" size={20} />
              <span>Buổi học của bạn</span>
            </Link>
          ) : (
            <>
              <Link href="/" className="mobile-brand" aria-label="Natural English · Trang hôm nay">
                <Logo />
              </Link>
              <span className="breadcrumb desktop-only">
                Không gian học <ChevronRight aria-hidden="true" size={14} />
                <strong>{title}</strong>
              </span>
            </>
          )}
          <div className="topbar-right">
            {!inSession && (
              <span className="date-label">
                {store.now?.toLocaleDateString("vi-VN", {
                  timeZone: "Asia/Ho_Chi_Minh",
                  weekday: "short",
                  day: "numeric",
                  month: "long",
                })}
              </span>
            )}
            <span
              className="daily-budget"
              aria-label={`Đã học ${Math.floor(activeSeconds / 60)} phút hôm nay`}
            >
              <Clock3 aria-hidden="true" size={18} />
              <span>
                {Math.floor(activeSeconds / 60)}
                <small> phút hôm nay</small>
              </span>
            </span>
            {!inSession && (
              <button
                className="topbar-settings"
                aria-label="Mở menu"
                title="Menu"
                onClick={() => mobileMenu.current?.showModal()}
              >
                <Menu aria-hidden="true" size={20} />
              </button>
            )}
            {!inSession && (
              <Link className="avatar small-avatar" href="/settings" aria-label="Mở hồ sơ cá nhân">
                {profile.name.slice(0, 1).toUpperCase()}
              </Link>
            )}
          </div>
        </header>
        <main id="main" ref={main} tabIndex={-1} className="main-content">
          {store.syncError && (
            <p className="field-error" role="alert">
              {store.syncError}{" "}
              <button
                type="button"
                onClick={() =>
                  void store
                    .refreshPersonalization()
                    .then(() => store.syncLearning())
                    .catch(() => {})
                }
              >
                Thử kết nối lại
              </button>
            </p>
          )}
          {store.storageError && (
            <div className="notice warning" role="alert">
              {store.storageError}
            </div>
          )}
          {children}
        </main>
      </div>
      {!inSession && <AppNavigation mobile />}
      {!inSession && (
        <dialog className="mobile-menu-dialog" ref={mobileMenu} aria-labelledby="mobile-menu-title">
          <header>
            <h2 id="mobile-menu-title">Không gian học</h2>
            <button
              className="cafe-icon-button"
              onClick={() => mobileMenu.current?.close()}
              aria-label="Đóng menu"
            >
              <X size={22} />
            </button>
          </header>
          <nav aria-label="Menu điện thoại">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                href={href}
                key={href}
                className="nav-item"
                aria-current={pathname === href ? "page" : undefined}
                onClick={() => mobileMenu.current?.close()}
              >
                <Icon size={20} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mobile-menu-bottom">
            <Link className="nav-item upgrade-nav" href="/settings/upgrade/connections">
              <Sparkles size={18} aria-hidden="true" />
              Nâng cấp / Upgrade
            </Link>
            <Link className="nav-item" href="/settings">
              <Settings size={18} aria-hidden="true" />
              Cài đặt & Hồ sơ
            </Link>
          </div>
        </dialog>
      )}
      <span className="sr-only">Tuần hiện tại: {curriculum[store.state.activeWeek - 1].title}</span>
    </div>
  );
}
