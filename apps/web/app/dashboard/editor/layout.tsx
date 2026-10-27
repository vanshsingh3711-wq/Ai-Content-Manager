import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio Editor — AI Director",
  description:
    "Professional non-linear video editor with multi-track timeline, AI-powered caption overlay, B-roll control, motion graphics canvas, and one-click render export.",
  keywords: ["video editor", "NLE", "timeline editor", "AI video editing", "studio editor"],
};

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  // The editor page mounts full-screen (fixed inset-0) and should not
  // inherit the dashboard sidebar layout — so we intentionally bypass
  // the parent dashboard layout by using an independent route group.
  return children;
}
