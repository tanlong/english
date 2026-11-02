"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ContentDraft } from "./governance";
const LibraryContext = createContext<{ lessons: ContentDraft[]; loading: boolean; error: string }>({
  lessons: [],
  loading: true,
  error: "",
});
export function ContentLibrary({ children }: { children: ReactNode }) {
  const [lessons, setLessons] = useState<ContentDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/lessons", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setLessons(data.lessons);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  return <LibraryContext value={{ lessons, loading, error }}>{children}</LibraryContext>;
}
export const useContentLibrary = () => useContext(LibraryContext);
