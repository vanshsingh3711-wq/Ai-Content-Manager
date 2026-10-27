"use client";

import React from "react";
import {
  Smartphone,
  Monitor,
  Square,
  Sparkles,
  Scissors,
  Volume2,
  Sliders,
  Type,
  Eye,
  Check,
} from "lucide-react";
import { Tabs } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface ConfigPanelProps {
  aspectRatio: "9:16" | "16:9" | "1:1";
  onAspectRatioChange: (ratio: "9:16" | "16:9" | "1:1") => void;
  videoStyle: "viral" | "educational" | "cinematic" | "minimal";
  onVideoStyleChange: (style: "viral" | "educational" | "cinematic" | "minimal") => void;
  captionPreset: "tiktok_yellow" | "neon_cyber" | "modern_clean" | "boxed_pill";
  onCaptionPresetChange: (preset: "tiktok_yellow" | "neon_cyber" | "modern_clean" | "boxed_pill") => void;
  aiFeatures: {
    faceTracking: boolean;
    trimSilences: boolean;
    autoBroll: boolean;
    transitionSfx: boolean;
  };
  onToggleAiFeature: (key: keyof ConfigPanelProps["aiFeatures"]) => void;
  className?: string;
}

export function ConfigPanel({
  aspectRatio,
  onAspectRatioChange,
  videoStyle,
  onVideoStyleChange,
  captionPreset,
  onCaptionPresetChange,
  aiFeatures,
  onToggleAiFeature,
  className,
}: ConfigPanelProps) {
  const aspectRatios: Array<{
    id: "9:16" | "16:9" | "1:1";
    label: string;
    sub: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: "9:16", label: "9:16 Vertical", sub: "TikTok, Reels, Shorts", icon: Smartphone },
    { id: "16:9", label: "16:9 Landscape", sub: "YouTube, Desktop", icon: Monitor },
    { id: "1:1", label: "1:1 Square", sub: "Instagram, LinkedIn", icon: Square },
  ];

  const videoStyles: Array<{
    id: "viral" | "educational" | "cinematic" | "minimal";
    name: string;
    desc: string;
  }> = [
    { id: "viral", name: "Viral Pacing", desc: "Fast jump cuts, high energy, punchy SFX" },
    { id: "educational", name: "Educational Feynman", desc: "Clear docked subtitles, 3D cards, explanatory flow" },
    { id: "cinematic", name: "Cinematic Mood", desc: "Atmospheric grade, slow zooms, subtle ambient audio" },
    { id: "minimal", name: "Minimalist Clean", desc: "Monochrome cards, distraction-free clarity" },
  ];

  const captionPresets: Array<{
    id: "tiktok_yellow" | "neon_cyber" | "modern_clean" | "boxed_pill";
    name: string;
    preview: string;
  }> = [
    { id: "tiktok_yellow", name: "TikTok Yellow", preview: "POP-IN YELLOW" },
    { id: "neon_cyber", name: "Neon Cyber", preview: "CYAN GLOW" },
    { id: "modern_clean", name: "Modern Clean", preview: "VIOLET UNDERLINE" },
    { id: "boxed_pill", name: "Boxed Pill", preview: "DARK PILL" },
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Aspect Ratio Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-white/80">
          Canvas Aspect Ratio
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {aspectRatios.map((ar) => {
            const isSelected = aspectRatio === ar.id;
            const Icon = ar.icon;
            return (
              <button
                key={ar.id}
                type="button"
                onClick={() => onAspectRatioChange(ar.id)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                  isSelected
                    ? "bg-violet-600/15 border-violet-500/40 shadow-[0_0_12px_rgba(124,58,237,0.25)]"
                    : "bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05]"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      isSelected ? "text-cyan-300" : "text-white/40"
                    )}
                  />
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center text-white text-[10px]">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className="text-xs font-semibold text-white">{ar.label}</div>
                <div className="text-[10px] text-white/40 mt-0.5">{ar.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Video Style Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-white/80">
          Director Style & Pacing
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {videoStyles.map((vs) => {
            const isSelected = videoStyle === vs.id;
            return (
              <button
                key={vs.id}
                type="button"
                onClick={() => onVideoStyleChange(vs.id)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                  isSelected
                    ? "bg-violet-600/15 border-violet-500/40 shadow-[0_0_12px_rgba(124,58,237,0.25)]"
                    : "bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05]"
                )}
              >
                <div className="text-xs font-semibold text-white">{vs.name}</div>
                <div className="text-[11px] text-white/40 mt-1 leading-snug">{vs.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subtitles & Captions Preset */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-white/80">
          Docked Subtitle Preset
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {captionPresets.map((cp) => {
            const isSelected = captionPreset === cp.id;
            return (
              <button
                key={cp.id}
                type="button"
                onClick={() => onCaptionPresetChange(cp.id)}
                className={cn(
                  "p-2.5 rounded-xl border text-center transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                  isSelected
                    ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                    : "bg-white/[0.02] border-white/[0.08] text-white/60 hover:bg-white/[0.05]"
                )}
              >
                <div className="text-xs font-semibold">{cp.name}</div>
                <div className="text-[10px] font-mono opacity-50 mt-1">{cp.preview}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Directing Feature Toggles */}
      <div className="space-y-2 pt-2 border-t border-white/[0.05]">
        <label className="text-xs font-semibold text-white/80">
          AI Directing Modules
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            {
              key: "autoBroll" as const,
              label: "Contextual B-Roll Placement",
              desc: "Inserts visual evidence and thematic footage on key topics",
            },
            {
              key: "trimSilences" as const,
              label: "Speech Silence Pruning",
              desc: "Cuts dead pauses greater than 400ms for tight retention",
            },
            {
              key: "faceTracking" as const,
              label: "Smart Framing & Tracking",
              desc: "Centers speaker face in vertical 9:16 safe zones",
            },
            {
              key: "transitionSfx" as const,
              label: "Audio Ducking & SFX Sync",
              desc: "Adds whooshes, risers, and subtle background ambient beats",
            },
          ].map((item) => {
            const isChecked = aiFeatures[item.key];
            return (
              <div
                key={item.key}
                onClick={() => onToggleAiFeature(item.key)}
                className={cn(
                  "p-3 rounded-xl border cursor-pointer select-none transition-all flex items-start gap-3",
                  isChecked
                    ? "bg-white/[0.04] border-white/[0.14]"
                    : "bg-white/[0.01] border-white/[0.05] opacity-60"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition-all",
                    isChecked
                      ? "bg-violet-600 border-violet-500 text-white"
                      : "border-white/20 bg-transparent text-transparent"
                  )}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{item.label}</div>
                  <div className="text-[11px] text-white/40 mt-0.5 leading-snug">{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
