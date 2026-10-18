export type TtsRequest = {
  spokenText: string;
  speed?: number;
  voice?: "nova" | "alloy" | "cedar";
  locale?: "en-US" | "en-GB";
};
let activeController: AbortController | null = null;
let activeAudio: HTMLAudioElement | null = null;
let activeUrl: string | null = null;
let activeReject: ((reason: Error) => void) | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
export function stopAudio() {
  activeController?.abort();
  activeController = null;
  activeReject?.(new Error("Đã dừng âm thanh."));
  activeReject = null;
  if (activeUtterance) {
    activeUtterance.onend = null;
    activeUtterance.onerror = null;
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
  if (activeAudio) {
    activeAudio.onended = null;
    activeAudio.onerror = null;
    activeAudio.pause();
    activeAudio = null;
  }
  if (activeUrl) URL.revokeObjectURL(activeUrl);
  activeUrl = null;
}
export async function playTts({
  spokenText,
  speed = 1,
  voice = "nova",
  locale = "en-US",
}: TtsRequest): Promise<void> {
  stopAudio();
  const controller = new AbortController();
  activeController = controller;
  try {
    if (locale === "en-GB") {
      if (!("speechSynthesis" in window))
        throw new Error("Thiết bị chưa hỗ trợ giọng đọc Anh-Anh.");
      const synthesis = window.speechSynthesis;
      if (!synthesis.getVoices().length) {
        await new Promise<void>((resolve) => {
          const finish = () => {
            clearTimeout(timer);
            synthesis.removeEventListener("voiceschanged", finish);
            controller.signal.removeEventListener("abort", finish);
            resolve();
          };
          const timer = setTimeout(finish, 1500);
          synthesis.addEventListener("voiceschanged", finish);
          controller.signal.addEventListener("abort", finish, { once: true });
        });
      }
      if (controller.signal.aborted) throw new Error("Đã dừng âm thanh.");
      const deviceVoice = synthesis.getVoices().find((v) => /^en[-_]GB(?:[-_]|$)/i.test(v.lang));
      if (!deviceVoice)
        throw new Error(
          "Thiết bị chưa có giọng en-GB. Hãy cài giọng Anh-Anh trong cài đặt giọng nói của thiết bị.",
        );
      const utterance = new SpeechSynthesisUtterance(spokenText);
      activeUtterance = utterance;
      utterance.lang = locale;
      utterance.voice = deviceVoice;
      utterance.rate = Math.max(0.5, Math.min(1.5, speed));
      await new Promise<void>((resolve, reject) => {
        activeReject = reject;
        utterance.onend = () => resolve();
        utterance.onerror = () =>
          reject(new Error("Không phát được giọng Anh-Anh. Vui lòng thử lại."));
        synthesis.speak(utterance);
      });
      return;
    }
    const response = await fetch(voice === "cedar" ? "/api/daily-speaking/speech" : "/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(voice === "cedar" ? { input: spokenText } : { spokenText, voice }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error ?? "Không tải được giọng đọc Anh-Mỹ.");
    }
    const blob = await response.blob();
    if (!blob.size) throw new Error("Âm thanh trả về rỗng.");
    if (controller.signal.aborted) throw new Error("Đã dừng âm thanh.");
    activeUrl = URL.createObjectURL(blob);
    const audio = new Audio(activeUrl);
    activeAudio = audio;
    audio.playbackRate = Math.max(0.5, Math.min(1.5, speed));
    await new Promise<void>((resolve, reject) => {
      activeReject = reject;
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("Không phát được âm thanh. Vui lòng thử lại."));
      audio.play().catch(reject);
    });
  } catch (error) {
    if (controller.signal.aborted) throw new Error("Đã dừng âm thanh.");
    throw error;
  } finally {
    if (activeController === controller) {
      activeReject = null;
      stopAudio();
    }
  }
}
