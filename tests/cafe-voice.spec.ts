import { expect, test, type Page } from "@playwright/test";
import { startCafeConversation } from "./cafe-vocabulary-fixture";

type Spoken = { text: string; voice: string; lang: string; pitch: number; rate: number };
declare global {
  interface Window {
    __npcSpeech: {
      spoken: Spoken[];
      voices: { name: string; lang: string; voiceURI: string }[];
      finish: () => void;
    };
  }
}

async function mockSpeech(page: Page) {
  await page.route("**/api/cafe/**/speech", (route) =>
    route.fulfill({ status: 503, json: { error: "AI unavailable" } }),
  );
  await page.addInitScript(() => {
    const voices = ["Samantha", "Grandpa", "Sandy", "Eddy", "Rocko", "Flo", "Reed"].map((name) => ({
      name,
      lang: "en-US",
      voiceURI: name,
    }));
    let current: { onend?: () => void } | undefined;
    window.__npcSpeech = { spoken: [], voices, finish: () => current?.onend?.() };
    const synthesis = Object.assign(new EventTarget(), {
      getVoices: () => window.__npcSpeech.voices,
      cancel: () => {
        current = undefined;
      },
      speak: (
        utterance: Omit<Spoken, "voice"> & {
          voice: { name: string } | null;
          onstart?: () => void;
          onend?: () => void;
        },
      ) => {
        current = utterance;
        window.__npcSpeech.spoken.push({
          text: utterance.text,
          voice: utterance.voice?.name ?? "default",
          lang: utterance.lang,
          pitch: utterance.pitch,
          rate: utterance.rate,
        });
        utterance.onstart?.();
      },
    });
    Object.defineProperty(synthesis, "speaking", { get: () => !!current });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: synthesis,
    });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: class {
        lang = "";
        pitch = 1;
        rate = 1;
        voice = null;
        text: string;
        constructor(text: string) {
          this.text = text;
        }
      },
    });
  });
}

test("NPC device fallbacks keep distinct US voices across levels", async ({ page }) => {
  await mockSpeech(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
  await page.goto("/english/cafe");
  const heard: Spoken[] = [];
  for (const [names, next] of [
    [["Cloud Cat", "Ollie Owl", "Mimi Bunny"], "Đến đồi chè"],
    [["Astro Bean", "Đèo Explorer"], null],
  ] as const) {
    for (const name of names) {
      for (const level of ["A1", "B1"]) {
        if (level === "B1") await page.evaluate(() => window.__npcSpeech.voices.reverse());
        await page.getByRole("button", { name: `Trò chuyện với ${name}`, exact: true }).click();
        await page.locator(".cafe-levels button").filter({ hasText: level }).click();
        await startCafeConversation(page);
        await page.getByRole("button", { name: "Nghe câu", exact: true }).click();
        await expect
          .poll(() => page.evaluate(() => window.__npcSpeech.spoken.length))
          .toBe(heard.length + 1);
        heard.push(await page.evaluate(() => window.__npcSpeech.spoken.at(-1)!));
        await page.evaluate(() => window.__npcSpeech.finish());
        await page.getByRole("button", { name: "Kết thúc & xem tổng kết", exact: true }).click();
        await page.getByRole("button", { name: "Đóng trò chuyện", exact: true }).click();
      }
      const [slow, normal] = heard.slice(-2);
      expect(slow.voice).toBe(normal.voice);
      expect(slow.lang).toBe("en-US");
      expect(slow.rate).toBeLessThan(normal.rate);
    }
    if (next) await page.getByRole("button", { name: next, exact: true }).click();
  }
  expect(new Set(heard.map((item) => item.voice)).size).toBe(5);
  expect(new Set(heard.map((item) => item.pitch)).size).toBe(5);
});

test("Mr. Pink previews his own voice and closing the guide stops speech", async ({ page }) => {
  await mockSpeech(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
  await page.goto("/english/cafe");
  await page.getByRole("button", { name: "Học cùng Mr. Pink", exact: true }).click();
  await expect(page.getByRole("button", { name: "Nghe Mr. Pink", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Nghe Mr. Pink", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__npcSpeech.spoken[0]?.voice)).toBe("Reed");
  expect(await page.evaluate(() => window.speechSynthesis.speaking)).toBe(true);
  await page.getByRole("button", { name: "Đóng hướng dẫn", exact: true }).click();
  expect(await page.evaluate(() => window.speechSynthesis.speaking)).toBe(false);
});

for (const closeBeforeReady of [false, true]) {
  test(`late voice loading ${closeBeforeReady ? "stays cancelled after closing" : "selects the US voice"}`, async ({
    page,
  }) => {
    await mockSpeech(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
    await page.goto("/english/cafe");
    await page.getByRole("button", { name: "Học cùng Mr. Pink", exact: true }).click();
    await page.evaluate(() => {
      window.__npcSpeech.voices = [];
    });
    await page.getByRole("button", { name: "Nghe Mr. Pink", exact: true }).click();
    expect(await page.evaluate(() => window.__npcSpeech.spoken)).toEqual([]);
    if (closeBeforeReady)
      await page.getByRole("button", { name: "Đóng hướng dẫn", exact: true }).click();
    await page.evaluate(async () => {
      window.__npcSpeech.voices = [
        { name: "Shelley Vietnamese", lang: "vi-VN", voiceURI: "vi" },
        { name: "Shelley English", lang: "en_US", voiceURI: "us" },
      ];
      window.speechSynthesis.dispatchEvent(new Event("voiceschanged"));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    });
    if (closeBeforeReady) {
      expect(await page.evaluate(() => window.__npcSpeech.spoken)).toEqual([]);
    } else {
      await expect
        .poll(() => page.evaluate(() => window.__npcSpeech.spoken[0]?.voice))
        .toBe("Shelley English");
      expect(await page.evaluate(() => window.__npcSpeech.spoken[0].lang)).toBe("en-US");
    }
  });
}

test("missing US speech keeps the guide usable and retries with an available voice", async ({
  page,
}) => {
  await mockSpeech(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
  await page.goto("/english/cafe");
  await page.getByRole("button", { name: "Học cùng Mr. Pink", exact: true }).click();
  await page.evaluate(() => {
    window.__npcSpeech.voices = [{ name: "Vietnamese", lang: "vi-VN", voiceURI: "vi" }];
  });
  await page.getByRole("button", { name: "Nghe Mr. Pink", exact: true }).click();
  const guide = page.getByRole("dialog", { name: "Mr. Pink", exact: true });
  await expect(guide.getByRole("alert")).toContainText("Thiết bị chưa có giọng tiếng Anh-Mỹ.");
  expect(await page.evaluate(() => window.__npcSpeech.spoken)).toEqual([]);
  await expect(page.getByRole("link", { name: /Luyện phát âm/ })).toBeVisible();
  await page.evaluate(() => {
    window.__npcSpeech.voices = [{ name: "Only US voice", lang: "en-US", voiceURI: "only-us" }];
  });
  await page.getByRole("button", { name: "Nghe Mr. Pink", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.__npcSpeech.spoken[0]?.voice))
    .toBe("Only US voice");
  await expect(guide.getByRole("alert")).toHaveCount(0);
});
