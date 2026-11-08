import { expect, test, type Page } from "@playwright/test";
import { startCafeConversation } from "./cafe-vocabulary-fixture";

declare global {
  interface Window {
    __grayAudio: { played: number; paused: number; rate: number };
  }
}

async function mockAudio(page: Page) {
  await page.addInitScript(() => {
    window.__grayAudio = { played: 0, paused: 0, rate: 0 };
    Object.defineProperty(window, "Audio", {
      configurable: true,
      value: class {
        playbackRate = 1;
        onplaying?: () => void;
        onended?: () => void;
        onerror?: () => void;
        play() {
          window.__grayAudio.played++;
          window.__grayAudio.rate = this.playbackRate;
          this.onplaying?.();
          return Promise.resolve();
        }
        pause() {
          window.__grayAudio.paused++;
        }
      },
    });
  });
}

async function openGray(page: Page) {
  await mockAudio(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
  await page.goto("/english/cafe");
  await page.getByRole("button", { name: "Đến đồi chè", exact: true }).click();
  await page.getByRole("button", { name: "Đến hồ thông", exact: true }).click();
  await page.getByRole("button", { name: "Trò chuyện với Gray Boo", exact: true }).click();
  await startCafeConversation(page);
}

test("Gray Boo plays its AI audio after a click and closing the modal stops playback", async ({
  page,
}) => {
  const spoken: { text: string }[] = [];
  await page.route("**/api/cafe/conversations/*/speech", (route) => {
    spoken.push(route.request().postDataJSON());
    return route.fulfill({ contentType: "audio/mpeg", body: Buffer.from("ID3mock") });
  });
  await openGray(page);
  expect(spoken).toEqual([]);
  await page.getByRole("button", { name: "Nghe câu", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__grayAudio.played)).toBe(1);
  expect(spoken).toHaveLength(1);
  expect(spoken[0].text).toBeTruthy();
  expect(await page.evaluate(() => window.__grayAudio.rate)).toBe(0.88);
  await expect(page.getByRole("dialog")).toContainText("Giọng nói AI · Gemini · Anh-Mỹ");
  const pauses = await page.evaluate(() => window.__grayAudio.paused);
  await page.getByRole("button", { name: "Đóng trò chuyện", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__grayAudio.paused)).toBeGreaterThan(pauses);
});

test("vocabulary and Mr. Pink use Gemini audio before a conversation exists", async ({ page }) => {
  await mockAudio(page);
  const requests: { path: string; text: string }[] = [];
  await page.route("**/api/cafe/npcs/*/speech", (route) => {
    requests.push({
      path: new URL(route.request().url()).pathname,
      text: route.request().postDataJSON().text,
    });
    return route.fulfill({ contentType: "audio/wav", body: Buffer.from("RIFFmock") });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
  await page.goto("/english/cafe");
  await page.getByRole("button", { name: "Trò chuyện với Cloud Cat", exact: true }).click();
  await page.getByRole("button", { name: "Nghe từ và câu: order", exact: true }).click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0]).toEqual({
    path: "/api/cafe/npcs/cloud_daisy/speech",
    text: "order. I'd like to order a coffee, please.",
  });
  await expect.poll(() => page.evaluate(() => window.__grayAudio.played)).toBe(1);
  await page.getByRole("button", { name: "Đóng trò chuyện", exact: true }).click();
  await page.getByRole("button", { name: "Học cùng Mr. Pink", exact: true }).click();
  await page.getByRole("button", { name: "Nghe Mr. Pink", exact: true }).click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[1].path).toBe("/api/cafe/npcs/mr_pink/speech");
  await expect.poll(() => page.evaluate(() => window.__grayAudio.played)).toBe(2);
  const pauses = await page.evaluate(() => window.__grayAudio.paused);
  await page.getByRole("button", { name: "Đóng hướng dẫn", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__grayAudio.paused)).toBeGreaterThan(pauses);
});

test("Gray Boo clearly falls back to its device voice when AI speech is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const voice = { name: "Flo", lang: "en-US", voiceURI: "flo" };
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: Object.assign(new EventTarget(), {
        getVoices: () => [voice],
        cancel: () => {},
        speak: (utterance: { onstart?: () => void }) => {
          document.documentElement.dataset.grayDeviceSpoke = "true";
          utterance.onstart?.();
        },
      }),
    });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: class {
        constructor(public text: string) {}
      },
    });
  });
  await page.route("**/api/cafe/conversations/*/speech", (route) =>
    route.fulfill({
      status: 503,
      json: { error: "Giọng AI chưa sẵn sàng." },
    }),
  );
  await openGray(page);
  await page.getByRole("button", { name: "Nghe câu", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("đang dùng giọng thiết bị");
  await expect(page.locator("html")).toHaveAttribute("data-gray-device-spoke", "true");
  expect(await page.evaluate(() => window.__grayAudio.played)).toBe(0);
});
