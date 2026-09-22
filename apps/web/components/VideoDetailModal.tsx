"use client";

import React, { useState } from "react";
import {
  X,
  Play,
  Film,
  Sparkles,
  Scissors,
  Eye,
  ZoomIn,
  Volume2,
  Clock,
  CheckCircle2,
  Download,
  Copy,
  Check,
  Terminal,
  Settings2,
  Smartphone,
  Monitor,
  Square,
  Flame,
  Clapperboard,
  BookOpen,
  Sliders,
  Type,
  UserCheck,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

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

interface VideoDetailModalProps {
  video: VideoJob | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoDetailModal({ video, isOpen, onClose }: VideoDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"player" | "edits" | "transcript" | "style" | "raw">("edits");
  const [copied, setCopied] = useState(false);

  if (!isOpen || !video) return null;

  let parsedEditData: any = null;
  try {
    if (video.edit_decision_list) {
      parsedEditData = JSON.parse(video.edit_decision_list);
    }
  } catch (err) {
    parsedEditData = null;
  }

  const edits =
    parsedEditData?.validated_edits ||
    parsedEditData?.edits ||
    parsedEditData?.raw_edits ||
    [];
  const bracketedTranscript =
    parsedEditData?.unified_analysis?.transcript ||
    parsedEditData?.bracketed_transcript ||
    "";
  const timestampMap = parsedEditData?.timestamp_map || {};
  const validationReport = parsedEditData?.validation_report || null;

  // Extracted Style, Ratio, and Config Settings
  const settings = parsedEditData?.settings || {};
  const aspectRatio = settings?.aspect_ratio || "9:16";
  const videoStyle = settings?.video_style || "viral";
  const captionPreset = settings?.caption_preset || "tiktok_yellow";
  const aiFeatures = settings?.ai_features || {
    faceTracking: true,
    dynamicZooms: true,
    autoBroll: true,
    trimSilences: true,
    transitionSfx: true,
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(video.rendered_url || video.source_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "cut":
        return <Scissors className="w-3.5 h-3.5 text-rose-400" />;
      case "b_roll":
        return <Eye className="w-3.5 h-3.5 text-cyan-400" />;
      case "zoom_in":
        return <ZoomIn className="w-3.5 h-3.5 text-indigo-400" />;
      case "sfx":
        return <Volume2 className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const getActionBadge = (action: string) => {
    return "bg-neutral-900 border-neutral-800 text-neutral-300";
  };

  const StatusDot = ({ status }: { status: string }) => {
    const color =
      status === "COMPLETED" ? "bg-white" :
      status === "FAILED" ? "bg-neutral-500" :
      "bg-neutral-400 animate-pulse";
    return <span className={cn("inline-block w-1.5 h-1.5 rounded-full", color)} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] rounded-xl bg-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 flex items-start justify-between gap-4">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-white tracking-tight leading-none">{video.title}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-2">
                <StatusDot status={video.status} />
                <span className="text-xs text-neutral-400 uppercase tracking-wider font-medium">
                  {video.status === "COMPLETED" ? "Done" : video.status.toLowerCase().replace("_", " ")}
                </span>
              </span>
              <span className="text-neutral-700">·</span>
              <span className="text-xs text-neutral-500 uppercase tracking-wider font-medium">
                {video.video_type === "talking_head" ? "Talking Head" : "Faceless Short"}
              </span>
              <span className="text-neutral-700">·</span>
              <span className="text-xs text-neutral-500 uppercase tracking-wider font-medium font-mono">
                {aspectRatio}
              </span>
              <span className="text-neutral-700">·</span>
              <span className="text-xs text-neutral-500 uppercase tracking-wider font-medium">
                {videoStyle} style
              </span>
            </div>
            <div className="text-xs text-neutral-600 font-mono">
              ID: {video.id} • Processed: {formatDate(video.updated_at)}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-neutral-800 flex items-center gap-2 bg-neutral-950 overflow-x-auto">
          <button
            onClick={() => setActiveTab("edits")}
            className={cn(
              "px-4 py-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap",
              activeTab === "edits"
                ? "border-white text-white"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Edit Decisions ({edits.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("style")}
            className={cn(
              "px-4 py-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap",
              activeTab === "style"
                ? "border-white text-white"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            )}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Style & Ratio Config</span>
          </button>

          <button
            onClick={() => setActiveTab("transcript")}
            className={cn(
              "px-4 py-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap",
              activeTab === "transcript"
                ? "border-white text-white"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Whisper Transcript</span>
          </button>

          <button
            onClick={() => setActiveTab("player")}
            className={cn(
              "px-4 py-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap",
              activeTab === "player"
                ? "border-white text-white"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            )}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Video Player & Stream</span>
          </button>

          <button
            onClick={() => setActiveTab("raw")}
            className={cn(
              "px-4 py-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap",
              activeTab === "raw"
                ? "border-white text-white"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            )}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Raw JSON</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[55vh]">
          {/* Tab 1: AI Edit Decisions */}
          {activeTab === "edits" && (
            <div className="space-y-3">
              {validationReport && (
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {validationReport.approved_count ?? edits.length} edits validated
                  </span>
                  {validationReport.broll_budget_used !== undefined && (
                    <span className="text-neutral-400 font-mono text-[11px]">
                      B-roll: {Number(validationReport.broll_budget_used).toFixed(1)}s / {Number(validationReport.broll_budget_max).toFixed(1)}s
                    </span>
                  )}
                </div>
              )}

              <div className="text-xs text-neutral-400">
                AI Director editing decisions mapped to Whisper word timestamps:
              </div>
              {edits.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-400 bg-neutral-900 rounded-xl border border-neutral-800">
                  No edit decisions found in database.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {edits.map((e: any, idx: number) => {
                    const chunkInfo = e.trigger_id ? timestampMap[e.trigger_id] : null;
                    const startTime = chunkInfo?.start ?? e.start;
                    const endTime = chunkInfo?.end ?? e.end;

                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700/80 transition-colors flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider",
                                getActionBadge(e.action)
                              )}
                            >
                              {getActionIcon(e.action)}
                              {e.action}
                            </span>
                            {e.trigger_id && (
                              <span className="text-xs font-mono text-neutral-400 font-medium">
                                {e.trigger_id}
                              </span>
                            )}
                            {startTime !== undefined && endTime !== undefined && startTime !== null && endTime !== null && (
                              <span className="text-[11px] font-mono text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                                [{Number(startTime).toFixed(1)}s - {Number(endTime).toFixed(1)}s]
                              </span>
                            )}
                          </div>

                          {chunkInfo?.text && (
                            <p className="text-xs text-neutral-300 italic">
                              "{chunkInfo.text}"
                            </p>
                          )}

                          {e.search_query && (
                            <div className="text-xs text-neutral-300 font-mono">
                              <span className="text-neutral-500">Pexels Search:</span> <span className="underline">{e.search_query}</span>
                            </div>
                          )}

                          {e.sound_effect && (
                            <div className="text-xs text-neutral-300 font-mono">
                              <span className="text-neutral-500">SFX Cue:</span> <span>{e.sound_effect}</span>
                            </div>
                          )}

                          {e.reason && (
                            <div className="text-[11px] text-neutral-400 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                              <span className="font-medium text-neutral-300">Reason:</span> {e.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Style & Ratio Config */}
          {activeTab === "style" && (
            <div className="space-y-4">
              <div className="text-xs text-neutral-400">
                Active rendering profile and AI pipeline configuration for this video:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Ratio Card */}
                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-neutral-500" />
                      Aspect Ratio
                    </span>
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      {aspectRatio}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400">
                    {aspectRatio === "9:16" && "Vertical Canvas (1080 × 1920) for YouTube Shorts & TikTok"}
                    {aspectRatio === "16:9" && "Landscape Canvas (1920 × 1080) for YouTube Widescreen"}
                    {aspectRatio === "1:1" && "Square Canvas (1080 × 1080) for Instagram & LinkedIn Feeds"}
                    {aspectRatio === "4:5" && "Portrait Canvas (1080 × 1350) for Social Feeds"}
                  </div>
                </div>

                {/* Style Card */}
                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-neutral-500" />
                      Video Editing Style
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 capitalize">
                      {videoStyle}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400">
                    {videoStyle === "viral" && "Fast-paced cuts, high retention, emphasis punch-ins & sound effects"}
                    {videoStyle === "cinematic" && "Atmospheric pacing, rich B-roll storytelling, and smooth transitions"}
                    {videoStyle === "educational" && "Clear instructional flow, structured explanations, zero fluff"}
                    {videoStyle === "minimal" && "Authentic pacing, subtle silence trimming, natural original framing"}
                  </div>
                </div>

                {/* Captions Card */}
                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Type className="w-4 h-4 text-neutral-500" />
                      Subtitle Preset
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 capitalize">
                      {captionPreset.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400">
                    {captionPreset === "tiktok_yellow" && "White bold sans-serif with vibrant TikTok Yellow karaoke word highlighting"}
                    {captionPreset === "neon_cyber" && "Cyberpunk glowing cyan highlights with modern tech aesthetics"}
                    {captionPreset === "modern_clean" && "Minimalist clean typography with subtle contrast drop shadows"}
                    {captionPreset === "boxed_pill" && "Rounded badge highlight boxes wrapping the key spoken phrases"}
                  </div>
                </div>

                {/* AI Features Card */}
                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-neutral-500" />
                      AI Pipeline Modules
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      Active
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Face Tracking & Auto-Reframe:</span>
                      <span className="text-neutral-300 font-medium">{aiFeatures?.faceTracking !== false ? "ON" : "OFF"}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Dynamic Keyword Zooms:</span>
                      <span className="text-neutral-300 font-medium">{aiFeatures?.dynamicZooms !== false ? "ON" : "OFF"}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Smart Stock B-Roll:</span>
                      <span className="text-neutral-300 font-medium">{aiFeatures?.autoBroll !== false ? "ON" : "OFF"}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Silence & Mistake Trims:</span>
                      <span className="text-neutral-300 font-medium">{aiFeatures?.trimSilences !== false ? "ON" : "OFF"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Whisper Transcript */}
          {activeTab === "transcript" && (
            <div className="space-y-3">
              <div className="text-xs text-neutral-400">
                Silence-segmented speech transcript with word-level timing:
              </div>
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                {bracketedTranscript || "No transcript available."}
              </div>
            </div>
          )}

          {/* Tab 4: Video & Storage URL */}
          {activeTab === "player" && (
            <div className="space-y-4">
              <div className={cn(
                "rounded-xl bg-black border border-neutral-800 overflow-hidden flex items-center justify-center shadow-lg mx-auto",
                aspectRatio === "9:16" ? "max-w-xs aspect-[9/16] max-h-72" : "w-full aspect-video max-h-64"
              )}>
                <video
                  controls
                  className="w-full h-full object-contain"
                  src={video.rendered_url || video.source_url}
                >
                  Your browser does not support HTML5 video streaming.
                </video>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
                <div className="text-xs font-semibold text-white">Exported Storage Stream URL:</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={video.rendered_url || video.source_url}
                    className="flex-1 px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-300 select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-black hover:bg-neutral-200 inline-flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                  <a
                    href={video.rendered_url || video.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium inline-flex items-center gap-1.5 transition-colors border border-neutral-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>Open in Tab</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Raw JSON */}
          {activeTab === "raw" && (
            <div className="space-y-2">
              <div className="text-xs text-neutral-400">PostgreSQL JSON stored in `edit_decision_list`:</div>
              <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed">
                {video.edit_decision_list || "{}"}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
          >
            Close
          </button>

          <button
            onClick={handleCopyLink}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white hover:bg-neutral-200 text-black shadow-md inline-flex items-center gap-1.5 transition-all"
          >
            <Copy className="w-4 h-4" />
            <span>Copy Export URL</span>
          </button>
        </div>
      </div>
    </div>
  );
}
