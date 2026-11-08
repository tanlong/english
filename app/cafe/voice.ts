"use client";

import { useEffect, useRef, useState } from "react";
import type { Level, NpcId } from "./content";
import { roleNpcs } from "./role-npcs";

const baseProfiles = {
  cloud_daisy: { names: ["samantha", "jenny", "zira"], pitch: 1.08, pace: 0.96 },
  ollie_owl: { names: ["grandpa", "alex", "david"], pitch: 0.94, pace: 0.9 },
  mimi_bunny: { names: ["sandy", "victoria", "aria"], pitch: 1.18, pace: 1.02 },
  astro_bean: { names: ["eddy", "guy", "evan"], pitch: 1.02, pace: 0.98 },
  bear_explorer: { names: ["rocko", "aaron", "tom"], pitch: 0.84, pace: 0.92 },
  gray_boo: { names: ["flo", "allison", "michelle"], pitch: 1.12, pace: 0.94 },
  mr_pink: { names: ["reed", "andrew", "mark"], pitch: 1, pace: 0.95 },
  nina_cat: { names: ["kathy", "jenny"], pitch: 1.08, pace: 0.95 },
  ben_bear: { names: ["fred", "david"], pitch: 0.9, pace: 0.91 },
  luna_deer: { names: ["shelley", "jane"], pitch: 1.04, pace: 0.9 },
  penny_panda: { names: ["susan", "sara"], pitch: 1.02, pace: 0.93 },
  rio_fox: { names: ["ralph", "tony"], pitch: 1, pace: 0.98 },
  toby_corgi: { names: ["bruce", "jason"], pitch: 0.98, pace: 0.95 },
  alex_otter: { names: ["junior", "christopher"], pitch: 1, pace: 0.95 },
  morgan_wolf: { names: ["daniel", "eric"], pitch: 0.88, pace: 0.9 },
  bailey_beaver: { names: ["arthur", "roger"], pitch: 0.93, pace: 0.9 },
  ivy_cat: { names: ["nicky", "emma"], pitch: 1.08, pace: 0.96 },
  dex_robot: { names: ["oliver", "steffan"], pitch: 0.96, pace: 0.92 },
  tess_turtle: { names: ["princess", "nancy"], pitch: 1, pace: 0.88 },
  sun_king: { names: ["nathan", "joseph", "tom"], pitch: 0.92, pace: 0.95 },
};
const profiles: Record<string, { names: string[]; pitch: number; pace: number }> = {
  ...baseProfiles,
  ...Object.fromEntries(
    roleNpcs.map((npc) => [
      npc.id,
      {
        names: [],
        pitch: 1,
        pace: npc.role === "guide" ? 0.9 : 0.96,
      },
    ]),
  ),
};
const levelPace = { A1: 0.88, A2: 0.96, B1: 1 };

async function playNpcAudio(
  npcId: NpcId,
  sessionId: string | undefined,
  text: string,
  signal: AbortSignal,
  rate: number,
  onPlaying: () => void,
) {
  const path = sessionId
    ? `/api/cafe/conversations/${sessionId}/speech`
    : `/api/cafe/npcs/${npcId}/speech`;
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("Chưa phát được giọng AI.");
  const blob = await response.blob();
  if (signal.aborted) return;
  if (!blob.size || !blob.type.startsWith("audio/"))
    throw new Error("Âm thanh nhân vật chưa hợp lệ.");
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.playbackRate = rate;
  audio.preservesPitch = true;
  let cancel = () => {};
  try {
    await new Promise<void>((resolve, reject) => {
      cancel = () => {
        audio.pause();
        reject(new DOMException("Đã dừng giọng nhân vật.", "AbortError"));
      };
      signal.addEventListener("abort", cancel, { once: true });
      audio.onplaying = onPlaying;
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("Chưa phát được âm thanh nhân vật."));
      if (signal.aborted) cancel();
      else void audio.play().catch(reject);
    });
  } finally {
    signal.removeEventListener("abort", cancel);
    audio.onplaying = null;
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    URL.revokeObjectURL(url);
  }
}

