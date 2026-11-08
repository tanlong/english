"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

function playThunder(context: AudioContext) {
  const seconds = 3.8;
  const buffer = context.createBuffer(
    1,
    Math.ceil(context.sampleRate * seconds),
    context.sampleRate,
  );
  const samples = buffer.getChannelData(0);
  let rumble = 0;
  for (let index = 0; index < samples.length; index++) {
    const noise = Math.random() * 2 - 1;
    rumble = (rumble + noise * 0.035) / 1.035;
    samples[index] = noise * 0.4 + rumble * 0.6;
  }
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 0.5;
  const gain = context.createGain();
  const now = context.currentTime;
  filter.frequency.setValueAtTime(1200, now);
  filter.frequency.exponentialRampToValueAtTime(180, now + 0.5);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.6);
  gain.gain.linearRampToValueAtTime(0.18, now + 1.2);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  source.connect(filter).connect(gain).connect(context.destination);
  source.onended = () => {
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
  };
  source.start();
  source.stop(now + seconds);
  return source;
}

export function FieldStorm({ paused, reducedMotion }: { paused: boolean; reducedMotion: boolean }) {
  const lightning = useRef<HTMLDivElement>(null);
  const context = useRef<AudioContext | null>(null);
  const source = useRef<AudioBufferSourceNode | null>(null);
  const enabled = useRef(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audioError, setAudioError] = useState("");

  useEffect(() => {
    if (paused) return;
    let next: ReturnType<typeof setTimeout>;
    let sound: ReturnType<typeof setTimeout>;
    let flash: Animation | undefined;
    const strikeDelay = () => 2000 + Math.random() * 2000;
    const strike = () => {
      if (!reducedMotion) {
        lightning.current?.style.setProperty("--strike-x", `${42 + Math.random() * 32}%`);
        flash = lightning.current?.animate(
          [
            { opacity: 0 },
            { opacity: 0.9, offset: 0.1 },
            { opacity: 0.18, offset: 0.3 },
            { opacity: 0 },
          ],
          { duration: 700, easing: "ease-out" },
        );
      }
      sound = setTimeout(() => {
        if (!enabled.current || context.current?.state !== "running") return;
        source.current?.stop();
        source.current = playThunder(context.current);
      }, 1100);
      next = setTimeout(strike, strikeDelay());
    };
    next = setTimeout(strike, strikeDelay());
    return () => {
      clearTimeout(next);
      clearTimeout(sound);
      flash?.cancel();
      source.current?.stop();
      source.current = null;
    };
  }, [paused, reducedMotion]);

  useEffect(
    () => () => {
      source.current?.stop();
      const audio = context.current;
      context.current = null;
      if (audio && audio.state !== "closed") void audio.close().catch(() => {});
    },
    [],
  );

  async function toggleSound() {
    setAudioError("");
    if (enabled.current) {
      enabled.current = false;
      setSoundEnabled(false);
      source.current?.stop();
      source.current = null;
      return;
    }
    try {
      const audio = context.current ?? new AudioContext();
      context.current = audio;
      await audio.resume();
      if (context.current !== audio) return;
      enabled.current = true;
      setSoundEnabled(true);
    } catch {
      setAudioError("Chưa bật được tiếng sấm trên thiết bị này. Bạn có thể thử lại.");
    }
  }

  return (
    <>
      <div ref={lightning} className="cafe-field-lightning" aria-hidden="true">
        <span className="cafe-lightning-wash" />
        <span className="cafe-lightning-bolt" />
        <span className="cafe-lightning-branch" />
      </div>
      <button
        type="button"
        className="cafe-storm-audio"
        aria-pressed={soundEnabled}
        aria-label={soundEnabled ? "Tắt tiếng sấm" : "Bật tiếng sấm"}
        onClick={() => void toggleSound()}
      >
        {soundEnabled ? (
          <Volume2 size={17} aria-hidden="true" />
        ) : (
          <VolumeX size={17} aria-hidden="true" />
        )}
        <span>Tiếng sấm</span>
      </button>
      {audioError && (
        <p className="cafe-storm-message" role="status">
          {audioError}
        </p>
      )}
    </>
  );
}
