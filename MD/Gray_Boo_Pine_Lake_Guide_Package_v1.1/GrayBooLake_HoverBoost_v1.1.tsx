'use client';

import { useEffect, useRef, useState } from 'react';
import { Application, Assets, Container, Sprite, AnimatedSprite } from 'pixi.js';

type GrayState = 'idle' | 'notice' | 'listening' | 'thinking' | 'talking' | 'error';
const W = 1920;
const H = 1080;
const toRad = (deg: number) => deg * Math.PI / 180;

export default function GrayBooLake() {
  const hostRef = useRef<HTMLDivElement>(null);
  const setGrayState = useRef<(state: GrayState) => void>(() => {});
  const hoverActive = useRef(false); // mouse/pen hover hoặc keyboard focus
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    async function mount() {
      const app = new Application();
      await app.init({ resizeTo: host!, backgroundAlpha: 0, antialias: true });
      if (cancelled) { app.destroy(true); return; }
      host!.appendChild(app.canvas);
      app.canvas.style.pointerEvents = 'none'; // hotspot do DOM quản lý
      app.canvas.style.display = 'block';

      const world = new Container();
      app.stage.addChild(world);
      const scene = '/cafe/assets/scenes/mountain_view/';
      const npcBase = '/cafe/assets/npc/gray_boo/';
      const [bgTex, shimmerTex, pineLeftTex, pineRightTex,
             flowersLeftTex, flowersRightTex, glowTex, sparkleTex, sheet] =
        await Promise.all([
          Assets.load(scene + 'bg_clean.webp'),
          Assets.load(scene + 'lake_shimmer_alpha.webp'),
          Assets.load(scene + 'pine_branch_left.webp'),
          Assets.load(scene + 'pine_branch_right.webp'),
          Assets.load(scene + 'hydrangea_left.webp'),
          Assets.load(scene + 'hydrangea_right.webp'),
          Assets.load(npcBase + 'hologram_glow.webp'),
          Assets.load(npcBase + 'sparkle.webp'),
          Assets.load(npcBase + 'gray_boo.atlas.json')
        ]);
      if (cancelled) { app.destroy(true); return; }

      const bg = new Sprite(bgTex);
      bg.width = W;
      bg.height = H;
      world.addChild(bg);

      const shimmer = new Sprite(shimmerTex);
      shimmer.width = W;
      shimmer.height = H;
      world.addChild(shimmer); // alpha sạch / mask hồ có sẵn trong asset

      // Demo: các overlay foliage alpha cùng canvas 1920x1080.
      // Production nên crop sát sprite rồi đổi pivot/position theo manifest Art.
      function addSway(tex: typeof pineLeftTex, rootX: number, rootY: number) {
        const sprite = new Sprite(tex);
        sprite.width = W;
        sprite.height = H;
        sprite.pivot.set(rootX, rootY); // gốc cành/bụi cây, không phải tâm ảnh
        sprite.position.set(rootX, rootY);
        world.addChild(sprite);
        return sprite;
      }
      const pineL = addSway(pineLeftTex, 110, 36);
      const pineR = addSway(pineRightTex, 1690, 46);
      const flowerL = addSway(flowersLeftTex, 110, 920);
      const flowerR = addSway(flowersRightTex, 1770, 910);

      const gray = new AnimatedSprite({
        textures: sheet.animations.idle, autoPlay: true,
        loop: true, animationSpeed: 0.1
      });
      gray.anchor.set(0.5, 1);
      gray.position.set(1180, 976); // placeholder: phải đo lại ảnh clean
      world.addChild(gray);

      const hologram = new Sprite(glowTex);
      hologram.anchor.set(0.5);
      hologram.position.set(1280, 760); // placeholder theo bàn tay/thiết bị
      world.addChild(hologram);

      const particles = Array.from({ length: 6 }, (_, index) => {
        const sprite = new Sprite(sparkleTex);
        sprite.anchor.set(0.5);
        sprite.scale.set(0.14);
        world.addChild(sprite);
        return { sprite, index };
      });

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
      setGrayState.current = (state) => {
        const frames = sheet.animations[state] ?? sheet.animations.idle;
        gray.stop();
        gray.textures = frames;
        if (reduced.matches) gray.gotoAndStop(0);
        else gray.gotoAndPlay(0);
      };

      const fit = () => {
        const scale = Math.min(host!.clientWidth / W, host!.clientHeight / H);
        world.scale.set(scale);
        world.position.set((host!.clientWidth - W * scale) / 2,
                           (host!.clientHeight - H * scale) / 2);
      };
      const ro = new ResizeObserver(fit);
      ro.observe(host!);
      fit();

      let blend = 0;
      let waterPhase = 0, windPhase = 0, flowerPhase = 0;
      let particlePhase = 0, glowPhase = 0;
      const update = (ticker: { deltaMS: number }) => {
        const dt = Math.min(ticker.deltaMS, 50) / 1000;
        if (reduced.matches) {
          blend = 0;
          shimmer.alpha = 0;
          pineL.rotation = pineR.rotation = 0;
          flowerL.rotation = flowerR.rotation = 0;
          hologram.alpha = 0.18;
          particles.forEach(({ sprite }) => { sprite.visible = false; });
          gray.stop();
          return;
        }

        const target = hoverActive.current ? 1 : 0;
        const tau = target > blend ? 0.45 : 0.80;
        blend += (target - blend) * (1 - Math.exp(-dt / tau));
        const boost = (max: number) => 1 + (max - 1) * blend;
        waterPhase += dt * boost(1.8);
        windPhase += dt * boost(1.5);
        flowerPhase += dt * boost(1.5);
        particlePhase += dt * boost(2.0);
        glowPhase += dt * boost(1.3);

        shimmer.alpha = 0.22 + Math.sin(waterPhase * 1.35) * 0.07;
        pineL.rotation = toRad(1.05) * Math.sin(windPhase * 1.14);
        pineR.rotation = toRad(0.90) * Math.sin(windPhase * 1.14 + 1.4);
        flowerL.rotation = toRad(0.45) * Math.sin(flowerPhase * 1.55 + 0.8);
        flowerR.rotation = toRad(0.45) * Math.sin(flowerPhase * 1.55 + 2.3);
        hologram.alpha = 0.55 + Math.sin(glowPhase * 3.1) * 0.12;
        particles.forEach(({ sprite, index }) => {
          const p = particlePhase * 0.7 + index * 1.047;
          sprite.visible = true;
          sprite.position.set(1110 + index * 32 + Math.sin(p) * 7,
                              740 - Math.sin(p * 0.8) * 24);
          sprite.alpha = 0.23 + Math.abs(Math.sin(p)) * 0.3;
        });
      };
      app.ticker.add(update);
      const onVisibility = () => document.hidden ? app.stop() : app.start();
      document.addEventListener('visibilitychange', onVisibility);

      cleanup = () => {
        hoverActive.current = false;
        setGrayState.current = () => {};
        ro.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
        app.ticker.remove(update);
        app.destroy(true);
      };
      if (cancelled) cleanup();
    }

    void mount().catch((error) => {
      // Production: render static poster + retry; never leave blank scene.
      console.error('Gray Boo scene failed to mount', error);
    });
    return () => { cancelled = true; cleanup?.(); };
  }, []);

  const onHoverEnter = () => {
    if (open) return;
    hoverActive.current = true;
    setGrayState.current('notice');
  };
  const onHoverLeave = () => {
    hoverActive.current = false;
    if (!open) setGrayState.current('idle');
  };

  return (
    <div className="scene-frame">
      <div ref={hostRef} className="scene-canvas" aria-hidden="true" />
      <button
        className="gray-hotspot"
        aria-label="Talk to Gray Boo"
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse' || event.pointerType === 'pen')
            onHoverEnter();
        }}
        onPointerLeave={onHoverLeave}
        onFocus={onHoverEnter}
        onBlur={onHoverLeave}
        onClick={() => {
          hoverActive.current = false; // giảm tốc khi chat mở
          setGrayState.current('listening');
          setOpen(true);
        }}
      />
      {open && (
        <section className="chat-sheet" role="dialog" aria-modal="true"
                 aria-label="Practice English with Gray Boo">
          <strong>Gray Boo · Nature / Aliens</strong>
          <p>Connect this panel to the project's actual chat flow.</p>
          <button onClick={() => {
            hoverActive.current = false;
            setOpen(false);
            setGrayState.current('idle');
          }}>Close</button>
        </section>
      )}
    </div>
  );
}

