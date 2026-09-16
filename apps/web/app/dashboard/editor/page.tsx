"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Scissors,
  Upload,
  Sparkles,
  Smartphone,
  Play,
} from "lucide-react";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";

export default function EditorLauncherPage() {
  const router = useRouter();

  const handleQuickUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const blobUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    const finalizeProject = (rawDuration: number) => {
      let safeDuration = 30;
      if (Number.isFinite(rawDuration) && rawDuration > 0) {
        safeDuration = Math.round(rawDuration * 10) / 10;
      }

      const projectId = `local-${Date.now()}`;

      useTimelineStore.getState().initProject({
        id: projectId,
        title: file.name.replace(/\.[^/.]+$/, ""),
        aspectRatio: "9:16",
        duration: Math.max(safeDuration, 3),
        fps: 30,
        tracks: {
          videoTrack: [
            {
              id: `clip-${Date.now()}`,
              sourceUrl: blobUrl,
              name: file.name,
              start: 0,
              end: safeDuration,
              sourceStart: 0,
              sourceEnd: safeDuration,
              speed: 1,
              volume: 100,
              zoomFactor: 1.0,
            },
          ],
          brollTrack: [],
          textTrack: [],
          audioTrack: [],
        },
      });

      router.push(`/dashboard/editor/${projectId}`);
    };

    video.onloadedmetadata = () => {
      finalizeProject(video.duration);
    };

    video.onerror = () => {
      finalizeProject(30);
    };

    video.src = blobUrl;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900/60 border border-indigo-500/20 backdrop-blur-xl shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Scissors className="w-3.5 h-3.5" />
            <span>CapCut-Style Studio</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Manual Video Studio
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            A high-performance multi-track video editor. Split, trim, overlay B-roll, and design animated TikTok-style subtitles with zero lag.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <label className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Upload & Edit</span>
            <input
              type="file"
              accept="video/*"
              onChange={handleQuickUpload}
              className="hidden"
            />
          </label>

          <Link
            href="/dashboard/editor/demo"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-sm transition-all"
          >
            <Play className="w-4 h-4 text-indigo-400" />
            <span>Try Sample Demo</span>
          </Link>
        </div>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-xl bg-[#0d1017]/80 border border-slate-800/80 space-y-2.5">
          <div className="h-9 w-9 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400">
            <Scissors className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Multi-Track Timeline</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Split clips instantly with the <code className="text-indigo-300">S</code> key, drag trim handles, and ripple delete unwanted sections without leaving gaps.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#0d1017]/80 border border-slate-800/80 space-y-2.5">
          <div className="h-9 w-9 rounded-lg bg-yellow-500/15 flex items-center justify-center text-yellow-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Animated Subtitles</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            One-click text overlays with TikTok yellow highlighting, Hormozi bold red badges, and cyber neon glow presets.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#0d1017]/80 border border-slate-800/80 space-y-2.5">
          <div className="h-9 w-9 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Mobile & Offline Ready</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            100% responsive for phone touchscreens. Edit offline anywhere from local device storage with zero phone battery drain.
          </p>
        </div>
      </div>
    </div>
  );
}
