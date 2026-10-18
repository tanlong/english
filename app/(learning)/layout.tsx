import type { ReactNode } from "react";
import { LearningProvider } from "@/app/learning/provider";
import { AppShell } from "@/app/components/app-shell";

export default function LearningLayout({ children }: { children: ReactNode }) {
  return (
    <LearningProvider>
      <AppShell>{children}</AppShell>
    </LearningProvider>
  );
}
