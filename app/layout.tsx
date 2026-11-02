import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Natural English — Tiếng Anh cho cuộc sống của bạn",
  description:
    "Học tiếng Anh Mỹ từ tình huống đời sống và công việc. Nhìn, nghe, nói, nhận góp ý và ôn lại theo nhịp của bạn.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
