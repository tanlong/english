"use client";

import { SettingsPanel } from "@/app/components/profile";
import { useLearningStore } from "@/app/learning/provider";

export default function SettingsPage() {
  return <SettingsPanel store={useLearningStore()} />;
}
