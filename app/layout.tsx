import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Chat",
  description: "AIとの日常会話・雑談チャットアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="h-full bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
