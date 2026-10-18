import { expect, test } from "@playwright/test";

for (const stage of [0, 1]) {
  test(`lesson stage ${stage} uses the configured learner name after edits and reload`, async ({
    page,
  }) => {
    await page.addInitScript(
      ({ stage }) => {
        if (localStorage.getItem("natural-english:v2")) return;
        const key = "w1-d1-developer";
        localStorage.setItem(
          "natural-english:v2",
          JSON.stringify({
            version: 2,
            profile: {
              name: "Long",
              role: "developer",
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
                stage,
                completed: [],
                seconds: Array(3).fill(0),
                drafts: {},
                attempts: [],
              },
            },
            dailySeconds: {},
          }),
        );
      },
      { stage },
    );

    async function checkName(name: string) {
      if (stage === 0) {
        await page.getByText("Cần phụ đề hoặc không phát được âm thanh?", { exact: true }).click();
        await page.getByRole("button", { name: "Mở hỗ trợ chữ", exact: true }).click();
      }
      const content = page.locator(".listening-task, .speaking-task, .writing-task");
      await expect(content).toContainText(name);
      await expect(content).not.toContainText(/anna|minh/i);
      if (stage === 1) {
        await expect(content.locator(".conversation-turn .avatar svg")).toBeVisible();
        await expect(content.locator(".conversation-turn")).toContainText("Bạn hội thoại");
        await page.getByRole("button", { name: "Nhập câu trả lời", exact: true }).click();
        await page.locator("textarea").fill("I can help with this task.");
        await page.getByRole("button", { name: "Lưu & nghe câu hỏi tiếp", exact: true }).click();
        await expect(content.locator(".learner-turn small").first()).toContainText(name);
      }
    }

    await page.goto("/session/w1-d1-developer");
    await checkName("Long");
    await page.goto("/settings");
    await page.getByLabel("Mình nên gọi bạn là gì?").fill("Linh");
    await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
    await page.goto("/session/w1-d1-developer");
    await page.reload();
    await checkName("Linh");
    await expect(page.locator(".listening-task, .speaking-task, .writing-task")).not.toContainText(
      "Long",
    );
  });
}
