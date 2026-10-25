"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Film,
  Layers,
  ArrowUpRight,
  Clock,
  Play,
  Trash2,
  Plus,
  TrendingUp,
  Loader2,
  FileVideo,
  Scissors,
  Zap,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TimelineProject } from "@/lib/timeline-types";

/* ── Types ──────────────────────────────────────────── */
type VideoStatus =
  | "QUEUED"
  | "DOWNLOADING"
  | "TRANSCRIBING"
  | "AI_DIRECTING"
  | "RENDERING"
  | "COMPLETED"
  | "FAILED";

const MOCK_RECENT_VIDEOS: Array<{
  id: string;
  title: string;
  status: VideoStatus;
  duration: number;
  createdAt: string;
}> = [
  { id: "v1", title: "Why Compound Interest Grows Fast", status: "COMPLETED", duration: 32, createdAt: "2026-09-21T14:30:00Z" },
  { id: "v2", title: "Honey Never Spoils — Fun Facts",   status: "COMPLETED", duration: 28, createdAt: "2026-09-20T09:15:00Z" },
  { id: "v3", title: "Top 5 Productivity Hacks",         status: "RENDERING", duration: 45, createdAt: "2026-09-22T08:00:00Z" },
];

/* ── Helpers ─────────────────────────────────────────── */
function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
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

