import { expect, test } from "@playwright/test";

test("recording survives a failed upload and can be checked again after consent", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const key = "w1-d1-general";
    localStorage.setItem(
      "natural-english:v2",
      JSON.stringify({
        version: 2,
        profile: {
          name: "Long",
          role: "general",
          goal: "both",
          confidence: "some",
          largeText: false,
          mic: false,
        },
        activeWeek: 1,
        activeDay: 1,
        sessions: {
          [key]: {
            planVersion: "conversation-v1",
            key,
            week: 1,
            day: 1,
            stage: 1,
            completed: [],
            seconds: Array(3).fill(0),
            attempts: [],
            drafts: {},
          },
        },
        dailySeconds: {},
      }),
    );
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) },
    });
    Object.defineProperty(window, "MediaRecorder", {
      value: class {
        static isTypeSupported() {
          return true;
        }
        state = "inactive";
        mimeType = "audio/webm";
        onstart?: () => void;
        onstop?: () => void;
        ondataavailable?: (event: { data: Blob }) => void;
        start() {
          this.state = "recording";
          this.onstart?.();
        }
        stop() {
          this.state = "inactive";
          this.ondataavailable?.({ data: new Blob(["test recording"], { type: this.mimeType }) });
          this.onstop?.();
        }
      },
    });
  });
  let attempts = 0;
  await page.route("**/api/speech-score", async (route) => {
    attempts++;
    expect(route.request().postData()).toContain('name="consent"\r\n\r\ntrue');
    if (attempts === 1) return route.abort("failed");
    return route.fulfill({
      json: {
        score: 100,
        transcript: "I get breakfast on the way to work.",
        missingWords: [],
        feedback: "Rất sát câu mẫu!",
      },
    });
  });

  await page.goto("/session/w1-d1-general");
  await page.getByRole("button", { name: /Thu âm & nghe lại/ }).click();
  await page.getByRole("button", { name: "Bắt đầu thu", exact: true }).click();
  await page.getByRole("button", { name: "Dừng ghi", exact: true }).click();
  const check = page.getByRole("button", { name: "Kiểm tra nội dung", exact: true });
  await expect(check).toBeDisabled();
  expect(attempts).toBe(0);
  await page.getByRole("checkbox", { name: /Tôi đồng ý gửi bản ghi/ }).check();
  await check.click();
  await expect(page.locator(".recording-error")).toContainText(
    "Không thể kết nối. Hãy kiểm tra mạng rồi thử lại.",
  );
  await expect(page.getByRole("button", { name: "Nghe lại", exact: true })).toBeEnabled();
  await expect(page.locator(".recording-review audio")).toHaveAttribute("src", /^blob:/);
  await expect(check).toBeEnabled();
  expect(attempts).toBe(1);
  await check.click();
  await expect(page.locator(".score-result")).toContainText("100");
  await expect(page.locator(".recording-error")).toHaveCount(0);
  expect(attempts).toBe(2);
});
