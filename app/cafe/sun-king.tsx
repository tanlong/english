"use client";

import Image from "next/image";
import { useState } from "react";
import type { NpcState } from "./content";

export type SunKingAsset = {
  src: string;
  width: number;
  height: number;
  layers: { body: string; head: string };
};

export function SunKing({
  asset,
  state,
  paused,
}: {
  asset: SunKingAsset;
  state: NpcState;
  paused: boolean;
}) {
  const [loaded, setLoaded] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  const ready = loaded.length === 2 && !failed;
  return (
    <span
      className="cafe-npc cafe-sun-king"
      style={{ aspectRatio: `${asset.width} / ${asset.height}` }}
      data-npc-id="sun_king"
      data-state={state}
      data-paused={paused}
      data-renderer={ready ? "layers" : "poster"}
      data-animated={ready}
      aria-hidden="true"
    >
      <span className="sun-king-contact-shadow">
        <i />
        <i />
        <i />
      </span>
      <Image
        src={asset.src}
        width={asset.width}
        height={asset.height}
        unoptimized
        loading="eager"
        alt=""
        draggable={false}
        className="cafe-npc-image sun-king-poster"
        hidden={ready}
      />
      <span className="sun-king-parts" data-ready={ready}>
        {Object.entries(asset.layers).map(([name, src]) => (
          <Image
            key={src}
            src={src}
            width={asset.width}
            height={asset.height}
            unoptimized
            loading="eager"
            alt=""
            draggable={false}
            className={`cafe-npc-image sun-king-${name}`}
            data-layer={name}
            onLoad={() => setLoaded((old) => (old.includes(name) ? old : [...old, name]))}
            onError={() => setFailed(true)}
          />
        ))}
      </span>
      <span className="sun-king-chuckle">Ki ki ki!</span>
    </span>
  );
}
