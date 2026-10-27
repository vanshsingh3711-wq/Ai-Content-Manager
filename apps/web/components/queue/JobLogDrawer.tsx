"use client";

import React, { useState } from "react";
import { Terminal, Copy, Check, Download, AlertCircle } from "lucide-react";
import { Drawer, Button, Badge } from "@/components/ui";
import { QueueJob } from "./types";
import { cn } from "@/lib/utils";

export interface JobLogDrawerProps {
  job: QueueJob | null;
  isOpen: boolean;
  onClose: () => void;
}

export function JobLogDrawer({ job, isOpen, onClose }: JobLogDrawerProps) {
  const [copied, setCopied] = useState(false);

  if (!job) return null;

  const rawLogs = job.error_log || `[00:00.01] [DISPATCH] Job ${job.id} picked up by Celery worker-gpu
[00:02.14] [INGEST] Verifying audio waveform and sample rate
[00:04.22] [WHISPER] WhisperX transcription alignment complete
[00:08.50] [DIRECTOR] Autonomous AI scene treatment plan generated
[00:14.30] [REMOTION] Bundling video composition layers...`;

  const logLines = rawLogs.split("\n");

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(rawLogs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Worker Execution Logs: ${job.title}`}
      description={`Job ID: ${job.id} • Status: ${job.status}`}
      size="lg"
      footer={
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLogs}
            leftIcon={
              copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )
            }
          >
            {copied ? "Copied Logs" : "Copy Raw Logs"}
          </Button>

          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Terminal Window Header */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-t-xl bg-[#090b10] border border-white/[0.08] border-b-0 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            <span className="font-mono text-white/40 ml-2 text-[11px]">
              worker-stdout.log
            </span>
          </div>

          <Badge variant={job.status === "FAILED" ? "error" : "rendering"} size="sm">
            {job.status}
          </Badge>
        </div>

        {/* Terminal Body */}
        <div className="p-4 rounded-b-xl bg-[#06080d] border border-white/[0.08] font-mono text-xs text-white/80 max-h-[500px] overflow-y-auto space-y-1 leading-relaxed selection:bg-cyan-500/30">
          {logLines.map((line, idx) => {
            const isError = line.includes("[ERROR]") || line.includes("failed") || line.includes("Error");
            const isDirector = line.includes("[DIRECTOR]") || line.includes("[DEEPSEEK]");
            const isRender = line.includes("[REMOTION]") || line.includes("[RENDER]");

            return (
              <div
                key={idx}
                className={cn(
                  "py-0.5",
                  isError
                    ? "text-rose-400 bg-rose-950/20 px-1 rounded"
                    : isDirector
                    ? "text-violet-300"
                    : isRender
                    ? "text-cyan-300"
                    : "text-white/70"
                )}
              >
                {line}
              </div>
            );
          })}
        </div>
      </div>
    </Drawer>
  );
}
