"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Film, Plus, Sparkles, RefreshCw } from "lucide-react";
import { Button, EmptyState, useToast } from "@/components/ui";
import {
  VideoJob,
  StatusFilter,
  VideoTypeFilter,
  ViewMode,
  VideoCard,
  VideoTableRow,
  FilterBar,
  VideoDetailDrawer,
  BatchActionBar,
} from "@/components/library";
import { cn } from "@/lib/utils";

const DEMO_VIDEOS: VideoJob[] = [
  {
    id: "v-demo-1",
    user_id: "default_user",
    title: "Why Compound Interest Grows Exponentially",
    source_url: "",
    rendered_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    video_type: "faceless_short",
    status: "COMPLETED",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    edit_decision_list: JSON.stringify({
      settings: { aspect_ratio: "9:16", video_style: "educational", caption_preset: "tiktok_yellow" },
      validated_edits: [
        { action: "cut", start_time: 0, description: "Hook intro speech" },
        { action: "b_roll", start_time: 4.5, description: "Compound curve 3D motion" },
        { action: "zoom_in", start_time: 12.0, description: "Exponential hockey-stick graph" },
      ],
      unified_analysis: {
        transcript: "If you invest early, compound interest works as an exponential multiplier rather than simple linear addition.",
      },
    }),
  },
  {
    id: "v-demo-2",
    user_id: "default_user",
    title: "Honey Never Spoils — The Chemistry of Eternal Food",
    source_url: "",
    rendered_url: null,
    video_type: "faceless_short",
    status: "COMPLETED",
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    edit_decision_list: JSON.stringify({
      settings: { aspect_ratio: "9:16", video_style: "educational", caption_preset: "tiktok_yellow" },
    }),
  },
  {
    id: "v-demo-3",
    user_id: "default_user",
    title: "Top 5 Productivity Hacks for Deep Work",
    source_url: "",
    rendered_url: null,
    video_type: "talking_head",
    status: "RENDERING",
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: "v-demo-4",
    user_id: "default_user",
    title: "How Quantum Computers Break Encryption",
    source_url: "",
    rendered_url: null,
    video_type: "faceless_short",
    status: "AI_DIRECTING",
    created_at: new Date(Date.now() - 900000).toISOString(),
    updated_at: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: "v-demo-5",
    user_id: "default_user",
    title: "The Roman Empire's Secret Concrete Formula",
    source_url: "",
    rendered_url: null,
    video_type: "faceless_short",
    status: "COMPLETED",
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: "v-demo-6",
    user_id: "default_user",
    title: "Autonomous AI Agents in 2026",
    source_url: "",
    rendered_url: null,
    video_type: "talking_head",
    status: "FAILED",
    error_log: "Audio sample rate mismatch during transcription alignment",
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
];

export default function VideosLibraryPage() {
  const { success, info } = useToast();
  const [videos, setVideos] = useState<VideoJob[]>(DEMO_VIDEOS);
  const [isLoading, setIsLoading] = useState(false);

  // Filter & View States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<VideoTypeFilter>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Selection & Drawer States
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedVideo, setSelectedVideo] = useState<VideoJob | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch real videos from API
  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/videos`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setVideos(data);
        }
      }
    } catch {
      // Fallback to demo videos
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Filtered video list
  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      // Search
      if (
        searchQuery &&
        !video.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Status
      if (statusFilter === "COMPLETED" && video.status !== "COMPLETED") {
        return false;
      }
      if (
        statusFilter === "PROCESSING" &&
        ["COMPLETED", "FAILED"].includes(video.status)
      ) {
        return false;
      }
      if (statusFilter === "FAILED" && video.status !== "FAILED") {
        return false;
      }

      // Type
      if (typeFilter !== "ALL" && video.video_type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [videos, searchQuery, statusFilter, typeFilter]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleOpenDrawer = (video: VideoJob) => {
    setSelectedVideo(video);
    setDrawerOpen(true);
  };

  const handleBatchDelete = () => {
    setVideos((prev) => prev.filter((v) => !selectedIds.has(v.id)));
    success("Videos Deleted", `Removed ${selectedIds.size} videos from library.`);
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-6 animate-children">
      {/* ── Page Header ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display font-bold text-white tracking-tight">
            Video Content Library
          </h1>
          <p className="text-body text-white/50 mt-1">
            Browse, inspect, and fine-tune your autonomous AI video productions.
          </p>
        </div>

        <Link href="/dashboard/create">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create New Video
          </Button>
        </Link>
      </div>

      {/* ── Search & Filter Controls ──────────────── */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={fetchVideos}
        isRefreshing={isLoading}
        totalCount={videos.length}
      />

      {/* ── Video Content Display ─────────────────── */}
      {filteredVideos.length === 0 ? (
        <EmptyState
          icon={Film}
          title={videos.length === 0 ? "No videos in your library yet" : "No videos match your search"}
          description={
            videos.length === 0
              ? "Start by creating an educational short, finance explainer, or tech reel in under 60 seconds."
              : "Try adjusting your filter settings or create a new autonomous AI video."
          }
          actionText={videos.length === 0 ? "Create First Video" : "Create New Video"}
          onAction={() => (window.location.href = "/dashboard/create")}
          secondaryActionText={videos.length > 0 ? "Reset Filters" : undefined}
          onSecondaryAction={
            videos.length > 0
              ? () => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                  setTypeFilter("ALL");
                }
              : undefined
          }
          className="my-12"
        />
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              isSelected={selectedIds.has(video.id)}
              onToggleSelect={handleToggleSelect}
              onClick={handleOpenDrawer}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="rounded-xl border border-white/[0.06] bg-[#0c0f16]/60 backdrop-blur-md overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-white/[0.02] border-b border-white/[0.05] text-[10px] font-mono uppercase tracking-wider text-white/40 font-semibold">
            <div className="col-span-12 sm:col-span-6">Video Title</div>
            <div className="col-span-4 sm:col-span-2">Status</div>
            <div className="hidden sm:block sm:col-span-2">Format</div>
            <div className="col-span-8 sm:col-span-2 text-right">Created</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-white/[0.04]">
            {filteredVideos.map((video) => (
              <VideoTableRow
                key={video.id}
                video={video}
                isSelected={selectedIds.has(video.id)}
                onToggleSelect={handleToggleSelect}
                onClick={handleOpenDrawer}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Floating Batch Action Bar ─────────────── */}
      <BatchActionBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onBatchDelete={handleBatchDelete}
      />

      {/* ── Slide-Over Video Detail Drawer ────────── */}
      <VideoDetailDrawer
        video={selectedVideo}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
