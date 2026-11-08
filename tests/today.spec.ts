import { expect, test } from "@playwright/test";

const features = [
  ["Phát âm IPA", "/ipa"],
  ["Luyện tranh luận", "/debate"],
] as const;

for (const width of [390, 768, 1440]) {
  test(`Today shows only IPA and debate cards and opens both tools at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
    const tools = page.getByRole("region", { name: "Chọn cách luyện tập" });
    await expect(tools.getByRole("link")).toHaveCount(2);
    await expect(page.getByRole("link", { name: "Bắt đầu học", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Tiếp tục học", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Xem tiến độ", exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    for (const [name, href] of features) {
      const card = tools.getByRole("link", { name, exact: true });
      await expect(card).toHaveAttribute("href", href);
      await expect(card.getByRole("heading", { name, exact: true })).toBeVisible();
      await card.click();
      await expect(page).toHaveURL(new RegExp(`${href}$`));
      await expect(page.locator(".main-content h1")).toBeAttached();
      await page.goBack();
      await expect(tools).toBeVisible();
    }
    await page.reload();
    await expect(tools.getByRole("link")).toHaveCount(2);
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
    await page.mouse.move(0, 0);
    await page.screenshot({ path: test.info().outputPath("today.png"), fullPage: true });
  });
}
