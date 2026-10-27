"use client";

import React from "react";
import { Film, Clock, CheckCircle2, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashboardStatsRowProps {
  totalVideos: number;
  inPipeline: number;
  completed: number;
  successRate?: number;
  className?: string;
}

export function DashboardStatsRow({
  totalVideos,
  inPipeline,
  completed,
  successRate = 100,
  className,
}: DashboardStatsRowProps) {
  const cards = [
    {
      label: "Total Videos",
      value: totalVideos,
      subtext: "Studio productions",
      icon: Film,
      glowColor: "cyan",
      iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      pill: "+3 this week",
      pillClass: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      label: "In Pipeline",
      value: inPipeline,
      subtext: inPipeline === 1 ? "1 active job rendering" : `${inPipeline} active jobs rendering`,
      icon: Clock,
      glowColor: "violet",
      iconBg: "bg-violet-500/10 text-violet-400 border-violet-500/20",
      pill: inPipeline > 0 ? "⚡ Live" : "Idle",
      pillClass: inPipeline > 0 ? "text-violet-300 bg-violet-500/20 border-violet-500/30 animate-pulse" : "text-white/40 bg-white/5 border-white/10",
    },
    {
      label: "Completed",
      value: completed,
      subtext: "Ready for publish",
      icon: CheckCircle2,
      glowColor: "emerald",
      iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      pill: "100% Quality",
      pillClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Success Rate",
      value: `${successRate}%`,
      subtext: "Zero render faults",
      icon: Sparkles,
      glowColor: "amber",
      iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      pill: "Autonomous AI",
      pillClass: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className={cn(
              "group relative overflow-hidden rounded-2xl p-5",
              "glass-card-premium border border-white/[0.08]",
              "hover:border-white/[0.16] hover:translate-y-[-2px] transition-all duration-200"
            )}
          >
            {/* Top inner gradient highlight line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Ambient background glow */}
            <div
              className={cn(
                "absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-40 group-hover:opacity-75 transition-opacity pointer-events-none",
                c.glowColor === "cyan" && "bg-cyan-500/25",
                c.glowColor === "violet" && "bg-violet-500/25",
                c.glowColor === "emerald" && "bg-emerald-500/25",
                c.glowColor === "amber" && "bg-amber-500/25"
              )}
            />

            <div className="flex items-center justify-between gap-3 mb-4">
              <div
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center border shadow-inner",
                  c.iconBg
                )}
              >
                <Icon className="w-5 h-5" />
              </div>

              <span
                className={cn(
                  "text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border",
                  c.pillClass
                )}
              >
                {c.pill}
              </span>
            </div>

            <div>
              <div className="text-3xl font-extrabold text-white tracking-tight tabular-nums">
                {c.value}
              </div>
              <div className="text-xs font-semibold text-white/80 mt-1">
                {c.label}
              </div>
              <div className="text-[11px] text-white/40 mt-0.5">
                {c.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
