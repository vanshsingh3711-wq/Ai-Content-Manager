"use client";

import React from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { JobStatus } from "./types";
import { cn } from "@/lib/utils";

export const PIPELINE_STAGES: Array<{ id: JobStatus; label: string }> = [
  { id: "QUEUED", label: "Queued" },
  { id: "DOWNLOADING", label: "Ingest" },
  { id: "TRANSCRIBING", label: "WhisperX" },
  { id: "AI_DIRECTING", label: "AI Directing" },
  { id: "RENDERING", label: "Remotion" },
  { id: "COMPLETED", label: "Ready" },
];

export function PipelineStageTracker({
  status,
  className,
}: {
  status: JobStatus;
  className?: string;
}) {
  const getStageIndex = (st: JobStatus) => {
    switch (st) {
      case "QUEUED":
        return 0;
      case "DOWNLOADING":
        return 1;
      case "TRANSCRIBING":
        return 2;
      case "AI_DIRECTING":
        return 3;
      case "RENDERING":
      case "PUBLISHING":
        return 4;
      case "COMPLETED":
        return 5;
      case "FAILED":
        return 3;
      default:
        return 0;
    }
  };

  const currentIndex = getStageIndex(status);
  const isFailed = status === "FAILED";

  return (
    <div className={cn("w-full py-2", className)}>
      <div className="relative flex items-center justify-between">
        {/* Connecting Line Track */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/[0.08] z-0" />

        {/* Active Line Fill */}
        <div
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 h-0.5 transition-all duration-500 z-0",
            isFailed
              ? "bg-rose-500"
              : "bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400"
          )}
          style={{
            width: `${(Math.min(currentIndex, 5) / (PIPELINE_STAGES.length - 1)) * 100}%`,
          }}
        />

        {/* Step Nodes */}
        {PIPELINE_STAGES.map((stage, idx) => {
          const isPassed = idx < currentIndex || (idx === 5 && status === "COMPLETED");
          const isCurrent = idx === currentIndex && status !== "COMPLETED" && !isFailed;
          const isCurrentFailed = idx === currentIndex && isFailed;

          return (
            <div
              key={stage.id}
              className="relative z-10 flex flex-col items-center group select-none"
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors duration-200 text-xs",
                  isPassed
                    ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                    : isCurrentFailed
                    ? "bg-rose-600 border-rose-400 text-white shadow-[0_0_10px_rgba(244,63,94,0.6)]"
                    : isCurrent
                    ? "bg-violet-600 border-cyan-400 text-white shadow-[0_0_14px_rgba(6,182,212,0.6)] ring-2 ring-cyan-400/40"
                    : "bg-[#0d1017] border-white/20 text-white/30"
                )}
              >
                {isPassed ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : isCurrentFailed ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin origin-center shrink-0 text-cyan-300" />
                ) : (
                  <span className="text-[10px] font-mono">{idx + 1}</span>
                )}
              </div>

              <span
                className={cn(
                  "text-[10px] font-medium mt-1.5 whitespace-nowrap transition-colors",
                  isCurrent
                    ? "text-cyan-300 font-bold"
                    : isPassed
                    ? "text-white/70"
                    : isCurrentFailed
                    ? "text-rose-400 font-bold"
                    : "text-white/30"
                )}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
