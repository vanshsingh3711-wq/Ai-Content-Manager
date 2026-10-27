"use client";

import React from "react";
import Link from "next/link";
import {
  Clock,
  Terminal,
  RotateCcw,
  Scissors,
  CheckCircle2,
  AlertCircle,
  Loader2,
  XCircle,
  Play,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { PipelineStageTracker } from "./PipelineStageTracker";
import { QueueJob, JobStatus } from "./types";
import { cn, formatDate } from "@/lib/utils";

export interface JobCardProps {
  job: QueueJob;
  onOpenLogs: (job: QueueJob) => void;
  onRetry?: (jobId: string) => void;
  onCancel?: (jobId: string) => void;
  className?: string;
}

export function JobCard({
  job,
  onOpenLogs,
  onRetry,
  onCancel,
  className,
}: JobCardProps) {
  const getProgressPercent = (status: JobStatus, customProgress?: number) => {
    if (customProgress !== undefined) return customProgress;
    switch (status) {
      case "QUEUED":
        return 10;
      case "DOWNLOADING":
        return 25;
      case "TRANSCRIBING":
        return 45;
      case "AI_DIRECTING":
        return 70;
      case "RENDERING":
        return 88;
      case "PUBLISHING":
        return 95;
      case "COMPLETED":
        return 100;
      case "FAILED":
        return 40;
      default:
        return 0;
    }
  };

  const progress = getProgressPercent(job.status, job.progress);
  const isActive = !["COMPLETED", "FAILED"].includes(job.status);
  const isFailed = job.status === "FAILED";

  const getStatusBadge = (st: JobStatus) => {
    switch (st) {
      case "COMPLETED":
        return <Badge variant="done">Completed</Badge>;
      case "RENDERING":
        return <Badge variant="rendering">Rendering</Badge>;
      case "AI_DIRECTING":
        return <Badge variant="processing">AI Directing</Badge>;
      case "TRANSCRIBING":
      case "DOWNLOADING":
        return <Badge variant="info">{st.toLowerCase()}</Badge>;
      case "QUEUED":
        return <Badge variant="queued">Queued</Badge>;
      case "FAILED":
        return <Badge variant="error">Failed</Badge>;
      default:
        return <Badge variant="neutral">{st}</Badge>;
    }
  };

  return (
    <Card
      glow={isActive ? "cyan" : isFailed ? "none" : "none"}
      className={cn("p-5 space-y-4 transition-all duration-200", className)}
    >
      {/* Top Header: Title, Format, Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getStatusBadge(job.status)}
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
              {job.video_type?.replace(/_/g, " ") || "Video"}
            </span>
            <span className="text-caption text-white/30 hidden sm:inline">
              ID: {job.id}
            </span>
          </div>

          <h3 className="text-base font-semibold text-white tracking-tight truncate">
            {job.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onOpenLogs(job)}
            leftIcon={<Terminal className="w-3 h-3 text-cyan-400" />}
          >
            Worker Logs
          </Button>

          {isFailed && onRetry && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => onRetry(job.id)}
              leftIcon={<RotateCcw className="w-3 h-3 text-amber-400" />}
            >
              Retry Job
            </Button>
          )}

          {isActive && onCancel && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onCancel(job.id)}
              leftIcon={<XCircle className="w-3 h-3 text-rose-400" />}
            >
              Cancel
            </Button>
          )}

          {job.status === "COMPLETED" && (
            <Link href={`/dashboard/editor/${job.id}`}>
              <Button
                variant="primary"
                size="xs"
                leftIcon={<Scissors className="w-3 h-3" />}
              >
                Studio NLE
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Progress Bar & Stage Description */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-caption font-medium text-white/70 truncate pr-2">
            {job.stage ||
              (job.status === "COMPLETED"
                ? "Video rendered and validated successfully"
                : isFailed
                ? "Terminated due to worker error"
                : "Active pipeline execution...")}
          </span>
          <span className="font-mono text-cyan-300 font-bold tabular-nums shrink-0">
            {progress}%
          </span>
        </div>

        <div className="progress-track">
          <div
            className={cn(
              "progress-fill",
              isActive && "progress-fill-animate",
              isFailed && "bg-rose-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Embedded Pipeline Step Tracker */}
      <PipelineStageTracker status={job.status} />

      {/* Footer Timestamp */}
      <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-white/40">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          Created {formatDate(job.created_at)}
        </span>
        <span>Last updated {formatDate(job.updated_at)}</span>
      </div>
    </Card>
  );
}
