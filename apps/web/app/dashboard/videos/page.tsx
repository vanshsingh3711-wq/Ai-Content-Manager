"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Film,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Video,
  Sparkles,
  Trash2,
  Layers,
  Search,
  Play,
  Share2,
  Upload,
  FileText,
  User,
  Palette,
  Monitor,
  Smartphone,
  Square,
  Sun,
  Moon,
  ArrowRight,
  ArrowLeft,
  X,
  Clock,
  Loader2,
  Ratio,
  Type,
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

type PageView = "library" | "create";
type CreateMode = null | "faceless" | "upload";

const CHARACTERS = [
  { id: "sarah", name: "Sarah", desc: "Friendly explainer" },
  { id: "alex", name: "Alex", desc: "Professional presenter" },
  { id: "maya", name: "Maya", desc: "Energetic storyteller" },
  { id: "none", name: "No Character", desc: "Voiceover only" },
];

const NICHES = [
  "Education", "Finance", "Tech", "Health", "Motivation",
  "Science", "History", "News", "Lifestyle", "Entertainment",
];

const MOODS = [
  "Energetic", "Calm", "Dramatic", "Mysterious", "Uplifting", "Professional",
];

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoJob | null>(null);

  // Page view
  const [pageView, setPageView] = useState<PageView>("library");
  const [createMode, setCreateMode] = useState<CreateMode>(null);

  // Faceless creation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [facelessForm, setFacelessForm] = useState({
    script: "",
    topic: "",
    character: "sarah",
    niche: "Education",
    theme: "dark" as "dark" | "light",
    ratio: "9:16" as "9:16" | "16:9" | "1:1",
    mood: "Energetic",
  });

  // Upload creation state
  const [uploadForm, setUploadForm] = useState({
    ratio: "9:16" as "9:16" | "16:9" | "1:1",
    style: "viral" as "viral" | "cinematic" | "educational" | "minimal",
    theme: "dark" as "dark" | "light",
    mood: "Energetic",
    niche: "Education",
  });

  async function fetchVideos() {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${apiUrl}/api/v1/videos`);
      if (res.ok) {
        const data = await res.json();
        setVideos(data);
      }
    } catch (err) {
      console.error("Failed to fetch videos:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, videoId: string) {
    e.stopPropagation();
    if (!confirm("Delete this video?")) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${apiUrl}/api/v1/videos/${videoId}`, { method: "DELETE" });
      if (res.ok) setVideos(prev => prev.filter(v => v.id !== videoId));
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  async function handleCreateFaceless() {
    if (!facelessForm.topic && !facelessForm.script) {
      alert("Please provide a topic or a script.");
      return;
    }
    
    setIsSubmitting(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    
    try {
      const res = await fetch(`${apiUrl}/api/v1/videos/create-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: facelessForm.topic || "Faceless AI Video",
          source_url: "",
          video_type: "faceless_short",
          clerk_id: "user_default",
          email: "user@example.com",
          settings: {
            topic: facelessForm.topic,
            script: facelessForm.script,
            character: facelessForm.character,
            niche: facelessForm.niche,
            theme: facelessForm.theme,
            aspect_ratio: facelessForm.ratio,
            mood: facelessForm.mood,
          },
        }),
      });

      if (res.ok) {
        setPageView("library");
        setCreateMode(null);
        fetchVideos();
      } else {
        const errorText = await res.text();
        alert(`Failed to create job: ${errorText}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Is the backend running?");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    fetchVideos();
    const interval = setInterval(fetchVideos, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredVideos = videos.filter(v =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── CREATE VIEW ───
  if (pageView === "create") {
    return (
      <div className="space-y-8">
        {/* Back button */}
        <button
          onClick={() => { setPageView("library"); setCreateMode(null); }}
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </button>

        {/* Mode Selection */}
        {!createMode && (
          <>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-2">Create</p>
              <h1 className="text-3xl font-semibold tracking-tight text-white">New Video</h1>
              <p className="text-sm text-neutral-500 mt-2">Choose how you want to create your video.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Faceless */}
              <button
                onClick={() => setCreateMode("faceless")}
                className="group text-left p-8 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-neutral-600 transition-all"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-neutral-400" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-700 group-hover:text-white transition-colors" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">Faceless Video</h2>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Write or paste a script. Choose a character, niche, theme, and ratio. AI generates the entire video automatically.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Script", "Character", "Theme", "Auto-Generated"].map(tag => (
                    <span key={tag} className="text-[10px] uppercase tracking-wider text-neutral-600 border border-neutral-800 rounded px-2 py-0.5">{tag}</span>
                  ))}
                </div>
              </button>

              {/* Option 2: Upload */}
              <button
                onClick={() => setCreateMode("upload")}
                className="group text-left p-8 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-neutral-600 transition-all"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-neutral-400" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-700 group-hover:text-white transition-colors" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">Upload & Enhance</h2>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Upload your own footage. AI Director adds B-Roll, motion graphics, captions, SFX, and music automatically.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Your Footage", "AI B-Roll", "SFX", "Captions"].map(tag => (
                    <span key={tag} className="text-[10px] uppercase tracking-wider text-neutral-600 border border-neutral-800 rounded px-2 py-0.5">{tag}</span>
                  ))}
                </div>
              </button>
            </div>
          </>
        )}

        {/* ─── FACELESS CREATION FORM ─── */}
        {createMode === "faceless" && (
          <div className="space-y-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-2">Faceless Video</p>
              <h1 className="text-3xl font-semibold tracking-tight text-white">Configure Your Video</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Script */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Topic</label>
                  <input
                    type="text"
                    value={facelessForm.topic}
                    onChange={e => setFacelessForm(p => ({ ...p, topic: e.target.value }))}
                    placeholder="e.g. Why compound interest grows so quickly"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-neutral-700 focus:border-neutral-600 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Script</label>
                  <textarea
                    value={facelessForm.script}
                    onChange={e => setFacelessForm(p => ({ ...p, script: e.target.value }))}
                    placeholder="Paste your script here... Leave blank to let AI generate it from the topic."
                    className="w-full h-64 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-neutral-700 focus:border-neutral-600 outline-none transition-colors resize-none font-mono leading-relaxed"
                  />
                </div>
              </div>

              {/* Right: Options */}
              <div className="space-y-6">
                {/* Character */}
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Character</label>
                  <div className="space-y-2">
                    {CHARACTERS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setFacelessForm(p => ({ ...p, character: c.id }))}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3",
                          facelessForm.character === c.id
                            ? "border-white bg-neutral-900 text-white"
                            : "border-neutral-800 bg-neutral-950 text-neutral-500 hover:border-neutral-700"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                          facelessForm.character === c.id ? "bg-white text-black" : "bg-neutral-800 text-neutral-500"
                        )}>
                          {c.name[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{c.name}</div>
                          <div className="text-[11px] text-neutral-600">{c.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Niche */}
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Niche</label>
                  <div className="flex flex-wrap gap-2">
                    {NICHES.map(n => (
                      <button
                        key={n}
                        onClick={() => setFacelessForm(p => ({ ...p, niche: n }))}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                          facelessForm.niche === n
                            ? "border-white bg-white text-black"
                            : "border-neutral-800 text-neutral-500 hover:border-neutral-700"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Theme</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFacelessForm(p => ({ ...p, theme: "dark" }))}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2",
                        facelessForm.theme === "dark"
                          ? "border-white bg-white text-black"
                          : "border-neutral-800 text-neutral-500 hover:border-neutral-700"
                      )}
                    >
                      <Moon className="w-4 h-4" /> Dark
                    </button>
                    <button
                      onClick={() => setFacelessForm(p => ({ ...p, theme: "light" }))}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2",
                        facelessForm.theme === "light"
                          ? "border-white bg-white text-black"
                          : "border-neutral-800 text-neutral-500 hover:border-neutral-700"
                      )}
                    >
                      <Sun className="w-4 h-4" /> Light
                    </button>
                  </div>
                </div>

                {/* Ratio */}
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Aspect Ratio</label>
                  <div className="flex gap-2">
                    {([
                      { v: "9:16", icon: Smartphone, label: "9:16" },
                      { v: "16:9", icon: Monitor, label: "16:9" },
                      { v: "1:1", icon: Square, label: "1:1" },
                    ] as const).map(r => (
                      <button
                        key={r.v}
                        onClick={() => setFacelessForm(p => ({ ...p, ratio: r.v }))}
                        className={cn(
                          "flex-1 px-3 py-3 rounded-lg border text-xs font-medium transition-all flex flex-col items-center gap-1.5",
                          facelessForm.ratio === r.v
                            ? "border-white bg-white text-black"
                            : "border-neutral-800 text-neutral-500 hover:border-neutral-700"
                        )}
                      >
                        <r.icon className="w-4 h-4" />
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mood */}
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Mood</label>
                  <div className="flex flex-wrap gap-2">
                    {MOODS.map(m => (
                      <button
                        key={m}
                        onClick={() => setFacelessForm(p => ({ ...p, mood: m }))}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                          facelessForm.mood === m
                            ? "border-white bg-white text-black"
                            : "border-neutral-800 text-neutral-500 hover:border-neutral-700"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-900">
              <button
                onClick={() => setCreateMode(null)}
                className="text-sm text-neutral-500 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleCreateFaceless}
                disabled={isSubmitting}
                className="px-6 py-3 rounded-lg text-sm font-medium bg-white text-black hover:bg-neutral-200 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? "Generating..." : "Generate Video"}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* ─── UPLOAD & ENHANCE FORM ─── */}
        {createMode === "upload" && (
          <div className="space-y-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-2">Upload & Enhance</p>
              <h1 className="text-3xl font-semibold tracking-tight text-white">Configure AI Director</h1>
              <p className="text-sm text-neutral-500 mt-2">Set preferences before uploading your footage.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Ratio */}
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Output Ratio</label>
                <div className="flex gap-2">
                  {([
                    { v: "9:16", icon: Smartphone, label: "Portrait" },
                    { v: "16:9", icon: Monitor, label: "Landscape" },
                    { v: "1:1", icon: Square, label: "Square" },
                  ] as const).map(r => (
                    <button
                      key={r.v}
                      onClick={() => setUploadForm(p => ({ ...p, ratio: r.v }))}
                      className={cn(
                        "flex-1 px-3 py-4 rounded-lg border text-xs font-medium transition-all flex flex-col items-center gap-2",
                        uploadForm.ratio === r.v
                          ? "border-white bg-white text-black"
                          : "border-neutral-800 text-neutral-500 hover:border-neutral-700"
                      )}
                    >
                      <r.icon className="w-5 h-5" />
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Editing Style</label>
                <div className="space-y-2">
                  {(["viral", "cinematic", "educational", "minimal"] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setUploadForm(p => ({ ...p, style: s }))}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all capitalize",
                        uploadForm.style === s
                          ? "border-white bg-white text-black"
                          : "border-neutral-800 text-neutral-500 hover:border-neutral-700"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme + Mood + Niche */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Theme</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUploadForm(p => ({ ...p, theme: "dark" }))}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2",
                        uploadForm.theme === "dark"
                          ? "border-white bg-white text-black"
                          : "border-neutral-800 text-neutral-500 hover:border-neutral-700"
                      )}
                    >
                      <Moon className="w-4 h-4" /> Dark
                    </button>
                    <button
                      onClick={() => setUploadForm(p => ({ ...p, theme: "light" }))}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2",
                        uploadForm.theme === "light"
                          ? "border-white bg-white text-black"
                          : "border-neutral-800 text-neutral-500 hover:border-neutral-700"
                      )}
                    >
                      <Sun className="w-4 h-4" /> Light
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Mood</label>
                  <div className="flex flex-wrap gap-2">
                    {MOODS.map(m => (
                      <button
                        key={m}
                        onClick={() => setUploadForm(p => ({ ...p, mood: m }))}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                          uploadForm.mood === m
                            ? "border-white bg-white text-black"
                            : "border-neutral-800 text-neutral-500 hover:border-neutral-700"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Niche</label>
                  <div className="flex flex-wrap gap-2">
                    {NICHES.map(n => (
                      <button
                        key={n}
                        onClick={() => setUploadForm(p => ({ ...p, niche: n }))}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                          uploadForm.niche === n
                            ? "border-white bg-white text-black"
                            : "border-neutral-800 text-neutral-500 hover:border-neutral-700"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Button */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-900">
              <button
                onClick={() => setCreateMode(null)}
                className="text-sm text-neutral-500 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 rounded-lg text-sm font-medium bg-white text-black hover:bg-neutral-200 transition-colors inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Video File
              </button>
            </div>
          </div>
        )}

        {/* Upload Modal (reused for the upload path) */}
        <VideoUploadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => { fetchVideos(); setPageView("library"); setCreateMode(null); }}
        />
      </div>
    );
  }

  // ─── LIBRARY VIEW (default) ───
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-2">Library</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Videos</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchVideos}
            className="p-2.5 rounded-lg bg-neutral-950 hover:bg-neutral-900 text-neutral-400 border border-neutral-800 transition-all"
            title="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <button
            onClick={() => setPageView("create")}
            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-white text-black hover:bg-neutral-200 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Video
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-600 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search videos..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:border-neutral-600 transition-colors"
        />
      </div>

      {/* Video List */}
      {loading && videos.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
          <span className="text-xs text-neutral-600">Loading videos...</span>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-950 p-16 text-center flex flex-col items-center gap-4">
          <Film className="w-8 h-8 text-neutral-700" />
          <div>
            <h3 className="text-sm font-medium text-white mb-1">No videos yet</h3>
            <p className="text-xs text-neutral-600">Create your first AI video to get started.</p>
          </div>
          <button
            onClick={() => setPageView("create")}
            className="mt-2 px-4 py-2 rounded-lg text-xs font-medium bg-white text-black hover:bg-neutral-200 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Video
          </button>
        </div>
      ) : (
        <div className="border border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-800">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-neutral-900/50 text-[10px] text-neutral-500 font-medium uppercase tracking-wider">
            <div className="col-span-4">Title</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {filteredVideos.map(video => (
            <div
              key={video.id}
              onClick={() => setSelectedVideo(video)}
              className="grid grid-cols-12 gap-4 px-5 py-4 items-center bg-neutral-950 hover:bg-neutral-900/50 transition-colors cursor-pointer group"
            >
              <div className="col-span-4 text-sm font-medium text-white truncate group-hover:text-neutral-200">
                {video.title}
              </div>
              <div className="col-span-2 text-xs text-neutral-500 capitalize">
                {video.video_type === "talking_head" ? "Talking Head" : "Faceless"}
              </div>
              <div className="col-span-2">
                <span className={cn(
                  "inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider",
                  video.status === "COMPLETED" ? "text-white" :
                  video.status === "FAILED" ? "text-neutral-600" :
                  "text-neutral-400"
                )}>
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    video.status === "COMPLETED" ? "bg-white" :
                    video.status === "FAILED" ? "bg-neutral-700" :
                    "bg-neutral-500 animate-pulse"
                  )} />
                  {video.status === "COMPLETED" ? "Done" : video.status.toLowerCase().replace("_", " ")}
                </span>
              </div>
              <div className="col-span-2 text-xs text-neutral-600 font-mono">
                {formatDate(video.created_at)}
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  onClick={e => handleDelete(e, video.id)}
                  className="p-2 rounded-lg text-neutral-700 hover:text-white hover:bg-neutral-800 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal (for legacy upload path) */}
      <VideoUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchVideos}
      />

      {/* Detail Modal */}
      <VideoDetailModal
        video={selectedVideo}
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </div>
  );
}
