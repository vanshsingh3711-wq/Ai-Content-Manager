import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Video Library — AI Director",
  description:
    "Browse, filter, and manage all your AI-generated videos. View render status, download assets, and jump directly into the Studio Editor.",
  keywords: ["video library", "AI videos", "content management", "video manager"],
};

export default function VideosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
