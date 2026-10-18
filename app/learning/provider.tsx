"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLearning, type LearningStore } from "./use-learning";

const LearningContext = createContext<(LearningStore & { now: Date | null }) | null>(null);

export function LearningProvider({ children }: { children: ReactNode }) {
  const store = useLearning();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return <LearningContext value={{ ...store, now }}>{children}</LearningContext>;
}

export function useLearningStore() {
  const store = useContext(LearningContext);
  if (!store) throw new Error("useLearningStore must be used inside LearningProvider");
  return store;
}
