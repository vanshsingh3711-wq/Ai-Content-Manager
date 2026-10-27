import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Render Queue — AI Director",
  description:
    "Monitor live render jobs, track pipeline stages, view real-time logs, and retry failed tasks in the AI Director render queue.",
  keywords: ["render queue", "video processing", "pipeline monitor", "job tracker"],
};

export default function QueueLayout({ children }: { children: React.ReactNode }) {
  return children;
}
