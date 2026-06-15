import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI HTML Slides Editor",
  description: "A structured visual editor for AI-generated HTML slides.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
