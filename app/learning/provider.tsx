"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { useLearning, type LearningStore } from "./use-learning";

const LearningContext = createContext<(LearningStore & { now: Date | null }) | null>(null);
const currentMinute = () => Math.floor(Date.now() / 60_000) * 60_000;
const serverMinute = () => null;
function subscribeToClock(onChange: () => void) {
  const timer = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(timer);
}

export function LearningProvider({ children }: { children: ReactNode }) {
  const store = useLearning();
  const minute = useSyncExternalStore(subscribeToClock, currentMinute, serverMinute);
  const now = minute === null ? null : new Date(minute);
  return <LearningContext value={{ ...store, now }}>{children}</LearningContext>;
}

export function useLearningStore() {
  const store = useContext(LearningContext);
  if (!store) throw new Error("useLearningStore must be used inside LearningProvider");
  return store;
}
