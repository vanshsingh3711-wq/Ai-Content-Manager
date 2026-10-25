"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Scissors,
  Upload,
  Play,
  ArrowRight,
  Sparkles,
  Film,
  Type,
  Music,
  Layers,
  Zap,
  Clock,
  Smartphone,
  Monitor,
  Square,
  Keyboard,
  CheckCircle2,
} from "lucide-react";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { getPresetProject } from "@/lib/editor/editor-presets";

export default function EditorLauncherPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);

  const processVideoFile = (file: File) => {
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

  const handleQuickUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processVideoFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      processVideoFile(file);
    }
  };

  const launchPreset = (presetId: string) => {
    const preset = getPresetProject(presetId);
    useTimelineStore.getState().initProject(preset);
    router.push(`/dashboard/editor/${presetId}`);
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto py-6 px-4 sm:px-6 select-none">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-[10px] font-mono uppercase tracking-wider text-violet-300 mb-3">
            <Sparkles className="w-3 h-3 text-violet-400 animate-pulse" />
            <span>AI Non-Linear Studio</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Studio Video Editor
          </h1>
          <p className="text-sm text-neutral-400 mt-2 max-w-xl leading-relaxed">
            Autonomous multi-track timeline with kinetic captions, automated B-roll insertion,
            face tracking reframing, and lossless 4K export.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/editor/demo"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-white text-xs font-semibold transition-all hover:scale-[1.02] shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Launch Live Demo</span>
          </Link>
        </div>
      </div>

      {/* ── Main Launchpad Hero (2 Columns) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Upload & Edit Dropzone */}
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`lg:col-span-6 group cursor-pointer p-7 rounded-2xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${
            isDragging
              ? "border-violet-400 bg-violet-950/30 shadow-[0_0_35px_rgba(124,58,237,0.35)] scale-[1.01]"
              : "border-white/[0.08] bg-[#0d1017]/90 hover:border-violet-500/60 hover:shadow-[0_0_30px_rgba(124,58,237,0.2)]"
          }`}
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-16 -right-16 w-44 h-44 bg-violet-600/15 rounded-full blur-3xl pointer-events-none group-hover:bg-violet-600/25 transition-all" />

          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600/30 to-fuchsia-600/20 border border-violet-500/40 flex items-center justify-center text-violet-300 shadow-[0_0_20px_rgba(124,58,237,0.25)] group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-neutral-400 group-hover:text-white group-hover:border-white/20 transition-all">
                <span>Browse files</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
              Upload Video to Edit
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-6">
              Drop raw video footage from your device. The editor auto-creates a multi-track
              project with Whisper transcription and waveform analysis.
            </p>
          </div>

          <div className="space-y-4">
            {/* Visual dashed drop indicator */}
            <div className="border border-dashed border-white/[0.12] group-hover:border-violet-500/50 rounded-xl p-4 text-center bg-black/30 transition-colors">
              <p className="text-xs font-semibold text-neutral-300">
                Drag and drop your video file here
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">
                MP4, MOV, WebM, ProRes • Up to 4K resolution at 60fps
              </p>
            </div>

            {/* Quick badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-neutral-400">
              <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                ✓ Auto-Split
              </span>
              <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                ✓ Multi-Track
              </span>
              <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                ✓ Zero Loss Transcode
              </span>
            </div>
          </div>

          <input
            type="file"
            accept="video/*"
            onChange={handleQuickUpload}
            className="hidden"
          />
        </label>

        {/* Card 2: Interactive Live Sample Demo with Video Reel */}
        <Link
          href="/dashboard/editor/demo"
          className="lg:col-span-6 group p-7 rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-[#0e1626]/90 to-[#070b14]/95 hover:border-cyan-400 hover:shadow-[0_0_35px_rgba(6,182,212,0.3)] transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
        >
          {/* Cyan Glow Effect */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/25 transition-all" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                  Ready to Edit • Interactive Demo
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
              Try Pre-Loaded Demo Project
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-4">
              Explore the NLE editor immediately with a fully loaded sample project: 4 tracks,
              animated kinetic captions, B-roll overlays, and Lo-Fi audio.
            </p>
          </div>

          {/* Interactive Mini Preview Frame with Live Video */}
          <div className="w-full rounded-xl overflow-hidden border border-white/[0.1] bg-black relative aspect-[16/8] flex items-center justify-center shadow-lg group-hover:border-cyan-400/60 transition-colors">
            <video
              src="/demo_creator_reel.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-cyan-500/90 text-black flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.8)] group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 fill-black ml-0.5" />
              </div>
            </div>

            {/* Bottom Mini Status */}
            <div className="absolute bottom-2 inset-x-3 flex items-center justify-between text-[10px] font-mono text-neutral-300 pointer-events-none">
              <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-white/10 font-bold text-white">
                Compound Interest Explained
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 font-bold">
                20.0s • 4 Tracks
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* ── 1-Click Starter Presets ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>Quick Start Presets</span>
          </h2>
          <span className="text-[11px] font-mono text-neutral-500">1-Click New Timeline</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Preset 1: Viral Short */}
          <button
            data-testid="preset-viral"
            onClick={() => launchPreset("preset-viral")}
            className="p-4 rounded-xl bg-[#0d1017]/90 border border-white/[0.08] hover:border-violet-500/60 hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] hover:-translate-y-0.5 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-violet-950/60 text-violet-300 border border-violet-500/30">
                9:16
              </span>
            </div>
            <h3 className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">
              Viral Short / TikTok
            </h3>
            <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
              Auto-face tracking, kinetic captions & hook badges for mobile feeds.
            </p>
          </button>

          {/* Preset 2: Podcast Highlight */}
          <button
            data-testid="preset-podcast"
            onClick={() => launchPreset("preset-podcast")}
            className="p-4 rounded-xl bg-[#0d1017]/90 border border-white/[0.08] hover:border-cyan-500/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:-translate-y-0.5 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                <Music className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                9:16
              </span>
            </div>
            <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
              Podcast Clip & Waves
            </h3>
            <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
              Audio waveform visualization with dual-speaker subtitle reframing.
            </p>
          </button>

          {/* Preset 3: YouTube Explainer */}
          <button
            data-testid="preset-youtube"
            onClick={() => launchPreset("preset-youtube")}
            className="p-4 rounded-xl bg-[#0d1017]/90 border border-white/[0.08] hover:border-emerald-500/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:-translate-y-0.5 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                <Monitor className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                16:9
              </span>
            </div>
            <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
              YouTube Explainer
            </h3>
            <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
              Widescreen 16:9 canvas with cinematic B-roll layers and lower thirds.
            </p>
          </button>

          {/* Preset 4: Product Ad */}
          <button
            data-testid="preset-product"
            onClick={() => launchPreset("preset-product")}
            className="p-4 rounded-xl bg-[#0d1017]/90 border border-white/[0.08] hover:border-amber-500/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:-translate-y-0.5 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                <Square className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
                1:1
              </span>
            </div>
            <h3 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
              Product Ad / Square
            </h3>
            <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
              Square feed carousel format with rapid beat cuts and motion titles.
            </p>
          </button>
        </div>
      </div>

      {/* ── Recent Timeline Projects ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-400" />
            <span>Recent Studio Projects</span>
          </h2>
          <Link
            href="/dashboard/videos"
            className="text-[11px] font-mono text-neutral-400 hover:text-white transition-colors"
          >
            View all videos →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Project 1 */}
          <Link
            href="/dashboard/editor/demo"
            className="p-4 rounded-xl bg-[#0d1017]/90 border border-white/[0.08] hover:border-white/20 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-12 rounded-lg overflow-hidden bg-black relative shrink-0 border border-white/[0.08]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/demo_thumbs/thumb_friends.jpg"
                  alt="Compound Interest"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                  Compound Interest Explained
                </h3>
                <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 mt-0.5">
                  <span className="text-cyan-400 font-semibold">9:16</span>
                  <span>•</span>
                  <span>20.0s</span>
                  <span>•</span>
                  <span>4 tracks</span>
                  <span>•</span>
                  <span>Edited today</span>
                </div>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] group-hover:bg-violet-600 group-hover:border-violet-500 text-xs font-semibold text-white/80 group-hover:text-white transition-all">
              Resume
            </div>
          </Link>

          {/* Project 2 */}
          <Link
            href="/dashboard/editor/demo"
            className="p-4 rounded-xl bg-[#0d1017]/90 border border-white/[0.08] hover:border-white/20 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-12 rounded-lg overflow-hidden bg-black relative shrink-0 border border-white/[0.08]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/demo_thumbs/thumb_walk.jpg"
                  alt="Viral TikTok Reel"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                  Golden Hour Mindset Short
                </h3>
                <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 mt-0.5">
                  <span className="text-cyan-400 font-semibold">9:16</span>
                  <span>•</span>
                  <span>10.0s</span>
                  <span>•</span>
                  <span>3 tracks</span>
                  <span>•</span>
                  <span>Sample</span>
                </div>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] group-hover:bg-violet-600 group-hover:border-violet-500 text-xs font-semibold text-white/80 group-hover:text-white transition-all">
              Resume
            </div>
          </Link>
        </div>
      </div>

      {/* ── Studio Pro Features (Bento Grid) ── */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-300 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Editor Capabilities</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Feature 1 */}
          <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0d1017]/90 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
              <Scissors className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white">Multi-Track Timeline</h3>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Split clips with <kbd className="px-1 py-0.5 rounded bg-white/[0.08] text-white font-mono text-[9px]">S</kbd>,
              drag trim handles, and ripple delete without leaving blank gaps.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0d1017]/90 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <Type className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white">Kinetic Captions</h3>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Hormozi bold, TikTok yellow, and neon glow presets with word-level synced highlights.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0d1017]/90 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
              <Film className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white">Smart B-Roll & Safe Zones</h3>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              MediaPipe presenter avoidance boundaries so captions never block the speaker&apos;s face.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0d1017]/90 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white">60fps Lossless 4K</h3>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Hardware keyframe seeking with instantaneous scrubbing and 1-click Remotion render.
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom Keyboard Shortcuts Guide ── */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-neutral-300" />
          <span className="font-semibold text-neutral-200">Pro Editor Shortcuts:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white">Space</kbd> Play / Pause
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white">S</kbd> Split Clip
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white">Delete</kbd> Remove
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white">Cmd+K</kbd> AI Copilot
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white">Cmd+Z</kbd> Undo
          </span>
        </div>
      </div>
    </div>
  );
}
