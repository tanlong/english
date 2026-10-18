"use client";
import { useRouter } from "next/navigation";
import { useLearningStore } from "@/app/learning/provider";
import { SessionPlayer } from "./session-player";
export function SessionScreen({ sessionId }: { sessionId: string }) {
  const store = useLearningStore();
  const router = useRouter();
  return <SessionPlayer store={store} sessionId={sessionId} onExit={() => router.push("/")} />;
}
