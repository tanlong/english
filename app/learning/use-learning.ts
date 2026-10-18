"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { mergeLearningState, type Personalization } from "./personalization";
import {
  emptyState,
  parseState,
  STORAGE_KEY,
  type LearningState,
  type StudySession,
  type Profile,
  openLesson,
} from "./progress";
export function useLearning() {
  const [state, setState] = useState<LearningState>(emptyState);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [recoveryData, setRecoveryData] = useState<string | null>(null);
  const [personalization, setPersonalization] = useState<Personalization | null>(null);
  const [syncError, setSyncError] = useState("");
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [reviewId, setReviewId] = useState("");
  const latestState = useRef(state);
  latestState.current = state;
  const lastSaved = useRef("");
  const lastQueuedContent = useRef("");
  const resetting = useRef(false);
  const syncRequest = useRef<AbortController | null>(null);
  const syncPromise = useRef<Promise<void> | null>(null);
  const generation = useRef(0);
  const refreshPersonalization = useCallback(async () => {
    const currentGeneration = generation.current;
    const response = await fetch("/api/learning", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Chưa kết nối được hồ sơ học tập.");
    if (resetting.current || currentGeneration !== generation.current) return;
    setPersonalization(data.personalization);
    setConnected(true);
    setSyncError("");
    return data;
  }, []);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setRecoveryData(localStorage.getItem(`${STORAGE_KEY}:recovery`));
      if (raw) {
        let supported = false;
        try {
          supported = JSON.parse(raw)?.version === 2;
        } catch {
          /* Preserve malformed data before opening a fresh session. */
        }
        if (!supported) {
          localStorage.setItem(`${STORAGE_KEY}:recovery`, raw);
          setRecoveryData(raw);
          setStorageError(
            "Dữ liệu cũ chưa đọc được. Đã giữ bản sao gốc; bạn có thể tải trong Cài đặt.",
          );
        }
      }
      setState(parseState(raw));
    } catch {
      setStorageError(
        "Trình duyệt không cho phép lưu. Tiến độ chỉ được giữ trong phiên này; hãy xuất bản sao trước khi đóng.",
      );
    }
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setState(parseState(event.newValue));
        window.dispatchEvent(new Event("learning-external-update"));
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    let active = true;
    void refreshPersonalization()
      .then((data) => {
        if (active && data && !resetting.current)
          setState((current) =>
            current.profile
              ? mergeLearningState(parseState(JSON.stringify(data.state)), current)
              : parseState(JSON.stringify(data.state)),
          );
      })
      .catch((error) => {
        if (active) setSyncError(error.message);
      });
    const refresh = () => {
      void refreshPersonalization().catch((error) => setSyncError(error.message));
    };
    window.addEventListener("learning-personalization-updated", refresh);
    window.addEventListener("online", refresh);
    return () => {
      active = false;
      window.removeEventListener("learning-personalization-updated", refresh);
      window.removeEventListener("online", refresh);
      syncRequest.current?.abort();
    };
  }, [refreshPersonalization]);

  const syncLearning = useCallback(async function persist() {
    if (syncPromise.current) {
      await syncPromise.current;
      return persist();
    }
    if (!latestState.current.profile || resetting.current) return;
    const snapshot = JSON.stringify(latestState.current);
    if (snapshot === lastSaved.current) return;
    const controller = new AbortController();
    syncRequest.current = controller;
    setSyncing(true);
    const currentGeneration = generation.current;
    const work = (async () => {
      try {
        const response = await fetch("/api/learning", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "sync", state: latestState.current }),
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Chưa lưu được tiến độ vào database.");
        if (!resetting.current && currentGeneration === generation.current) {
          lastSaved.current = snapshot;
          setPersonalization(data.personalization);
          setSyncError("");
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setSyncError(error instanceof Error ? error.message : "Chưa lưu được tiến độ.");
      } finally {
        if (syncRequest.current === controller) syncRequest.current = null;
        setSyncing(false);
      }
    })();
    syncPromise.current = work;
    try {
      await work;
    } finally {
      if (syncPromise.current === work) syncPromise.current = null;
    }
  }, []);
  useEffect(() => {
    if (!ready || !connected) return;
    const content = JSON.stringify(state, (key, value) =>
      key === "seconds" || key === "dailySeconds" ? undefined : value,
    );
    if (content === lastQueuedContent.current) return;
    const timer = window.setTimeout(() => {
      lastQueuedContent.current = content;
      void syncLearning();
    }, 750);
    return () => window.clearTimeout(timer);
  }, [state, ready, connected, syncLearning]);
  useEffect(() => {
    if (!connected) return;
    const timer = window.setInterval(() => void syncLearning(), 15_000);
    return () => window.clearInterval(timer);
  }, [connected, syncLearning]);

  async function personalize(action: string, fields: Record<string, string> = {}) {
    if (!connected) await refreshPersonalization();
    await syncLearning();
    const response = await fetch("/api/learning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...fields }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Chưa cập nhật được cá nhân hoá.");
    setPersonalization(data.personalization);
    setSyncError("");
  }
  async function resetLearning() {
    generation.current++;
    resetting.current = true;
    syncRequest.current?.abort();
    try {
      const response = await fetch("/api/learning", { method: "DELETE" });
      if (!response.ok) throw new Error("Chưa xóa được dữ liệu trên máy chủ. Hãy thử lại.");
      setState(emptyState());
      latestState.current = emptyState();
      lastSaved.current = "";
      lastQueuedContent.current = "";
      setPersonalization(null);
      setConnected(false);
      setSyncError("");
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Chưa xóa được dữ liệu.");
      throw error;
    } finally {
      resetting.current = false;
    }
  }
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      setStorageError(
        "Không lưu được tiến độ trên thiết bị. Hãy xuất bản sao trong Cài đặt trước khi đóng ứng dụng.",
      );
    }
  }, [state, ready]);
  function updateSession(key: string, update: (session: StudySession) => StudySession) {
    setState((old) =>
      old.sessions[key]
        ? {
            ...old,
            sessions: { ...old.sessions, [key]: update(old.sessions[key]) },
          }
        : old,
    );
  }
  function openSession(week = state.activeWeek, day = state.activeDay) {
    const role = state.profile?.role ?? "general";
    const result = openLesson(state, week, day, role);
    if (result.key) setState(result.state);
    return result.key;
  }
  function saveProfile(profile: Profile) {
    setState((old) => ({ ...old, profile }));
    if (!connected) void refreshPersonalization().catch((error) => setSyncError(error.message));
  }
  return {
    state,
    setState,
    ready,
    storageError,
    recoveryData,
    personalization,
    reviewId,
    setReviewId,
    syncError,
    syncing,
    refreshPersonalization,
    syncLearning,
    personalize,
    resetLearning,
    updateSession,
    openSession,
    saveProfile,
  };
}
export type LearningStore = ReturnType<typeof useLearning>;