function chooseVoice(npcId: NpcId, available: SpeechSynthesisVoice[]) {
  const voices = [
    ...new Map(
      available
        .filter((voice) => /^en[-_]US(?:[-_]|$)/i.test(voice.lang))
        // Musical/effect voices are unsuitable for pronunciation practice.
        .filter(
          (voice) =>
            !/^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox)$/i.test(
              voice.name,
            ),
        )
        .map((voice) => [voice.voiceURI || voice.name, voice]),
    ).values(),
  ].sort(
    (a, b) => a.name.localeCompare(b.name, "en") || a.voiceURI.localeCompare(b.voiceURI, "en"),
  );
  if (!voices.length) return undefined;
  const assigned = new Map<NpcId, SpeechSynthesisVoice>();
  const used = new Set<SpeechSynthesisVoice>();
  const entries = Object.entries(profiles) as [NpcId, (typeof profiles)[NpcId]][];
  // Reserve preferred voices first so another NPC's fallback cannot take them.
  for (const [id, profile] of entries) {
    const voice = profile.names
      .map((name) =>
        voices.find((item) => !used.has(item) && item.name.toLowerCase().includes(name)),
      )
      .find(Boolean);
    if (voice) {
      assigned.set(id, voice);
      used.add(voice);
    }
  }
  for (const [index, [id]] of entries.entries()) {
    if (assigned.has(id)) continue;
    const voice = voices.find((item) => !used.has(item)) ?? voices[index % voices.length];
    if (voice) {
      assigned.set(id, voice);
      used.add(voice);
    }
  }
  return assigned.get(npcId);
}

async function availableVoices(synthesis: SpeechSynthesis, signal: AbortSignal) {
  const voices = synthesis.getVoices();
  if (voices.some((voice) => /^en[-_]US(?:[-_]|$)/i.test(voice.lang))) return voices;
  await new Promise<void>((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      synthesis.removeEventListener("voiceschanged", changed);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const changed = () => {
      if (synthesis.getVoices().some((voice) => /^en[-_]US(?:[-_]|$)/i.test(voice.lang))) finish();
    };
    const timer = setTimeout(finish, 1500);
    synthesis.addEventListener("voiceschanged", changed);
    signal.addEventListener("abort", finish, { once: true });
    changed();
  });
  return synthesis.getVoices();
}

export function useNpcSpeech(
  npcId: NpcId,
  level: Level,
  onSpeaking: (speaking: boolean) => void,
  sessionId?: string,
) {
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const request = useRef<AbortController | null>(null);
  const notify = useRef(onSpeaking);
  const selectedVoice = useRef<SpeechSynthesisVoice | undefined>(undefined);
  useEffect(() => {
    notify.current = onSpeaking;
  });
  useEffect(() => () => request.current?.abort(), []);

  function stop() {
    request.current?.abort();
    request.current = null;
    notify.current(false);
  }
  async function speak(text: string) {
    stop();
    const controller = new AbortController();
    request.current = controller;
    setError("");
    setNotice("");
    try {
      try {
        setNotice("Đang chuẩn bị giọng AI…");
        await playNpcAudio(npcId, sessionId, text, controller.signal, levelPace[level], () => {
          if (!controller.signal.aborted) {
            setNotice("");
            notify.current(true);
          }
        });
        if (controller.signal.aborted) return;
        request.current = null;
        notify.current(false);
        return;
      } catch {
        if (controller.signal.aborted) return;
        notify.current(false);
        setNotice("Giọng AI chưa sẵn sàng; đang thử giọng thiết bị.");
      }
      if (!("speechSynthesis" in window))
        throw new Error("Thiết bị chưa hỗ trợ đọc câu. Bạn vẫn có thể luyện bằng chữ.");
      const synthesis = window.speechSynthesis;
      const voices = await availableVoices(synthesis, controller.signal);
      if (controller.signal.aborted) return;
      selectedVoice.current ??= chooseVoice(npcId, voices);
      if (!selectedVoice.current)
        throw new Error(
          "Thiết bị chưa có giọng tiếng Anh-Mỹ. Hãy thêm giọng en-US trong cài đặt giọng nói; bạn vẫn có thể đọc câu chữ.",
        );
      const profile = profiles[npcId];
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.voice = selectedVoice.current;
      utterance.pitch = profile.pitch;
      utterance.rate = profile.pace * levelPace[level];
      const cancel = () => {
        utterance.onstart = null;
        utterance.onend = null;
        utterance.onerror = null;
        synthesis.cancel();
      };
      controller.signal.addEventListener("abort", cancel, { once: true });
      const finish = () => {
        controller.signal.removeEventListener("abort", cancel);
        if (request.current !== controller) return;
        request.current = null;
        notify.current(false);
      };
      utterance.onstart = () => {
        if (!controller.signal.aborted) {
          setNotice("Giọng AI chưa sẵn sàng; đang dùng giọng thiết bị.");
          notify.current(true);
        }
      };
      utterance.onend = finish;
      utterance.onerror = (event) => {
        if (controller.signal.aborted || request.current !== controller) return;
        finish();
        if (!["canceled", "interrupted"].includes(event.error))
          setError("Chưa phát được giọng đọc trên thiết bị. Hãy thử lại.");
      };
      synthesis.cancel();
      if (synthesis.paused) synthesis.resume();
      synthesis.speak(utterance);
    } catch (e) {
      if (controller.signal.aborted) return;
      request.current = null;
      notify.current(false);
      setError(e instanceof Error ? e.message : "Chưa phát được giọng đọc trên thiết bị.");
    }
  }
  return { speak, stop, error, notice };
}
