"use client";
import Image from "next/image";
import Link from "next/link";
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
  ChevronRight,
  Coffee,
  Layers3,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  CalendarDays,
  Gamepad2,
  Rocket,
  Mountain,
  Orbit,
  Map as MapIcon,
  MessageCircle,
  UserRound,
  Users,
  ShoppingBag,
  Navigation,
  BriefcaseBusiness,
  Monitor,
  ClipboardList,
  Landmark,
  Palette,
  Code2,
  ShieldCheck,
  Sun,
  BookOpen,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { cafeRequest } from "./client";
import {
  npcs,
  topics,
  isGuideNpc,
  npcRoleLabels,
  type CafeSession,
  type NpcId,
  type NpcState,
} from "./content";
import { canNavigate, mapDestinations, scenes, topicRooms, type SceneId } from "./scenes";
import { Npc } from "./npc";
import { CafeChat } from "./chat";
import { CafeGuide } from "./guide";
import { PineLake } from "./pine-lake";
import { FieldStorm } from "./field-storm";
const topicIcons: Partial<Record<NpcId, typeof Coffee>> = {
  cloud_daisy: Coffee,
  ollie_owl: CalendarDays,
  mimi_bunny: Gamepad2,
  astro_bean: Rocket,
  bear_explorer: Mountain,
  gray_boo: Orbit,
  mr_pink: Sparkles,
  nina_cat: MessageCircle,
  ben_bear: UserRound,
  luna_deer: Users,
  penny_panda: ShoppingBag,
  rio_fox: Navigation,
  toby_corgi: BriefcaseBusiness,
  alex_otter: Monitor,
  morgan_wolf: ClipboardList,
  bailey_beaver: Landmark,
  ivy_cat: Palette,
  dex_robot: Code2,
  tess_turtle: ShieldCheck,
  sun_king: Sun,
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
  const [mapFlight, setMapFlight] = useState<{
    direction: "in" | "out";
    point: (typeof mapDestinations)[number];
    ground: string;
  } | null>(null);
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
  const [hoveredNpc, setHoveredNpc] = useState<NpcId | null>(null);
  const grayHovered = hoveredNpc === "gray_boo";
  const [focusedNpc, setFocusedNpc] = useState<NpcId | null>(null);
  const grayFocused = focusedNpc === "gray_boo";
  const restoringFocus = useRef(false);
  const [initialSession, setInitialSession] = useState<CafeSession>();
  const [npcStates, setNpcStates] = useState<Partial<Record<NpcId, NpcState>>>({
    cloud_daisy: "notice",
  });
  const [aiReady, setAiReady] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const guideButton = useRef<HTMLButtonElement>(null);
  const transitionLock = useRef(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hotspots = useRef<Partial<Record<NpcId, HTMLButtonElement | null>>>({});
  const lastFocus = useRef<NpcId>("cloud_daisy");
  const mapButtons = useRef<Record<string, HTMLButtonElement | null>>({});
  const returnToMap = useRef<HTMLButtonElement>(null);
  const lastMapPoint = useRef<string | null>(null);
  const scene = scenes.find((s) => s.id === sceneId)!;
  const pineLake = scene.settingId === "pine_lake";
  const mapView = scene.id === "map";
  const mapLocation = mapDestinations.find((point) => point.id === sceneId);
  const parentId =
    topicRooms.find((room) => room.id === sceneId)?.parent ??
    (scene.exits.some((exit) => exit.to === "village_homes") ? "village_homes" : undefined);
  const parentScene = scenes.find((candidate) => candidate.id === parentId);
  const staticScenery = mapView || !!mapLocation || topicRooms.some((room) => room.id === sceneId);
  useEffect(() => {
    if (mapLocation) returnToMap.current?.focus({ preventScroll: true });
    else if (mapView && lastMapPoint.current)
      mapButtons.current[lastMapPoint.current]?.focus({ preventScroll: true });
    else if (topicRooms.some((room) => room.id === sceneId))
      frame.current?.focus({ preventScroll: true });
  }, [sceneId, mapView, mapLocation]);
  const grayBoost =
    pineLake && (grayHovered || grayFocused) && !motionPaused && !selected && !guideOpen;
  const refresh = useCallback(async () => {
    try {
      const capability = await cafeRequest<{ textAi: boolean }>("/api/advanced/capabilities");
      setAiReady(capability.textAi);
      setError("");
      setReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa đọc được dữ liệu café.");
    }
  }, []);
  useIsomorphicLayoutEffect(() => {
    // Skip the topbar and breadcrumb; preserve back/forward restoration.
    const navigation = performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined;
    const sceneFrame = frame.current;
    if (!sceneFrame) return;
    const top = Math.round(sceneFrame.getBoundingClientRect().top + window.scrollY);
    const page = sceneFrame.closest<HTMLElement>(".page-wrap");
    page?.style.setProperty("--cafe-entry-scroll", `${top}px`);
    if (navigation?.type !== "back_forward") window.scrollTo({ top, behavior: "instant" });
    return () => {
      page?.style.removeProperty("--cafe-entry-scroll");
    };
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
    if (motionPaused || selected || guideOpen || !scene.npcs.length) return;
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
    const point = mapDestinations.find((point) =>
      sceneId === "map" ? point.id === to : to === "map" && point.id === sceneId,
    );
    const fly = point && !motionPaused;
    if (fly)
      setMapFlight({
        direction: sceneId === "map" ? "in" : "out",
        point,
        ground: scenes.find((s) => s.id === point.id)!.layers[0].src,
      });
    transitionLock.current = true;
    setTransition(true);
    transitionTimer.current = setTimeout(
      () => {
        setSceneId(to as SceneId);
        setFailedAsset(false);
        setNpcStates({});
        setHoveredNpc(null);
        setFocusedNpc(null);
        setTransition(false);
        setMapFlight(null);
        transitionLock.current = false;
        window.history.replaceState(null, "", `${window.location.pathname}?scene=${to}`);
      },
      motionPaused ? 50 : fly ? 1200 : 380,
    );
  }
  function openNpc(id: NpcId) {
    if (!ready || transitionLock.current) return;
    lastFocus.current = id;
    setHoveredNpc(null);
    setFocusedNpc(null);
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
    setTimeout(() => {
      restoringFocus.current = true;
      guideButton.current?.focus();
      restoringFocus.current = false;
    }, 0);
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
      <nav className="cafe-breadcrumb" aria-label="Đường dẫn không gian học">
        <ol>
          <li>
            <Link href="/">Không gian học</Link>
          </li>
          <li>
            <ChevronRight size={14} aria-hidden="true" />
            <Link href="/english/cafe">Cà phê vỉa hè</Link>
          </li>
          {mapLocation && (
            <li>
              <ChevronRight size={14} aria-hidden="true" />
              <button
                disabled={transition || !!selected || guideOpen}
                onClick={() => navigate("map")}
              >
                Bản đồ
              </button>
            </li>
          )}
          {parentScene && (
            <li>
              <ChevronRight size={14} aria-hidden="true" />
              <button
                disabled={transition || !!selected || guideOpen}
                onClick={() => navigate(parentScene.id)}
              >
                {parentScene.shortLabel}
              </button>
            </li>
          )}
          <li>
            <ChevronRight size={14} aria-hidden="true" />
            <span aria-current="location">{scene.label}</span>
          </li>
        </ol>
      </nav>
      {error && (
        <p className="field-error" role="alert">
          {error} <button onClick={() => void refresh()}>Thử lại</button>
        </p>
      )}
      <section className="cafe-scene-card" aria-label="Không gian Đà Lạt">
        <div
          ref={frame}
          tabIndex={-1}
          aria-label={scene.label}
          className="cafe-scene-frame"
          data-scene={sceneId}
          data-topic={scene.topicId}
          data-setting={scene.settingId}
          data-asset-fallback={failedAsset}
          data-paused={motionPaused || !!selected || guideOpen}
          data-transition={transition}
          data-map-flight={mapFlight?.direction}
          onPointerMove={(e) => {
            if (
              motionPaused ||
              selected ||
              guideOpen ||
              pineLake ||
              staticScenery ||
              e.pointerType === "touch"
            )
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
            .map((layer, index) => (
              <div
                key={`${sceneId}-${layer.id}-${assetRetry}`}
                className={`cafe-scene-layer layer-${layer.id}`}
                style={
                  {
                    // These plates and the water share the master’s pixel coordinates.
                    scale: pineLake || staticScenery ? 1 : undefined,
                    transform: pineLake || staticScenery ? "none" : undefined,
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
                  alt={
                    index > 0
                      ? ""
                      : mapView
                        ? "Bản đồ khu vực với những con đường, hồ nước và nhà cửa"
                        : mapLocation
                          ? `Khung cảnh ${scene.label}`
                          : ""
                  }
                  fill
                  style={{ scale: layer.flip ? "-1 1" : undefined }}
                  draggable={false}
                  onError={() => setFailedAsset(true)}
                />
              </div>
            ))}
          {!staticScenery && (
            <div className="cafe-sky-clouds" aria-hidden="true" hidden={failedAsset} />
          )}
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
            !staticScenery && <div className="cafe-light-rays" aria-hidden="true" />
          )}
          {sceneId === "farm_fields" && !failedAsset && (
            <div className="cafe-field-rain" aria-hidden="true">
              <span className="cafe-field-rain-mist" />
              {Array.from({ length: 288 }, (_, index) => (
                <i
                  key={index}
                  style={
                    {
                      left: `${(index * 37) % 101}%`,
                      animationDelay: `${-((index * 13) % 23) / 10}s`,
                      animationDuration: `${0.5 + (index % 7) * 0.07}s`,
                      "--rain-depth": index % 4,
                      "--rain-opacity": 0.45 + (index % 5) * 0.11,
                    } as CSSProperties
                  }
                />
              ))}
              {Array.from({ length: 32 }, (_, index) => {
                const groundY = 64 + ((index * 11) % 34);
                return (
                  <span
                    key={index}
                    className="cafe-rain-impact"
                    style={
                      {
                        left: `${3 + ((index * 37) % 94)}%`,
                        top: `${groundY}%`,
                        "--impact-height": `${groundY}cqh`,
                        "--impact-size": `clamp(10px, ${(groundY - 44) / 25}cqw, 30px)`,
                        "--impact-cycle": `${1.05 + (index % 5) * 0.11}s`,
                        "--impact-delay": `${-((index * 19) % 41) / 10}s`,
                      } as CSSProperties
                    }
                  >
                    <span className="cafe-rain-contact-drop" />
                    <span className="cafe-rain-splash" />
                    <b className="cafe-rain-spray spray-left" />
                    <b className="cafe-rain-spray spray-right" />
                  </span>
                );
              })}
            </div>
          )}
          {sceneId === "farm_fields" && !failedAsset && (
            <FieldStorm
              paused={paused || hidden || !!selected || guideOpen || transition}
              reducedMotion={reducedMotion}
            />
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
          {!pineLake && !staticScenery && (
            <div className={`cafe-ambient-fx fx-${scene.settingId}`} aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
          )}
          {scene.npcs.map((placement) => {
            const npc = npcs.find((n) => n.id === placement.id)!;
            const Icon =
              npc.role === "guide"
                ? BookOpen
                : npc.role === "hybrid"
                  ? Sparkles
                  : (topicIcons[npc.id] ?? MapIcon);
            const primaryTopic = npc.topics[0];
            const greetingVisible =
              !selected && !guideOpen && !transition && (hoveredNpc ?? focusedNpc) === npc.id;
            return (
              <button
                ref={(element) => {
                  hotspots.current[npc.id] = element;
                }}
                key={npc.id}
                className="cafe-hotspot"
                data-npc-role={npc.role}
                data-greeting-align={
                  placement.x < 35 ? "left" : placement.x > 65 ? "right" : "center"
                }
                aria-describedby={greetingVisible ? `greeting-${npc.id}` : undefined}
                type="button"
                disabled={!ready || transition || !!selected || guideOpen}
                aria-label={
                  npc.role === "guide"
                    ? `Học cùng ${npc.name}`
                    : npc.role === "hybrid"
                      ? `Luyện kết hợp với ${npc.name}`
                      : `Trò chuyện với ${npc.name}`
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
                  setHoveredNpc(npc.id);
                }}
                onPointerLeave={() => {
                  setHoveredNpc(null);
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
                  setHoveredNpc(null);
                  setFocusedNpc(npc.id);
                }}
                onBlur={() => {
                  setFocusedNpc(null);
                  if (!selected && !(npc.id === "gray_boo" && grayHovered)) setNpcStates({});
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setHoveredNpc(null);
                    setFocusedNpc(null);
                    setNpcStates({});
                  }
                }}
                onClick={() => openNpc(npc.id)}
              >
                {greetingVisible && (
                  <span className="cafe-npc-greeting" id={`greeting-${npc.id}`} role="tooltip">
                    <span lang="en">{npc.greeting}</span>
                    {primaryTopic && (
                      <span className="cafe-npc-topic" lang="vi">
                        Chủ đề: <span lang="en">{topics[primaryTopic].label}</span>
                      </span>
                    )}
                  </span>
                )}
                <span className="cafe-npc-label">
                  <span className="cafe-topic-icon">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{npc.name}</strong>
                    <small className="cafe-npc-role">{npcRoleLabels[npc.role]}</small>
                    {primaryTopic && (
                      <small>{topics[primaryTopic].shortLabel ?? topics[primaryTopic].label}</small>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
          {mapView &&
            mapDestinations.map((point, index) => (
              <button
                key={point.id}
                ref={(button) => {
                  mapButtons.current[point.id] = button;
                }}
                className="cafe-map-point"
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                aria-label={`Khám phá ${point.label}`}
                disabled={transition || !!selected || guideOpen}
                onClick={() => {
                  lastMapPoint.current = point.id;
                  navigate(point.id);
                }}
              >
                <span className="cafe-map-point-number" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="cafe-map-point-label">{point.shortLabel}</span>
              </button>
            ))}
          {scene.exits
            .filter((exit) => !["point", "place", "passage"].includes(exit.direction))
            .map((exit) => (
              <button
                key={exit.to}
                ref={mapLocation ? returnToMap : undefined}
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
          {mapFlight && (
            <div
              className="cafe-map-flight"
              data-direction={mapFlight.direction}
              aria-hidden="true"
              style={
                {
                  "--flight-origin": `${mapFlight.point.x}% ${mapFlight.point.y}%`,
                  "--flight-x": `${50 - mapFlight.point.x}%`,
                  "--flight-y": `${50 - mapFlight.point.y}%`,
                } as CSSProperties
              }
            >
              <div className="cafe-flight-map">
                <Image
                  src={scenes.find((s) => s.id === "map")!.layers[0].src}
                  fill
                  unoptimized
                  alt=""
                  draggable={false}
                />
              </div>
              <div className="cafe-flight-ground">
                <Image
                  src={mapFlight.ground}
                  fill
                  unoptimized
                  loading="eager"
                  alt=""
                  draggable={false}
                />
              </div>
            </div>
          )}
          {failedAsset && (
            <div className="cafe-asset-fallback" role="alert">
              <Coffee size={32} />
              <strong>Chưa tải đủ khung cảnh</strong>
              <p>
                {mapView
                  ? "Bạn vẫn có thể quay về hồ thông bằng mũi tên."
                  : mapLocation
                    ? "Bạn vẫn có thể quay về Bình Nguyên bằng mũi tên."
                    : "Bạn vẫn có thể chọn người bạn ngay trên khung cảnh."}
              </p>
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
        {scene.exits.some((exit) => ["place", "passage"].includes(exit.direction)) && (
          <nav
            className="cafe-location-links"
            aria-label={
              scene.id === "village_homes" ? "Địa điểm trong khu nhà" : "Chỉ dẫn qua cảnh"
            }
          >
            {scene.exits
              .filter((exit) => ["place", "passage"].includes(exit.direction))
              .map((exit) => (
                <button
                  key={exit.to}
                  disabled={transition || !!selected || guideOpen}
                  onClick={() => navigate(exit.to)}
                >
                  <MapIcon size={16} aria-hidden="true" />
                  {exit.label}
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              ))}
          </nav>
        )}
        {mapView && (
          <ol className="cafe-map-legend" aria-label="Địa điểm trên bản đồ">
            {mapDestinations.map((point, index) => (
              <li key={point.id}>
                <span>{index + 1}</span>
                {point.shortLabel}
              </li>
            ))}
          </ol>
        )}
        <div className="cafe-scene-caption">
          <div>
            <strong>{scene.label}</strong>
            <span>{scene.subtitle}</span>
          </div>
          <span>
            {staticScenery ? <MapIcon size={15} aria-hidden="true" /> : <Layers3 size={15} />}
            {mapView
              ? "Chạm vào điểm để mở khung cảnh"
              : mapLocation && !scene.npcs.length
                ? "Dùng mũi tên để về Bình Nguyên"
                : "Chạm vào một người bạn để bắt đầu"}
          </span>
        </div>
        <div className="cafe-scene-top">
          <ol aria-label="Các điểm dừng Đà Lạt">
            {scenes
              .filter((s) =>
                ["inside_cafe", "outdoor_terrace", "mountain_view", "map"].includes(s.id),
              )
              .map((s, i) => (
                <li
                  key={s.id}
                  aria-current={
                    s.id === sceneId || (s.id === "map" && mapLocation) ? "step" : undefined
                  }
                >
                  <span>0{i + 1}</span>
                  {s.shortLabel}
                </li>
              ))}
          </ol>
          <div className="cafe-scene-actions">
            <button
              ref={guideButton}
              className="cafe-icon-button"
              disabled={!ready || transition || !!selected || guideOpen}
              aria-label={`Học cùng ${npcs.find((npc) => npc.id === "mr_pink")!.name}`}
              aria-describedby={
                !guideOpen && (hoveredNpc ?? focusedNpc) === "mr_pink"
                  ? "greeting-mr_pink"
                  : undefined
              }
              onPointerEnter={(event) => {
                if (event.pointerType !== "touch" && !guideOpen && !selected)
                  setHoveredNpc("mr_pink");
              }}
              onPointerLeave={() => setHoveredNpc(null)}
              onFocus={(event) => {
                if (
                  event.currentTarget.matches(":focus-visible") &&
                  !restoringFocus.current &&
                  !guideOpen &&
                  !selected
                )
                  setFocusedNpc("mr_pink");
              }}
              onBlur={() => setFocusedNpc(null)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setHoveredNpc(null);
                  setFocusedNpc(null);
                }
              }}
              onClick={() => openNpc("mr_pink")}
            >
              {!guideOpen && !selected && (hoveredNpc ?? focusedNpc) === "mr_pink" && (
                <span className="cafe-npc-greeting" id="greeting-mr_pink" role="tooltip" lang="en">
                  {npcs.find((npc) => npc.id === "mr_pink")!.greeting}
                </span>
              )}
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
            setHoveredNpc(null);
            setFocusedNpc(null);
            setSelected(null);
            setNpcStates({});
            void refresh();
            queueMicrotask(() => {
              restoringFocus.current = true;
              hotspots.current[lastFocus.current]?.focus();
              restoringFocus.current = false;
            });
          }}
        />
      )}
      {guideOpen && <CafeGuide onClose={closeGuide} />}
    </div>
  );
}
