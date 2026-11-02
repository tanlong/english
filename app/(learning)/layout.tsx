import type { ReactNode } from "react";
import { LearningProvider } from "@/app/learning/provider";
import { AppShell } from "@/app/components/app-shell";
import { ContentLibrary } from "@/app/content/library";

export default function LearningLayout({ children }: { children: ReactNode }) {
  return (
    <LearningProvider>
      <ContentLibrary>
        <AppShell>{children}</AppShell>
      </ContentLibrary>
    </LearningProvider>
  );
}
