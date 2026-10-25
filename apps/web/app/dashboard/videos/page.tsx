"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Film,
  Plus,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Trash2,
  Search,
  Play,
  Upload,
  FileText,
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
  Scissors,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Check,
  Zap,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { VideoUploadModal } from "@/components/VideoUploadModal";
import { VideoDetailModal } from "@/components/VideoDetailModal";

/* ── Types ──────────────────────────────────────────── */
interface VideoJob {
  id: string;
  user_id: string;
  title: string;
  source_url: string;
  rendered_url?: string | null;
  video_type: "talking_head" | "faceless_short";
  status:
    | "QUEUED"
    | "DOWNLOADING"
    | "TRANSCRIBING"
    | "AI_DIRECTING"
    | "RENDERING"
    | "PUBLISHING"
    | "COMPLETED"
    | "FAILED";
  edit_decision_list?: string | null;
  error_log?: string | null;
  created_at: string;
  updated_at: string;
}

type PageView = "library" | "create";
type ViewMode = "grid" | "list";
type StatusFilter = "ALL" | "COMPLETED" | "PROCESSING" | "FAILED";
type VideoTypeFilter = "ALL" | "faceless_short" | "talking_head";
type WizardStep = 1 | 2 | 3;
type CreateMode = "faceless" | "upload";

/* ── Demo Fallback Videos ───────────────────────────── */
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

/* ── Constants ───────────────────────────────────────── */
const CHARACTERS = [
  { id: "sarah", name: "Sarah", desc: "Friendly explainer", badge: "POPULAR" },
  { id: "alex",  name: "Alex",  desc: "Professional presenter", badge: "EXECUTIVE" },
  { id: "maya",  name: "Maya",  desc: "Energetic storyteller", badge: "DYNAMIC" },
  { id: "none",  name: "No Character", desc: "Voiceover only", badge: "MINIMAL" },
];

const NICHES = [
  "Education", "Finance", "Tech", "Health", "Motivation",
  "Science", "History", "News", "Lifestyle", "Entertainment",
];

const MOODS = [
  "Energetic", "Calm", "Dramatic", "Mysterious", "Uplifting", "Professional",
];

/* ── Helpers ─────────────────────────────────────────── */
function formatRelativeTime(dateStr: string) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (isNaN(diff)) return "Recently";
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(dateStr);
  } catch {
    return "Recently";
  }
}

