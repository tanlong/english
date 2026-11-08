"use client";
import { useEffect, useRef, type RefObject } from "react";
import type { LearningStore } from "./use-learning";
import { dateKey } from "./progress";
// Activity duration is an estimate: visible time with interaction in the last 30 seconds.
export function useActivityClock(
  store: LearningStore,
  key: string,
  revision: number,
  listening: boolean,
  speaking: boolean,
  stopped: boolean,
  lastInteraction: RefObject<number>,
) {
  const latest = useRef({ store, listening, speaking, stopped });
  useEffect(() => {
    latest.current = { store, listening, speaking, stopped };
  });
  useEffect(() => {
    let previousTick = performance.now();
    const interact = () => {
      lastInteraction.current = performance.now();
    };
    document.addEventListener("pointerdown", interact);
    document.addEventListener("keydown", interact);
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = Math.min(2, (now - previousTick) / 1000);
      previousTick = now;
      const active = latest.current;
      if (
        active.stopped ||
        document.visibilityState !== "visible" ||
        (!active.listening &&
          !active.speaking &&
          (!lastInteraction.current || now - lastInteraction.current > 30_000))
      )
        return;
      const skill = active.listening
        ? "listening"
        : active.speaking
          ? "speaking"
          : document.activeElement?.id === "natural-answer"
            ? "writing"
            : "reading";
      const at = new Date();
      active.store.setState((old) => {
        const visit = old.lessonVisits?.[key];
        return {
          ...old,
          dailySeconds: {
            ...old.dailySeconds,
            [dateKey(at)]: (old.dailySeconds[dateKey(at)] ?? 0) + delta,
          },
          lessonVisits: {
            ...old.lessonVisits,
            [key]: {
              revision,
              index: visit?.index ?? 0,
              answers: visit?.answers ?? {},
              ...visit,
              cancelledAt: undefined,
              updatedAt: visit?.cancelledAt
                ? at.toISOString()
                : (visit?.updatedAt ?? at.toISOString()),
              activitySeconds: {
                ...visit?.activitySeconds,
                [skill]: (visit?.activitySeconds?.[skill] ?? 0) + delta,
              },
            },
          },
        };
      });
    }, 1000);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("pointerdown", interact);
      document.removeEventListener("keydown", interact);
    };
  }, [key, revision, lastInteraction]);
}
