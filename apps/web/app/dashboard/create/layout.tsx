import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Video — AI Director",
  description:
    "Start a new AI-generated video in three steps: choose your content type, configure hook presets and voiceover, then launch your automated pipeline.",
  keywords: ["create video", "AI video generator", "automated content", "faceless video creator"],
};

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
