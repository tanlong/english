import { expect, type Page } from "@playwright/test";

export async function completeCarnegieListening(page: Page) {
  const section = page.getByRole("region", { name: "Nghe Đắc Nhân Tâm", exact: true });
  await expect(section).toBeVisible();
  await expect(page.getByRole("button", { name: "Hoàn thành bước", exact: true })).toBeDisabled();
  await section.getByText("Cần phụ đề hoặc không phát được âm thanh?", { exact: true }).click();
  await section.getByRole("button", { name: "Mở hỗ trợ chữ", exact: true }).click();
  await section.getByRole("button", { name: /Ghi nhận cảm xúc rồi hỏi thăm/ }).click();
  await section.getByRole("button", { name: "Kiểm tra câu trả lời", exact: true }).click();
}
