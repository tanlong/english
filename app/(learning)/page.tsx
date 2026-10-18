"use client";

import { Dashboard } from "@/app/components/dashboard";
import { useLearningStore } from "@/app/learning/provider";
import { useStartSession } from "@/app/learning/use-start-session";

export default function TodayPage() {
  const store = useLearningStore();
  const start = useStartSession();
  return <Dashboard store={store} now={store.now} onStart={start} />;
}
