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
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TimelineProject } from "@/lib/timeline-types";

// Mock data for recent videos — in production this comes from your API
const MOCK_RECENT_VIDEOS = [
  { id: "v1", title: "Why Compound Interest Grows Fast", status: "COMPLETED" as const, duration: 32, createdAt: "2026-09-21T14:30:00Z" },
  { id: "v2", title: "Honey Never Spoils — Fun Facts", status: "COMPLETED" as const, duration: 28, createdAt: "2026-09-20T09:15:00Z" },
  { id: "v3", title: "Top 5 Productivity Hacks", status: "RENDERING" as const, duration: 45, createdAt: "2026-09-22T08:00:00Z" },
];

type VideoStatus = "QUEUED" | "DOWNLOADING" | "TRANSCRIBING" | "AI_DIRECTING" | "RENDERING" | "COMPLETED" | "FAILED";

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function StatusDot({ status }: { status: VideoStatus }) {
  const color =
    status === "COMPLETED" ? "bg-white" :
    status === "FAILED" ? "bg-neutral-500" :
    "bg-neutral-400 animate-pulse";
  return <span className={cn("inline-block w-1.5 h-1.5 rounded-full", color)} />;
}

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState({
    totalVideos: 0,
    inProcess: 0,
    drafts: 0,
    apiStatus: "checking" as "checking" | "online" | "offline",
  });
  const [draftProject, setDraftProject] = useState<TimelineProject | null>(null);
  const [videos, setVideos] = useState(MOCK_RECENT_VIDEOS);

  useEffect(() => {
    // Load draft from localStorage
    try {
      const stored = localStorage.getItem("video-editor-draft");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.project && parsed.state.project.id !== "default-project") {
          setDraftProject(parsed.state.project);
        }
      }
    } catch (e) {
      console.error("Failed to load draft from localStorage", e);
    }
  }, []);

  useEffect(() => {
    async function fetchStats() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const [healthRes, statsRes] = await Promise.allSettled([
          fetch(`${apiUrl}/health`),
          fetch(`${apiUrl}/api/v1/system/stats`),
        ]);

        let apiOnline = false;
        if (healthRes.status === "fulfilled" && healthRes.value.ok) {
          apiOnline = true;
        }

        let totalJobs = 0;
        if (statsRes.status === "fulfilled" && statsRes.value.ok) {
          const data = await statsRes.value.json();
          totalJobs = data.total_video_jobs || 0;
        }

        setStats({
          totalVideos: totalJobs || MOCK_RECENT_VIDEOS.filter(v => v.status === "COMPLETED").length,
          inProcess: MOCK_RECENT_VIDEOS.filter(v => v.status !== "COMPLETED" && v.status !== "FAILED").length,
          drafts: draftProject ? 1 : 0,
          apiStatus: apiOnline ? "online" : "offline",
        });
      } catch {
        setStats(prev => ({
          ...prev,
          totalVideos: MOCK_RECENT_VIDEOS.filter(v => v.status === "COMPLETED").length,
          inProcess: MOCK_RECENT_VIDEOS.filter(v => v.status !== "COMPLETED" && v.status !== "FAILED").length,
          drafts: draftProject ? 1 : 0,
          apiStatus: "offline",
        }));
      }
    }
    fetchStats();
  }, [draftProject]);

  return (
    <div className="space-y-10">

      {/* ─── HEADER ─── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-2">
            Dashboard
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white leading-tight">
            Overview
          </h1>
        </div>
        <Link
          href="/dashboard/videos"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-white text-black hover:bg-neutral-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Video
        </Link>
      </div>

      {/* ─── STATS GRID ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-950 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Total Created</span>
            <Film className="w-4 h-4 text-neutral-600" />
          </div>
          <div className="text-3xl font-semibold text-white tabular-nums">{stats.totalVideos}</div>
          <div className="text-xs text-neutral-500">All time</div>
        </div>

        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-950 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">In Process</span>
            <Loader2 className={cn("w-4 h-4 text-neutral-600", stats.inProcess > 0 && "animate-spin text-white")} />
          </div>
          <div className="text-3xl font-semibold text-white tabular-nums">{stats.inProcess}</div>
          <div className="text-xs text-neutral-500">Currently rendering</div>
        </div>

        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-950 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Drafts</span>
            <FileVideo className="w-4 h-4 text-neutral-600" />
          </div>
          <div className="text-3xl font-semibold text-white tabular-nums">{stats.drafts}</div>
          <div className="text-xs text-neutral-500">Unsaved projects</div>
        </div>

        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-950 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">System</span>
            <Circle className={cn(
              "w-3 h-3",
              stats.apiStatus === "online" ? "fill-white text-white" :
              stats.apiStatus === "offline" ? "fill-neutral-600 text-neutral-600" :
              "fill-neutral-500 text-neutral-500 animate-pulse"
            )} />
          </div>
          <div className="text-3xl font-semibold text-white capitalize">{stats.apiStatus}</div>
          <div className="text-xs text-neutral-500">Backend API</div>
        </div>
      </div>

      {/* ─── PENDING DRAFTS ─── */}
      {draftProject && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white tracking-tight">Pending Draft</h2>
            <button
              onClick={() => {
                localStorage.removeItem("video-editor-draft");
                setDraftProject(null);
              }}
              className="text-xs text-neutral-500 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Discard
            </button>
          </div>

          <div className="flex items-center justify-between p-5 rounded-xl border border-neutral-800 bg-neutral-950">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <Clock className="w-5 h-5 text-neutral-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">{draftProject.title || "Untitled Project"}</div>
                <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-3">
                  <span>{draftProject.duration?.toFixed(1)}s</span>
                  <span className="text-neutral-700">·</span>
                  <span>{draftProject.aspectRatio}</span>
                  <span className="text-neutral-700">·</span>
                  <span>{draftProject.tracks?.videoTrack?.length || 0} clips</span>
                </div>
              </div>
            </div>
            <Link
              href={`/dashboard/editor/${draftProject.id || "new"}`}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-black hover:bg-neutral-200 inline-flex items-center gap-2 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              Resume
            </Link>
          </div>
        </div>
      )}

      {/* ─── IN-PROCESS VIDEOS ─── */}
      {videos.filter(v => v.status !== "COMPLETED" && v.status !== "FAILED").length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white tracking-tight">Currently Processing</h2>
          <div className="space-y-2">
            {videos.filter(v => v.status !== "COMPLETED" && v.status !== "FAILED").map(video => (
              <div key={video.id} className="flex items-center justify-between p-4 rounded-xl border border-neutral-800 bg-neutral-950">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{video.title}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">{video.duration}s · {formatRelativeTime(video.createdAt)}</div>
                  </div>
                </div>
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">{video.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── RECENT VIDEOS ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white tracking-tight">Recent Videos</h2>
          <Link
            href="/dashboard/videos"
            className="text-xs text-neutral-500 hover:text-white inline-flex items-center gap-1 transition-colors"
          >
            View all
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {videos.length === 0 ? (
          <div className="p-12 rounded-xl border border-neutral-800 bg-neutral-950 flex flex-col items-center justify-center text-center">
            <Film className="w-8 h-8 text-neutral-700 mb-3" />
            <p className="text-sm text-neutral-500">No videos yet.</p>
            <p className="text-xs text-neutral-600 mt-1">Create your first AI video to get started.</p>
          </div>
        ) : (
          <div className="border border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-800">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-neutral-900/50 text-xs text-neutral-500 font-medium uppercase tracking-wider">
              <div className="col-span-5">Title</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Duration</div>
              <div className="col-span-3 text-right">Created</div>
            </div>

            {/* Table Rows */}
            {videos.map(video => (
              <div
                key={video.id}
                className="grid grid-cols-12 gap-4 px-5 py-4 items-center bg-neutral-950 hover:bg-neutral-900/50 transition-colors cursor-pointer group"
              >
                <div className="col-span-5 text-sm font-medium text-white group-hover:text-neutral-200 truncate">
                  {video.title}
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <StatusDot status={video.status} />
                  <span className="text-xs text-neutral-400 capitalize">
                    {video.status === "COMPLETED" ? "Done" : video.status.toLowerCase().replace("_", " ")}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-neutral-400 tabular-nums font-mono">
                  {video.duration}s
                </div>
                <div className="col-span-3 text-sm text-neutral-500 text-right">
                  {formatRelativeTime(video.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── QUICK ACTIONS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/videos"
          className="group p-6 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <Layers className="w-5 h-5 text-neutral-500" />
            <ArrowUpRight className="w-4 h-4 text-neutral-700 group-hover:text-neutral-400 transition-colors" />
          </div>
          <h3 className="text-sm font-medium text-white mb-1">Create Faceless Video</h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Paste a script, choose a character, pick a theme, and let AI generate your video automatically.
          </p>
        </Link>

        <Link
          href="/dashboard/videos"
          className="group p-6 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-5 h-5 text-neutral-500" />
            <ArrowUpRight className="w-4 h-4 text-neutral-700 group-hover:text-neutral-400 transition-colors" />
          </div>
          <h3 className="text-sm font-medium text-white mb-1">Upload & Enhance Video</h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Upload your own footage and let the AI Director add B-roll, motion graphics, SFX, and captions.
          </p>
        </Link>
      </div>
    </div>
  );
}
