import { expect, test } from "@playwright/test";
import { startCafeConversation } from "./cafe-vocabulary-fixture";

for (const width of [390, 1440]) {
  test(`conversation management menu resumes, cancels and deletes visits at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
    await page.goto("/english/cafe");
    await page.getByRole("button", { name: "Trò chuyện với Cloud Cat", exact: true }).click();
    await startCafeConversation(page);
    await expect(page.getByRole("log")).toBeVisible();
    await page.getByRole("button", { name: "Đóng trò chuyện", exact: true }).click();
    const nav = page.getByRole("navigation", {
      name: width < 768 ? "Điều hướng trên điện thoại" : "Điều hướng chính",
      exact: true,
    });
    const menu = nav.getByRole("link", {
      name: width < 768 ? "Hội thoại" : "Quản lý hội thoại",
      exact: true,
    });
    await expect(menu).toBeVisible();
    await menu.click();
    await expect(page).toHaveURL(/\/english\/cafe\/history$/);
    await expect(menu).toHaveAttribute("aria-current", "page");
    await expect(
      page.getByRole("heading", { name: "Quản lý hội thoại", exact: true }),
    ).toBeVisible();
    const visits = page.getByRole("list", { name: "Nhật ký ghé quán", exact: true });
    const visit = visits.getByRole("listitem");
    await expect(visit).toHaveCount(1);
    await expect(visit).toContainText("Cloud Cat");
    await visit.getByRole("button", { name: "Tiếp tục", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Cloud Cat", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Đóng trò chuyện", exact: true }).click();
    await visit.getByRole("button", { name: "Huỷ buổi", exact: true }).click();
    await expect(visit).toContainText("Đã kết thúc");
    const filters = page.getByRole("group", { name: "Lọc hội thoại", exact: true });
    await filters.getByRole("button", { name: /^Đang mở/ }).click();
    await expect(visits.getByRole("listitem")).toHaveCount(0);
    await expect(page.getByText("Không có hội thoại đang mở.", { exact: true })).toBeVisible();
    await filters.getByRole("button", { name: /^Đã kết thúc/ }).click();
    await expect(visit).toHaveCount(1);
    await visit.getByRole("button", { name: "Xem tổng kết", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Một chút mang về", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Đóng trò chuyện", exact: true }).click();
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
    await page.screenshot({ path: test.info().outputPath("history.png"), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await visit.getByRole("button", { name: "Xoá", exact: true }).click();
    await visit.getByRole("button", { name: "Giữ lại", exact: true }).click();
    await expect(visit).toHaveCount(1);
    await visit.getByRole("button", { name: "Xoá", exact: true }).click();
    await visit.getByRole("button", { name: "Xác nhận xoá", exact: true }).click();
    await filters.getByRole("button", { name: /^Tất cả/ }).click();
    await expect(page.getByText("Chưa có hội thoại nào.", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText("Chưa có hội thoại nào.", { exact: true })).toBeVisible();
  });
}
