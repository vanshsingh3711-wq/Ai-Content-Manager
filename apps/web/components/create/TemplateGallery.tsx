"use client";

import React from "react";
import { Sparkles, Clock, Check, ArrowRight, Zap, BookOpen, TrendingUp, Cpu } from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface TemplateItem {
  id: string;
  title: string;
  category: string;
  duration: string;
  aspectRatio: "9:16" | "16:9";
  videoStyle: "educational" | "viral" | "cinematic";
  captionPreset: "tiktok_yellow" | "neon_cyber" | "modern_clean";
  description: string;
  sampleScript: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PRESET_TEMPLATES: TemplateItem[] = [
  {
    id: "feynman_short",
    title: "Educational Feynman Short",
    category: "STEM & Learning",
    duration: "60s",
    aspectRatio: "9:16",
    videoStyle: "educational",
    captionPreset: "tiktok_yellow",
    description:
      "Explains complex concepts to a 12-year-old using clear real-world analogies, non-overlapping docked captions, and 3D card reveals.",
    sampleScript:
      "If you can't explain quantum tunneling to a 12-year-old, you don't truly understand it. Imagine tossing a tennis ball at a brick wall. In classical physics, it bounces right back. But in the subatomic realm, particles act like waves of probability. There is a tiny mathematical chance the wave exists on the other side of the wall. That is how your smartphone's flash memory works.",
    icon: BookOpen,
  },
  {
    id: "finance_explainer",
    title: "Finance & Wealth Deep Dive",
    category: "Wealth & Markets",
    duration: "4 mins",
    aspectRatio: "16:9",
    videoStyle: "cinematic",
    captionPreset: "modern_clean",
    description:
      "High-production landscape video with compound growth visualization, financial charts, and documentary pacing.",
    sampleScript:
      "Compound interest is often called the eighth wonder of the world. But most investors misunderstand where the true inflection point occurs. If you invest $500 a month starting at age twenty-five versus age thirty-five, the ten-year delay cuts your ultimate retirement portfolio in half. Let's look at the mathematical actuals.",
    icon: TrendingUp,
  },
  {
    id: "tech_speed_reel",
    title: "High-Speed AI Tech Reel",
    category: "AI & Innovation",
    duration: "30s",
    aspectRatio: "9:16",
    videoStyle: "viral",
    captionPreset: "neon_cyber",
    description:
      "Hyper-fast viral reel with zero dead air, punchy whoosh SFX, cyber neon captions, and kinetic tech b-roll cuts.",
    sampleScript:
      "Three breakthroughs in autonomous AI coding you completely missed this week. First: models can now self-correct subtle memory leaks across entire repositories. Second: subagent orchestration now runs fifty times faster using persistent IPC sockets. And third: multi-modal video compositing happens in real time in your browser.",
    icon: Cpu,
  },
];

export function TemplateGallery({
  selectedTemplateId,
  onSelectTemplate,
  className,
}: {
  selectedTemplateId: string;
  onSelectTemplate: (template: TemplateItem) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-base font-semibold text-white tracking-tight">
          Select a Proven Template Preset
        </h3>
        <p className="text-caption text-white/40 mt-0.5">
          These presets pre-configure optimal safe zones, docked subtitle styles, and voice pacing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PRESET_TEMPLATES.map((tpl) => {
          const isSelected = selectedTemplateId === tpl.id;
          const Icon = tpl.icon;

          return (
            <Card
              key={tpl.id}
              glow={isSelected ? "violet" : "none"}
              interactive
              onClick={() => onSelectTemplate(tpl)}
              className={cn(
                "p-5 flex flex-col justify-between transition-all",
                isSelected
                  ? "border-violet-500/50 bg-[#12151f]"
                  : "hover:border-white/20"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-cyan-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                      {tpl.aspectRatio}
                    </span>
                    <Badge variant="neutral" size="sm">
                      {tpl.duration}
                    </Badge>
                  </div>
                </div>

                <span className="text-[10px] font-mono uppercase text-white/30 tracking-wider">
                  {tpl.category}
                </span>
                <h4 className="text-sm font-semibold text-white mt-0.5">
                  {tpl.title}
                </h4>
                <p className="text-xs text-white/40 mt-1.5 leading-relaxed">
                  {tpl.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-white/[0.05] flex items-center justify-between">
                <span className="text-xs font-semibold text-violet-400">
                  {isSelected ? "Selected ✓" : "Use Preset"}
                </span>
                <ArrowRight
                  className={cn(
                    "w-3.5 h-3.5 text-white/30 transition-transform",
                    isSelected && "text-violet-400 translate-x-1"
                  )}
                />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
