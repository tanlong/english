import { expect, test } from "@playwright/test";
import { completeCarnegieListening } from "./lesson-helpers";

for (const width of [375, 1440]) {
  test(`guided lesson resumes at the correct step at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
    await expect(page.locator(".hero-card").getByRole("button")).toHaveCount(1);
    await expect(page.locator(".dashboard").getByRole("button")).toHaveCount(1);
    await expect(page.locator(".week-strip, .extra-practice")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Đổi tình huống", exact: true })).toHaveAttribute(
      "href",
      "/roadmap",
    );
    await expect(page.locator(".lesson-pipeline > li")).toHaveCount(3);
    await page.getByRole("button", { name: "Bắt đầu buổi học", exact: true }).click();
    await expect(page.locator(".sidebar, .mobile-nav")).toHaveCount(0);
    await expect(page.locator(".stage-item")).toHaveCount(3);
    const milestones = await page.locator(".stage-item").evaluateAll((items) =>
      items.map((item) => {
        const { top, left } = item.getBoundingClientRect();
        return { top: Math.round(top), left: Math.round(left) };
      }),
    );
    expect(new Set(milestones.map((item) => item.left)).size).toBe(1);
    expect(milestones[0].top).toBeLessThan(milestones[1].top);
    expect(milestones[1].top).toBeLessThan(milestones[2].top);
    if (width === 1440) {
      const rail = await page.locator(".stage-sidebar").boundingBox();
      const activity = await page.locator(".activity-panel").boundingBox();
      expect(rail!.x + rail!.width).toBeLessThan(activity!.x);
    }
    await expect(page.locator("#stage-next-hint")).toContainText("Nghe hội thoại");
    await page.getByText("Cần phụ đề hoặc không phát được âm thanh?", { exact: true }).click();
    await page.getByRole("button", { name: "Mở hỗ trợ chữ", exact: true }).click();
    await page.getByRole("button", { name: "Gợi ý tiếng Việt", exact: true }).click();
    await expect(page.getByRole("table")).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: `artifacts/ui-audit/spoken-versions-${width}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: /Mua đồ ăn sáng trên đường đi làm/ }).click();
    await page.getByRole("button", { name: "Kiểm tra câu trả lời" }).click();
    await completeCarnegieListening(page);
    await expect(page.locator("#stage-next-hint")).toContainText("Tiếp theo: Bạn lên tiếng");
    await page.getByRole("button", { name: "Hoàn thành bước", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Bạn lên tiếng", exact: true })).toBeFocused();
    await expect(page.locator(".stage-item.done")).toContainText("Nghe mẫu");
    await expect(page.locator('.stage-item[aria-current="step"]')).toContainText("Đang học");
    await page.getByRole("link", { name: "Về hôm nay · tiến độ đã lưu" }).click();
    await expect(page.locator(".hero-bottom")).toContainText("Bước 2/3: Bạn lên tiếng");
    await expect(page.locator('.lesson-pipeline-step[aria-current="step"]')).toContainText(
      "Bạn lên tiếng",
    );
    await page.getByRole("button", { name: "Tiếp tục buổi học", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Bạn lên tiếng", exact: true })).toBeVisible();
    await page.reload();
    await expect(page.locator('.stage-item[aria-current="step"]')).toContainText("Bạn lên tiếng");
    await page.screenshot({
      path: `artifacts/ui-audit/guided-session-${width}.png`,
      fullPage: true,
    });
  });
}

test("speaking keeps one turn in focus, offers relevant help and records spoken practice", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
  await page.getByRole("button", { name: "Bắt đầu buổi học", exact: true }).click();
  await page.getByText("Cần phụ đề hoặc không phát được âm thanh?", { exact: true }).click();
  await page.getByRole("button", { name: "Mở hỗ trợ chữ", exact: true }).click();
  await page.getByRole("button", { name: /Mua đồ ăn sáng trên đường đi làm/ }).click();
  await page.getByRole("button", { name: "Kiểm tra câu trả lời" }).click();
  await completeCarnegieListening(page);
  await page.getByRole("button", { name: "Hoàn thành bước", exact: true }).click();
  const hints = page
    .locator("details")
    .filter({ has: page.locator("summary", { hasText: "Bí ý?" }) });
  const goals = ["Trả lời bằng thông tin của bạn", "Thử ứng biến", "hỏi lại một câu"];
  for (let turn = 0; turn < 3; turn++) {
    await expect(page.locator(".speaking-turn-goal")).toContainText(goals[turn]);
    await expect(hints).not.toHaveAttribute("open", "");
    await hints.locator("summary").click();
    await expect(hints).toContainText(
      turn === 0 ? "Thay một chi tiết" : turn === 1 ? "lý do ngắn" : "What, How, When",
    );
    if (turn === 2) {
      await expect(page.locator(".conversation-turn")).toContainText(
        "Morning! You look like you've had a busy start.",
      );
      await expect(
        page.getByRole("button", { name: "Nghe người đối diện", exact: true }),
      ).toBeVisible();
    }
    await page.getByRole("checkbox", { name: "Tôi đã trả lời thành tiếng", exact: true }).check();
    await page
      .getByRole("button", {
        name: turn < 2 ? "Lưu & nghe câu hỏi tiếp" : "Lưu lượt trả lời",
        exact: true,
      })
      .click();
    if (turn === 0) {
      await expect(
        page.getByRole("button", { name: "Hoàn thành bước", exact: true }),
      ).toBeDisabled();
      await expect(page.locator(".learner-turn")).not.toBeVisible();
    }
  }
  await expect(page.getByRole("button", { name: "Hoàn thành bước", exact: true })).toBeEnabled();
  const attempts = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("natural-english:v2")!).sessions["w1-d1-general"].attempts,
  );
  expect(attempts.filter((attempt: { kind: string }) => attempt.kind === "speaking")).toHaveLength(
    3,
  );
  expect(attempts.filter((attempt: { kind: string }) => attempt.kind === "typed")).toHaveLength(0);
});

test("all learning screens fit phone, tablet and desktop with settings reachable", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/roadmap", "/ipa", "/daily-speaking", "/settings"]) {
      await page.goto(path);
      await expect(page.locator(".main-content h1")).toBeVisible();
      await expect(
        width < 768
          ? page.getByRole("link", { name: "Mở cài đặt", exact: true })
          : page.locator(".sidebar").getByRole("link", { name: "Cài đặt", exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${path} at ${width}px`,
      ).toBe(true);
      if (width === 375 || width === 1440) {
        await page.screenshot({
          path: `artifacts/ui-audit/redesign-${width}-${path === "/" ? "today" : path.slice(1)}.png`,
          fullPage: true,
        });
      }
    }
  }
});

test("changing the study month selects a topic from that month", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
  await page.goto("/roadmap");
  await page.getByRole("combobox", { name: "Giai đoạn học", exact: true }).fill("Tháng 2");
  await page.getByRole("option", { name: /^Tháng 2 ·/ }).click();
  await expect(page.locator(".module-preview")).toContainText("TUẦN 5");
  await expect(page.locator('.week-row[aria-pressed="true"]')).toContainText("Food & Drinks");
  await page.locator(".week-row").nth(1).click();
  await expect(page.locator(".module-preview h2")).toBeFocused();
});
