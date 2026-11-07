"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { NpcState } from "./content";
import type { mountNpcPuppet } from "./npc-puppet";

export function NpcRig({
  id,
  state,
  paused,
  asset,
}: {
  id: string;
  state: NpcState;
  paused: boolean;
  asset: { src: string; width: number; height: number; rig: string };
}) {
  const host = useRef<HTMLSpanElement>(null);
  const controller = useRef<Awaited<ReturnType<typeof mountNpcPuppet>> | null>(null);
  const latest = useRef({ state, paused });
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    latest.current = { state, paused };
    controller.current?.update(state, paused);
  }, [state, paused]);
  useEffect(() => {
    let disposed = false;
    void import("./npc-puppet")
      .then(async ({ mountNpcPuppet }) => {
        if (disposed || !host.current) return;
        const player = await mountNpcPuppet(host.current, asset.rig);
        if (disposed) {
          player.destroy();
          return;
        }
        controller.current = player;
        player.update(latest.current.state, latest.current.paused);
        setLoaded(true);
      })
      .catch(() => {
        if (!disposed) {
          host.current?.setAttribute("data-load-error", "true");
          setLoaded(false);
        }
      });
    return () => {
      disposed = true;
      controller.current?.destroy();
      controller.current = null;
    };
  }, [asset.rig]);
  return (
    <span
      className="cafe-npc cafe-npc-rig"
      data-npc-id={id}
      data-state={state}
      data-ready={loaded}
      data-animated={loaded}
      data-renderer={loaded ? "pixi" : "poster"}
      aria-hidden="true"
    >
      <span className="cafe-npc-viewport">
        <Image
          src={asset.src}
          width={asset.width}
          height={asset.height}
          unoptimized
          loading="eager"
          alt=""
          draggable={false}
          className="cafe-npc-image"
        />
        <span ref={host} className="cafe-npc-runtime" />
      </span>
    </span>
  );
}
