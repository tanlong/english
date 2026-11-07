"use client";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Coffee,
  Layers3,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  Trash2,
  CalendarDays,
  Gamepad2,
  Rocket,
  Mountain,
  Orbit,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { cafeRequest } from "./client";
import { npcs, topics, isGuideNpc, type CafeSession, type NpcId, type NpcState } from "./content";
import { canNavigate, scenes, type SceneId } from "./scenes";
import { Npc } from "./npc";
import { CafeChat } from "./chat";
import { CafeGuide } from "./guide";
import { PineLake } from "./pine-lake";
type History = Pick<CafeSession, "id" | "npcId" | "topicId" | "level" | "status">[];
const topicIcons = {
  cloud_daisy: Coffee,
  ollie_owl: CalendarDays,
  mimi_bunny: Gamepad2,
  astro_bean: Rocket,
  bear_explorer: Mountain,
  gray_boo: Orbit,
  mr_pink: Sparkles,
};
type ConnectionPreferences = EventTarget & { saveData?: boolean };
function dataPreferences() {
  return (navigator as Navigator & { connection?: ConnectionPreferences }).connection;
}
function subscribeMotionPreference(change: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection = dataPreferences();
  media.addEventListener("change", change);
  connection?.addEventListener("change", change);
  return () => {
    media.removeEventListener("change", change);
    connection?.removeEventListener("change", change);
  };
}
function motionPreference() {
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    dataPreferences()?.saveData === true
  );
}
function serverMotionPreference() {
  return false;
}
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function CafeWorkspace() {
  const [sceneId, setSceneId] = useState<SceneId>("inside_cafe");
  const [transition, setTransition] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeMotionPreference,
    motionPreference,
    serverMotionPreference,
  );
  const motionPaused = paused || hidden || reducedMotion;
  const [failedAsset, setFailedAsset] = useState(false);
  const [assetRetry, setAssetRetry] = useState(0);
  const [selected, setSelected] = useState<NpcId | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [grayHovered, setGrayHovered] = useState(false);
  const [grayFocused, setGrayFocused] = useState(false);
  const restoringFocus = useRef(false);
  const [initialSession, setInitialSession] = useState<CafeSession>();
  const [npcStates, setNpcStates] = useState<Partial<Record<NpcId, NpcState>>>({
    cloud_daisy: "notice",
  });
  const [history, setHistory] = useState<History>([]);
  const [aiReady, setAiReady] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const guideButton = useRef<HTMLButtonElement>(null);
  const transitionLock = useRef(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hotspots = useRef<Partial<Record<NpcId, HTMLButtonElement | null>>>({});
  const lastFocus = useRef<NpcId>("cloud_daisy");
  const scene = scenes.find((s) => s.id === sceneId)!;
  const pineLake = scene.settingId === "pine_lake";
  const grayBoost =
    pineLake && (grayHovered || grayFocused) && !motionPaused && !selected && !guideOpen;
  const refresh = useCallback(async () => {
    try {
      const [sessions, capability] = await Promise.all([
        cafeRequest<History>("/api/cafe/conversations"),
        cafeRequest<{ textAi: boolean }>("/api/advanced/capabilities"),
      ]);
      setHistory(sessions);
      setAiReady(capability.textAi);
      setError("");
      setReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa đọc được dữ liệu café.");
    }
  }, []);
  useIsomorphicLayoutEffect(() => {
    // Open the café with the scene edge directly under the viewport top.
    const navigation = performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined;
    if (navigation?.type === "back_forward") return;
    const offset = document.querySelector<HTMLElement>(".topbar")?.offsetHeight ?? 80;
    if (window.scrollY >= offset) return;
    window.scrollTo({ top: offset, behavior: "instant" });
  }, []);
  useEffect(() => {
    // Wait for the shared cookie identity; it is a device profile, not account sign-in.
    void cafeRequest("/api/learning")
      .then(refresh)
      .catch(() => setError("Chưa kết nối được hồ sơ. Hãy thử lại."));
    const visibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", visibility);
    visibility();
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      clearTimeout(transitionTimer.current);
    };
  }, [refresh]);
  useEffect(() => {
    if (motionPaused || selected || guideOpen) return;
    let timer: ReturnType<typeof setTimeout>;
    let reset: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const schedule = () => {
      timer = setTimeout(
        () => {
          if (cancelled) return;
          const id = scene.npcs[Math.floor(Math.random() * scene.npcs.length)].id as NpcId;
          setNpcStates({ [id]: "ambient_01" });
          reset = setTimeout(() => {
            if (!cancelled) {
              setNpcStates({});
              schedule();
            }
          }, 1800);
        },
        6000 + Math.random() * 9000,
      );
    };
    schedule();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearTimeout(reset);
    };
  }, [scene, motionPaused, selected, guideOpen]);
  function navigate(to: string) {
    if (transitionLock.current || selected || !canNavigate(sceneId, to)) return;
    transitionLock.current = true;
    setTransition(true);
    transitionTimer.current = setTimeout(
      () => {
        setSceneId(to as SceneId);
        setFailedAsset(false);
        setNpcStates({});
        setGrayHovered(false);
        setGrayFocused(false);
        setTransition(false);
        transitionLock.current = false;
        window.history.replaceState(null, "", `${window.location.pathname}?scene=${to}`);
      },
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 50 : 380,
    );
  }
  function openNpc(id: NpcId) {
    if (!ready || transitionLock.current) return;
    lastFocus.current = id;
    setGrayHovered(false);
    setGrayFocused(false);
    setNpcStates({ [id]: "notice" });
    if (isGuideNpc(id)) {
      setGuideOpen(true);
      return;
    }
    setInitialSession(undefined);
    setSelected(id);
  }
  function closeGuide() {
    setGuideOpen(false);
    setNpcStates({});
    setTimeout(() => guideButton.current?.focus(), 0);
  }
  async function resume(id: string) {
    try {
      const session = await cafeRequest<CafeSession>(`/api/cafe/conversations/${id}`);
      const npc = npcs.find((n) => n.id === session.npcId)!;
      setSceneId(npc.sceneId);
      setInitialSession(session);
      setSelected(npc.id);
      setNpcStates({ [npc.id]: session.summary ? "idle" : "listening" });
      lastFocus.current = npc.id;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa mở được cuộc trò chuyện.");
    }
  }
  return (
    <div className="cafe-workspace">
      <h1 className="sr-only">Khám phá Đà Lạt</h1>
      {error && (
        <p className="field-error" role="alert">
          {error} <button onClick={() => void refresh()}>Thử lại</button>
        </p>
      )}
      <section className="cafe-scene-card" aria-label="Không gian Đà Lạt">
        <div
          ref={frame}
          className="cafe-scene-frame"
          data-scene={sceneId}
          data-setting={scene.settingId}
          data-asset-fallback={failedAsset}
          data-paused={motionPaused || !!selected || guideOpen}
          data-transition={transition}
          onPointerMove={(e) => {
            if (motionPaused || selected || guideOpen || pineLake || e.pointerType === "touch")
              return;
            const rect = e.currentTarget.getBoundingClientRect();
            const scale = rect.width / 1920;
            e.currentTarget.style.setProperty(
              "--parallax-x",
              `${Math.max(-20, Math.min(20, ((e.clientX - rect.left) / rect.width - 0.5) * 40)) * scale}px`,
            );
            e.currentTarget.style.setProperty(
              "--parallax-y",
              `${Math.max(-12, Math.min(12, ((e.clientY - rect.top) / rect.height - 0.5) * 24)) * scale}px`,
            );
          }}
          onPointerLeave={() => {
            frame.current?.style.setProperty("--parallax-x", "0px");
            frame.current?.style.setProperty("--parallax-y", "0px");
          }}
        >
          {pineLake && failedAsset && (
            <Image
              className="pine-lake-static-poster"
              src="/cafe/assets/scenes/mountain_view/bg_clean.webp"
              alt=""
              fill
              unoptimized
              draggable={false}
            />
          )}
          {scene.layers
            .filter((layer) => !pineLake || layer.id === "landscape" || layer.id === "ground")
            .map((layer) => (
              <div
                key={`${sceneId}-${layer.id}-${assetRetry}`}
                className={`cafe-scene-layer layer-${layer.id}`}
                style={
                  {
                    // These plates and the water share the master’s pixel coordinates.
                    scale: pineLake ? 1 : undefined,
                    transform: pineLake ? "none" : undefined,
                    zIndex: layer.zIndex,
                    "--depth": layer.depth,
                    left: `${layer.x}%`,
                    top: `${layer.y}%`,
                    width: `${layer.width}%`,
                    height: `${layer.height}%`,
                  } as CSSProperties
                }
              >
                <Image
                  unoptimized
                  loading="eager"
                  src={layer.src}
                  alt=""
                  fill
                  style={{ scale: layer.flip ? "-1 1" : undefined }}
                  draggable={false}
                  onError={() => setFailedAsset(true)}
                />
              </div>
            ))}
          {pineLake ? (
            <PineLake
              key={`pine-lake-${assetRetry}`}
              active={grayBoost}
              paused={motionPaused || !!selected || guideOpen || failedAsset}
              reducedMotion={reducedMotion}
              placement={scene.npcs[0]}
              onAssetError={() => setFailedAsset(true)}
            />
          ) : (
            <div className="cafe-light-rays" aria-hidden="true" />
          )}
          {scene.npcs.map((placement) => (
            <div
              className="cafe-scene-person"
              key={placement.id}
              style={{
                left: `${placement.x}%`,
                top: `${placement.y}%`,
                width: `${placement.width}%`,
              }}
            >
              <Npc
                id={placement.id as NpcId}
                state={npcStates[placement.id as NpcId] ?? "idle"}
                paused={motionPaused || !!selected || guideOpen}
              />
              <span className="cafe-npc-reaction">
                {npcStates[placement.id as NpcId] === "thinking"
                  ? "…"
                  : npcStates[placement.id as NpcId] === "error"
                    ? "!"
                    : npcStates[placement.id as NpcId] === "notice"
                      ? "♡"
                      : ""}
              </span>
            </div>
          ))}
          {!pineLake && (
            <div className={`cafe-ambient-fx fx-${scene.settingId}`} aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
          )}
          {scene.npcs.map((placement) => {
            const npc = npcs.find((n) => n.id === placement.id)!;
            const Icon = topicIcons[npc.id];
            const primaryTopic = npc.topics[0];
            return (
              <button
                ref={(element) => {
                  hotspots.current[npc.id] = element;
                }}
                key={npc.id}
                className="cafe-hotspot"
                type="button"
                disabled={!ready || transition || !!selected || guideOpen}
                aria-label={
                  isGuideNpc(npc.id) ? `Học cùng ${npc.name}` : `Trò chuyện với ${npc.name}`
                }
                style={{
                  left: `${placement.x}%`,
                  top: `${placement.y - (placement.width * 8) / 9}%`,
                  width: `${placement.width}%`,
                  height: `${(placement.width * 16) / 9}%`,
                }}
                onPointerEnter={(event) => {
                  if (selected || guideOpen || event.pointerType === "touch") return;
                  setNpcStates({ [npc.id]: "notice" });
                  if (npc.id === "gray_boo") setGrayHovered(true);
                }}
                onPointerLeave={() => {
                  if (npc.id === "gray_boo") setGrayHovered(false);
                  if (!selected && !(npc.id === "gray_boo" && grayFocused)) setNpcStates({});
                }}
                onFocus={(event) => {
                  if (
                    selected ||
                    guideOpen ||
                    restoringFocus.current ||
                    !event.currentTarget.matches(":focus-visible")
                  )
                    return;
                  setNpcStates({ [npc.id]: "notice" });
                  if (npc.id === "gray_boo") setGrayFocused(true);
                }}
                onBlur={() => {
                  if (npc.id === "gray_boo") setGrayFocused(false);
                  if (!selected && !(npc.id === "gray_boo" && grayHovered)) setNpcStates({});
                }}
                onClick={() => openNpc(npc.id)}
              >
                <span className="cafe-npc-label">
                  <span className="cafe-topic-icon">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{npc.name}</strong>
                    {primaryTopic && <small>{topics[primaryTopic].label}</small>}
                  </span>
                </span>
              </button>
            );
          })}
          {scene.exits.map((exit) => (
            <button
              key={exit.to}
              className={`cafe-scene-arrow arrow-${exit.direction}`}
              disabled={transition || !!selected || guideOpen}
              onClick={() => navigate(exit.to)}
              aria-label={exit.label}
            >
              {exit.direction === "left" && <ArrowLeft size={22} aria-hidden="true" />}
              <span className="cafe-scene-arrow-label">{exit.label}</span>
              {exit.direction === "right" && <ArrowRight size={22} aria-hidden="true" />}
            </button>
          ))}
          {failedAsset && (
            <div className="cafe-asset-fallback" role="alert">
              <Coffee size={32} />
              <strong>Chưa tải đủ khung cảnh</strong>
              <p>Bạn vẫn có thể chọn người bạn ngay trên khung cảnh.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setFailedAsset(false);
                  setAssetRetry((n) => n + 1);
                }}
              >
                <RefreshCw size={16} />
                Tải lại cảnh
              </Button>
            </div>
          )}
        </div>
        <div className="cafe-scene-caption">
          <div>
            <strong>{scene.label}</strong>
            <span>{scene.subtitle}</span>
          </div>
          <span>
            <Layers3 size={15} />
            Chạm vào một người bạn để bắt đầu
          </span>
        </div>
        <div className="cafe-scene-top">
          <ol aria-label="Ba điểm dừng Đà Lạt">
            {scenes.map((s, i) => (
              <li key={s.id} aria-current={s.id === sceneId ? "step" : undefined}>
                <span>0{i + 1}</span>
                {s.shortLabel}
              </li>
            ))}
          </ol>
          <div className="cafe-scene-actions">
            <button
              ref={guideButton}
              className="cafe-icon-button"
              disabled={!ready}
              aria-label="Học cùng Mr. Pink"
              onClick={() => setGuideOpen(true)}
            >
              <Sparkles size={18} />
            </button>
            <button
              className="cafe-icon-button"
              onClick={() => setPaused((s) => !s)}
              aria-pressed={paused}
              aria-label={paused ? "Bật chuyển động" : "Tạm dừng chuyển động"}
            >
              {paused ? <Play size={18} /> : <Pause size={18} />}
            </button>
          </div>
        </div>
      </section>
      {!!history.length && (
        <details className="cafe-history">
          <summary>Nhật ký ghé quán</summary>
          {history.map((s) => (
            <div key={s.id}>
              <button className="cafe-text-button" onClick={() => void resume(s.id)}>
                {npcs.find((n) => n.id === s.npcId)?.name} · {topics[s.topicId].label} · {s.level} ·{" "}
                {s.status === "active" ? "Đang mở" : "Đã kết thúc"}
              </button>
              {deleteId === s.id ? (
                <span>
                  <button
                    className="cafe-text-button"
                    onClick={() => {
                      void cafeRequest(`/api/cafe/conversations/${s.id}`, undefined, "DELETE")
                        .then(() => {
                          setDeleteId(null);
                          void refresh();
                        })
                        .catch((e: Error) => setError(e.message));
                    }}
                  >
                    Xác nhận xóa cả hội thoại và thẻ liên quan
                  </button>
                  <button className="cafe-text-button" onClick={() => setDeleteId(null)}>
                    Hủy
                  </button>
                </span>
              ) : (
                <button
                  className="cafe-icon-button"
                  aria-label={`Xóa cuộc trò chuyện ${s.id}`}
                  onClick={() => setDeleteId(s.id)}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </details>
      )}
      {selected && (
        <CafeChat
          key={`${selected}-${initialSession?.id ?? "new"}`}
          npcId={selected}
          motionPaused={motionPaused}
          initialSession={initialSession}
          aiReady={aiReady}
          onSaved={() => void refresh()}
          onResume={(id) => void resume(id)}
          onState={(state) => setNpcStates({ [selected]: state })}
          onClose={() => {
            setGrayHovered(false);
            setGrayFocused(false);
            setSelected(null);
            setNpcStates({});
            void refresh();
            setTimeout(() => {
              restoringFocus.current = true;
              hotspots.current[lastFocus.current]?.focus();
              restoringFocus.current = false;
            }, 0);
          }}
        />
      )}
      {guideOpen && <CafeGuide onClose={closeGuide} />}
    </div>
  );
}
