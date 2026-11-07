"use client";
import Image from "next/image";
import { useState, type CSSProperties } from "react";
import assets from "./npc-assets.json";
import type { NpcId, NpcState } from "./content";
import { NpcRig } from "./npc-rig";

type NpcAsset = {
  src: string;
  width: number;
  height: number;
  atlas?: string;
  atlasWidth?: number;
  atlasHeight?: number;
  rig?: string;
  seated?: { src: string; width: number; height: number };
};

export function Npc({
  id,
  state = "idle",
  seated = false,
  paused = false,
}: {
  id: NpcId;
  state?: NpcState;
  seated?: boolean;
  paused?: boolean;
}) {
  const asset = assets[id] as NpcAsset;
  const [fallback, setFallback] = useState(false);
  const index = Object.keys(assets).indexOf(id);
  if (asset.rig)
    return (
      <NpcRig
        key={asset.rig}
        id={id}
        state={state}
        paused={paused}
        asset={{ ...asset, rig: asset.rig }}
      />
    );
  // NPCs without a 3×3 sprite sheet use a single transparent pose.
  const seatedAsset = seated && !fallback ? asset.seated : undefined;
  const pose = seatedAsset ?? asset;
  const animated = !seatedAsset && Boolean(asset.atlas) && !fallback;
  return (
    <span
      aria-hidden="true"
      className={`cafe-npc ${seatedAsset ? "cafe-npc-seated" : animated ? "cafe-npc-sprite" : "cafe-npc-photo"} npc-${id}`}
      data-npc-id={id}
      data-state={state}
      data-animated={animated || Boolean(seatedAsset)}
      style={{ "--npc-phase": `${index * -0.83}s` } as CSSProperties}
    >
      <span className="cafe-npc-viewport">
        <Image
          src={animated ? asset.atlas! : pose.src}
          width={animated ? (asset.atlasWidth ?? asset.width) : pose.width}
          height={animated ? (asset.atlasHeight ?? asset.height) : pose.height}
          unoptimized={animated || Boolean(seatedAsset)}
          sizes="(max-width: 767px) 128px, 320px"
          loading="eager"
          alt=""
          draggable={false}
          className={`cafe-npc-image ${animated ? "cafe-npc-sheet" : ""}`}
          onError={() => setFallback(true)}
        />
      </span>
    </span>
  );
}
