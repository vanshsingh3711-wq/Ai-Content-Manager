"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Film,
  Layers,
  ArrowUpRight,
  Clock,
  Play,
  Plus,
  Scissors,
  Sparkles,
  Upload,
  Zap,
  CheckCircle2,
  Cpu,
  Activity,
  HardDrive,
} from "lucide-react";
import { Button, Badge, Card, EmptyState } from "@/components/ui";
import {
  PipelineMonitor,
  QuickActions,
  ActivityFeed,
  ContinueEditingCard,
  DashboardStatsRow,
  ActivityItem,
  OnboardingBanner,
  OnboardingTourModal,
} from "@/components/dashboard";
import { VideoUploadModal } from "@/components/VideoUploadModal";
import { TimelineProject } from "@/lib/timeline-types";
import { cn } from "@/lib/utils";

/* ── Types ──────────────────────────────────────────── */
type VideoStatus =
  | "QUEUED"
  | "DOWNLOADING"
  | "TRANSCRIBING"
  | "AI_DIRECTING"
  | "RENDERING"
  | "COMPLETED"
  | "FAILED";

interface VideoItem {
  id: string;
  title: string;
  status: VideoStatus;
  duration: number;
  createdAt: string;
}

const MOCK_RECENT_VIDEOS: VideoItem[] = [
  {
    id: "v1",
    title: "Why Compound Interest Grows Fast",
    status: "COMPLETED",
    duration: 32,
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: "v2",
    title: "Honey Never Spoils — Feynman Fun Facts",
    status: "COMPLETED",
    duration: 28,
    createdAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
  },
  {
    id: "v3",
    title: "Top 5 Productivity Hacks (Fast Cuts)",
    status: "RENDERING",
    duration: 45,
    createdAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
  },
];

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: "act-1",
    type: "render_done",
    title: "Video Render Complete",
    subtitle: "Why Compound Interest Grows Fast (32s • 9:16)",
    timestamp: "18m ago",
    actionUrl: "/dashboard/videos",
  },
  {
    id: "act-2",
    type: "directing",
    title: "AI Scene Treatments Generated",
    subtitle: "5 motion cards + 8 B-roll clips placed for Productivity Hacks",
    timestamp: "24m ago",
    actionUrl: "/dashboard/queue",
  },
  {
    id: "act-3",
    type: "draft",
    title: "Project Draft Auto-Saved",
    subtitle: "Draft saved locally with audio waveform and subtitle styles",
    timestamp: "1h ago",
    actionUrl: "/dashboard/editor",
  },
  {
    id: "act-4",
    type: "publish",
    title: "Shorts Queue Updated",
    subtitle: "Honey Never Spoils queued for multi-platform scheduling",
    timestamp: "3h ago",
    actionUrl: "/dashboard/socials",
  },
];

/* ── Helpers ─────────────────────────────────────────── */
function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getStatusBadgeVariant(status: VideoStatus) {
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
}

