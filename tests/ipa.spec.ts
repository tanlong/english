import { expect, test } from "@playwright/test";
import { ipaSounds, ipaReference } from "../app/content/ipa";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
  await expect(page.locator(".app-shell")).toBeVisible();
});

test("IPA navigation, filtering, practice progress and source video", async ({ page }) => {
  await page.locator(".side-nav").getByRole("link", { name: "Luyện IPA", exact: true }).click();
  await expect(page).toHaveURL(/\/ipa$/);
  await expect(page.getByRole("heading", { name: "Luyện IPA", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Âm \// })).toHaveCount(44);
  await page
    .getByRole("group", { name: "Nhóm âm IPA", exact: true })
    .getByRole("button", { name: "Phụ âm", exact: true })
    .click();
  await expect(page.getByRole("button", { name: /^Âm \// })).toHaveCount(24);
  await page.getByRole("textbox", { name: "Tìm âm IPA" }).fill("θ");
  await expect(page.getByRole("button", { name: /^Âm \// })).toHaveCount(1);
  await page.getByRole("button", { name: "Âm /θ/ · thin", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Âm /θ/", exact: true })).toBeVisible();
  await expect(page.getByText("mỏng", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Đánh dấu đã luyện", exact: true }).click();
  await expect(page.getByRole("progressbar", { name: "Số âm đã luyện" })).toHaveAttribute(
    "value",
    "1",
  );
  await page.reload();
  await expect(page.getByRole("progressbar", { name: "Số âm đã luyện" })).toHaveAttribute(
    "value",
    "1",
  );
  await expect(page.getByRole("button", { name: "Âm /θ/ · thin", exact: true })).toContainText(
    "thin",
  );
  await page.getByRole("button", { name: "Âm /θ/ · thin", exact: true }).click();
  await page.getByRole("button", { name: "Đã luyện · Bỏ đánh dấu", exact: true }).click();
  await expect(page.getByRole("progressbar", { name: "Số âm đã luyện" })).toHaveAttribute(
    "value",
    "0",
  );
  await page.getByRole("textbox", { name: "Tìm âm IPA" }).fill("không tìm được từ này");
  await expect(page.getByRole("status")).toContainText("Không tìm thấy âm phù hợp.");
  await page.getByRole("button", { name: "Xem tất cả âm", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Âm \// })).toHaveCount(44);
  await expect(page.getByRole("link", { name: "Mở playlist", exact: true })).toHaveAttribute(
    "href",
    ipaReference.href,
  );
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "Video reference fixture" }),
  );
  await page.getByRole("button", { name: "Xem video tham khảo", exact: true }).click();
  await expect(page.locator("iframe")).toHaveAttribute("src", new RegExp(ipaReference.videoId));
  await page.getByRole("button", { name: "Ẩn video tham khảo", exact: true }).click();
  await expect(page.locator("iframe")).toHaveCount(0);
});

test("IPA playback, listening gate, retry and recording fallback", async ({ page }) => {
  const spoken: string[] = [];
  let fail = false;
  await page.addInitScript(() => {
    Object.defineProperty(window, "Audio", {
      value: class {
        onended: (() => void) | null = null;
        onerror: (() => void) | null = null;
        playbackRate = 1;
        play() {
          setTimeout(() => this.onended?.(), 20);
          return Promise.resolve();
        }
        pause() {}
      },
    });
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: () => Promise.reject(new DOMException("Denied", "NotAllowedError")) },
    });
  });
  await page.route("**/api/tts", (route) => {
    spoken.push(route.request().postDataJSON().spokenText);
    return route.fulfill(
      fail
        ? { status: 503, json: { error: "Âm thanh chưa sẵn sàng." } }
        : { status: 200, contentType: "audio/mpeg", body: "mock audio" },
    );
  });
  await page.goto("/ipa");
  await page.getByRole("button", { name: "Nghe từ mẫu", exact: true }).click();
  await expect.poll(() => spoken[0]).toBe("sheep");
  await expect(page.getByRole("button", { name: "Nghe từ mẫu", exact: true })).toBeVisible();
  const quiz = page.getByRole("region", { name: "Tự kiểm tra nghe" });
  const sheep = quiz.getByRole("button", { name: "sheep", exact: true });
  const ship = quiz.getByRole("button", { name: "ship", exact: true });
  await expect(sheep).toBeDisabled();
  await expect(ship).toBeDisabled();
  fail = true;
  await quiz.getByRole("button", { name: "Nghe từ cần chọn", exact: true }).click();
  await expect(quiz.getByRole("alert")).toContainText("Âm thanh chưa sẵn sàng.");
  await expect(sheep).toBeDisabled();
  fail = false;
  await quiz.getByRole("button", { name: "Nghe từ cần chọn", exact: true }).click();
  await expect(sheep).toBeEnabled();
  const correct = spoken.at(-1)!;
  await quiz.getByRole("button", { name: correct, exact: true }).click();
  await expect(quiz.getByRole("status")).toContainText("Đúng rồi!");
  await quiz.getByRole("button", { name: "Thử lượt khác", exact: true }).click();
  await expect(sheep).toBeDisabled();
  await expect(quiz.getByRole("status")).toHaveCount(0);
  await page.getByRole("button", { name: "Thu âm & nghe lại" }).click();
  await page.getByRole("button", { name: "Bắt đầu thu", exact: true }).click();
  await expect(page.locator(".recording-practice").getByRole("alert")).toContainText(
    "Micro đang bị chặn.",
  );
});

test("IPA fits mobile, large text and landscape with five navigation items", async ({ page }) => {
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("natural-english:v2")!);
    state.profile.largeText = true;
    localStorage.setItem("natural-english:v2", JSON.stringify(state));
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const viewport of [
    { width: 320, height: 640 },
    { width: 375, height: 812 },
    { width: 812, height: 375 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/ipa");
    await expect(page.getByRole("heading", { name: "Luyện IPA", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewport.width,
    );
    if (viewport.width < 768) {
      const nav = page.locator(".mobile-nav");
      await expect(nav.getByRole("link")).toHaveCount(5);
      await expect(nav.getByRole("link", { name: "IPA", exact: true })).toHaveAttribute(
        "aria-current",
        "page",
      );
      const bounds = await nav.getByRole("link", { name: "IPA", exact: true }).boundingBox();
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
      await page.getByRole("button", { name: "Âm /θ/ · thin", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Âm /θ/", exact: true })).toBeFocused();
      await expect(page.getByRole("img", { name: /^Mặt cắt miệng cho âm \/θ\// })).toBeInViewport();
      if (viewport.width === 320)
        await page.screenshot({ path: "artifacts/ipa-mobile-practice.png" });
    }
    await page.screenshot({ path: `artifacts/ipa-${viewport.width}.png`, fullPage: true });
  }
});

test("TTS accepts IPA examples while rejecting unapproved text", async ({ request }) => {
  for (const spokenText of new Set(ipaSounds.flatMap((sound) => [sound.word, sound.pair.word]))) {
    const response = await request.post("/api/tts", {
      headers: { Origin: "http://127.0.0.1:3001" },
      data: { spokenText },
    });
    expect([200, 503], spokenText).toContain(response.status());
  }
  const invalid = await request.post("/api/tts", {
    headers: { Origin: "http://127.0.0.1:3001" },
    data: { spokenText: "Arbitrary IPA generation should not be allowed." },
  });
  expect(invalid.status()).toBe(400);
});

test("British additions remain light red and use British device playback", async ({ page }) => {
  let usRequests = 0;
  await page.addInitScript(() => {
    const calls: { text: string; lang: string; rate: number; voice: string }[] = [];
    Object.assign(window, { __ipaBritish: calls });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: class {
        constructor(public text: string) {}
      },
    });
    Object.defineProperty(window, "speechSynthesis", {
      value: Object.assign(new EventTarget(), {
        getVoices: () => [
          { lang: "en-US", name: "US" },
          { lang: "en-GB", name: "British" },
        ],
        speak: (utterance: {
          text: string;
          lang: string;
          rate: number;
          voice: { lang: string };
          onend: (() => void) | null;
        }) => {
          calls.push({
            text: utterance.text,
            lang: utterance.lang,
            rate: utterance.rate,
            voice: utterance.voice.lang,
          });
          setTimeout(() => utterance.onend?.(), 20);
        },
        cancel: () => {},
      }),
    });
  });
  await page.route("**/api/tts", (route) => {
    usRequests++;
    return route.fulfill({ status: 503, json: { error: "US playback is not expected" } });
  });
  await page.goto("/ipa");
  const british = page.locator('button[data-accent="en-GB"]');
  await expect(british).toHaveCount(4);
  await page.mouse.move(0, 0);
  const colors = await british.first().evaluate((element) => {
    const probe = document.createElement("span");
    probe.style.backgroundColor = "var(--color-red-50)";
    document.body.append(probe);
    const expected = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return { actual: getComputedStyle(element).backgroundColor, expected };
  });
  expect(colors.actual).toBe(colors.expected);
  await page.getByRole("button", { name: "Âm /ɪə/ · hear · Anh-Anh", exact: true }).click();
  const detail = page.getByRole("region", { name: "Âm /ɪə/", exact: true });
  await expect(detail).toContainText("Anh-Anh");
  await expect(detail.locator(".audio-disclosure")).toHaveCount(0);
  await detail.getByRole("button", { name: "Nghe từ mẫu", exact: true }).click();
  const spoken = () =>
    page.evaluate(
      () =>
        (
          window as unknown as {
            __ipaBritish: { text: string; lang: string; rate: number; voice: string }[];
          }
        ).__ipaBritish,
    );
  await expect.poll(async () => (await spoken()).length).toBe(1);
  expect((await spoken())[0]).toEqual({ text: "hear", lang: "en-GB", voice: "en-GB", rate: 1 });
  await detail.getByRole("button", { name: "Nghe chậm · 0.8×", exact: true }).click();
  await expect.poll(async () => (await spoken())[1]?.rate).toBe(0.8);
  const quiz = detail.getByRole("region", { name: "Tự kiểm tra nghe" });
  await quiz.getByRole("button", { name: "Nghe từ cần chọn", exact: true }).click();
  await expect(quiz.getByRole("button", { name: "hear", exact: true })).toBeEnabled();
  const correct = (await spoken()).at(-1)!.text;
  await quiz.getByRole("button", { name: correct, exact: true }).click();
  await expect(quiz.getByRole("status")).toContainText("Đúng rồi!");
  expect(usRequests).toBe(0);
  await detail.getByRole("button", { name: "Đánh dấu đã luyện", exact: true }).click();
  await page.screenshot({ path: "artifacts/ipa-british-desktop.png", fullPage: true });
  await page.reload();
  await page.getByRole("button", { name: "Âm /ɪə/ · hear · Anh-Anh", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Đã luyện · Bỏ đánh dấu", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: "artifacts/ipa-british-mobile.png", fullPage: true });
});

test("a missing British voice leaves the listening question unanswered", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", {
      value: Object.assign(new EventTarget(), {
        getVoices: () => [{ lang: "en-US", name: "US" }],
        speak: () => {},
        cancel: () => {},
      }),
    });
  });
  await page.goto("/ipa");
  await page.getByRole("button", { name: "Âm /ɪə/ · hear · Anh-Anh", exact: true }).click();
  const quiz = page.getByRole("region", { name: "Tự kiểm tra nghe" });
  await quiz.getByRole("button", { name: "Nghe từ cần chọn", exact: true }).click();
  await expect(quiz.getByRole("alert")).toContainText("Thiết bị chưa có giọng en-GB.");
  await expect(quiz.getByRole("button", { name: "hear", exact: true })).toBeDisabled();
  await expect(quiz.getByRole("button", { name: "hair", exact: true })).toBeDisabled();
});

test("mouth diagrams follow all sounds and expose tongue movements and nasal airflow", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/ipa");
  const tongues = new Set<string>();
  for (const sound of ipaSounds) {
    await page
      .getByRole("button", {
        name: `Âm /${sound.symbol}/ · ${sound.word}${sound.accent === "en-GB" ? " · Anh-Anh" : ""}`,
        exact: true,
      })
      .click();
    const figure = page.getByRole("figure", {
      name: `Minh hoạ đặt miệng cho âm /${sound.symbol}/`,
      exact: true,
    });
    await expect(figure.getByRole("img")).toHaveCount(2);
    await expect(figure.getByRole("img").first()).toHaveAccessibleName(
      new RegExp(`^Mặt cắt miệng cho âm /${sound.symbol}/`),
    );
    const path = await figure.locator('[data-slot="tongue"]').getAttribute("d");
    expect(path).not.toMatch(/undefined|NaN/);
    tongues.add(path!);
  }
  expect(tongues.size).toBeGreaterThan(15);
  await page.getByRole("button", { name: "Âm /m/ · meat", exact: true }).click();
  const nasal = page.getByRole("figure", { name: "Minh hoạ đặt miệng cho âm /m/", exact: true });
  await expect(nasal.locator("p").filter({ hasText: "Hơi đi qua mũi" })).toBeVisible();
  await expect(nasal.locator("p").filter({ hasText: "âm hữu thanh" })).toBeVisible();
  await page.getByRole("button", { name: "Âm /aɪ/ · buy", exact: true }).click();
  const moving = page.getByRole("figure", { name: "Minh hoạ đặt miệng cho âm /aɪ/", exact: true });
  const start = await moving.locator('[data-slot="tongue"]').getAttribute("d");
  await moving.getByRole("button", { name: "2. Kết thúc", exact: true }).click();
  await expect(moving.getByRole("button", { name: "2. Kết thúc", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(await moving.locator('[data-slot="tongue"]').getAttribute("d")).not.toBe(start);
  await page.getByRole("button", { name: "Âm /p/ · pie", exact: true }).click();
  const stop = page.getByRole("figure", { name: "Minh hoạ đặt miệng cho âm /p/", exact: true });
  await expect(stop.locator("p").filter({ hasText: "Hơi bị chặn" })).toBeVisible();
  await stop.getByRole("button", { name: "2. Nhả hơi", exact: true }).click();
  await expect(stop.locator("p").filter({ hasText: "Hơi đi qua miệng" })).toBeVisible();
  await expect(stop.locator("p").filter({ hasText: "âm vô thanh" })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "Âm /θ/ · thin", exact: true }).click();
  const mobile = page.getByRole("figure", { name: "Minh hoạ đặt miệng cho âm /θ/", exact: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await mobile.screenshot({ path: "artifacts/ipa-mouth-mobile.png" });
});
