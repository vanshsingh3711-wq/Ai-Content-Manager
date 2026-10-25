"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Layers,
  Activity,
  Clock,
  RefreshCw,
  Play,
  RotateCcw,
  Terminal,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Scissors,
  ArrowRight,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

/* ── Types ──────────────────────────────────────────── */
interface QueueJob {
  id: string;
  title: string;
  status:
    | "QUEUED"
    | "DOWNLOADING"
    | "TRANSCRIBING"
    | "AI_DIRECTING"
    | "RENDERING"
    | "PUBLISHING"
    | "COMPLETED"
    | "FAILED";
  source_url: string;
  rendered_url?: string | null;
  video_type?: "talking_head" | "faceless_short";
  edit_decision_list?: string | null;
  error_log?: string | null;
  progress?: number;
  stage?: string;
  created_at: string;
  updated_at: string;
}

/* ── Fallback Demo Queue Data ───────────────────────── */
const DEMO_JOBS: QueueJob[] = [
  {
    id: "job-8924b1",
    title: "Why Compound Interest Grows Fast in Your 20s",
    status: "RENDERING",
    source_url: "",
    video_type: "faceless_short",
    progress: 82,
    stage: "Remotion 4K Multi-Track Render (Frame 740/900)",
    created_at: new Date(Date.now() - 1000 * 120).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 15).toISOString(),
    error_log: `[00:01.02] [SYSTEM] Job initialized. Worker assigned: worker-gpu-us-east-1a
[00:02.14] [DEEPSEEK] Parsing hook prompt and topic keywords...
[00:04.50] [AUDIO] Voiceover synthesized via ElevenLabs (sarah_energetic, 28.4s)
[00:07.12] [TRANSCRIBE] WhisperX word-level alignment complete (38 words, 0 low-conf tokens)
[00:11.89] [DIRECTOR] DeepSeek R1 generated 4 kinetic motion graphic overlays + 3 B-roll cutaways
[00:14.30] [REMOTION] Bundling composition with WebGL 3D Avatar pipeline...
[00:18.00] [RENDER] Stitching frame sequence: 82% complete (ETA 6s)`,
  },
  {
    id: "job-8924b2",
    title: "Top 5 Productivity Hacks for Deep Work",
    status: "AI_DIRECTING",
    source_url: "",
    video_type: "talking_head",
    progress: 58,
    stage: "DeepSeek Reasoning — Hook & B-Roll Generation",
    created_at: new Date(Date.now() - 1000 * 240).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 40).toISOString(),
    error_log: `[00:01.10] [INGEST] Source video uploaded (1080p, 54.2 MB)
[00:03.40] [AUDIO] Extracted audio track 48kHz stereo
[00:06.12] [WHISPER] Completed transcription: detected 4 speech dead-air gaps (>600ms)
[00:08.50] [AUTO_CUT] Trimming silence gaps (saved 4.8 seconds)
[00:12.30] [AI_DIRECTOR] Analyzing emotional arc and emphasis moments...`,
  },
  {
    id: "job-8924b3",
    title: "Autonomous AI Agents in 2026",
    status: "QUEUED",
    source_url: "",
    video_type: "faceless_short",
    progress: 0,
    stage: "Waiting in GPU dispatcher queue",
    created_at: new Date(Date.now() - 1000 * 360).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 360).toISOString(),
  },
  {
    id: "job-8924b4",
    title: "Honey Never Spoils — The Chemistry of Eternal Food",
    status: "COMPLETED",
    source_url: "",
    rendered_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    video_type: "faceless_short",
    progress: 100,
    stage: "Pipeline completed successfully in 34.2s",
    created_at: new Date(Date.now() - 1000 * 1800).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 1765).toISOString(),
  },
  {
    id: "job-8924b5",
    title: "The Roman Empire's Secret Concrete Formula",
    status: "FAILED",
    source_url: "",
    video_type: "faceless_short",
    progress: 35,
    stage: "Failed during audio alignment stage",
    created_at: new Date(Date.now() - 1000 * 3600).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 3580).toISOString(),
    error_log: `[00:00.82] [SYSTEM] Worker spun up: worker-gpu-04
[00:02.10] [SYNTHESIS] Generated voiceover (elevenlabs:alex_presenter)
[00:05.44] [ALIGNMENT] WhisperX forced alignment failed: Audio sample rate mismatch
  File "/worker/services/audio_aligner.py", line 142, in align_transcript
    raise AudioSampleRateError("Expected 16000Hz or 48000Hz, received 22050Hz without resampler")
[00:05.45] [ERROR] Job terminated with exit code 1. Automatic retry available.`,
  },
];

