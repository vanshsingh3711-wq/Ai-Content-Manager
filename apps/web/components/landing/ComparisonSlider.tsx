"use client";

import React, { useState, useRef } from "react";
import { Sparkles, Zap, Volume2, MoveHorizontal } from "lucide-react";

export function ComparisonSlider() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-[11px] font-mono uppercase tracking-wider text-violet-300 mb-3 font-semibold">
          <Sparkles className="w-3 h-3 text-violet-400" />
          The Opus Clip & Runway Effect
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          See the transformation in real time
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-normal">
          Drag the slider to see how AI Director transforms flat raw footage into an
          algorithm-optimized viral short with kinetic captions, B-roll, and face-tracking.
        </p>
      </div>

      {/* Comparison Interactive Box */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onTouchMove={handleTouchMove}
        className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden border border-white/[0.12] shadow-[0_20px_70px_rgba(0,0,0,0.6)] cursor-ew-resize select-none bg-black group"
      >
        {/* RIGHT SIDE: AI DIRECTOR VIRAL OUTPUT (Full Width Background) */}
        <div className="absolute inset-0 w-full h-full">
          <video
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />

          {/* AI Overlays on Right Side */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

          {/* Glowing Kinetic Captions */}
          <div className="absolute bottom-8 right-12 z-10 flex flex-col items-center">
            <div className="px-4 py-1.5 rounded-xl bg-black/80 border-2 border-yellow-400/60 backdrop-blur-md shadow-[0_0_25px_rgba(250,204,21,0.5)]">
              <span className="text-lg md:text-2xl font-black italic tracking-wider text-yellow-300 drop-shadow">
                BUILD LIKE A PRO
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 mt-1 font-bold">
              ⚡ WORD-LEVEL WHISPER SYNC
            </span>
          </div>

          {/* B-Roll Picture-in-Picture Box */}
          <div className="absolute top-6 right-6 z-10 rounded-xl overflow-hidden border border-emerald-400/60 shadow-xl w-32 md:w-44 aspect-video bg-neutral-900 pointer-events-none">
            <div className="absolute top-1 left-1 z-20 px-1.5 py-0.5 rounded bg-emerald-500/90 text-black text-[8px] font-mono font-bold">
              SMART B-ROLL
            </div>
            <video
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-90"
            />
          </div>

          {/* Presenter Detection Box */}
          <div className="absolute top-1/3 right-1/4 w-28 h-32 border border-emerald-400/80 rounded-lg pointer-events-none animate-pulse">
            <div className="absolute -top-4 left-0 bg-emerald-500 text-black text-[8px] font-mono font-extrabold px-1 rounded">
              AUTO-CENTERED
            </div>
          </div>

          {/* Label Tag */}
          <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-violet-600/90 border border-violet-400 text-white text-[11px] font-bold shadow-lg flex items-center gap-1.5">
            <Zap className="w-3 h-3 fill-white" />
            <span>AI Director Engine</span>
            <span className="text-emerald-300 font-mono">+84% Watch Time</span>
          </div>
        </div>

        {/* LEFT SIDE: RAW FOOTAGE (Clipped by CSS clipPath) */}
        <div
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          className="absolute inset-0 z-20 bg-neutral-950 pointer-events-none"
        >
          <video
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover grayscale brightness-75 contrast-90"
          />
          {/* Raw Footage Label */}
          <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full bg-black/80 border border-white/20 text-neutral-300 text-[11px] font-semibold shadow">
            <span>Raw Camera Footage (Uncut)</span>
            <span className="text-red-400 font-mono ml-2">Low Retention</span>
          </div>

          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 text-neutral-400 text-xs font-mono bg-black/75 px-3 py-1.5 rounded-lg border border-white/10">
            <Volume2 className="w-3.5 h-3.5 text-neutral-500" />
            <span>Flat audio • 0 visual hooks • 16:9 crop</span>
          </div>
        </div>

        {/* DRAGGABLE SLIDER LINE & HANDLE */}
        <div
          style={{ left: `${sliderPosition}%` }}
          className="absolute top-0 bottom-0 z-30 -ml-[1px] w-[2px] bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] flex items-center justify-center pointer-events-none"
        >
          <div className="w-8 h-8 rounded-full bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.8)] border border-neutral-300 flex items-center justify-center pointer-events-auto cursor-ew-resize hover:scale-110 active:scale-95 transition-transform">
            <MoveHorizontal className="w-4 h-4 text-black" />
          </div>
        </div>
      </div>

      {/* Slider Hint */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500 font-mono px-2">
        <span>← Drag left: Reveal AI Director output</span>
        <span>Drag right: Inspect raw footage →</span>
      </div>
    </section>
  );
}
