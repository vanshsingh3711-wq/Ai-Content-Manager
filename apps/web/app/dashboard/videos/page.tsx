"use client";

import React, { useState, useEffect } from "react";
import {
  Film,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Video,
  Sparkles,
  Trash2,
  Layers,
  Search,
  Play,
  Scissors,
  Share2,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { VideoUploadModal } from "@/components/VideoUploadModal";
import { VideoDetailModal } from "@/components/VideoDetailModal";

interface VideoJob {
  id: string;
  user_id: string;
  title: string;
  source_url: string;
  rendered_url?: string | null;
  video_type: "talking_head" | "faceless_short";
  status: "QUEUED" | "DOWNLOADING" | "TRANSCRIBING" | "AI_DIRECTING" | "RENDERING" | "PUBLISHING" | "COMPLETED" | "FAILED";
  edit_decision_list?: string | null;
  error_log?: string | null;
  created_at: string;
  updated_at: string;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoJob | null>(null);

  async function fetchVideos() {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      console.log(`[FRONTEND: VIDEOS] 🔄 Fetching video library from: ${apiUrl}/api/v1/videos...`);
      const res = await fetch(`${apiUrl}/api/v1/videos`);
      if (res.ok) {
        const data = await res.json();
        console.log(`[FRONTEND: VIDEOS] ✅ Received ${data.length} video jobs from database:`, data);
        setVideos(data);
      } else {
        console.warn(`[FRONTEND: VIDEOS] ⚠️ API returned status ${res.status}:`, await res.text());
      }
    } catch (err) {
      console.error("[FRONTEND: VIDEOS] ❌ Network/fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, videoId: string) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this video job?")) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    console.log(`[FRONTEND: VIDEOS] 🗑️ Deleting video job: ${videoId}...`);
    try {
      const res = await fetch(`${apiUrl}/api/v1/videos/${videoId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        console.log(`[FRONTEND: VIDEOS] ✅ Deleted job ${videoId}`);
        setVideos((prev) => prev.filter((v) => v.id !== videoId));
      }
    } catch (err) {
      console.error("[FRONTEND: VIDEOS] ❌ Delete error:", err);
    }
  }

  useEffect(() => {
    fetchVideos();
    const interval = setInterval(fetchVideos, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredVideos = videos.filter((v) =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: VideoJob["status"]) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case "PUBLISHING":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse">
            <Share2 className="w-3 h-3" />
            Publishing
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      case "QUEUED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            Queued
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 animate-pulse">
            <Layers className="w-3 h-3" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Videos Library</h1>
          <p className="text-sm text-slate-400">
            Direct R2 ingest, AI editing state machine, and exported videos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchVideos}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
            title="Refresh list"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Video</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search videos by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0d1017] border border-slate-800/80 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Videos Grid */}
      {loading && videos.length === 0 ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          <span className="text-xs">Loading video pipeline jobs...</span>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-[#0d1017]/60 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Film className="w-7 h-7" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-base font-semibold text-white">No videos in pipeline</h3>
            <p className="text-xs text-slate-400">
              Upload raw video footage or create a faceless AI short.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 inline-flex items-center gap-2 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Upload First Video</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => setSelectedVideo(video)}
              className="rounded-2xl bg-[#0d1017] border border-slate-800/80 hover:border-indigo-500/60 transition-all overflow-hidden flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-xl hover:shadow-indigo-500/5"
            >
              {/* Card Header / Thumbnail */}
              <div className="h-40 bg-gradient-to-br from-slate-900 via-[#101420] to-[#0d1017] relative p-4 flex flex-col justify-between border-b border-slate-800/60">
                <div className="flex items-center justify-between z-10">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-900/80 text-slate-300 border border-slate-700/60 backdrop-blur-md">
                    {video.video_type === "talking_head" ? (
                      <>
                        <Video className="w-3 h-3 text-indigo-400" />
                        Talking Head
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        Faceless Short
                      </>
                    )}
                  </span>

                  {getStatusBadge(video.status)}
                </div>

                <div className="z-10 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatDate(video.created_at)}
                  </span>
                  <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 group-hover:scale-110 transition-transform">
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
                    {video.title}
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono truncate" title={video.source_url}>
                    {video.source_url}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[10px]">
                    ID: {video.id.slice(0, 8)}...
                  </span>

                  <button
                    onClick={(e) => handleDelete(e, video.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Video"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <VideoUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchVideos}
      />

      {/* Video Details & AI Edits Inspector Modal */}
      <VideoDetailModal
        video={selectedVideo}
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </div>
  );
}
