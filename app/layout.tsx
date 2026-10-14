import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Flow English",
  description: "Luyện nói tiếng Anh tự nhiên theo nhịp sống hằng ngày.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
