"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Sparkles,
  Layers,
  Cpu,
  Activity,
  CheckCircle2,
  Clock,
  Mic,
  Film,
} from "lucide-react";
import { ProgressRing, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface PipelineStageCount {
  queued: number;
  transcribing: number;
  directing: number;
  rendering: number;
  completed: number;
  failed: number;
}

export interface PipelineMonitorProps {
  stages: PipelineStageCount;
  totalVideos: number;
  className?: string;
}

export function PipelineMonitor({
  stages,
  totalVideos,
  className,
}: PipelineMonitorProps) {
  const activeCount =
    stages.queued + stages.transcribing + stages.directing + stages.rendering;
  const completionPercentage =
    totalVideos > 0
      ? Math.round((stages.completed / (totalVideos + activeCount)) * 100)
      : 100;

  const stageBreakdown = [
    {
      label: "Queued",
      count: stages.queued,
      variant: "queued" as const,
      color: "#fbbf24",
      icon: Clock,
      sublabel: "Ingest & Queue",
    },
    {
      label: "Transcribing",
      count: stages.transcribing,
      variant: "info" as const,
      color: "#60a5fa",
      icon: Mic,
      sublabel: "WhisperX Words",
    },
    {
      label: "AI Directing",
      count: stages.directing,
      variant: "processing" as const,
      color: "#c084fc",
      icon: Sparkles,
      sublabel: "Gemini Motion & B-Roll",
    },
    {
      label: "Rendering",
      count: stages.rendering,
      variant: "rendering" as const,
      color: "#22d3ee",
      icon: Film,
      sublabel: "Remotion 4K Compositor",
    },
  ];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 sm:p-7",
        "glass-card-premium border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        className
      )}
    >
      {/* Top rim highlight */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

      {/* Ambient background glows */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-7 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
              Live Production
            </span>
            {activeCount > 0 && (
              <Badge variant="rendering" size="sm">
                {activeCount} In Pipeline
              </Badge>
            )}
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Pipeline Engine Monitor
          </h3>
          <p className="text-xs text-white/50 mt-1 max-w-xl">
            Real-time status of speech transcription, AI scene generation, and video renders
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/queue"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-white px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] shadow-sm transition-all"
          >
            <span>View Queue</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Grid: Progress Gauge + Flow Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
        {/* Left: Progress Gauge Card */}
        <div className="lg:col-span-4 flex items-center gap-5 p-5 rounded-2xl bg-[#0a0d14]/80 border border-white/[0.06] shadow-inner">
          <div className="relative shrink-0">
            <ProgressRing
              progress={completionPercentage}
              size={76}
              strokeWidth={7}
              variant="cyan"
              showValue
            />
          </div>

          <div>
            <div className="text-2xl font-black text-white tabular-nums tracking-tight">
              {completionPercentage}%
            </div>
            <div className="text-xs font-medium text-white/50">
              Pipeline throughput
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{stages.completed} rendered all-time</span>
            </div>
          </div>
        </div>

        {/* Right: Stage Step Cards */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stageBreakdown.map((s, idx) => {
            const Icon = s.icon;
            const isActive = s.count > 0;
            return (
              <div
                key={s.label}
                className={cn(
                  "relative p-4 rounded-2xl border transition-all duration-200 overflow-hidden",
                  isActive
                    ? "bg-gradient-to-b from-white/[0.06] to-white/[0.02] border-white/[0.16] shadow-[0_0_20px_rgba(6,182,212,0.12)]"
                    : "bg-white/[0.02] border-white/[0.04] opacity-60 hover:opacity-90"
                )}
              >
                {/* Active glow corner */}
                {isActive && (
                  <div
                    className="absolute top-0 right-0 w-16 h-16 rounded-full blur-xl opacity-30 pointer-events-none"
                    style={{ backgroundColor: s.color }}
                  />
                )}

                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                    {`0${idx + 1}`}
                  </span>
                  {isActive ? (
                    <span
                      className="w-2 h-2 rounded-full animate-ping"
                      style={{ backgroundColor: s.color }}
                    />
                  ) : (
                    <Icon className="w-3.5 h-3.5 text-white/20" />
                  )}
                </div>

                <div className="text-2xl font-black text-white tabular-nums">
                  {s.count}
                </div>

                <div className="text-xs font-semibold text-white/90 mt-1">
                  {s.label}
                </div>

                <div className="text-[10px] text-white/40 truncate mt-0.5">
                  {s.sublabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live production active banner */}
      {activeCount > 0 && (
        <div className="mt-5 pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white/60">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-medium text-white/80">
              Active Production:
            </span>
            <span className="text-cyan-300 font-mono text-[11px]">
              Remotion multi-track rendering & audio alignment in progress
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-white/40">
            <span>Hardware: 4-Thread Worker</span>
            <span>•</span>
            <span>Speed: 2.4x Realtime</span>
          </div>
        </div>
      )}
    </div>
  );
}
