"use client";

import React from "react";
import Link from "next/link";
import { Play, Scissors, Clock, Check, Eye } from "lucide-react";
import { Badge } from "@/components/ui";
import { VideoJob, VideoStatus } from "./types";
import { cn, formatDate } from "@/lib/utils";

export interface VideoTableRowProps {
  video: VideoJob;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onClick: (video: VideoJob) => void;
  className?: string;
}

export function VideoTableRow({
  video,
  isSelected,
  onToggleSelect,
  onClick,
  className,
}: VideoTableRowProps) {
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
    <div
      onClick={() => onClick(video)}
      className={cn(
        "grid grid-cols-12 gap-4 px-4 py-3.5 items-center cursor-pointer transition-colors border-b border-white/[0.04] text-xs",
        isSelected
          ? "bg-violet-600/10 text-white"
          : "hover:bg-white/[0.02] text-white/70",
        className
      )}
    >
      {/* Checkbox & Title (Col 6) */}
      <div className="col-span-12 sm:col-span-6 flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(video.id);
          }}
          className={cn(
            "w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-all",
            isSelected
              ? "bg-violet-600 border-violet-500 text-white"
              : "border-white/20 bg-transparent text-transparent hover:border-white/40"
          )}
          aria-label={`Select ${video.title}`}
        >
          <Check className="w-2.5 h-2.5 stroke-[3]" />
        </button>

        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 text-white/40 group-hover:text-cyan-400">
          <Play className="w-3.5 h-3.5 fill-current" />
        </div>

        <div className="min-w-0 truncate font-medium text-white hover:text-cyan-300 transition-colors">
          {video.title}
        </div>
      </div>

      {/* Status (Col 2) */}
      <div className="col-span-4 sm:col-span-2">
        <Badge variant={getStatusVariant(video.status)} size="sm">
          {video.status.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Ratio & Type (Col 2) */}
      <div className="hidden sm:block sm:col-span-2">
        <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
          {aspectRatio}
        </span>
      </div>

      {/* Date & Actions (Col 2) */}
      <div className="col-span-8 sm:col-span-2 flex items-center justify-between sm:justify-end gap-3 text-right">
        <span className="text-white/30 text-[11px] hidden md:inline">
          {formatDate(video.created_at)}
        </span>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onClick(video)}
            className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <Link
            href={`/dashboard/editor/${video.id}`}
            className="p-1.5 rounded-md text-white/40 hover:text-yellow-400 hover:bg-white/[0.06] transition-colors"
            title="Open in Studio NLE"
          >
            <Scissors className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
