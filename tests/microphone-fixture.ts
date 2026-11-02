import type { Page } from "@playwright/test";

type MicrophoneFixture = {
  lang: string;
  continuous: boolean;
  starts: number;
  aborted: boolean;
  onresult: (event: unknown) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
};

declare global {
  interface Window {
    __mic: MicrophoneFixture;
    __debateMic: MicrophoneFixture;
  }
}

export async function mockMicrophone(page: Page, slot: "__mic" | "__debateMic") {
  await page.addInitScript((name) => {
    Object.defineProperty(window, "SpeechRecognition", {
      value: class implements MicrophoneFixture {
        lang = "";
        continuous = false;
        starts = 0;
        aborted = false;
        onresult: MicrophoneFixture["onresult"] = () => {};
        onerror: MicrophoneFixture["onerror"] = () => {};
        onend = () => {};
        constructor() {
          window[name] = this;
        }
        start() {
          this.starts++;
        }
        stop() {
          this.onend?.();
        }
        abort() {
          this.aborted = true;
        }
      },
    });
  }, slot);
}
