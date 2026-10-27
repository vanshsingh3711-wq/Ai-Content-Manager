"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Layers,
  RefreshCw,
  Plus,
  Play,
  RotateCcw,
  Sparkles,
  Bell,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button, Tabs, EmptyState, useToast } from "@/components/ui";
import {
  QueueJob,
  JobStatus,
  QueueTabFilter,
  JobCard,
  JobLogDrawer,
  QueueStatsBanner,
} from "@/components/queue";
import { useJobStream } from "@/lib/realtime";
import { cn } from "@/lib/utils";

const DEMO_QUEUE_JOBS: QueueJob[] = [
  {
    id: "job-8924b1",
    title: "Why Compound Interest Grows Fast in Your 20s",
    status: "RENDERING",
    source_url: "",
    video_type: "faceless_short",
    progress: 84,
    stage: "Remotion 4K Multi-Track Render (Docked Subtitles & SFX Sync)",
    created_at: new Date(Date.now() - 1000 * 120).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 15).toISOString(),
    error_log: `[00:01.02] [SYSTEM] Job initialized. Worker assigned: worker-gpu-01
[00:02.14] [DEEPSEEK] Parsing hook prompt and topic keywords...
[00:04.50] [AUDIO] Voiceover synthesized via ElevenLabs (sarah_energetic, 28.4s)
[00:07.12] [TRANSCRIBE] WhisperX word-level alignment complete (38 words, 0 low-conf tokens)
[00:11.89] [DIRECTOR] DeepSeek R1 generated 4 kinetic motion graphic overlays + 3 B-roll cutaways
[00:14.30] [REMOTION] Bundling composition with WebGL 3D Avatar pipeline...
[00:18.00] [RENDER] Stitching frame sequence: 84% complete (ETA 5s)`,
  },
  {
    id: "job-8924b2",
    title: "Top 5 Productivity Hacks for Deep Work",
    status: "AI_DIRECTING",
    source_url: "",
    video_type: "talking_head",
    progress: 60,
    stage: "DeepSeek Reasoning — Hook & Contextual B-Roll Placement",
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
    progress: 10,
    stage: "Waiting in GPU dispatcher queue for worker allocation",
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
    stage: "Pipeline completed successfully in 32.8s",
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
    stage: "Terminated: Audio sample rate mismatch during WhisperX alignment",
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

export default function QueueJobsPage() {
  const { success, info } = useToast();
  const [jobs, setJobs] = useState<QueueJob[]>(DEMO_QUEUE_JOBS);
  const [activeTab, setActiveTab] = useState<string>("active");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Selected job for logs drawer
  const [logJob, setLogJob] = useState<QueueJob | null>(null);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);

  // Stable callbacks for stream events
  const handleJobCompleted = useCallback(
    (job: any) => {
      success("Render Complete!", `"${job.title}" finished rendering successfully.`);
    },
    [success]
  );

  const handleJobFailed = useCallback(
    (job: any) => {
      info("Render Failed", `"${job.title}" encountered an error during generation.`);
    },
    [info]
  );

  // Real-time SSE stream hook
  const {
    jobs: streamJobs,
    status: streamStatus,
    permission,
    requestPermission,
    refresh: refreshStream,
  } = useJobStream({
    onJobCompleted: handleJobCompleted,
    onJobFailed: handleJobFailed,
  });

  // When live stream sends jobs, update the page state
  useEffect(() => {
    if (streamJobs.length > 0) {
      setJobs(streamJobs);
    }
  }, [streamJobs]);

  const fetchJobs = async () => {
    setIsRefreshing(true);
    await refreshStream();
    setIsRefreshing(false);
  };

  // Compute job metrics with useMemo to avoid re-rendering downstream components
  const activeJobs = useMemo(
    () => jobs.filter((j) => j.status !== "COMPLETED" && j.status !== "FAILED"),
    [jobs]
  );
  const completedJobs = useMemo(
    () => jobs.filter((j) => j.status === "COMPLETED"),
    [jobs]
  );
  const failedJobs = useMemo(
    () => jobs.filter((j) => j.status === "FAILED"),
    [jobs]
  );

  // Tab definitions
  const queueTabs = useMemo(
    () => [
      {
        id: "active",
        label: `Active Pipeline (${activeJobs.length})`,
        badge: activeJobs.length > 0 ? (
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse ml-1" />
        ) : undefined,
      },
      { id: "completed", label: `Completed (${completedJobs.length})` },
      { id: "failed", label: `Failed (${failedJobs.length})` },
      { id: "all", label: `All Jobs (${jobs.length})` },
    ],
    [activeJobs.length, completedJobs.length, failedJobs.length, jobs.length]
  );

  // Filtered jobs
  const displayedJobs = useMemo(() => {
    switch (activeTab) {
      case "active":
        return activeJobs;
      case "completed":
        return completedJobs;
      case "failed":
        return failedJobs;
      default:
        return jobs;
    }
  }, [jobs, activeTab, activeJobs, completedJobs, failedJobs]);

  const handleOpenLogs = (job: QueueJob) => {
    setLogJob(job);
    setLogDrawerOpen(true);
  };

  const handleRetry = async (jobId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiUrl}/api/v1/videos/${jobId}/retry`, { method: "POST" });
    } catch {}

    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: "QUEUED",
              progress: 10,
              stage: "Re-queued for execution by worker pool",
            }
          : j
      )
    );
    success("Job Re-queued", `Job ${jobId} has been sent back to the worker pool.`);
  };

  const handleCancel = (jobId: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: "FAILED",
              stage: "Manually cancelled by user",
            }
          : j
      )
    );
    info("Job Cancelled", `Job ${jobId} was stopped.`);
  };

  return (
    <div className="space-y-6 animate-children">
      {/* ── Page Header ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display font-bold text-white tracking-tight">
            Rendering Queue & Worker Pipelines
          </h1>
          <p className="text-body text-white/50 mt-1">
            Track real-time speech alignment, AI directing treatments, and Remotion video rendering.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Stream Status Pill */}
          {streamStatus === "connected" && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Stream Active</span>
            </div>
          )}
          {streamStatus === "connecting" && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Connecting SSE...</span>
            </div>
          )}
          {streamStatus === "disconnected" && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/40 text-[11px] font-mono">
              <WifiOff className="w-3 h-3 text-white/30" />
              <span>Polling (8s)</span>
            </div>
          )}

          {/* Desktop Alerts Opt-in */}
          {permission !== "granted" && permission !== "unsupported" && (
            <Button
              variant="outline"
              size="sm"
              onClick={requestPermission}
              leftIcon={<Bell className="w-3.5 h-3.5 text-cyan-400" />}
            >
              Enable Alerts
            </Button>
          )}

          <Button
            variant="ghost"
            size="md"
            onClick={fetchJobs}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>

          <Link href="/dashboard/create">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New AI Video
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Pipeline Telemetry Banner ─────────────── */}
      <QueueStatsBanner
        activeCount={activeJobs.length}
        completedCount={completedJobs.length}
        failedCount={failedJobs.length}
        avgDurationSec={32}
      />

      {/* ── Tabs Navigation ───────────────────────── */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <Tabs
          tabs={queueTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          size="md"
        />
      </div>

      {/* ── Jobs Display ──────────────────────────── */}
      {displayedJobs.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={
            activeTab === "active"
              ? "All Pipelines Idle"
              : `No ${activeTab} jobs found`
          }
          description={
            activeTab === "active"
              ? "There are currently no active renders in progress. Start a new video to see real-time pipeline telemetry."
              : "No jobs match this queue filter."
          }
          actionText="Create New Video"
          onAction={() => (window.location.href = "/dashboard/create")}
          className="my-10"
        />
      ) : (
        <div className="space-y-4">
          {displayedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onOpenLogs={handleOpenLogs}
              onRetry={handleRetry}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}

      {/* ── Worker Log Inspection Drawer ──────────── */}
      <JobLogDrawer
        job={logJob}
        isOpen={logDrawerOpen}
        onClose={() => setLogDrawerOpen(false)}
      />
    </div>
  );
}
