"use client";

import React from "react";
import Link from "next/link";
import { Play, Scissors, Clock, Check, MoreVertical, Eye } from "lucide-react";
import { Card, Badge, Tooltip } from "@/components/ui";
import { VideoJob, VideoStatus } from "./types";
import { cn, formatDate } from "@/lib/utils";

export interface VideoCardProps {
  video: VideoJob;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onClick: (video: VideoJob) => void;
  className?: string;
}

export function VideoCard({
  video,
  isSelected,
  onToggleSelect,
  onClick,
  className,
}: VideoCardProps) {
  let parsedSettings: any = {};
  try {
    if (video.edit_decision_list) {
      const edl = JSON.parse(video.edit_decision_list);
      parsedSettings = edl.settings || {};
    }
  } catch {}

  const aspectRatio = parsedSettings.aspect_ratio || (video.video_type === "faceless_short" ? "9:16" : "16:9");

  const getStatusVariant = (status: VideoStatus) => {
    switch (status) {
      case "COMPLETED":
        return "done";
      case "RENDERING":
      case "AI_DIRECTING":
        return "rendering";
      case "TRANSCRIBING":
      case "DOWNLOADING":
        return "info";
      case "QUEUED":
        return "queued";
      case "FAILED":
        return "failed";
      default:
        return "neutral";
    }
  };

  return (
    <Card
      interactive
      className={cn(
        "group relative p-0 overflow-hidden flex flex-col justify-between transition-all duration-200 select-none",
        isSelected
          ? "border-violet-500 shadow-[0_0_20px_rgba(124,58,237,0.35)] ring-1 ring-violet-500"
          : "hover:border-white/20",
        className
      )}
    >
      {/* Thumbnail Container */}
      <div
        onClick={() => onClick(video)}
        className="relative w-full aspect-video bg-gradient-to-br from-violet-950/40 via-[#0d1017] to-cyan-950/30 flex items-center justify-center cursor-pointer overflow-hidden border-b border-white/[0.06]"
      >
        {/* Play Icon overlay */}
        <div className="w-11 h-11 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/[0.15] flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-violet-600 transition-all shadow-lg">
          <Play className="w-4 h-4 fill-white ml-0.5" />
        </div>

        {/* Top Badges: Checkbox & Aspect Ratio */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(video.id);
            }}
            className={cn(
              "w-5 h-5 rounded-md flex items-center justify-center border pointer-events-auto transition-all",
              isSelected
                ? "bg-violet-600 border-violet-500 text-white"
                : "border-white/20 bg-black/40 text-transparent hover:border-white/40"
            )}
            aria-label={`Select ${video.title}`}
          >
            <Check className="w-3 h-3 stroke-[3]" />
          </button>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 text-cyan-300 font-semibold">
            {aspectRatio}
          </span>
        </div>

        {/* Bottom Duration Badge */}
        <div className="absolute bottom-2.5 right-2.5">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-white/10 text-white/80 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            30s
          </span>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <Badge variant={getStatusVariant(video.status)} size="sm">
              {video.status.replace(/_/g, " ")}
            </Badge>
            <span className="text-[11px] text-white/30 truncate">
              {formatDate(video.created_at)}
            </span>
          </div>

          <h3
            onClick={() => onClick(video)}
            className="text-sm font-semibold text-white tracking-tight line-clamp-2 cursor-pointer group-hover:text-cyan-300 transition-colors"
          >
            {video.title}
          </h3>
        </div>

        {/* Card Actions Footer */}
        <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => onClick(video)}
            className="inline-flex items-center gap-1.5 text-white/50 hover:text-white transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>

          <Link
            href={`/dashboard/editor/${video.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-violet-500/40 text-white/70 hover:text-white transition-all"
          >
            <Scissors className="w-3 h-3 text-yellow-400" />
            <span>Studio</span>
          </Link>
        </div>
      </div>
    </Card>
  );
}
