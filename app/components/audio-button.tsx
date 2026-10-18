"use client";
import { useEffect, useState } from "react";
import { Button, type ButtonProps } from "./ui/button";
import { LoaderCircle, Square, Volume2 } from "lucide-react";
import { playTts, stopAudio } from "../audio/client";
import type { TtsRequest } from "../audio/client";
export function AudioButton({
  text,
  speed = 1,
  voice = "nova",
  locale = "en-US",
  label = "Nghe hội thoại",
  onPlayed,
  className = "",
  variant = "default",
  disabled = false,
  iconOnly = false,
}: {
  text: string;
  speed?: number;
  voice?: TtsRequest["voice"];
  locale?: TtsRequest["locale"];
  label?: string;
  onPlayed?: () => void;
  className?: string;
  variant?: ButtonProps["variant"];
  disabled?: boolean;
  iconOnly?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => () => stopAudio(), [text]);
  return (
    <div className="audio-button-wrap">
      <Button
        variant={variant}
        size={iconOnly ? "icon" : undefined}
        type="button"
        disabled={disabled}
        className={className}
        aria-busy={playing}
        aria-label={iconOnly ? (playing ? "Dừng âm thanh" : label) : undefined}
        title={iconOnly ? (playing ? "Dừng âm thanh" : label) : undefined}
        onClick={async () => {
          if (playing) {
            stopAudio();
            setPlaying(false);
            return;
          }
          setPlaying(true);
          setError("");
          try {
            await playTts({ spokenText: text, speed, voice, locale });
            onPlayed?.();
          } catch (e) {
            const message = e instanceof Error ? e.message : "Không thể phát âm thanh.";
            if (message !== "Đã dừng âm thanh.") setError(message);
          } finally {
            setPlaying(false);
          }
        }}
      >
        {playing && iconOnly ? (
          <Square aria-hidden="true" size={18} />
        ) : (
          <Volume2 aria-hidden="true" size={18} />
        )}
        {!iconOnly && (playing ? "Dừng âm thanh" : label)}
        {playing && !iconOnly && <LoaderCircle aria-hidden="true" size={16} className="spin" />}
      </Button>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