/* ── Helpers ─────────────────────────────────────────── */
function getProgressPercent(status: QueueJob["status"], customProgress?: number) {
  if (customProgress !== undefined) return customProgress;
  switch (status) {
    case "QUEUED":
      return 5;
    case "DOWNLOADING":
      return 20;
    case "TRANSCRIBING":
      return 40;
    case "AI_DIRECTING":
      return 65;
    case "RENDERING":
      return 85;
    case "PUBLISHING":
      return 95;
    case "COMPLETED":
      return 100;
    case "FAILED":
      return 35;
    default:
      return 0;
  }
}

function StatusBadge({ status }: { status: QueueJob["status"] }) {
  if (status === "COMPLETED") {
    return (
      <span className="status-pill status-pill-done">
        <span className="status-dot status-dot-online" />
        Completed
      </span>
    );
  }
  if (status === "FAILED") {
    return (
      <span className="status-pill status-pill-failed">
        <span className="status-dot status-dot-failed" />
        Failed
      </span>
    );
  }
  return (
    <span className="status-pill status-pill-processing">
      <span className="status-dot status-dot-busy" />
      {status === "RENDERING"
        ? "Rendering"
        : status === "AI_DIRECTING"
        ? "AI Directing"
        : status === "TRANSCRIBING"
        ? "Transcribing"
        : status === "DOWNLOADING"
        ? "Downloading"
        : "Queued"}
    </span>
  );
}

type FilterType = "ALL" | "ACTIVE" | "COMPLETED" | "FAILED";

