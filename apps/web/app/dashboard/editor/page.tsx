"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Scissors,
  Upload,
  Play,
  ArrowRight,
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
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-2">Workspace</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Studio Editor</h1>
        <p className="text-sm text-neutral-500 mt-2">
          A multi-track video editor. Split, trim, overlay B-roll, and design animated captions.
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="group cursor-pointer p-8 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-neutral-600 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <Upload className="w-5 h-5 text-neutral-400" />
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-700 group-hover:text-white transition-colors" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Upload & Edit</h2>
          <p className="text-sm text-neutral-500 leading-relaxed">
            Drop a video file from your device. Opens the full editor with your clip on the timeline.
          </p>
          <input
            type="file"
            accept="video/*"
            onChange={handleQuickUpload}
            className="hidden"
          />
        </label>

        <Link
          href="/dashboard/editor/demo"
          className="group p-8 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-neutral-600 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <Play className="w-5 h-5 text-neutral-400" />
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-700 group-hover:text-white transition-colors" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Try Sample Demo</h2>
          <p className="text-sm text-neutral-500 leading-relaxed">
            Explore the editor with a pre-loaded demo project. No upload needed.
          </p>
        </Link>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-950 space-y-3">
          <Scissors className="w-5 h-5 text-neutral-500" />
          <h3 className="text-sm font-medium text-white">Multi-Track Timeline</h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Split clips with <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-white text-[10px] font-mono">S</kbd>, drag trim handles, ripple delete without gaps.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-950 space-y-3">
          <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <h3 className="text-sm font-medium text-white">Animated Captions</h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            TikTok-style highlighting, bold badges, and neon glow presets — one click.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-950 space-y-3">
          <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h3 className="text-sm font-medium text-white">Mobile Ready</h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Fully responsive for touchscreens. Edit from any device, offline.
          </p>
        </div>
      </div>
    </div>
  );
}
