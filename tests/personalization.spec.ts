import { expect, test } from "@playwright/test";

test("one personalized debate article refreshes without replacing a draft and the database restores the learner", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau", exact: true }).click();
  await expect
    .poll(async () => (await (await page.request.get("/api/learning")).json()).state.profile?.name)
    .toBe("Bạn");
  await page.goto("/debate");
  await page.getByText("Chọn chủ đề luyện nhanh", { exact: true }).click();
  const card = page.getByTestId("personalized-debate");
  await expect(card).toHaveCount(1);
  await expect(card.getByRole("button", { name: "Luyện bài này", exact: true })).toBeVisible();
  const title = await card.locator("h3").textContent();
  const draft = page.getByLabel("Nội dung dùng để tranh luận", { exact: true });
  await draft.fill(
    "This is my own draft. Please keep this text while the suggested practice article changes.",
  );
  await card.getByRole("button", { name: "Cập nhật bài gợi ý", exact: true }).click();
  await expect(card.locator("h3")).not.toHaveText(title!);
  await expect(card).toHaveCount(1);
  await expect(draft).toHaveValue(/This is my own draft/);
  await card.getByRole("button", { name: "Luyện bài này", exact: true }).click();
  expect((await draft.inputValue()).length).toBeGreaterThanOrEqual(80);
  await expect(
    page.getByRole("checkbox", {
      name: "Tôi đồng ý gửi nội dung này đến OpenAI để tạo cuộc hội thoại tranh luận.",
      exact: true,
    }),
  ).not.toBeChecked();
  const chosen = await card.locator("h3").textContent();
  await page.route("**/api/learning", async (route) => {
    if (
      route.request().method() === "POST" &&
      route.request().postDataJSON().action === "refresh-topic"
    )
      await route.fulfill({ status: 503, json: { error: "Thử lại sau." } });
    else await route.continue();
  });
  await card.getByRole("button", { name: "Cập nhật bài gợi ý", exact: true }).click();
  await expect(card.getByRole("alert")).toContainText("Thử lại sau.");
  await expect(card.locator("h3")).toHaveText(chosen!);
  await page.unroute("**/api/learning");
  await card.getByRole("button", { name: "Cập nhật bài gợi ý", exact: true }).click();
  await expect(card.getByRole("alert")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/personalized-debate-375.png", fullPage: true });
  await page.evaluate(() => localStorage.removeItem("natural-english:v2"));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Tranh luận", exact: true })).toBeVisible();
  await expect
    .poll(async () =>
      page.evaluate(() => JSON.parse(localStorage.getItem("natural-english:v2")!).profile?.name),
    )
    .toBe("Bạn");
});

test("approved examples survive reload and resetting removes the server profile too", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau", exact: true }).click();
  await page.goto("/settings");
  await page.getByText("Kho câu mẫu do bạn duyệt", { exact: true }).click();
  await page
    .getByLabel("Câu tiếng Anh", { exact: true })
    .fill("I grab breakfast on my way to work.");
  await page
    .getByLabel("Nghĩa tiếng Việt", { exact: true })
    .fill("Tôi ghé ăn sáng trên đường đi làm.");
  await page.getByLabel("Ghi chú cách dùng", { exact: true }).fill("Nói về buổi sáng thường ngày.");
  await page.getByRole("button", { name: "Duyệt & lưu mẫu", exact: true }).click();
  await expect(page.getByRole("region", { name: "Bộ nhớ học tập", exact: true })).toContainText(
    "I grab breakfast on my way to work.",
  );
  await page.reload();
  await page.getByText("Kho câu mẫu do bạn duyệt", { exact: true }).click();
  await expect(page.getByRole("region", { name: "Bộ nhớ học tập", exact: true })).toContainText(
    "I grab breakfast on my way to work.",
  );
  await page.getByRole("button", { name: "Xóa dữ liệu học tập…", exact: true }).click();
  await page.getByRole("button", { name: "Xóa toàn bộ dữ liệu v2", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau", exact: true }),
  ).toBeVisible();
  const data = await (await page.request.get("/api/learning")).json();
  expect(data.state.profile).toBeNull();
  expect(data.personalization.examples).toEqual([]);
});