export default function QueuePage() {
  const [jobs, setJobs] = useState<QueueJob[]>(DEMO_JOBS);
  const [loading, setLoading] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("ALL");

  async function fetchQueueJobs() {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${apiUrl}/api/v1/jobs`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setJobs(data);
        }
      }
    } catch {
      // Keep existing jobs
    } finally {
      setLoading(false);
    }
  }

  async function handleDispatch(jobId: string) {
    setActionLoading(jobId);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${apiUrl}/api/v1/jobs/${jobId}/dispatch`, { method: "POST" });
      if (res.ok) fetchQueueJobs();
    } catch (err) {
      console.error("Dispatch error:", err);
    } finally {
      // Simulate state update for demo
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? { ...j, status: "AI_DIRECTING", progress: 25, stage: "AI Director dispatch initiated" }
            : j
        )
      );
      setActionLoading(null);
    }
  }

  async function handleRetry(jobId: string) {
    setActionLoading(jobId);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${apiUrl}/api/v1/jobs/${jobId}/retry`, { method: "POST" });
      if (res.ok) fetchQueueJobs();
    } catch (err) {
      console.error("Retry error:", err);
    } finally {
      // Simulate retry for demo
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? { ...j, status: "QUEUED", progress: 0, stage: "Re-queued for execution" }
            : j
        )
      );
      setActionLoading(null);
    }
  }

  function handleCopyLog(jobId: string, logText: string) {
    navigator.clipboard.writeText(logText);
    setCopiedLogId(jobId);
    setTimeout(() => setCopiedLogId(null), 2000);
  }

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      try {
        const res = await fetch(`${apiUrl}/api/v1/jobs`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setJobs(data);
          }
        }
      } catch {
        // Keep fallback data
      }
    }
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const pendingCount = jobs.filter((j) => j.status === "QUEUED").length;
  const inProgressCount = jobs.filter((j) =>
    ["DOWNLOADING", "TRANSCRIBING", "AI_DIRECTING", "RENDERING", "PUBLISHING"].includes(j.status)
  ).length;
  const completedCount = jobs.filter((j) => j.status === "COMPLETED").length;
  const failedCount = jobs.filter((j) => j.status === "FAILED").length;

  const filteredJobs = useMemo(() => {
    if (filter === "ACTIVE") {
      return jobs.filter((j) =>
        ["QUEUED", "DOWNLOADING", "TRANSCRIBING", "AI_DIRECTING", "RENDERING", "PUBLISHING"].includes(
          j.status
        )
      );
    }
    if (filter === "COMPLETED") return jobs.filter((j) => j.status === "COMPLETED");
    if (filter === "FAILED") return jobs.filter((j) => j.status === "FAILED");
    return jobs;
  }, [jobs, filter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Queue & Pipelines</h1>
            <span className="tag border-violet-500/30 text-violet-300">GPU WORKERS ONLINE</span>
          </div>
          <p className="text-xs text-white/40 mt-1">
            Real-time execution telemetry, render pipelines, and worker dispatch logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchQueueJobs}
            className="btn-ghost text-xs px-3 py-2 gap-1.5"
            title="Refresh Queue"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Metric Cards with Gradient Borders ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Queued */}
        <div className="glass-card p-5 space-y-2 border-white/[0.06] hover:border-white/[0.12] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-label text-white/50">Queued</span>
            <Clock className="w-4 h-4 text-white/30" />
          </div>
          <div className="text-3xl font-bold text-white tabular-nums tracking-tight">
            {pendingCount}
          </div>
          <div className="text-[11px] text-white/35">Waiting for next GPU slot</div>
        </div>

        {/* In Progress */}
        <div className="gradient-border gradient-border-cyan p-5 space-y-2 rounded-xl transition-all hover:shadow-[0_0_24px_rgba(6,182,212,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-label text-cyan-400">Rendering & Directing</span>
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div className="text-3xl font-bold text-white tabular-nums tracking-tight">
            {inProgressCount}
          </div>
          <div className="text-[11px] text-cyan-300/60">Active GPU processes</div>
        </div>

        {/* Completed */}
        <div className="glass-card p-5 space-y-2 border-white/[0.06] hover:border-emerald-500/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-label text-emerald-400">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-white tabular-nums tracking-tight">
            {completedCount}
          </div>
          <div className="text-[11px] text-emerald-400/60">Successfully delivered</div>
        </div>

        {/* Failed */}
        <div className="glass-card p-5 space-y-2 border-white/[0.06] hover:border-red-500/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-label text-red-400">Failed</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-white tabular-nums tracking-tight">
            {failedCount}
          </div>
          <div className="text-[11px] text-red-400/60">Requires attention / retry</div>
        </div>
      </div>

      {/* ── Filter Tabs & Header ── */}
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.04] pb-3">
        <div className="flex items-center gap-1.5">
          {(
            [
              { id: "ALL", label: `All Jobs (${jobs.length})` },
              { id: "ACTIVE", label: `Active (${inProgressCount + pendingCount})` },
              { id: "COMPLETED", label: `Completed (${completedCount})` },
              { id: "FAILED", label: `Failed (${failedCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filter === tab.id
                  ? "bg-violet-600/15 border border-violet-500/40 text-violet-300"
                  : "text-white/40 hover:text-white hover:bg-white/[0.03]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-[11px] font-mono text-white/30 hidden sm:block">
          STREAM: <span className="text-violet-400">export-pipeline-v1</span>
        </div>
      </div>

      {/* ── Jobs Execution Stream ── */}
      <div className="space-y-4">
        {loading && jobs.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            <span className="text-xs text-white/40">Querying execution cluster...</span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="glass-card p-16 text-center flex flex-col items-center gap-4 rounded-2xl border-dashed">
            <Layers className="w-8 h-8 text-white/20" />
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">No jobs in this category</h3>
              <p className="text-xs text-white/40">
                Dispatch a new video creation from the library to populate the queue.
              </p>
            </div>
            <Link href="/dashboard/videos" className="btn-primary text-xs px-4 py-2 mt-2 gap-1.5">
              <span>Go to Videos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const isExpanded = expandedLogId === job.id;
            const isActionRunning = actionLoading === job.id;
            const progress = getProgressPercent(job.status, job.progress);
            const isInProgress = [
              "DOWNLOADING",
              "TRANSCRIBING",
              "AI_DIRECTING",
              "RENDERING",
              "PUBLISHING",
            ].includes(job.status);

            return (
              <div
                key={job.id}
                className={cn(
                  "glass-card p-5 space-y-4 transition-all duration-200 border-white/[0.06]",
                  isInProgress && "border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.08)]",
                  job.status === "FAILED" && "border-red-500/25",
                  isExpanded && "bg-white/[0.02]"
                )}
              >
                {/* Job Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-sm font-semibold text-white">{job.title}</h3>
                      <StatusBadge status={job.status} />
                      {job.video_type && (
                        <span className="tag text-[9px] border-white/[0.08] text-white/40">
                          {job.video_type === "faceless_short" ? "FACELESS" : "TALKING HEAD"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-white/35 font-mono">
                      <span>ID: {job.id}</span>
                      <span>·</span>
                      <span>Created {formatDate(job.created_at)}</span>
                      {job.stage && (
                        <>
                          <span>·</span>
                          <span className="text-white/60 font-sans">{job.stage}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {job.status === "QUEUED" && (
                      <button
                        onClick={() => handleDispatch(job.id)}
                        disabled={isActionRunning}
                        className="btn-primary text-xs px-3 py-1.5 gap-1.5 shadow-[0_0_12px_rgba(124,58,237,0.3)] disabled:opacity-50"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>{isActionRunning ? "Dispatching..." : "Dispatch Now"}</span>
                      </button>
                    )}

                    {job.status === "FAILED" && (
                      <button
                        onClick={() => handleRetry(job.id)}
                        disabled={isActionRunning}
                        className="btn-ghost text-xs px-3 py-1.5 gap-1.5 text-white/70 hover:text-white disabled:opacity-50"
                      >
                        <RotateCcw className={cn("w-3 h-3", isActionRunning && "animate-spin")} />
                        <span>{isActionRunning ? "Retrying..." : "Retry"}</span>
                      </button>
                    )}

                    {job.status === "COMPLETED" && (
                      <Link
                        href={`/dashboard/editor/${job.id}`}
                        className="btn-ghost text-xs px-3 py-1.5 gap-1.5 text-white/70 hover:text-white"
                      >
                        <Scissors className="w-3 h-3 text-yellow-400" />
                        <span>Edit in Studio</span>
                      </Link>
                    )}

                    {job.error_log && (
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : job.id)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg text-xs font-mono inline-flex items-center gap-1.5 transition-colors border",
                          isExpanded
                            ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                            : "bg-white/[0.03] border-white/[0.08] text-white/50 hover:text-white"
                        )}
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Logs</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar (Visible for In Progress or Detailed Jobs) */}
                {(isInProgress || job.status === "QUEUED") && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-white/40">
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
                        {job.stage || "Pipeline execution in progress..."}
                      </span>
                      <span className="font-mono text-white/75">{progress}%</span>
                    </div>

                    <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Terminal-Style Monospace Log Panel */}
                {isExpanded && job.error_log && (
                  <div className="mt-3 rounded-xl border border-white/[0.08] bg-[#07090e] overflow-hidden shadow-2xl animate-in fade-in duration-200">
                    {/* Terminal Header */}
                    <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                          <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                        </div>
                        <span className="text-[11px] font-mono text-white/40 ml-2">
                          telemetry-output-{job.id}.log
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopyLog(job.id, job.error_log!)}
                        className="text-[11px] text-white/40 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        {copiedLogId === job.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Log</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Terminal Body */}
                    <div className="p-4 font-mono text-xs leading-relaxed overflow-x-auto text-white/70 max-h-64 whitespace-pre select-text">
                      {job.error_log}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
