import type { Page } from "@playwright/test";

export async function learnCafeVocabulary(page: Page) {
  const learned = page.getByRole("button", { name: "Đã học các từ trên", exact: true });
  if (await learned.isVisible()) await learned.click();
}

export async function startCafeConversation(page: Page) {
  await learnCafeVocabulary(page);
  await page.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true }).click();
}
