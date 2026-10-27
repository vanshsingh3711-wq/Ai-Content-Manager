"use client";

import React from "react";
import { Sparkles, Upload, Zap, Globe, Check } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

export type CreationPath = "faceless" | "upload" | "template" | "url";

export interface PathSelectorProps {
  selectedPath: CreationPath;
  onSelect: (path: CreationPath) => void;
  className?: string;
}

export function PathSelector({
  selectedPath,
  onSelect,
  className,
}: PathSelectorProps) {
  const paths: Array<{
    id: CreationPath;
    title: string;
    badge: string;
    badgeVariant: "rendering" | "done" | "info" | "neutral";
    description: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    iconColor: string;
    glow: "violet" | "cyan" | "white" | "none";
    features: string[];
  }> = [
    {
      id: "faceless",
      title: "Faceless AI Video",
      badge: "Most Popular",
      badgeVariant: "rendering",
      description:
        "Input a script or topic. AI Director generates voiceover, dynamic B-roll, kinetic motion cards, and docked karaoke captions.",
      icon: Sparkles,
      iconColor: "#a78bfa",
      glow: "violet",
      features: ["Auto Character & Voice", "Contextual B-Roll", "Timed Sound FX"],
    },
    {
      id: "upload",
      title: "Upload & Enhance Footage",
      badge: "Talking Head",
      badgeVariant: "done",
      description:
        "Upload raw speaking or camera footage. AI trims dead pauses, centers face framing, overlays kinetic text, and adds audio ducking.",
      icon: Upload,
      iconColor: "#67e8f9",
      glow: "cyan",
      features: ["Silence Auto-Pruning", "Smart Framing (9:16)", "SFX Ducking"],
    },
    {
      id: "template",
      title: "Viral Presets Gallery",
      badge: "Instant 60s",
      badgeVariant: "info",
      description:
        "Pre-engineered viral structures including Feynman Educational Shorts, Finance Explainers, and Fast Tech Reels.",
      icon: Zap,
      iconColor: "#fbbf24",
      glow: "white",
      features: ["Proven Retention Formula", "Calibrated Pacing", "1-Click Render"],
    },
    {
      id: "url",
      title: "From Article or URL",
      badge: "Repurpose",
      badgeVariant: "neutral",
      description:
        "Paste any blog post, news article, or markdown text. AI condenses key insights into an engaging short-form video script.",
      icon: Globe,
      iconColor: "#34d399",
      glow: "none",
      features: ["Web Ingest", "Auto Hook Extraction", "Summary Engine"],
    },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h2 className="text-title font-bold text-white tracking-tight">
          Step 1: Choose Your Creation Path
        </h2>
        <p className="text-caption text-white/40 mt-1">
          Select how you want to produce your video. You can customize all visual treatments in the next step.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paths.map((p) => {
          const isSelected = selectedPath === p.id;
          const Icon = p.icon;

          return (
            <div
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={cn(
                "group cursor-pointer rounded-2xl transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 p-[1px]",
                isSelected
                  ? "bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 shadow-[0_0_24px_rgba(124,58,237,0.3)]"
                  : "hover:bg-white/[0.08]"
              )}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  onSelect(p.id);
                }
              }}
            >
              <Card
                glow={isSelected ? p.glow : "none"}
                className={cn(
                  "h-full p-5 flex flex-col justify-between rounded-[15px] border-0",
                  isSelected ? "bg-[#0d1017]" : "bg-[#0d1017]/80"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                      <Icon className="w-5 h-5" style={{ color: p.iconColor }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={p.badgeVariant} size="sm">
                        {p.badge}
                      </Badge>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center border transition-all",
                          isSelected
                            ? "bg-violet-600 border-violet-500 text-white"
                            : "border-white/[0.15] bg-transparent text-transparent"
                        )}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-white tracking-tight">
                    {p.title}
                  </h3>
                  <p className="text-xs text-white/45 mt-1.5 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-white/[0.05] flex flex-wrap gap-1.5">
                  {p.features.map((feat) => (
                    <span
                      key={feat}
                      className="text-[10px] px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-white/50"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
