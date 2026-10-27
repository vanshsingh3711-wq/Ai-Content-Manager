"use client";

import React from "react";
import {
  Sparkles,
  CheckCircle2,
  Film,
  Clock,
  Layers,
  Coins,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Zap,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface ReviewSummaryProps {
  title: string;
  creationPath: string;
  aspectRatio: string;
  videoStyle: string;
  captionPreset: string;
  estimatedSeconds: number;
  wordCount: number;
  aiModulesCount: number;
  isGenerating: boolean;
  onLaunch: () => void;
  onBack: () => void;
  className?: string;
}

export function ReviewSummary({
  title,
  creationPath,
  aspectRatio,
  videoStyle,
  captionPreset,
  estimatedSeconds,
  wordCount,
  aiModulesCount,
  isGenerating,
  onLaunch,
  onBack,
  className,
}: ReviewSummaryProps) {
  const estimatedCost = (estimatedSeconds * 0.0035 + 0.05).toFixed(2);

  return (
    <Card glow="violet" className={cn("p-6 space-y-6 max-w-2xl mx-auto", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="processing">Step 3 of 3</Badge>
            <span className="text-micro font-bold text-cyan-400">
              Ready to Produce
            </span>
          </div>
          <h2 className="text-title font-bold text-white tracking-tight">
            Review Video Configuration
          </h2>
          <p className="text-caption text-white/40 mt-0.5">
            Confirm your settings before dispatching to the autonomous AI Director pipeline
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-[0_0_20px_rgba(124,58,237,0.3)] shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <div>
          <span className="text-[10px] font-mono text-white/40 uppercase">
            Project Title
          </span>
          <div className="text-sm font-semibold text-white truncate mt-0.5">
            {title || "Untitled Project"}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono text-white/40 uppercase">
            Creation Mode
          </span>
          <div className="text-sm font-semibold text-white capitalize mt-0.5">
            {creationPath}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono text-white/40 uppercase">
            Aspect Ratio
          </span>
          <div className="text-sm font-semibold text-cyan-300 font-mono mt-0.5">
            {aspectRatio}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono text-white/40 uppercase">
            Style & Pacing
          </span>
          <div className="text-sm font-semibold text-white capitalize mt-0.5">
            {videoStyle}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono text-white/40 uppercase">
            Subtitle Style
          </span>
          <div className="text-sm font-semibold text-white capitalize mt-0.5">
            {captionPreset.replace(/_/g, " ")}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono text-white/40 uppercase">
            AI Modules
          </span>
          <div className="text-sm font-semibold text-emerald-400 mt-0.5">
            {aiModulesCount} Active
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-white/60">
            Est. Length: <strong className="text-white">~{estimatedSeconds}s</strong> ({wordCount} words)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="text-white/60">
            Est. Cost: <strong className="text-white">${estimatedCost}</strong>
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-emerald-400 font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Safe Zones Calibrated</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={onBack}
          disabled={isGenerating}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Edit
        </Button>

        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={onLaunch}
          isLoading={isGenerating}
          loadingText="Dispatching Pipeline..."
          rightIcon={<Zap className="w-4 h-4 text-cyan-300 fill-cyan-300" />}
        >
          Launch Video Production
        </Button>
      </div>
    </Card>
  );
}
