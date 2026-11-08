import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`NPC teaches five topic words before conversation and remembers learned words at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
    await page.goto("/english/cafe");
    await page.getByRole("button", { name: "Trò chuyện với Cloud Cat", exact: true }).click();
    const lesson = page.getByRole("region", { name: "5 từ trước khi trò chuyện", exact: true });
    await expect(lesson).toBeVisible();
    await expect(lesson.getByRole("listitem")).toHaveCount(5);
    await expect(
      lesson.getByText("I'd like to order a coffee, please.", { exact: true }),
    ).toBeVisible();
    await expect(lesson.getByRole("button", { name: /Nghe từ và câu:/ })).toHaveCount(5);
    const start = page.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true });
    await expect(start).toBeDisabled();
    await lesson.getByRole("button", { name: "Đã học: order", exact: true }).click();
    await expect(lesson.getByRole("listitem")).toHaveCount(4);
    await expect
      .poll(async () => {
        const data = await (await page.request.get("/api/learning")).json();
        return data.state.cardReviews["cafe-vocab:ordering:order"]?.intervalDays;
      })
      .toBe(2);
    await page.getByRole("button", { name: "Đóng trò chuyện", exact: true }).click();
    await page.reload();
    await page.getByRole("button", { name: "Trò chuyện với Cloud Cat", exact: true }).click();
    await expect(lesson.getByRole("listitem")).toHaveCount(4);
    for (const word of ["iced", "menu", "bill", "to go"])
      await lesson.getByRole("button", { name: `Đã học: ${word}`, exact: true }).click();
    await expect(lesson).toHaveCount(0);
    await expect(start).toBeEnabled();
    await start.click();
    await expect(page.getByRole("log", { name: "Hội thoại với Cloud Cat", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}

test("learned vocabulary returns as a due recall and saves its next review through the learning API", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
  await expect
    .poll(async () => (await (await page.request.get("/api/learning")).json()).state.profile?.name)
    .toBeTruthy();
  const { state } = await (await page.request.get("/api/learning")).json();
  const now = Date.now();
  state.cardReviews = Object.fromEntries(
    ["order", "iced", "menu", "bill", "to go"].map((word) => [
      `cafe-vocab:ordering:${word}`,
      {
        version: "leitner-v1",
        reviewedAt: new Date(now - 3 * 86_400_000).toISOString(),
        dueAt: new Date(now + (word === "order" ? -1 : 1) * 86_400_000).toISOString(),
        intervalDays: 2,
        rating: "good",
        eventId: `learned-${word}`,
        count: 1,
      },
    ]),
  );
  const seeded = await page.request.post("/api/learning", {
    headers: { Origin: "http://127.0.0.1:3000" },
    data: { action: "sync", state },
  });
  expect(seeded.ok()).toBe(true);
  await page.goto("/english/cafe");
  await page.reload();
  await page.getByRole("button", { name: "Trò chuyện với Cloud Cat", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "5 từ trước khi trò chuyện", exact: true }),
  ).toHaveCount(0);
  const review = page.getByRole("region", { name: "Ôn từ đến hạn", exact: true });
  await expect(review).toBeVisible();
  await expect(review.getByText("gọi món", { exact: true })).toBeVisible();
  await expect(review.getByRole("heading", { name: "order", exact: true })).toHaveCount(0);
  await expect(review.getByRole("button", { name: "Chưa nhớ", exact: true })).toHaveCount(0);
  await review.getByRole("button", { name: "Xem đáp án", exact: true }).click();
  await expect(review.getByRole("heading", { name: "order", exact: true })).toBeVisible();
  await review.getByRole("button", { name: "Chưa nhớ", exact: true }).click();
  await expect(review).toHaveCount(0);
  await expect
    .poll(async () => {
      const data = await (await page.request.get("/api/learning")).json();
      return data.state.cardReviews["cafe-vocab:ordering:order"]?.rating;
    })
    .toBe("again");
  const data = await (await page.request.get("/api/learning")).json();
  const saved = data.state.cardReviews["cafe-vocab:ordering:order"];
  expect(saved.count).toBe(2);
  expect(saved.intervalDays).toBe(0);
  expect(Date.parse(saved.dueAt) - Date.parse(saved.reviewedAt)).toBe(600_000);
  await page.reload();
  await page.getByRole("button", { name: "Trò chuyện với Cloud Cat", exact: true }).click();
  await expect(review).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "5 từ trước khi trò chuyện", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true })).toBeEnabled();
});
