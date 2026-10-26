"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";

export function HeroSection() {
  const [captionIdx, setCaptionIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const brollRef = useRef<HTMLVideoElement | null>(null);

  const captionSets = [
    ["This AI tool", "is insane!", "+84% Watch", "Time!"],
    ["Turn 1 video", "into 10 shorts", "in 60 seconds", "Autopilot!"],
    ["Auto B-roll", "spliced on beat", "viral captions", "1-click export!"],
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCaptionIdx((prev) => (prev + 1) % captionSets.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [captionSets.length]);

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      brollRef.current?.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      brollRef.current?.play();
      setIsPlaying(true);
    }
  };

  return (
    <section className="relative w-full pt-8 pb-20 px-6 sm:px-10 lg:px-16 max-w-[1400px] mx-auto overflow-hidden select-none">
      {/* ── Ambient Radial Lighting Spills (Proposal 3 Mockup Style) ── */}
      <div className="absolute top-0 -left-20 w-[600px] h-[600px] bg-gradient-to-br from-purple-700/40 via-fuchsia-600/20 to-transparent blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 -right-20 w-[650px] h-[650px] bg-gradient-to-tl from-cyan-500/40 via-teal-500/20 to-transparent blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* ── 2-Column Grid (Left: Copy & CTA | Right: Live 3D Video Showcase) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center min-h-[640px]">
        {/* ══════════════════════════════════════════════════════
            LEFT COLUMN: Copy, CTA, Modality Pills, and Press Logos
        ══════════════════════════════════════════════════════ */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-start text-left z-10">
          {/* Universal Modality Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-[11px] font-mono uppercase tracking-wider text-cyan-300 mb-5 font-semibold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Autonomous Creator Engine • Audio, Script & Raw Video
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[66px] font-extrabold tracking-tight text-white mb-6 leading-[1.06]">
            Auto-Edit Videos From{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-purple-400">
              Audio, Script, or Raw Video
            </span>
          </h1>

          <p className="text-base sm:text-lg text-neutral-300 max-w-xl mb-6 leading-relaxed font-normal">
            Whether you have a 30-minute podcast episode, a written script idea, or raw camera footage — AI Director automatically cuts silences, sources 4K B-roll, inserts motion graphics, and renders kinetic karaoke captions in 60s.
          </p>

          {/* 3 Universal Modality Badges */}
          <div className="w-full max-w-lg grid grid-cols-3 gap-2 mb-8">
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-cyan-500/30 hover:border-cyan-400/60 transition-all flex flex-col gap-1">
              <span className="text-sm">🎙️</span>
              <span className="text-[11px] font-bold text-white tracking-tight">Audio Ingest</span>
              <span className="text-[10px] text-neutral-400 font-mono leading-tight">Podcasts, Voice Notes</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-purple-500/30 hover:border-purple-400/60 transition-all flex flex-col gap-1">
              <span className="text-sm">📝</span>
              <span className="text-[11px] font-bold text-white tracking-tight">Script Ingest</span>
              <span className="text-[10px] text-neutral-400 font-mono leading-tight">Ideas, Prompts, Blogs</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-emerald-500/30 hover:border-emerald-400/60 transition-all flex flex-col gap-1">
              <span className="text-sm">📹</span>
              <span className="text-[11px] font-bold text-white tracking-tight">Raw Video</span>
              <span className="text-[10px] text-neutral-400 font-mono leading-tight">Footage, Talking Head</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-12">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-extrabold text-sm hover:bg-neutral-100 transition-all shadow-[0_0_35px_rgba(6,182,212,0.55)] hover:shadow-[0_0_50px_rgba(6,182,212,0.85)] active:scale-95"
            >
              <span>Start Auto-Editing Free</span>
              <span className="text-base">→</span>
            </Link>
            <Link
              href="/dashboard/editor"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-full bg-white/[0.05] border border-white/[0.12] text-white hover:bg-white/[0.1] font-semibold text-sm transition-all"
            >
              <span>Explore Studio Editor</span>
            </Link>
          </div>

          {/* Social Proof */}
          <div className="flex items-center gap-8 sm:gap-10">
            {/* Awwwards Winner Laurel */}
            <div className="flex items-center gap-2.5">
              <svg className="w-8 h-8 text-white shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                <path d="M4.5 9.5a4 4 0 0 1 7-2.5 4 4 0 0 1 7 2.5" />
                <path d="M4.5 14.5a4 4 0 0 0 7 2.5 4 4 0 0 0 7-2.5" />
              </svg>
              <div className="leading-tight">
                <div className="text-[12px] font-bold text-white tracking-tight">Awwwards</div>
                <div className="text-[11px] text-neutral-400 font-medium">Winner</div>
              </div>
            </div>

            {/* TechCrunch */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-black font-black text-sm tracking-tighter">
                TC
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                TechCrunch
              </span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            RIGHT COLUMN: Live 3D Playing Video Smartphone Showcase
        ══════════════════════════════════════════════════════ */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="lg:col-span-6 xl:col-span-6 relative flex items-center justify-center lg:justify-end pr-0 lg:pr-8"
        >
          {/* Background Cyber Grid Behind Phone */}
          <div
            className="absolute -right-8 top-1/4 w-[460px] h-[460px] pointer-events-none opacity-25 z-0"
            style={{
              backgroundImage: `linear-gradient(to right, #06b6d4 1px, transparent 1px),
                                linear-gradient(to bottom, #06b6d4 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />

          {/* Floating Tilted Purple Diamond Plate */}
          <div className="absolute top-4 right-16 w-52 h-52 rounded-3xl bg-gradient-to-tr from-purple-600/30 to-fuchsia-600/10 border border-purple-500/40 backdrop-blur-xl rotate-45 pointer-events-none z-0 shadow-[0_0_40px_rgba(168,85,247,0.25)]" />

          {/* Floating Tilted Cyan Diamond Plate */}
          <div className="absolute bottom-6 right-2 w-48 h-48 rounded-3xl bg-gradient-to-tr from-cyan-500/30 to-blue-600/10 border border-cyan-400/40 backdrop-blur-xl -rotate-12 pointer-events-none z-0 shadow-[0_0_40px_rgba(6,182,212,0.25)]" />

          {/* ── Main Smartphone Container ── */}
          <div
            style={{
              transform: isHovered
                ? "perspective(1100px) rotateY(-3deg) rotateX(2deg) scale(1.02)"
                : "perspective(1100px) rotateY(-6deg) rotateX(3deg) scale(1)",
              transition: "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
            }}
            className="relative w-full max-w-[340px] sm:max-w-[370px] aspect-[9/18.5] z-10"
          >
            {/* FLOATING WIDGET 1: +84% WATCH TIME (Top-Left of Phone) */}
            <div className="absolute -left-8 sm:-left-12 top-14 z-40 px-4 py-2.5 rounded-2xl bg-[#0e121e]/95 border-2 border-fuchsia-500/80 shadow-[0_0_30px_rgba(217,70,239,0.55)] backdrop-blur-2xl flex flex-col justify-center animate-bounce [animation-duration:5s]">
              <div className="flex items-center gap-1.5 text-white font-mono font-black text-lg leading-none">
                <span>+84%</span>
                <span className="text-fuchsia-400 text-base">↗</span>
              </div>
              <div className="text-[9px] font-mono font-bold text-neutral-300 uppercase tracking-widest mt-1">
                Target Retention
              </div>
            </div>

            {/* FLOATING WIDGET 2: HOOK SCORE PREVIEW (Bottom-Right of Phone) */}
            <div className="absolute -right-6 sm:-right-8 bottom-24 z-40 px-4 py-2.5 rounded-2xl bg-[#0e121e]/95 border-2 border-cyan-400/90 shadow-[0_0_35px_rgba(6,182,212,0.6)] backdrop-blur-2xl flex flex-col justify-center animate-bounce [animation-duration:6s]">
              <div className="flex items-center gap-1.5 text-white font-mono font-black text-lg leading-none">
                <span className="text-cyan-400 text-xs tracking-tighter">lll</span>
                <span>99.4</span>
              </div>
              <div className="text-[9px] font-mono font-bold text-cyan-300 uppercase tracking-widest mt-1">
                Simulated Hook
              </div>
            </div>

            {/* FLOATING WIDGET 3: PICTURE-IN-PICTURE 4K B-ROLL (Bottom-Left of Phone) */}
            <div className="absolute -left-12 sm:-left-16 bottom-10 z-40 w-44 sm:w-48 aspect-[16/10] rounded-2xl overflow-hidden border-2 border-cyan-400/80 shadow-[0_15px_40px_rgba(0,0,0,0.95)] bg-black">
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-cyan-400/60 flex items-center gap-1.5 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[8px] font-mono font-bold text-cyan-300 uppercase tracking-wider">AI B-Roll 4K</span>
              </div>
              <video
                ref={brollRef}
                src="/demo_broll_scenic.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>

            {/* ── THE METALLIC CYAN SMARTPHONE BEZEL ── */}
            <div className="relative w-full h-full rounded-[44px] p-2.5 bg-gradient-to-b from-[#1a2336] via-[#0d121c] to-[#06080d] border-[3px] border-cyan-400/80 shadow-[0_0_60px_rgba(6,182,212,0.45),0_30px_90px_rgba(0,0,0,0.95)] backdrop-blur-3xl">
              {/* Dynamic Island / Speaker Notch */}
              <div className="absolute top-4 inset-x-0 z-30 flex justify-center pointer-events-none">
                <div className="w-24 h-4 bg-black rounded-full border border-white/10 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-neutral-900 border border-neutral-700" />
                  <div className="w-10 h-1 bg-neutral-800 rounded-full" />
                </div>
              </div>

              {/* Real Playing Video Inside Screen */}
              <div className="relative w-full h-full rounded-[36px] overflow-hidden bg-black flex items-center justify-center">
                <video
                  ref={videoRef}
                  src="/demo_creator_reel.mp4"
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  onClick={togglePlay}
                  className="w-full h-full object-cover cursor-pointer"
                />

                {/* Dark Contrast Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                {/* Cyan Face-Tracking Reticle [ ] with AI Lock Tag */}
                <div className="absolute top-[32%] left-[54%] -translate-x-1/2 w-32 sm:w-36 h-36 sm:h-40 border-2 border-cyan-400/90 rounded-2xl pointer-events-none animate-radar-pulse z-20">
                  <div className="w-2.5 h-2.5 border-t-2 border-l-2 border-white absolute -top-1 -left-1" />
                  <div className="w-2.5 h-2.5 border-t-2 border-r-2 border-white absolute -top-1 -right-1" />
                  <div className="w-2.5 h-2.5 border-b-2 border-l-2 border-white absolute -bottom-1 -left-1" />
                  <div className="w-2.5 h-2.5 border-b-2 border-r-2 border-white absolute -bottom-1 -right-1" />

                  {/* AI Face Lock Tag */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-cyan-500/90 text-[8px] font-mono font-black text-black tracking-widest uppercase shadow-[0_0_10px_rgba(6,182,212,0.8)] whitespace-nowrap">
                    AI FACE LOCK 99.8%
                  </div>
                </div>

                {/* High-Energy Yellow Kinetic Captions */}
                <div className="absolute bottom-28 inset-x-4 z-20 flex flex-col items-center pointer-events-none">
                  <div className="text-center font-black italic tracking-wide text-yellow-300 drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] animate-caption-pop">
                    {captionSets[captionIdx].map((line, i) => (
                      <div key={i} className="text-xl sm:text-2xl leading-tight">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sound & Play Controls (Bottom-Right) */}
                <div className="absolute bottom-5 right-4 z-30 flex items-center gap-1.5">
                  <button
                    onClick={toggleMute}
                    className="p-2.5 rounded-full bg-black/80 border border-white/20 text-white hover:text-cyan-400 transition-colors cursor-pointer shadow-lg"
                    title={isMuted ? "Unmute Sound" : "Mute Sound"}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                  </button>

                  <button
                    onClick={togglePlay}
                    className="p-2.5 rounded-full bg-black/80 border border-white/20 text-white hover:text-cyan-400 transition-colors cursor-pointer shadow-lg"
                    title={isPlaying ? "Pause Video" : "Play Video"}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Soft Floor Reflection */}
            <div className="absolute -bottom-6 inset-x-6 h-12 bg-gradient-to-b from-cyan-400/20 to-transparent blur-xl pointer-events-none -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
