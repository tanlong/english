import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Natural English — Tiếng Anh cho cuộc sống của bạn",
  description:
    "Luyện giao tiếp tiếng Anh đời sống và công việc: nghe mẫu, tự phản hồi và dùng ngoài đời, khoảng 12 phút mỗi buổi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