/* ── Status pill (inline) ────────────────────────────── */
function StatusBadge({ status }: { status: VideoStatus }) {
  if (status === "COMPLETED") {
    return (
      <span className="status-pill status-pill-done">
        <span className="status-dot status-dot-online" />
        Done
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
    <span className="status-pill status-pill-rendering">
      <span className="status-dot status-dot-rendering animate-pulse" />
      {status.toLowerCase().replace(/_/g, " ")}
    </span>
  );
}

/* ══════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════ */
export default function DashboardOverviewPage() {
  const [stats, setStats] = useState({
    totalVideos: 0,
    inProcess: 0,
    drafts: 0,
    apiStatus: "checking" as "checking" | "online" | "offline",
  });
  const [draftProject, setDraftProject] = useState<TimelineProject | null>(null);
  const [videos] = useState(MOCK_RECENT_VIDEOS);

  /* — Load draft ─────────────────────────────────── */
  useEffect(() => {
    try {
      const stored = localStorage.getItem("video-editor-draft");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.project && parsed.state.project.id !== "default-project") {
          setDraftProject(parsed.state.project);
        }
      }
    } catch {}
  }, []);

  /* — Fetch stats ────────────────────────────────── */
  useEffect(() => {
    async function fetchStats() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const [healthRes, statsRes] = await Promise.allSettled([
          fetch(`${apiUrl}/health`),
          fetch(`${apiUrl}/api/v1/system/stats`),
        ]);

        const apiOnline =
          healthRes.status === "fulfilled" && healthRes.value.ok;

        let totalJobs = 0;
        if (statsRes.status === "fulfilled" && statsRes.value.ok) {
          const data = await statsRes.value.json();
          totalJobs = data.total_video_jobs || 0;
        }

        setStats({
          totalVideos: totalJobs || videos.filter((v) => v.status === "COMPLETED").length,
          inProcess: videos.filter((v) => v.status !== "COMPLETED" && v.status !== "FAILED").length,
          drafts: draftProject ? 1 : 0,
          apiStatus: apiOnline ? "online" : "offline",
        });
      } catch {
        setStats((prev) => ({
          ...prev,
          totalVideos: videos.filter((v) => v.status === "COMPLETED").length,
          inProcess: videos.filter((v) => v.status !== "COMPLETED" && v.status !== "FAILED").length,
          drafts: draftProject ? 1 : 0,
          apiStatus: "offline",
        }));
      }
    }
    fetchStats();
  }, [draftProject, videos]);

  /* — Stat card data ─────────────────────────────── */
  const statCards = [
    {
      label:    "Total Videos",
      value:    stats.totalVideos,
      sub:      "all time",
      icon:     Film,
      iconColor: "#a78bfa",
      glowClass: "gradient-border-violet",
    },
    {
      label:    "Rendering",
      value:    stats.inProcess,
      sub:      "in pipeline",
      icon:     Loader2,
      iconColor: "#67e8f9",
      glowClass: stats.inProcess > 0 ? "gradient-border-cyan" : "",
      spinning: stats.inProcess > 0,
    },
    {
      label:    "Drafts",
      value:    stats.drafts,
      sub:      "unsaved",
      icon:     FileVideo,
      iconColor: "#fbbf24",
      glowClass: "",
    },
    {
      label:    "Backend",
      value:    stats.apiStatus === "online" ? "Online" : stats.apiStatus === "offline" ? "Offline" : "…",
      sub:      "API status",
      icon:     stats.apiStatus === "online" ? CheckCircle2 : stats.apiStatus === "offline" ? AlertCircle : Loader2,
      iconColor: stats.apiStatus === "online" ? "#34d399" : stats.apiStatus === "offline" ? "#f87171" : "#a78bfa",
      glowClass: stats.apiStatus === "online" ? "gradient-border-white" : "",
    },
  ] as const;

  /* ─────────────────────────────────────────────────── */
  return (
    <div className="space-y-9 animate-children">

      {/* ════════════════════════════════════════════
          GREETING HEADER
      ════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-label mb-2">{formatDate()}</p>
          <h1 className="text-page-title">
            {getGreeting()},{" "}
            <span className="text-gradient-violet">Vansh.</span>
          </h1>
          <p className="text-sm text-white/35 mt-2">
            Here&apos;s what&apos;s happening with your content pipeline today.
          </p>
        </div>

        <Link
          href="/dashboard/videos"
          className={cn(
            "shrink-0 inline-flex items-center gap-1.5 h-9 px-4",
            "text-[13px] font-semibold text-white rounded-lg",
            "bg-violet-600 hover:bg-violet-500",
            "shadow-[0_0_14px_rgba(124,58,237,0.35)]",
            "hover:shadow-[0_0_22px_rgba(124,58,237,0.55)]",
            "transition-all duration-150"
          )}
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          New Video
        </Link>
      </div>

      {/* ════════════════════════════════════════════
          METRIC CARDS
      ════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={cn(
                "gradient-border p-5 space-y-3 transition-all duration-200",
                card.glowClass
              )}
            >
              {/* Top row */}
              <div className="flex items-center justify-between">
                <span className="text-label">{card.label}</span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <Icon
                    className={cn("w-3.5 h-3.5", "spinning" in card && card.spinning && "animate-spin")}
                    style={{ color: card.iconColor }}
                    strokeWidth={1.8}
                  />
                </div>
              </div>

              {/* Value */}
              <div className="text-3xl font-semibold text-white tabular-nums tracking-tight">
                {card.value}
              </div>

              {/* Sub */}
              <div className="text-xs text-white/25 font-medium">{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════
          CONTINUE EDITING (draft card)
      ════════════════════════════════════════════ */}
      {draftProject && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-section-title">Continue Editing</h2>
            <button
              onClick={() => {
                localStorage.removeItem("video-editor-draft");
                setDraftProject(null);
              }}
              className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Discard draft
            </button>
          </div>

          {/* Hero draft card */}
          <div className="gradient-border gradient-border-violet rounded-xl overflow-hidden">
            <div className="flex items-center gap-5 p-5">
              {/* Thumbnail placeholder */}
              <div className={cn(
                "shrink-0 w-24 h-16 rounded-lg",
                "flex items-center justify-center",
                "bg-violet-500/10 border border-violet-500/20"
              )}>
                <Play className="w-6 h-6 text-violet-400/70 fill-violet-400/70" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {draftProject.title || "Untitled Project"}
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-white/35">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {draftProject.duration?.toFixed(1)}s
                  </span>
                  <span className="text-white/15">·</span>
                  <span>{draftProject.aspectRatio}</span>
                  <span className="text-white/15">·</span>
                  <span>{draftProject.tracks?.videoTrack?.length ?? 0} clips</span>
                </div>
                <div className="mt-2">
                  <span className="status-pill status-pill-queued">
                    <span className="status-dot status-dot-queued" />
                    Draft saved
                  </span>
                </div>
              </div>

              {/* Resume button */}
              <Link
                href={`/dashboard/editor/${draftProject.id || "new"}`}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 h-9 px-4",
                  "text-[13px] font-semibold text-white rounded-lg",
                  "bg-violet-600 hover:bg-violet-500",
                  "shadow-[0_0_12px_rgba(124,58,237,0.3)]",
                  "hover:shadow-[0_0_18px_rgba(124,58,237,0.5)]",
                  "transition-all duration-150"
                )}
              >
                <Scissors className="w-3.5 h-3.5" />
                Resume
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          PROCESSING VIDEOS
      ════════════════════════════════════════════ */}
      {videos.filter((v) => v.status !== "COMPLETED" && v.status !== "FAILED").length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-section-title">Currently Processing</h2>
            <Link
              href="/dashboard/queue"
              className="text-xs text-white/30 hover:text-white/70 inline-flex items-center gap-1 transition-colors"
            >
              View queue
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {videos
              .filter((v) => v.status !== "COMPLETED" && v.status !== "FAILED")
              .map((video) => (
                <div
                  key={video.id}
                  className="glass-card flex items-center gap-4 px-5 py-4 rounded-xl"
                >
                  {/* Spinning icon */}
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{video.title}</div>
                    <div className="text-xs text-white/30 mt-0.5">
                      {video.duration}s · {formatRelativeTime(video.createdAt)}
                    </div>
                  </div>

                  {/* Animated progress bar */}
                  <div className="shrink-0 w-32 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
                        {video.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill progress-fill-animate" style={{ width: "60%" }} />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          RECENT VIDEOS TABLE
      ════════════════════════════════════════════ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-section-title">Recent Videos</h2>
          <Link
            href="/dashboard/videos"
            className="text-xs text-white/30 hover:text-white/70 inline-flex items-center gap-1 transition-colors"
          >
            View all
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {videos.length === 0 ? (
          /* Empty state */
          <div className="glass-card rounded-xl p-14 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <Film className="w-5 h-5 text-white/20" />
            </div>
            <p className="text-sm font-medium text-white/40">No videos yet</p>
            <p className="text-xs text-white/20">Create your first AI video to get started.</p>
            <Link
              href="/dashboard/videos"
              className="mt-1 inline-flex items-center gap-1.5 h-8 px-4 text-xs font-semibold text-white rounded-lg bg-violet-600 hover:bg-violet-500 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Video
            </Link>
          </div>
        ) : (
          /* Table */
          <div className="rounded-xl overflow-hidden border border-white/[0.05]">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-white/[0.02] border-b border-white/[0.04]">
              {[
                { label: "Title",    cols: "col-span-5" },
                { label: "Status",   cols: "col-span-2" },
                { label: "Duration", cols: "col-span-2" },
                { label: "Created",  cols: "col-span-2" },
                { label: "Action",   cols: "col-span-1 text-right" },
              ].map((h) => (
                <div key={h.label} className={cn("text-label", h.cols)}>
                  {h.label}
                </div>
              ))}
            </div>

            {/* Rows */}
            {videos.map((video, i) => (
              <div
                key={video.id}
                className={cn(
                  "grid grid-cols-12 gap-4 px-5 py-4 items-center",
                  "hover:bg-white/[0.02] transition-colors duration-150",
                  "cursor-pointer group",
                  i < videos.length - 1 && "border-b border-white/[0.04]"
                )}
              >
                {/* Title */}
                <div className="col-span-5 text-sm font-medium text-white truncate group-hover:text-violet-300 transition-colors">
                  {video.title}
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <StatusBadge status={video.status} />
                </div>

                {/* Duration */}
                <div className="col-span-2 text-mono-sm">
                  {video.duration}s
                </div>

                {/* Created */}
                <div className="col-span-2 text-xs text-white/25">
                  {formatRelativeTime(video.createdAt)}
                </div>

                {/* Action */}
                <div className="col-span-1 flex justify-end">
                  <Link
                    href={`/dashboard/editor/${video.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md",
                      "text-[11px] font-medium",
                      "bg-white/[0.04] border border-white/[0.06]",
                      "text-white/40 hover:text-white hover:bg-white/[0.08]",
                      "hover:border-violet-500/30",
                      "transition-all duration-150",
                      "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <Scissors className="w-3 h-3 text-yellow-400/80" />
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════
          QUICK ACTIONS
      ════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Faceless video */}
        <Link
          href="/dashboard/videos"
          className="group gradient-border gradient-border-violet rounded-xl p-6 block transition-all duration-200 hover:shadow-[0_0_28px_rgba(124,58,237,0.15)]"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-violet-400 transition-colors" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-2">
            Create Faceless Video
          </h3>
          <p className="text-xs text-white/35 leading-relaxed">
            Paste a script, choose a character and theme — the AI generates your complete video automatically.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {["Script", "Character", "Theme", "Auto-Generated"].map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        </Link>

        {/* Upload & enhance */}
        <Link
          href="/dashboard/videos"
          className="group gradient-border gradient-border-cyan rounded-xl p-6 block transition-all duration-200 hover:shadow-[0_0_28px_rgba(6,182,212,0.12)]"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Upload className="w-5 h-5 text-cyan-400" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-cyan-400 transition-colors" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-2">
            Upload & Enhance Video
          </h3>
          <p className="text-xs text-white/35 leading-relaxed">
            Upload your footage and let the AI Director add B-roll, motion graphics, SFX, and captions.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {["Your Footage", "AI B-Roll", "SFX", "Captions"].map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        </Link>
      </div>

    </div>
  );
}
