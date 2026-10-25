import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Director — Automated Video Content Engine",
  description:
    "Autonomous AI video pipeline: transcription, B-roll, motion graphics, captions, SFX, and multi-platform publishing — in one click.",
  keywords: ["AI video editor", "automated editing", "content manager", "faceless video"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[--bg-base] text-[--foreground]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
