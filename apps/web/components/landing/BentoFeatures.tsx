"use client";

import React from "react";
import {
  Wand2,
  Cpu,
  Layers,
  Share2,
  CheckCircle2,
  ArrowUpRight,
  Gauge,
  TrendingUp,
} from "lucide-react";

export function BentoFeatures() {
  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-16">
      {/* Section Header */}
      <div className="text-left mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-[11px] font-mono uppercase tracking-wider text-violet-300 mb-3 font-semibold">
          <Layers className="w-3 h-3 text-violet-400" />
          The Linear & Runway Engine Architecture
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Engineered for autonomous virality
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-xl leading-relaxed">
          Every layer of the AI Director pipeline is designed for maximum viewer retention,
          precision audio sync, and rapid GPU compilation.
        </p>
      </div>

      {/* Asymmetric Linear-Style Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* BENTO 1: Large Card (2 Cols) — Semantic Hook & Whisper Analysis */}
        <div className="md:col-span-2 rounded-2xl p-6 bg-gradient-to-br from-[#121624] to-[#0a0d16] border border-white/[0.1] hover:border-violet-500/50 shadow-xl transition-all duration-300 group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-300">
                  <Wand2 className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Semantic Hook Intelligence</h3>
                  <p className="text-[11px] text-neutral-400 font-mono">Whisper AI + Claude 3.5 Sonnet</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                HOOK SCORE: 9.8/10
              </span>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed mb-6 font-normal">
              Detects emotional peaks, punchlines, and narrative cliffhangers in long footage.
              Automatically trims filler words and awkward dead-air pauses down to the millisecond.
            </p>

            {/* Interactive Audio Waveform Hook Box */}
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/[0.08] flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span>00:00.0 (Silence Trimmed)</span>
                <span className="text-violet-400 font-bold">VIRAL HOOK DETECTED [00:01.4 - 00:04.8]</span>
                <span>00:12.0</span>
              </div>
              {/* Simulated Waveform Peaks */}
              <div className="h-10 flex items-center gap-1 overflow-hidden px-1">
                {[12, 18, 8, 24, 38, 44, 40, 36, 14, 28, 42, 38, 20, 10, 34, 42, 40, 18, 12, 28, 36, 22, 14, 18].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}px` }}
                    className={`flex-1 rounded-full transition-all ${
                      i >= 4 && i <= 12
                        ? "bg-gradient-to-t from-violet-500 to-fuchsia-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]"
                        : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-500">
            <span>Automatic speech-to-text with timestamps</span>
            <span className="text-white font-mono flex items-center gap-1 group-hover:text-violet-400 transition-colors">
              Explore speech pipeline <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* BENTO 2: Tall Card (1 Col) — Smart 4K B-Roll & Visual Overlays */}
        <div className="rounded-2xl p-6 bg-gradient-to-br from-[#121624] to-[#0a0d16] border border-white/[0.1] hover:border-cyan-500/50 shadow-xl transition-all duration-300 group flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 mb-4">
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>

            <h3 className="text-sm font-bold text-white mb-1.5">Smart 4K B-Roll Splicing</h3>
            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
              Auto-queries Pexels and Remotion templates for semantic keywords and overlays
              high-impact graphics.
            </p>

            {/* Visual Media Chip Simulation */}
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-black/60 border border-white/[0.08] flex items-center justify-between text-xs">
                <span className="text-cyan-300 font-mono text-[11px]">“Wall Street bull”</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">4K 60FPS</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/60 border border-white/[0.08] flex items-center justify-between text-xs">
                <span className="text-purple-300 font-mono text-[11px]">“Exponential chart”</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">Remotion FX</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-500">
            <span>Zero manual b-roll searches</span>
            <span className="text-cyan-400 font-mono flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Sourcing v2 <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* BENTO 3: Tall Card (1 Col) — Hardware NVENC GPU Render */}
        <div className="rounded-2xl p-6 bg-gradient-to-br from-[#121624] to-[#0a0d16] border border-white/[0.1] hover:border-emerald-500/50 shadow-xl transition-all duration-300 group flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 mb-4">
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>

            <h3 className="text-sm font-bold text-white mb-1.5">NVENC GPU Acceleration</h3>
            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
              Hardware video encoding with NVIDIA NVENC deployed on AWS ECS. Renders in 4.8x real-time speed.
            </p>

            {/* Performance Gauge */}
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/[0.08] flex items-center justify-between">
              <div>
                <div className="text-2xl font-black text-white font-mono">00:04.2s</div>
                <div className="text-[10px] text-emerald-400 font-mono">Render duration for 60s cut</div>
              </div>
              <Gauge className="w-8 h-8 text-emerald-400 shrink-0" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-500">
            <span>Automatic CPU fallback safe</span>
            <span className="text-emerald-400 font-mono font-bold">4.8x Speed</span>
          </div>
        </div>

        {/* BENTO 4: Large Card (2 Cols) — Multi-Platform Auto-Publisher */}
        <div className="md:col-span-2 rounded-2xl p-6 bg-gradient-to-br from-[#121624] to-[#0a0d16] border border-white/[0.1] hover:border-fuchsia-500/50 shadow-xl transition-all duration-300 group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-fuchsia-600/20 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-300">
                  <Share2 className="w-4 h-4 text-fuchsia-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">1-Click Multi-Platform Auto-Publish</h3>
                  <p className="text-[11px] text-neutral-400 font-mono">OAuth2 Direct Pipeline Integration</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-300 text-[10px] font-mono font-bold">
                SYNCED ACCOUNTS
              </span>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed mb-6 font-normal">
              Schedule or immediately publish across all your connected creator accounts.
              Formats aspect ratios, title tags, hashtags, and thumbnails automatically.
            </p>

            {/* Connected Platform Status Simulation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-black/60 border border-white/[0.08] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">TikTok</div>
                  <div className="text-[10px] text-emerald-400 font-mono">● Auto-Published</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="p-3 rounded-xl bg-black/60 border border-white/[0.08] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">YouTube Shorts</div>
                  <div className="text-[10px] text-cyan-400 font-mono">● Scheduled 6:00 PM</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="p-3 rounded-xl bg-black/60 border border-white/[0.08] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Instagram Reels</div>
                  <div className="text-[10px] text-emerald-400 font-mono">● Auto-Published</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-500">
            <span>Unified analytics tracking coming soon</span>
            <span className="text-white font-mono flex items-center gap-1 group-hover:text-fuchsia-400 transition-colors">
              Manage accounts <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
