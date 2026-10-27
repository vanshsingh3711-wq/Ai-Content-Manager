"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Play, Clock, Scissors, Trash2, Film, Layers } from "lucide-react";
import { Button, Badge, Dialog } from "@/components/ui";
import { TimelineProject } from "@/lib/timeline-types";
import { cn } from "@/lib/utils";

export interface ContinueEditingCardProps {
  project: TimelineProject;
  onDiscard: () => void;
  className?: string;
}

export function ContinueEditingCard({
  project,
  onDiscard,
  className,
}: ContinueEditingCardProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const clipCount =
    (project.tracks?.videoTrack?.length || 0) +
    (project.tracks?.brollTrack?.length || 0);

  return (
    <>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl p-6",
          "glass-card-premium border border-violet-500/30",
          "shadow-[0_8px_32px_rgba(124,58,237,0.15)]",
          className
        )}
      >
        {/* Top rim highlight */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />

        {/* Ambient violet glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
          {/* Thumbnail & Info */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0 w-24 h-16 rounded-xl bg-violet-950/40 border border-violet-500/30 flex items-center justify-center shadow-inner overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/20 to-transparent pointer-events-none" />
              <Play className="w-6 h-6 text-violet-300 fill-violet-400/40 relative z-10" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="draft" size="sm">
                  Unsaved Draft
                </Badge>
                <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                  {project.aspectRatio || "9:16"}
                </span>
              </div>
              <h4 className="text-base font-bold text-white tracking-tight truncate">
                {project.title || "Untitled Video Project"}
              </h4>
              <div className="flex items-center gap-2.5 mt-1 text-xs text-white/50">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-white/40" />
                  {project.duration ? `${project.duration.toFixed(1)}s` : "0.0s"}
                </span>
                <span>•</span>
                <span>{clipCount} clips on timeline</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDialogOpen(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-white/40 hover:text-red-400" />}
            >
              Discard
            </Button>

            <Link href={`/dashboard/editor/${project.id || "draft"}`}>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Scissors className="w-3.5 h-3.5" />}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-[0_0_16px_rgba(124,58,237,0.4)]"
              >
                Resume in Studio
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        title="Discard Saved Draft?"
        description="Are you sure you want to discard your local project edits? This cannot be undone."
        confirmText="Yes, Discard Draft"
        confirmVariant="danger"
        onConfirm={() => {
          onDiscard();
          setConfirmDialogOpen(false);
        }}
      />
    </>
  );
}
