"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import config from "../../configs/mountain_view.animation.json";

type Group = "water" | "pine" | "flowers" | "particles" | "hologram" | "boat" | "rowing";

export function PineLake({
  active,
  paused,
  reducedMotion,
  placement,
  onAssetError,
}: {
  active: boolean;
  paused: boolean;
  reducedMotion: boolean;
  placement: { x: number; y: number; width: number };
  onAssetError: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const controls = useRef<(active: boolean, paused: boolean, reduced: boolean) => void>(() => {});
  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const animations: { animation: Animation; group: Group }[] = [];
    const animate = (
      element: Element,
      group: Group,
      frames: Keyframe[],
      duration: number,
      phase = 0,
    ) => {
      const animation = element.animate(frames, { duration, iterations: Infinity });
      animation.id = `pine-lake-${group}:${animations.length}`;
      animation.pause();
      animation.currentTime = (duration * phase) / (Math.PI * 2);
      animations.push({ animation, group });
      return animation;
    };
    for (const element of host.querySelectorAll<HTMLElement>("[data-sway]")) {
      const layer = config.foliage.find((item) => item.id === element.dataset.sway)!;
      animate(
        element,
        layer.group as Group,
        [0, 1, 0, -1, 0].map((value) => ({
          transform: `rotate(${value * layer.angle}deg)`,
          easing: "ease-in-out",
        })),
        layer.group === "pine" ? 5500 : 6500,
        layer.phase,
      );
    }
    const waterClock = animate(
      host.querySelector(".pine-lake-shimmer")!,
      "water",
      [{ opacity: 1 }, { opacity: 1 }],
      4700,
    );
    animate(
      host.querySelector(".pine-lake-hologram")!,
      "hologram",
      [
        { opacity: 0.18, transform: "scale(1)" },
        { opacity: 0.36, transform: "scale(1.015)" },
        { opacity: 0.18, transform: "scale(1)" },
      ],
      1900,
    );
    const travelX = ((config.boat.destination.x - config.boat.x) / config.boat.displayWidth) * 100;
    const travelY = ((config.boat.destination.y - config.boat.y) / config.boat.displayHeight) * 100;
    const arrival = config.boat.legMs / config.boat.periodMs;
    const departBack = (config.boat.legMs + config.boat.turnMs) / config.boat.periodMs;
    const arriveHome = (2 * config.boat.legMs + config.boat.turnMs) / config.boat.periodMs;
    animate(
      host.querySelector(".pine-lake-boat")!,
      "boat",
      [
        { offset: 0, transform: "translate(0, 0) rotateY(0deg)" },
        { offset: arrival, transform: `translate(${travelX}%, ${travelY}%) rotateY(0deg)` },
        { offset: departBack, transform: `translate(${travelX}%, ${travelY}%) rotateY(180deg)` },
        { offset: arriveHome, transform: "translate(0, 0) rotateY(180deg)" },
        { offset: 1, transform: "translate(0, 0) rotateY(360deg)" },
      ],
      config.boat.periodMs,
    );
    const lean: Keyframe[] = [
      { offset: 0, transform: "rotate(4deg)", easing: "ease-in-out" },
      { offset: 0.56, transform: "rotate(-5deg)", easing: "ease-in-out" },
      { offset: 1, transform: "rotate(4deg)" },
    ];
    host
      .querySelectorAll(".pine-lake-rowing-pose")
      .forEach((element) => animate(element, "rowing", lean, config.rower.strokeMs));
    animate(
      host.querySelector(".pine-lake-oar")!,
      "rowing",
      [
        { offset: 0, transform: "rotate(32deg) scaleY(.38)" },
        { offset: 0.13, transform: "rotate(32deg) scaleY(1)" },
        { offset: 0.56, transform: "rotate(-32deg) scaleY(1)" },
        { offset: 0.72, transform: "rotate(-32deg) scaleY(.38)" },
        { offset: 0.95, transform: "rotate(32deg) scaleY(.38)" },
        { offset: 1, transform: "rotate(32deg) scaleY(.38)" },
      ],
      config.rower.strokeMs,
    );
    animate(
      host.querySelector(".pine-lake-wake")!,
      "rowing",
      [
        { opacity: 0, transform: "scale(.7,.55)" },
        { offset: 0.2, opacity: 0.28, transform: "scale(.85,.7)" },
        { offset: 0.65, opacity: 0.13, transform: "scale(1.2,1)" },
        { opacity: 0, transform: "scale(1.45,1.3)" },
      ],
      config.rower.strokeMs,
    );
    host.querySelectorAll(".pine-lake-sparkle").forEach((element, i) => {
      animate(
        element,
        "particles",
        [
          { opacity: 0, transform: "translate(0, 0)" },
          { opacity: 0.42, transform: "translate(45%, -180%)", offset: 0.5 },
          { opacity: 0, transform: "translate(-30%, -360%)" },
        ],
        4200,
        i * 1.047,
      );
    });
    let blend = 0;
    let hovering = false,
      stopped = true,
      reduced = false;
    let request = 0,
      last = 0;
    const waterCanvas = host.querySelector<HTMLCanvasElement>(".pine-lake-wave-surface")!;
    const waterImage = host.querySelector<HTMLImageElement>(".pine-lake-water-source")!;
    const context = waterCanvas.getContext("2d");
    let waterRequest = 0,
      lastWaterPaint = 0;
    const drawWater = () => {
      if (!context || !waterImage.complete || !waterImage.naturalWidth) return;
      const phase = (Number(waterClock.currentTime ?? 0) / 4700) * Math.PI * 2;
      context.setTransform(waterCanvas.width / 1920, 0, 0, waterCanvas.height / 1080, 0, 0);
      context.clearRect(0, 0, 1920, 1080);
      context.drawImage(waterImage, 300, 448, 1620, 482, 300, 448, 1620, 482);
      // Warp actual reflected tree lines in narrow water strips. The containing
      // shoreline mask and static railing stay fixed; brightness does not pulse.
      for (let y = 448; y < 930; y += 3) {
        const depth = Math.max(0, Math.min(1, (y - 448) / 402));
        const dx =
          Math.sin(y * 0.072 - phase) * (3 + depth * 8) +
          Math.sin(y * 0.037 + phase * 2) * depth * 1.5;
        const dy = Math.sin(y * 0.043 + phase) * depth * 1.5;
        context.drawImage(waterImage, 300, y + dy, 1620, 3, 300 + dx, y, 1620, 3);
      }
    };
    const fitWater = () => {
      waterCanvas.width = Math.round(Math.min(1920, Math.max(960, host.clientWidth)));
      waterCanvas.height = Math.round((waterCanvas.width * 9) / 16);
      drawWater();
    };
    const paintWater = (now: number) => {
      waterRequest = 0;
      if (stopped || reduced || document.hidden) return;
      if (now - lastWaterPaint >= 1000 / 30) {
        drawWater();
        lastWaterPaint = now;
      }
      waterRequest = requestAnimationFrame(paintWater);
    };
    const waterResize = new ResizeObserver(fitWater);
    waterResize.observe(host);
    waterImage.addEventListener("load", drawWater);
    fitWater();
    const setRates = () => {
      for (const { animation, group } of animations)
        animation.updatePlaybackRate(1 + (config.hoverBoost[group] - 1) * blend);
    };
    const tick = (now: number) => {
      request = 0;
      const dt = last ? Math.min(now - last, 50) : 0;
      last = now;
      const target = hovering ? 1 : 0;
      const tau = target > blend ? config.hoverBoost.easeInMs : config.hoverBoost.easeOutMs;
      blend += (target - blend) * (1 - Math.exp(-dt / tau));
      if (Math.abs(target - blend) < 0.0001) blend = target;
      setRates();
      if (blend !== target) request = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(request);
      cancelAnimationFrame(waterRequest);
      request = 0;
      waterRequest = 0;
      last = 0;
      const freeze = stopped || reduced || document.hidden;
      for (const { animation } of animations) {
        if (freeze) animation.pause();
        else animation.play();
      }
      if (freeze) {
        blend = 0;
        setRates();
      } else {
        request = requestAnimationFrame(tick);
        lastWaterPaint = 0;
        waterRequest = requestAnimationFrame(paintWater);
      }
    };
    controls.current = (active, paused, reduce) => {
      hovering = active && !reduce;
      stopped = paused;
      reduced = reduce;
      sync();
    };
    document.addEventListener("visibilitychange", sync);
    return () => {
      controls.current = () => {};
      document.removeEventListener("visibilitychange", sync);
      cancelAnimationFrame(request);
      cancelAnimationFrame(waterRequest);
      waterResize.disconnect();
      waterImage.removeEventListener("load", drawWater);
      animations.forEach(({ animation }) => animation.cancel());
    };
  }, []);
  useEffect(() => {
    controls.current(active, paused, reducedMotion);
  }, [active, paused, reducedMotion]);

  const npcHeight = (placement.width * 1.25 * 16) / 9;
  const box = config.hologramBox;
  const glowLeft = placement.x - placement.width / 2 + placement.width * box.left;
  const glowTop = placement.y - npcHeight + npcHeight * box.top;
  const rower = config.rower;
  const rowerStyle = {
    left: `${(rower.x / config.boat.displayWidth) * 100}%`,
    top: `${(rower.y / config.boat.displayHeight) * 100}%`,
    width: `${(rower.displayWidth / config.boat.displayWidth) * 100}%`,
    height: `${(rower.displayHeight / config.boat.displayHeight) * 100}%`,
  };
  const oarWidth = (rower.oarHeight * rower.oar.width) / rower.oar.height;
  const image = (asset: { src: string; width: number; height: number }, className?: string) => (
    <Image
      src={asset.src}
      width={asset.width}
      height={asset.height}
      alt=""
      unoptimized
      loading="eager"
      draggable={false}
      className={className}
      onError={onAssetError}
    />
  );
  return (
    <div ref={root} className="cafe-pine-lake" data-reduced={reducedMotion} aria-hidden="true">
      <div
        className="pine-lake-water-mask"
        style={{
          maskImage: `url("${config.waterMask.src}")`,
          maskSize: "100% 100%",
          maskRepeat: "no-repeat",
        }}
      >
        <canvas className="pine-lake-wave-surface pine-lake-shimmer" width="1920" height="1080" />
        {image(config.waterBase, "pine-lake-water-source")}
      </div>
      <div
        className="pine-lake-boat"
        style={{
          left: `${(config.boat.x / 1920) * 100}%`,
          top: `${(config.boat.y / 1080) * 100}%`,
          width: `${(config.boat.displayWidth / 1920) * 100}%`,
          height: `${(config.boat.displayHeight / 1080) * 100}%`,
        }}
      >
        <span className="pine-lake-wake" />
        {image(config.boat, "pine-lake-boat-hull")}
        <div className="pine-lake-rower pine-lake-rowing-pose" style={rowerStyle}>
          {image(rower.body, "pine-lake-rower-image")}
        </div>
        {image(config.boat, "pine-lake-boat-front")}
        {/* Clip in the boat's water plane, outside the rotating shoulder pose. */}
        <div className="pine-lake-oar-waterline">
          <div className="pine-lake-oar-pose pine-lake-rowing-pose" style={rowerStyle}>
            <div
              className="pine-lake-oar"
              style={{
                left: `${(rower.grip.x - oarWidth / rower.displayWidth / 2) * 100}%`,
                top: `${(rower.grip.y - (rower.oarHeight / rower.displayHeight) * rower.oarGrip) * 100}%`,
                width: `${(oarWidth / rower.displayWidth) * 100}%`,
                height: `${(rower.oarHeight / rower.displayHeight) * 100}%`,
                transformOrigin: `50% ${rower.oarGrip * 100}%`,
              }}
            >
              {image(rower.oar)}
            </div>
          </div>
        </div>
        {image(config.boat, "pine-lake-boat-reflection")}
        <div
          className="pine-lake-rower-reflection"
          style={{
            left: rowerStyle.left,
            width: rowerStyle.width,
            top: `${((config.boat.displayHeight + 0.45 * (config.boat.displayHeight - rower.y - rower.displayHeight)) / config.boat.displayHeight) * 100}%`,
            height: `${((rower.displayHeight * 0.45) / config.boat.displayHeight) * 100}%`,
          }}
        >
          {image(rower.body)}
        </div>
      </div>
      {config.foliage.map((layer) => (
        <div
          key={layer.id}
          className="cafe-scene-layer pine-lake-sway"
          data-sway={layer.id}
          style={{
            left: `${(layer.x / 1920) * 100}%`,
            top: `${(layer.y / 1080) * 100}%`,
            width: `${(layer.width / 1920) * 100}%`,
            height: `${(layer.height / 1080) * 100}%`,
            zIndex: layer.zIndex,
            transformOrigin: `${((layer.pivot[0] - layer.x) / layer.width) * 100}% ${((layer.pivot[1] - layer.y) / layer.height) * 100}%`,
          }}
        >
          {image(layer)}
        </div>
      ))}
      <div
        className="pine-lake-hologram"
        style={{
          left: `${glowLeft}%`,
          top: `${glowTop}%`,
          width: `${placement.width * box.width}%`,
          height: `${npcHeight * box.height}%`,
        }}
      >
        {image(config.hologram)}
      </div>
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="pine-lake-sparkle"
          style={{
            left: `${glowLeft + i * 0.65}%`,
            top: `${glowTop + 0.8 + (i % 3) * 0.65}%`,
          }}
        >
          {image(config.sparkle)}
        </div>
      ))}
    </div>
  );
}
