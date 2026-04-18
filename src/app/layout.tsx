import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "이든국어독서교육원",
  description: "이든국어독서교육원 학생 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
