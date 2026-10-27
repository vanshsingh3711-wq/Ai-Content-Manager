"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Upload,
  Scissors,
  Zap,
  ArrowRight,
  Flame,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuickActionsProps {
  onOpenUpload?: () => void;
  className?: string;
}

export function QuickActions({ onOpenUpload, className }: QuickActionsProps) {
  const actions = [
    {
      title: "Faceless AI Video",
      category: "Full Autonomous AI",
      description:
        "Input a script or idea. AI directs voiceover, character styling, b-roll, motion cards, and timed captions.",
      href: "/dashboard/create",
      icon: Sparkles,
      iconColor: "#c084fc",
      gradientClass: "from-violet-500/20 via-purple-500/5 to-transparent",
      borderGlow: "group-hover:border-violet-500/40 group-hover:shadow-[0_0_24px_rgba(168,85,247,0.18)]",
      iconBg: "bg-violet-500/10 text-violet-300 border-violet-500/25",
      shortcut: "⌘1",
      tags: ["Script to Video", "Auto B-Roll", "9:16 & 16:9"],
    },
    {
      title: "Upload & Enhance Footage",
      category: "Talking Head & Raw",
      description:
        "Upload raw speech or camera footage. AI Director trims dead pauses, adds motion graphics, and inserts SFX.",
      href: "/dashboard/create?mode=upload",
      onClick: onOpenUpload,
      icon: Upload,
      iconColor: "#22d3ee",
      gradientClass: "from-cyan-500/20 via-teal-500/5 to-transparent",
      borderGlow: "group-hover:border-cyan-500/40 group-hover:shadow-[0_0_24px_rgba(6,182,212,0.18)]",
      iconBg: "bg-cyan-500/10 text-cyan-300 border-cyan-500/25",
      shortcut: "⌘2",
      tags: ["Silence Removal", "Kinetic Captions", "Sound Design"],
    },
    {
      title: "Studio NLE Editor",
      category: "Manual Precision",
      description:
        "Fine-tune transitions, remap audio ducking, retime text elements, and preview live on the Remotion player.",
      href: "/dashboard/editor",
      icon: Scissors,
      iconColor: "#f472b6",
      gradientClass: "from-pink-500/20 via-rose-500/5 to-transparent",
      borderGlow: "group-hover:border-pink-500/40 group-hover:shadow-[0_0_24px_rgba(244,114,182,0.18)]",
      iconBg: "bg-pink-500/10 text-pink-300 border-pink-500/25",
      shortcut: "⌘3",
      tags: ["Multi-Track", "Remotion Compositor", "AI Copilot"],
    },
    {
      title: "Viral Presets & Formats",
      category: "Proven Retention",
      description:
        "Launch high-performing formats like Feynman Educational Shorts (60s), Finance Deep Dives, or Tech Reels.",
      href: "/dashboard/create?tab=presets",
      icon: Zap,
      iconColor: "#fbbf24",
      gradientClass: "from-amber-500/20 via-yellow-500/5 to-transparent",
      borderGlow: "group-hover:border-amber-500/40 group-hover:shadow-[0_0_24px_rgba(251,191,36,0.18)]",
      iconBg: "bg-amber-500/10 text-amber-300 border-amber-500/25",
      shortcut: "⌘4",
      tags: ["Feynman Style", "Finance 16:9", "Shorts 9:16"],
    },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Creation Substrates
          </h3>
          <p className="text-xs text-white/50 mt-1">
            Choose a starting point to produce studio-grade video in minutes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.title}
              href={act.href}
              onClick={(e) => {
                if (act.onClick) {
                  e.preventDefault();
                  act.onClick();
                }
              }}
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-2xl"
            >
              <div
                className={cn(
                  "relative h-full flex flex-col justify-between p-6 rounded-2xl",
                  "glass-card-premium border border-white/[0.08]",
                  "hover:-translate-y-1 transition-all duration-200 overflow-hidden",
                  act.borderGlow
                )}
              >
                {/* Top edge gradient sheen */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                {/* Subtle corner radial gradient */}
                <div
                  className={cn(
                    "absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-30 group-hover:opacity-60 transition-opacity pointer-events-none bg-gradient-to-br",
                    act.gradientClass
                  )}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-105",
                        act.iconBg
                      )}
                    >
                      <Icon className="w-5 h-5" style={{ color: act.iconColor }} />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-white/30 px-1.5 py-0.5 rounded border border-white/[0.06] bg-white/[0.02]">
                        {act.shortcut}
                      </span>
                      <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>

                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                    {act.category}
                  </span>

                  <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors mt-1">
                    {act.title}
                  </h4>

                  <p className="text-xs text-white/50 mt-2.5 leading-relaxed line-clamp-3">
                    {act.description}
                  </p>
                </div>

                <div className="relative z-10 mt-5 pt-4 border-t border-white/[0.05] flex flex-wrap gap-1.5">
                  {act.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-white/50 group-hover:text-white/70 transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
