"use client";

import { Roadmap } from "@/app/components/course-explorer";
import { useLearningStore } from "@/app/learning/provider";
import { useStartSession } from "@/app/learning/use-start-session";

export default function RoadmapPage() {
  const store = useLearningStore();
  const start = useStartSession();
  return <Roadmap store={store} onStart={start} />;
}