function StatusBadge({ status }: { status: VideoJob["status"] }) {
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
    <span className="status-pill status-pill-processing">
      <span className="status-dot status-dot-busy" />
      {status === "RENDERING"
        ? "Rendering"
        : status === "AI_DIRECTING"
        ? "Directing"
        : status === "TRANSCRIBING"
        ? "Transcribing"
        : status === "DOWNLOADING"
        ? "Downloading"
        : "Queued"}
    </span>
  );
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<VideoTypeFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoJob | null>(null);

  // Page View and Wizard Stepper
  const [pageView, setPageView] = useState<PageView>("library");
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [createMode, setCreateMode] = useState<CreateMode>("faceless");

  // Faceless creation form
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [facelessForm, setFacelessForm] = useState({
    script: "",
    topic: "",
    character: "sarah",
    niche: "Education",
    theme: "dark" as "dark" | "light",
    ratio: "9:16" as "9:16" | "1:1" | "16:9",
    mood: "Energetic",
    audioFile: null as File | null,
    audioUrl: "",
    aiModel: "DeepSeek-Hybrid",
    use3DAvatar: false,
  });

  // Upload creation form
  const [uploadForm, setUploadForm] = useState({
    ratio: "9:16" as "9:16" | "16:9" | "1:1",
    style: "viral" as "viral" | "cinematic" | "educational" | "minimal",
    theme: "dark" as "dark" | "light",
    mood: "Energetic",
    niche: "Education",
  });

  async function fetchVideos(retryCount = 0) {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${apiUrl}/api/v1/videos`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setVideos(data);
        } else {
          setVideos(DEMO_VIDEOS);
        }
        setLoading(false);
        return;
      } else if (retryCount < 1) {
        setTimeout(() => fetchVideos(retryCount + 1), 1000);
        return;
      } else {
        setVideos(DEMO_VIDEOS);
      }
    } catch {
      if (retryCount < 1) {
        setTimeout(() => fetchVideos(retryCount + 1), 1000);
        return;
      }
      setVideos(DEMO_VIDEOS);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, videoId: string) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this video?")) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${apiUrl}/api/v1/videos/${videoId}`, { method: "DELETE" });
      if (res.ok) {
        setVideos(prev => prev.filter(v => v.id !== videoId));
      } else {
        setVideos(prev => prev.filter(v => v.id !== videoId));
      }
    } catch (err) {
      console.error("Delete error:", err);
      setVideos(prev => prev.filter(v => v.id !== videoId));
    }
  }

  async function handleRetry(e: React.MouseEvent, videoId: string) {
    e.stopPropagation();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${apiUrl}/api/v1/videos/${videoId}/retry`, { method: "POST" });
      if (res.ok) {
        fetchVideos();
      } else {
        const errText = await res.text();
        alert(`Failed to retry: ${errText}`);
      }
    } catch (err) {
      console.error("Retry error:", err);
      alert("Network error. Is the backend running?");
    }
  }

  async function handleCreateFaceless() {
    if (!facelessForm.topic && !facelessForm.script && !facelessForm.audioFile) {
      alert("Please provide a topic, script, or audio recording.");
      return;
    }

    setIsSubmitting(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      let uploadedAudioUrl = "";
      if (facelessForm.audioFile) {
        const presignRes = await fetch(`${apiUrl}/api/v1/storage/presigned-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: facelessForm.audioFile.name,
            content_type: facelessForm.audioFile.type || "audio/mpeg",
            file_size_bytes: facelessForm.audioFile.size,
            user_id: "default_user",
          }),
        });

        if (presignRes.ok) {
          const { upload_url, source_url } = await presignRes.json();
          await fetch(upload_url, {
            method: "PUT",
            headers: { "Content-Type": facelessForm.audioFile.type || "audio/mpeg" },
            body: facelessForm.audioFile,
          });
          uploadedAudioUrl = source_url;
        }
      }

      const res = await fetch(`${apiUrl}/api/v1/videos/create-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: facelessForm.topic || facelessForm.audioFile?.name || "Faceless AI Video",
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
            audio_url: uploadedAudioUrl,
            ai_model: facelessForm.aiModel,
            use_3d_avatar: facelessForm.use3DAvatar,
          },
        }),
      });

      if (res.ok) {
        setPageView("library");
        setWizardStep(1);
        fetchVideos();
      } else {
        const errorText = await res.text();
        alert(`Failed to create job: ${errorText}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error: " + (err instanceof Error ? err.message : "Network error."));
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    fetchVideos();
    const interval = setInterval(fetchVideos, 15000);
    return () => clearInterval(interval);
  }, []);

  // Filter calculations
  const counts = useMemo(() => {
    return {
      all: videos.length,
      completed: videos.filter(v => v.status === "COMPLETED").length,
      processing: videos.filter(v => v.status !== "COMPLETED" && v.status !== "FAILED").length,
      failed: videos.filter(v => v.status === "FAILED").length,
    };
  }, [videos]);

  const filteredVideos = useMemo(() => {
    return videos.filter(v => {
      // Search query
      const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === "COMPLETED" && v.status !== "COMPLETED") return false;
      if (statusFilter === "FAILED" && v.status !== "FAILED") return false;
      if (statusFilter === "PROCESSING" && (v.status === "COMPLETED" || v.status === "FAILED")) return false;

      // Type filter
      if (typeFilter !== "ALL" && v.video_type !== typeFilter) return false;

      return true;
    });
  }, [videos, searchQuery, statusFilter, typeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage) || 1;
  const paginatedVideos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVideos.slice(start, start + itemsPerPage);
  }, [filteredVideos, currentPage, itemsPerPage]);

  /* ═══════════════════════════════════════════════════
     WIZARD / CREATE VIEW
  ═══════════════════════════════════════════════════ */
  if (pageView === "create") {
    return (
      <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in duration-300">
        {/* Navigation & Stepper Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/[0.06] pb-6">
          <button
            onClick={() => {
              if (wizardStep > 1) {
                setWizardStep((p) => (p - 1) as WizardStep);
              } else {
                setPageView("library");
              }
            }}
            className="inline-flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {wizardStep === 1 ? "Back to Library" : "Previous Step"}
          </button>

          {/* Stepper Indicator */}
          <div className="flex items-center gap-3">
            {[
              { num: 1, label: "Choose Pipeline" },
              { num: 2, label: "Configure" },
              { num: 3, label: "Review & Launch" },
            ].map((step, idx) => {
              const isCurrent = wizardStep === step.num;
              const isDone = wizardStep > step.num;
              return (
                <React.Fragment key={step.num}>
                  {idx > 0 && (
                    <div
                      className={cn(
                        "w-8 h-[1px] transition-colors",
                        isDone ? "bg-violet-500" : "bg-white/[0.08]"
                      )}
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (isDone) setWizardStep(step.num as WizardStep);
                      }}
                      disabled={!isDone && !isCurrent}
                      className={cn(
                        "w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-all",
                        isCurrent
                          ? "bg-violet-600 text-white shadow-[0_0_14px_rgba(124,58,237,0.5)] border border-violet-400"
                          : isDone
                          ? "bg-violet-500/20 text-violet-300 border border-violet-500/40"
                          : "bg-white/[0.04] text-white/30 border border-white/[0.06]"
                      )}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5" /> : step.num}
                    </button>
                    <span
                      className={cn(
                        "text-xs font-medium transition-colors hidden sm:inline",
                        isCurrent ? "text-white" : isDone ? "text-white/60" : "text-white/25"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── STEP 1: CHOOSE PIPELINE ── */}
        {wizardStep === 1 && (
          <div className="space-y-6">
            <div>
              <p className="text-label text-violet-400">Step 1 of 3</p>
              <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
                Select Creation Pipeline
              </h1>
              <p className="text-sm text-white/40 mt-1">
                Choose how you want to build and direct your AI video.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Option 1: Faceless Short */}
              <div
                onClick={() => setCreateMode("faceless")}
                className={cn(
                  "gradient-border gradient-border-violet rounded-2xl p-7 cursor-pointer transition-all duration-200 relative group",
                  createMode === "faceless"
                    ? "ring-2 ring-violet-500 shadow-[0_0_36px_rgba(124,58,237,0.22)] bg-white/[0.03]"
                    : "hover:border-white/[0.12] hover:bg-white/[0.02]"
                )}
              >
                {createMode === "faceless" && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
                <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mb-5">
                  <FileText className="w-6 h-6 text-violet-300" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-lg font-semibold text-white">Faceless Short</h2>
                  <span className="tag border-violet-500/30 text-violet-300">RECOMMENDED</span>
                </div>
                <p className="text-xs text-white/45 leading-relaxed">
                  Turn a simple topic or custom script into a complete viral video. AI automatically
                  handles speech synthesis, 3D WebGL character avatars, motion graphics, and background audio.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {["DeepSeek-Hybrid", "Voiceover", "3D Avatar", "Auto B-Roll", "Captions"].map(
                    (tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Option 2: Upload & Enhance */}
              <div
                onClick={() => setCreateMode("upload")}
                className={cn(
                  "gradient-border gradient-border-cyan rounded-2xl p-7 cursor-pointer transition-all duration-200 relative group",
                  createMode === "upload"
                    ? "ring-2 ring-cyan-500 shadow-[0_0_36px_rgba(6,182,212,0.22)] bg-white/[0.03]"
                    : "hover:border-white/[0.12] hover:bg-white/[0.02]"
                )}
              >
                {createMode === "upload" && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
                <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mb-5">
                  <Upload className="w-6 h-6 text-cyan-300" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-lg font-semibold text-white">Upload & Enhance</h2>
                  <span className="tag border-cyan-500/30 text-cyan-300">STUDIO NLE</span>
                </div>
                <p className="text-xs text-white/45 leading-relaxed">
                  Upload raw camera footage or talking head recordings. The AI Director trims dead air,
                  generates synchronized kinetic captions, inserts thematic B-Roll, and mixes SFX.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {["Cut Silence", "Animated Text", "Smart B-Roll", "Audio Polish", "Sound FX"].map(
                    (tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setWizardStep(2)}
                className="btn-primary px-6 py-2.5 text-sm gap-2"
              >
                Configure Pipeline
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: CONFIGURE PIPELINE ── */}
        {wizardStep === 2 && (
          <div className="space-y-6">
            <div>
              <p className="text-label text-violet-400">Step 2 of 3</p>
              <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
                {createMode === "faceless" ? "Configure Faceless Video" : "Configure AI Enhancement"}
              </h1>
              <p className="text-sm text-white/40 mt-1">
                Fine-tune your creative parameters, aspect ratio, and AI reasoning engine.
              </p>
            </div>

            {/* FACELESS FORM CONFIG */}
            {createMode === "faceless" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Content */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Topic */}
                  <div className="glass-card p-5 space-y-2">
                    <label className="text-label text-white/70 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      Topic & Premise
                    </label>
                    <input
                      type="text"
                      value={facelessForm.topic}
                      onChange={(e) => setFacelessForm((p) => ({ ...p, topic: e.target.value }))}
                      placeholder="e.g. Why compound interest grows so fast in your 20s"
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-violet-500/50 focus:outline-none transition-colors"
                    />
                    <p className="text-[11px] text-white/30">
                      Provide a prompt or leave blank if pasting a custom script below.
                    </p>
                  </div>

                  {/* Script Textarea */}
                  <div className="glass-card p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-label text-white/70 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        Custom Script (Optional)
                      </label>
                      <span className="text-[11px] font-mono text-white/30">
                        {facelessForm.script.length} chars
                      </span>
                    </div>
                    <textarea
                      value={facelessForm.script}
                      onChange={(e) => setFacelessForm((p) => ({ ...p, script: e.target.value }))}
                      placeholder="Paste your narrated script here... Or leave blank to let DeepSeek Auto-Hybrid generate it from your topic."
                      className="w-full h-56 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-violet-500/50 focus:outline-none transition-colors resize-none font-mono text-xs leading-relaxed"
                    />
                  </div>

                  {/* Audio Upload */}
                  <div className="glass-card p-5 space-y-2">
                    <label className="text-label text-white/70 flex items-center gap-2">
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      Or Upload Custom Voiceover / Audio
                    </label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) =>
                        setFacelessForm((p) => ({ ...p, audioFile: e.target.files?.[0] || null }))
                      }
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white/70 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-violet-600 file:text-white hover:file:bg-violet-500 transition-colors cursor-pointer"
                    />
                    {facelessForm.audioFile && (
                      <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Selected: {facelessForm.audioFile.name} (
                        {(facelessForm.audioFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Col: Style & Engine */}
                <div className="space-y-5">
                  {/* Aspect Ratio */}
                  <div className="glass-card p-5 space-y-3">
                    <label className="text-label text-white/70">Aspect Ratio</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { v: "9:16", icon: Smartphone, label: "9:16 Short" },
                          { v: "16:9", icon: Monitor, label: "16:9 Wide" },
                          { v: "1:1", icon: Square, label: "1:1 Square" },
                        ] as const
                      ).map((r) => (
                        <button
                          key={r.v}
                          type="button"
                          onClick={() => setFacelessForm((p) => ({ ...p, ratio: r.v }))}
                          className={cn(
                            "py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all",
                            facelessForm.ratio === r.v
                              ? "bg-violet-600/15 border-violet-500 text-white shadow-[0_0_14px_rgba(124,58,237,0.25)]"
                              : "border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/[0.04]"
                          )}
                        >
                          <r.icon className="w-4 h-4" />
                          <span className="text-[11px] font-medium">{r.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Character */}
                  <div className="glass-card p-5 space-y-3">
                    <label className="text-label text-white/70">Narrator & Avatar</label>
                    <div className="space-y-2">
                      {CHARACTERS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setFacelessForm((p) => ({ ...p, character: c.id }))}
                          className={cn(
                            "w-full text-left px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition-all",
                            facelessForm.character === c.id
                              ? "bg-violet-600/15 border-violet-500 text-white"
                              : "border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/[0.04]"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center",
                                facelessForm.character === c.id
                                  ? "bg-violet-600 text-white"
                                  : "bg-white/[0.08] text-white/60"
                              )}
                            >
                              {c.name[0]}
                            </div>
                            <div>
                              <div className="text-xs font-medium text-white">{c.name}</div>
                              <div className="text-[10px] text-white/40">{c.desc}</div>
                            </div>
                          </div>
                          <span className="tag text-[9px]">{c.badge}</span>
                        </button>
                      ))}
                    </div>

                    {/* 3D WebGL Avatar Toggle */}
                    <div className="pt-2 border-t border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() =>
                          setFacelessForm((p) => ({ ...p, use3DAvatar: !p.use3DAvatar }))
                        }
                        className={cn(
                          "w-full flex items-center justify-between p-2.5 rounded-xl border transition-all",
                          facelessForm.use3DAvatar
                            ? "bg-violet-600/15 border-violet-500/40"
                            : "border-white/[0.06] bg-white/[0.02]"
                        )}
                      >
                        <div className="text-left">
                          <div className="text-xs font-medium text-white">3D WebGL Avatar</div>
                          <div className="text-[10px] text-white/35">Render animated character model</div>
                        </div>
                        <div
                          className={cn(
                            "w-9 h-5 rounded-full p-0.5 transition-colors flex items-center",
                            facelessForm.use3DAvatar ? "bg-violet-600" : "bg-white/[0.12]"
                          )}
                        >
                          <div
                            className={cn(
                              "w-4 h-4 rounded-full bg-white transition-transform",
                              facelessForm.use3DAvatar ? "translate-x-4" : "translate-x-0"
                            )}
                          />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* AI Model Engine */}
                  <div className="glass-card p-5 space-y-3">
                    <label className="text-label text-white/70">AI Director Model</label>
                    <div className="space-y-2">
                      {[
                        {
                          id: "DeepSeek-Hybrid",
                          name: "DeepSeek Auto-Hybrid",
                          desc: "R1 reasoning for story + V3 for pacing",
                          badge: "SMART",
                        },
                        {
                          id: "DeepSeek-Reasoner",
                          name: "DeepSeek R1",
                          desc: "Full analytical chain-of-thought",
                          badge: "REASONING",
                        },
                        {
                          id: "DeepSeek-Chat",
                          name: "DeepSeek V3",
                          desc: "Fast generation for volume",
                          badge: "FAST",
                        },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setFacelessForm((p) => ({ ...p, aiModel: m.id }))}
                          className={cn(
                            "w-full text-left p-2.5 rounded-xl border transition-all",
                            facelessForm.aiModel === m.id
                              ? "bg-violet-600/15 border-violet-500"
                              : "border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/[0.04]"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-white">{m.name}</span>
                            <span className="tag text-[9px]">{m.badge}</span>
                          </div>
                          <span className="text-[10px] text-white/35 block mt-0.5">{m.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Niche & Theme */}
                  <div className="glass-card p-5 space-y-3">
                    <label className="text-label text-white/70">Niche & Theme</label>
                    <div className="flex flex-wrap gap-1.5">
                      {NICHES.slice(0, 6).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setFacelessForm((p) => ({ ...p, niche: n }))}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                            facelessForm.niche === n
                              ? "bg-violet-600 text-white"
                              : "bg-white/[0.04] text-white/40 hover:text-white"
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setFacelessForm((p) => ({ ...p, theme: "dark" }))}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5",
                          facelessForm.theme === "dark"
                            ? "bg-white/[0.1] border-white/20 text-white"
                            : "border-white/[0.06] text-white/40"
                        )}
                      >
                        <Moon className="w-3.5 h-3.5" /> Dark Mode
                      </button>
                      <button
                        type="button"
                        onClick={() => setFacelessForm((p) => ({ ...p, theme: "light" }))}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5",
                          facelessForm.theme === "light"
                            ? "bg-white/[0.1] border-white/20 text-white"
                            : "border-white/[0.06] text-white/40"
                        )}
                      >
                        <Sun className="w-3.5 h-3.5" /> Light Mode
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* UPLOAD FORM CONFIG */}
            {createMode === "upload" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Ratio */}
                  <div className="glass-card p-5 space-y-3">
                    <label className="text-label text-white/70">Target Aspect Ratio</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { v: "9:16", icon: Smartphone, label: "9:16 Short" },
                          { v: "16:9", icon: Monitor, label: "16:9 Wide" },
                          { v: "1:1", icon: Square, label: "1:1 Square" },
                        ] as const
                      ).map((r) => (
                        <button
                          key={r.v}
                          type="button"
                          onClick={() => setUploadForm((p) => ({ ...p, ratio: r.v }))}
                          className={cn(
                            "py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all",
                            uploadForm.ratio === r.v
                              ? "bg-cyan-600/15 border-cyan-500 text-white shadow-[0_0_14px_rgba(6,182,212,0.25)]"
                              : "border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white"
                          )}
                        >
                          <r.icon className="w-4 h-4" />
                          <span className="text-[11px] font-medium">{r.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Editing Style */}
                  <div className="glass-card p-5 space-y-3">
                    <label className="text-label text-white/70">Editing Style</label>
                    <div className="space-y-2">
                      {(["viral", "cinematic", "educational", "minimal"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setUploadForm((p) => ({ ...p, style: s }))}
                          className={cn(
                            "w-full text-left px-3.5 py-2.5 rounded-xl border capitalize text-xs font-medium transition-all",
                            uploadForm.style === s
                              ? "bg-cyan-600/15 border-cyan-500 text-white"
                              : "border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mood & Niche */}
                  <div className="glass-card p-5 space-y-3">
                    <label className="text-label text-white/70">Mood & Tone</label>
                    <div className="flex flex-wrap gap-1.5">
                      {MOODS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setUploadForm((p) => ({ ...p, mood: m }))}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                            uploadForm.mood === m
                              ? "bg-cyan-600 text-white"
                              : "bg-white/[0.04] text-white/40 hover:text-white"
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Upload zone launcher */}
                <div className="glass-card p-8 text-center space-y-4 border-dashed">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6 text-cyan-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Upload Your Video Footage</h3>
                    <p className="text-xs text-white/40 mt-1 max-w-md mx-auto">
                      Supports MP4, MOV, and WebM files. The AI Director will analyze the speech,
                      transcribe timestamps, and automatically generate edit cuts.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary bg-cyan-600 hover:bg-cyan-500 px-5 py-2.5 text-xs font-semibold gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                  >
                    <Upload className="w-4 h-4" />
                    Open Upload Modal
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="text-xs font-medium text-white/50 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Pipeline
              </button>

              {createMode === "faceless" && (
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="btn-primary px-6 py-2.5 text-sm gap-2"
                >
                  Review & Finalize
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: REVIEW & LAUNCH ── */}
        {wizardStep === 3 && (
          <div className="space-y-6">
            <div>
              <p className="text-label text-violet-400">Step 3 of 3</p>
              <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
                Review & Launch Generation
              </h1>
              <p className="text-sm text-white/40 mt-1">
                Verify your configuration before triggering the AI creation pipeline.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Visual Preview Card */}
              <div className="lg:col-span-5">
                <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-cyan-500/10 pointer-events-none" />

                  {/* Mock Frame */}
                  <div
                    className={cn(
                      "rounded-2xl border-2 border-dashed border-violet-500/30 flex flex-col items-center justify-center p-6 text-center transition-all shadow-inner",
                      facelessForm.ratio === "9:16"
                        ? "w-44 h-72"
                        : facelessForm.ratio === "1:1"
                        ? "w-60 h-60"
                        : "w-72 h-44"
                    )}
                  >
                    <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center mb-3">
                      <Film className="w-6 h-6 text-violet-400" />
                    </div>
                    <span className="text-xs font-semibold text-white">
                      {facelessForm.ratio} Format
                    </span>
                    <span className="text-[10px] text-white/40 mt-1">
                      {facelessForm.theme.toUpperCase()} THEME
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <span className="tag border-violet-500/40 text-violet-300">
                      {facelessForm.aiModel}
                    </span>
                    <span className="tag text-white/60">
                      Narrator: {facelessForm.character}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Specification Breakdown */}
              <div className="lg:col-span-7 space-y-4">
                <div className="glass-card divide-y divide-white/[0.04]">
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-xs text-white/40">Topic / Title</span>
                    <span className="text-xs font-medium text-white max-w-[280px] truncate text-right">
                      {facelessForm.topic || "AI Generated from Script"}
                    </span>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-xs text-white/40">Pipeline</span>
                    <span className="text-xs font-semibold text-violet-300">
                      Faceless AI Short
                    </span>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-xs text-white/40">AI Model Routing</span>
                    <span className="text-xs font-mono text-white/70">
                      {facelessForm.aiModel}
                    </span>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-xs text-white/40">Narrator Character</span>
                    <span className="text-xs font-medium text-white capitalize">
                      {facelessForm.character}
                    </span>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-xs text-white/40">3D WebGL Avatar</span>
                    <span className="text-xs font-medium text-white">
                      {facelessForm.use3DAvatar ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-xs text-white/40">Niche & Mood</span>
                    <span className="text-xs font-medium text-white">
                      {facelessForm.niche} · {facelessForm.mood}
                    </span>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-xs text-white/40">Estimated Render Time</span>
                    <span className="text-xs font-medium text-emerald-400">~45 seconds</span>
                  </div>
                </div>

                {/* Submit Launch Button */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="text-xs font-medium text-white/50 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Configure
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateFaceless}
                    disabled={isSubmitting}
                    className="btn-primary px-7 py-3 text-sm font-semibold gap-2 shadow-[0_0_28px_rgba(124,58,237,0.4)] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating Video Pipeline...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Launch AI Video Generation
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        <VideoUploadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            fetchVideos();
            setPageView("library");
            setWizardStep(1);
          }}
        />
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════
     VIDEOS LIBRARY VIEW (default)
  ═══════════════════════════════════════════════════ */
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Top Bar: Title, Centered Search, View Mode & Create ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Videos Library</h1>
            <span className="tag border-white/[0.08] text-white/50">{videos.length} Total</span>
          </div>
          <p className="text-xs text-white/40 mt-1">
            Browse, preview, and edit your AI directed short videos.
          </p>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-3">
          {/* Centered Glass Search Bar */}
          <div className="relative min-w-[260px] md:min-w-[320px]">
            <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search videos by title..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder:text-white/25 focus:border-violet-500/50 focus:outline-none focus:bg-white/[0.05] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle: Grid vs List */}
          <div className="flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-lg text-xs transition-colors",
                viewMode === "grid"
                  ? "bg-white/[0.1] text-white shadow-xs"
                  : "text-white/40 hover:text-white"
              )}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-lg text-xs transition-colors",
                viewMode === "list"
                  ? "bg-white/[0.1] text-white shadow-xs"
                  : "text-white/40 hover:text-white"
              )}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchVideos()}
            className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-white/40 hover:text-white border border-white/[0.08] transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>

          {/* Create Video Button */}
          <button
            onClick={() => {
              setPageView("create");
              setWizardStep(1);
            }}
            className="btn-primary text-xs font-semibold py-2 px-3.5 gap-1.5 shadow-[0_0_18px_rgba(124,58,237,0.35)]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Video</span>
          </button>
        </div>
      </div>

      {/* ── Status Filter Pills Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/[0.04]">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "ALL", label: "All Videos", count: counts.all },
            { id: "COMPLETED", label: "Completed", count: counts.completed },
            { id: "PROCESSING", label: "Processing", count: counts.processing },
            { id: "FAILED", label: "Failed", count: counts.failed },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => {
                setStatusFilter(pill.id as StatusFilter);
                setCurrentPage(1);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2",
                statusFilter === pill.id
                  ? "bg-violet-600/15 border border-violet-500/40 text-violet-300 shadow-[0_0_12px_rgba(124,58,237,0.15)]"
                  : "bg-white/[0.02] border border-white/[0.05] text-white/40 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <span>{pill.label}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-mono",
                  statusFilter === pill.id
                    ? "bg-violet-500/20 text-violet-200"
                    : "bg-white/[0.06] text-white/30"
                )}
              >
                {pill.count}
              </span>
            </button>
          ))}
        </div>

        {/* Video Type Filter Tabs */}
        <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.05] p-0.5 rounded-lg">
          <button
            onClick={() => {
              setTypeFilter("ALL");
              setCurrentPage(1);
            }}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
              typeFilter === "ALL" ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white"
            )}
          >
            All Types
          </button>
          <button
            onClick={() => {
              setTypeFilter("faceless_short");
              setCurrentPage(1);
            }}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
              typeFilter === "faceless_short"
                ? "bg-violet-600/20 text-violet-300"
                : "text-white/40 hover:text-white"
            )}
          >
            Faceless
          </button>
          <button
            onClick={() => {
              setTypeFilter("talking_head");
              setCurrentPage(1);
            }}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
              typeFilter === "talking_head"
                ? "bg-cyan-600/20 text-cyan-300"
                : "text-white/40 hover:text-white"
            )}
          >
            Talking Head
          </button>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      {loading && videos.length === 0 ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
          <span className="text-xs text-white/40">Loading video library...</span>
        </div>
      ) : filteredVideos.length === 0 ? (
        /* Empty State */
        <div className="glass-card p-16 text-center flex flex-col items-center gap-4 rounded-2xl border-dashed">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
            <Film className="w-7 h-7 text-white/30" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">No videos found</h3>
            <p className="text-xs text-white/40 max-w-sm">
              {searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL"
                ? "No videos matched your filter criteria. Try clearing search filters."
                : "Create your first AI video to populate your production library."}
            </p>
          </div>
          {searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL" ? (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
                setTypeFilter("ALL");
              }}
              className="btn-ghost text-xs mt-2"
            >
              Reset Filters
            </button>
          ) : (
            <button
              onClick={() => {
                setPageView("create");
                setWizardStep(1);
              }}
              className="btn-primary text-xs px-4 py-2 mt-2 gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Create Video
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* ── GRID VIEW ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {paginatedVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => setSelectedVideo(video)}
              className="group relative rounded-xl border border-white/[0.06] bg-[#0d1017] hover:border-violet-500/30 hover:shadow-[0_0_24px_rgba(124,58,237,0.12)] transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-[16/10] bg-gradient-to-br from-violet-950/20 via-neutral-900 to-black overflow-hidden flex items-center justify-center">
                {/* Decorative Pattern / Film Graphic */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#7c3aed_1px,transparent_1px)] [background-size:12px_12px]" />

                <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Play className="w-4 h-4 text-white/60 ml-0.5" />
                </div>

                {/* Top Badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                  {/* Type Badge */}
                  <span
                    className={cn(
                      "tag text-[10px] font-semibold tracking-wider",
                      video.video_type === "faceless_short"
                        ? "bg-violet-950/80 border-violet-500/40 text-violet-300"
                        : "bg-cyan-950/80 border-cyan-500/40 text-cyan-300"
                    )}
                  >
                    {video.video_type === "faceless_short" ? "FACELESS" : "TALKING HEAD"}
                  </span>

                  {/* Status Badge */}
                  <StatusBadge status={video.status} />
                </div>

                {/* Bottom Badges */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-white/60">
                    9:16
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-white/75">
                    0:32
                  </span>
                </div>

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVideo(video);
                    }}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all hover:scale-105"
                    title="Quick Preview"
                  >
                    <Play className="w-4 h-4 fill-white" />
                  </button>

                  <Link
                    href={`/dashboard/editor/${video.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(124,58,237,0.4)] hover:scale-105"
                    title="Edit in Studio NLE"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Studio</span>
                  </Link>

                  <button
                    onClick={(e) => handleDelete(e, video.id)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-red-500/20 text-white/60 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-all hover:scale-105"
                    title="Delete Video"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white group-hover:text-violet-300 transition-colors line-clamp-2 leading-snug">
                    {video.title}
                  </h3>
                </div>

                <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-white/35">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-white/25" />
                    {formatRelativeTime(video.created_at)}
                  </span>

                  <span className="text-[10px] font-mono text-white/25">
                    ID: {video.id.slice(0, 8)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── LIST VIEW ── */
        <div className="glass-card rounded-xl overflow-hidden divide-y divide-white/[0.04]">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-white/[0.02] text-label">
            <div className="col-span-5">Video Title</div>
            <div className="col-span-2">Format</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Rows */}
          {paginatedVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => setSelectedVideo(video)}
              className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-white/[0.02] transition-colors duration-150 cursor-pointer group"
            >
              {/* Title & Preview Icon */}
              <div className="col-span-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 group-hover:border-violet-500/40">
                  <Film className="w-4 h-4 text-white/50 group-hover:text-violet-400 transition-colors" />
                </div>
                <div className="truncate">
                  <span className="text-xs font-medium text-white group-hover:text-violet-300 transition-colors">
                    {video.title}
                  </span>
                  <div className="text-[10px] text-white/25 font-mono">
                    ID: {video.id.slice(0, 12)}
                  </div>
                </div>
              </div>

              {/* Type */}
              <div className="col-span-2">
                <span
                  className={cn(
                    "tag text-[10px] font-medium",
                    video.video_type === "faceless_short"
                      ? "text-violet-300 border-violet-500/30"
                      : "text-cyan-300 border-cyan-500/30"
                  )}
                >
                  {video.video_type === "faceless_short" ? "Faceless Short" : "Talking Head"}
                </span>
              </div>

              {/* Status */}
              <div className="col-span-2">
                <StatusBadge status={video.status} />
              </div>

              {/* Created */}
              <div className="col-span-2 text-xs text-white/35 font-mono">
                {formatRelativeTime(video.created_at)}
              </div>

              {/* Action Buttons */}
              <div className="col-span-1 flex items-center justify-end gap-1.5">
                <Link
                  href={`/dashboard/editor/${video.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white hover:border-violet-500/40 transition-colors"
                  title="Edit in Studio"
                >
                  <Scissors className="w-3.5 h-3.5 text-yellow-400/80" />
                </Link>

                {video.status === "FAILED" && (
                  <button
                    onClick={(e) => handleRetry(e, video.id)}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
                    title="Retry generation"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={(e) => handleDelete(e, video.id)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/[0.08] transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination Component ── */}
      {filteredVideos.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/[0.04] text-xs text-white/40">
          <div>
            Showing{" "}
            <span className="text-white font-mono">
              {(currentPage - 1) * itemsPerPage + 1}
            </span>{" "}
            to{" "}
            <span className="text-white font-mono">
              {Math.min(currentPage * itemsPerPage, filteredVideos.length)}
            </span>{" "}
            of <span className="text-white font-mono">{filteredVideos.length}</span> videos
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white/50 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "w-7 h-7 rounded-lg text-xs font-mono font-medium transition-colors",
                  currentPage === page
                    ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.3)]"
                    : "bg-white/[0.02] border border-white/[0.06] text-white/40 hover:text-white"
                )}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white/50 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
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
