"use client";
import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Clock3, Settings } from "lucide-react";
import { curriculum, roles } from "@/app/content/curriculum";
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
  useEffect(() => {
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
              ["settings", "ipa", "debate", "path", "progress"].includes(view)
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
  const role = roles.find((item) => item.id === profile.role)!;
  const activeSeconds = store.state.dailySeconds[dateKey(store.now ?? new Date())] ?? 0;
  const title = pathname.startsWith("/session/")
    ? "Buổi học"
    : (navigation.find((item) => item.href === pathname)?.label ??
      {
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
        inSession && "session-focus",
        profile.largeText && "large-text",
      )}
    >
      <a className="skip-link" href="#main">
        Đến nội dung chính
      </a>
      {!inSession && (
        <aside className="sidebar">
          <Link href="/" className="brand-link" aria-label="Natural English · Trang hôm nay">
            <Logo />
          </Link>
          <span className="nav-label">KHÔNG GIAN HỌC</span>
          <AppNavigation />
          <div className="sidebar-bottom">
            <Link className="nav-item" href="/progress">
              Tiến độ của bạn
            </Link>
            <Link
              className={cn("nav-item", pathname === "/settings" && "active")}
              href="/settings"
              aria-current={pathname === "/settings" ? "page" : undefined}
            >
              <Settings aria-hidden="true" size={18} />
              <span>Cài đặt</span>
            </Link>
            <Link className="profile-nav" href="/settings">
              <span className="avatar">{profile.name.slice(0, 1).toUpperCase()}</span>
              <span>
                <strong>{profile.name}</strong>
                <small>{role.short} · Học theo nhịp của bạn</small>
              </span>
              <ChevronRight aria-hidden="true" size={16} />
            </Link>
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
              <Link
                className="topbar-settings"
                href="/settings"
                aria-label="Mở cài đặt"
                title="Cài đặt"
              >
                <Settings aria-hidden="true" size={20} />
              </Link>
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
        {!inSession && (
          <footer className="app-footer">
            <span>Natural English · Tiếng Anh cho cuộc sống của bạn.</span>
          </footer>
        )}
      </div>
      {!inSession && <AppNavigation mobile />}
      <span className="sr-only">Tuần hiện tại: {curriculum[store.state.activeWeek - 1].title}</span>
    </div>
  );
}
