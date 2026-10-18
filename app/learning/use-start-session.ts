"use client";

import { useRouter } from "next/navigation";
import { useLearningStore } from "./provider";

export function useStartSession() {
  const store = useLearningStore();
  const router = useRouter();
  return (week?: number, day?: number) => {
    const key = store.openSession(week, day);
    if (key) router.push(`/session/${encodeURIComponent(key)}`);
  };
}