export default function DashboardOverviewPage() {
  const [draftProject, setDraftProject] = useState<TimelineProject | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>(MOCK_RECENT_VIDEOS);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [tourModalOpen, setTourModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalVideos: 12,
    inProcess: 1,
    completed: 11,
    failed: 0,
  });

  // Load draft from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("video-editor-draft");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed?.state?.project &&
          parsed.state.project.id !== "default-project"
        ) {
          setDraftProject(parsed.state.project);
        }
      }
    } catch {}
  }, []);

  // Fetch real stats & jobs
  useEffect(() => {
    async function loadData() {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const [statsRes, jobsRes, videosRes] = await Promise.allSettled([
          fetch(`${apiUrl}/api/v1/system/stats`),
          fetch(`${apiUrl}/api/v1/jobs`),
          fetch(`${apiUrl}/api/v1/videos`),
        ]);

        if (videosRes.status === "fulfilled" && videosRes.value.ok) {
          const data = await videosRes.value.json();
          if (Array.isArray(data) && data.length > 0) {
            setVideos(
              data.map((v: any) => ({
                id: String(v.id),
                title: v.title || "Untitled Video",
                status: (v.status as VideoStatus) || "COMPLETED",
                duration: v.duration || 30,
                createdAt: v.created_at || new Date().toISOString(),
              }))
            );
          }
        }

        if (jobsRes.status === "fulfilled" && jobsRes.value.ok) {
          const jobData = await jobsRes.value.json();
          const jobsList = jobData.jobs || [];
          const active = jobsList.filter(
            (j: any) => j.status !== "COMPLETED" && j.status !== "FAILED"
          ).length;
          const completed = jobsList.filter(
            (j: any) => j.status === "COMPLETED"
          ).length;
          const failed = jobsList.filter(
            (j: any) => j.status === "FAILED"
          ).length;

          setStats({
            totalVideos: (statsRes.status === "fulfilled" && statsRes.value.ok
              ? (await statsRes.value.json()).total_video_jobs
              : completed) || 12,
            inProcess: active,
            completed: completed || 11,
            failed,
          });
        }
      } catch {}
    }

    loadData();
  }, []);

  const discardDraft = () => {
    localStorage.removeItem("video-editor-draft");
    setDraftProject(null);
  };

  const pipelineStages = {
    queued: videos.filter((v) => v.status === "QUEUED").length,
    transcribing: videos.filter((v) => v.status === "TRANSCRIBING").length,
    directing: videos.filter((v) => v.status === "AI_DIRECTING").length,
    rendering: videos.filter((v) => v.status === "RENDERING").length || stats.inProcess,
    completed: stats.completed,
    failed: stats.failed,
  };

  return (
    <div className="relative space-y-8 animate-children pb-10">
      {/* ── Ambient Radial Atmosphere Glow ──────────────── */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-r from-violet-600/15 via-cyan-500/10 to-indigo-600/15 blur-3xl pointer-events-none rounded-full" />

      {/* ════════════════════════════════════════════
          COMMAND CENTER HEADER
      ════════════════════════════════════════════ */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-[11px] font-mono text-violet-300 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span suppressHydrationWarning>{formatDate()}</span>
            <span className="text-white/20">•</span>
            <span className="text-cyan-400 font-semibold">AI Director Studio</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight" suppressHydrationWarning>
            <span suppressHydrationWarning>{getGreeting()}</span>,{" "}
            <span className="text-gradient-violet">Vansh.</span>
          </h1>

          <p className="text-sm text-white/50 mt-2 max-w-2xl leading-relaxed">
            Welcome to your AI Director Command Center. Your video pipeline is
            optimized for high-retention content creation.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/dashboard/editor">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Scissors className="w-4 h-4 text-white/70" />}
              className="bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.1] text-white font-medium shadow-sm transition-all"
            >
              Open Studio
            </Button>
          </Link>
          <Link href="/dashboard/create">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Sparkles className="w-4 h-4 text-cyan-300" />}
              className="bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 hover:from-violet-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(124,58,237,0.45)] font-semibold transition-all"
            >
              New AI Video
            </Button>
          </Link>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          KPI STATS ROW
      ════════════════════════════════════════════ */}
      <DashboardStatsRow
        totalVideos={stats.totalVideos}
        inPipeline={stats.inProcess}
        completed={stats.completed}
        successRate={100}
      />

      {/* ════════════════════════════════════════════
          ONBOARDING TOUR BANNER
      ════════════════════════════════════════════ */}
      <OnboardingBanner onStartTour={() => setTourModalOpen(true)} />

      {/* ════════════════════════════════════════════
          CONTINUE EDITING (DRAFT RESUME)
      ════════════════════════════════════════════ */}
      {draftProject && (
        <ContinueEditingCard
          project={draftProject}
          onDiscard={discardDraft}
        />
      )}

      {/* ════════════════════════════════════════════
          LIVE PIPELINE MONITOR
      ════════════════════════════════════════════ */}
      <PipelineMonitor
        stages={pipelineStages}
        totalVideos={stats.totalVideos}
      />

      {/* ════════════════════════════════════════════
          CREATION SUBSTRATES (QUICK ACTIONS)
      ════════════════════════════════════════════ */}
      <QuickActions onOpenUpload={() => setUploadModalOpen(true)} />

      {/* ════════════════════════════════════════════
          ACTIVITY FEED & RECENT VIDEOS GRID
      ════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Activity Feed (Left 6 cols) */}
        <div className="lg:col-span-6">
          <ActivityFeed items={INITIAL_ACTIVITIES} />
        </div>

        {/* Recent Videos (Right 6 cols) */}
        <div className="lg:col-span-6">
          <div className="relative rounded-2xl p-6 sm:p-7 glass-card-premium border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] h-full flex flex-col justify-between overflow-hidden">
            {/* Top rim highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Recent Videos
                  </h3>
                  <p className="text-xs text-white/50 mt-1">
                    Latest generated video content and cuts
                  </p>
                </div>
                <Link
                  href="/dashboard/videos"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
                >
                  <span>View All</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {videos.length === 0 ? (
                <EmptyState
                  icon={Film}
                  title="No videos yet"
                  description="Generate your first autonomous AI video with motion graphics and timed captions."
                  actionText="Create Video"
                  onAction={() => setUploadModalOpen(true)}
                  className="my-8"
                />
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {videos.slice(0, 4).map((video) => (
                    <div
                      key={video.id}
                      className="py-3.5 flex items-center justify-between gap-3 group hover:bg-white/[0.02] px-3 -mx-3 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Film slate preview icon */}
                        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/40 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-all shrink-0 shadow-inner">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                            {video.title}
                          </h4>
                          <div className="text-[11px] font-mono text-white/40 flex items-center gap-2 mt-0.5">
                            <span className="text-white/60">{video.duration}s</span>
                            <span>•</span>
                            <span>9:16 Shorts</span>
                            <span>•</span>
                            <span suppressHydrationWarning>{formatRelativeTime(video.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <Badge variant={getStatusBadgeVariant(video.status)}>
                          {video.status.replace(/_/g, " ")}
                        </Badge>
                        <Link
                          href={`/dashboard/editor/${video.id}`}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
                          title="Open in Studio"
                        >
                          <Scissors className="w-4 h-4 text-amber-400" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 mt-5 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/40 font-medium">
              <span>Showing recent {Math.min(4, videos.length)} videos</span>
              <Link
                href="/dashboard/videos"
                className="text-violet-400 hover:text-violet-300 font-semibold transition-colors"
              >
                Go to library →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          STUDIO ENGINE TELEMETRY BAR
      ════════════════════════════════════════════ */}
      <div className="rounded-2xl p-4 glass-card-premium border border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-xs text-white/50">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            <span className="font-semibold text-white/80">Remotion Compositor:</span>
            <span className="font-mono text-white/50 text-[11px]">v4.0.526 (GPU Accelerated)</span>
          </div>

          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-white/80">AI Directing Model:</span>
            <span className="font-mono text-white/50 text-[11px]">Whisper Large + Gemini 1.5</span>
          </div>

          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-violet-400" />
            <span className="font-semibold text-white/80">Telemetry Stream:</span>
            <span className="font-mono text-emerald-400 text-[11px]">Online (8ms latency)</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-white/30">
          AI Director Engine • 60 FPS Export
        </div>
      </div>

      {/* Global Upload Modal */}
      <VideoUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      {/* Interactive Onboarding Tour Modal */}
      <OnboardingTourModal
        isOpen={tourModalOpen}
        onClose={() => setTourModalOpen(false)}
      />
    </div>
  );
}
