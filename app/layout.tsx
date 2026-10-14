import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Flow English",
  description: "Chương trình luyện nói tiếng Anh tự nhiên theo từng lesson và tình huống hằng ngày.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
