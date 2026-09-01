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
  const [activeTab, setActiveTab] = useState<"player" | "edits" | "transcript" | "raw">("edits");
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

  const edits = parsedEditData?.edits || [];
  const bracketedTranscript = parsedEditData?.bracketed_transcript || "";
  const timestampMap = parsedEditData?.timestamp_map || {};

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
    switch (action) {
      case "cut":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "b_roll":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "zoom_in":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "sfx":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] rounded-3xl bg-[#0d1017] border border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {video.video_type === "talking_head" ? "Talking Head" : "Faceless Short"}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {video.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{video.title}</h2>
            <div className="text-xs text-slate-400 font-mono">
              Job ID: {video.id} • Processed: {formatDate(video.updated_at)}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800/80 flex items-center gap-2 bg-slate-900/30">
          <button
            onClick={() => setActiveTab("edits")}
            className={cn(
              "px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5",
              activeTab === "edits"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-300"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Edit Decision List ({edits.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("transcript")}
            className={cn(
              "px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5",
              activeTab === "transcript"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-300"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Whisper Transcript</span>
          </button>

          <button
            onClick={() => setActiveTab("player")}
            className={cn(
              "px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5",
              activeTab === "player"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-300"
            )}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Video & Storage URL</span>
          </button>

          <button
            onClick={() => setActiveTab("raw")}
            className={cn(
              "px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5",
              activeTab === "raw"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-300"
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
              <div className="text-xs text-slate-400">
                Decisions generated by Gemini Flash mapped to Whisper word timestamps:
              </div>
              {edits.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                  No edit decisions found in database.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {edits.map((e: any, idx: number) => {
                    const chunkInfo = timestampMap[e.trigger_id];
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700/80 transition-colors flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider",
                                getActionBadge(e.action)
                              )}
                            >
                              {getActionIcon(e.action)}
                              {e.action}
                            </span>
                            <span className="text-xs font-mono text-indigo-300 font-semibold">
                              {e.trigger_id}
                            </span>
                            {chunkInfo && (
                              <span className="text-[11px] font-mono text-slate-400">
                                [{chunkInfo.start?.toFixed(1)}s - {chunkInfo.end?.toFixed(1)}s]
                              </span>
                            )}
                          </div>

                          {chunkInfo?.text && (
                            <p className="text-xs text-slate-300 italic">
                              "{chunkInfo.text}"
                            </p>
                          )}

                          {e.search_query && (
                            <div className="text-xs text-cyan-300 font-mono">
                              🔍 Pexels Search: <span className="underline">{e.search_query}</span>
                            </div>
                          )}

                          {e.sound_effect && (
                            <div className="text-xs text-amber-300 font-mono">
                              🔊 SFX Cue: <span>{e.sound_effect}</span>
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

          {/* Tab 2: Whisper Transcript */}
          {activeTab === "transcript" && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                Silence-segmented and bracket-compressed speech transcript:
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                {bracketedTranscript || "No transcript available."}
              </div>
            </div>
          )}

          {/* Tab 3: Video & Storage URL */}
          {activeTab === "player" && (
            <div className="space-y-4">
              {/* HTML5 Video Player */}
              <div className="rounded-2xl bg-black border border-slate-800 overflow-hidden flex items-center justify-center aspect-video max-h-64 shadow-lg">
                <video
                  controls
                  className="w-full h-full object-contain"
                  src={video.rendered_url || video.source_url}
                >
                  Your browser does not support HTML5 video streaming.
                </video>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-white">Exported Storage Stream URL:</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={video.rendered_url || video.source_url}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                  <a
                    href={video.rendered_url || video.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Open in Tab</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Raw JSON */}
          {activeTab === "raw" && (
            <div className="space-y-2">
              <div className="text-xs text-slate-400">PostgreSQL JSON stored in `edit_decision_list`:</div>
              <pre className="p-4 rounded-2xl bg-black border border-slate-800 text-emerald-400 font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed">
                {video.edit_decision_list || "{}"}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/30 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            Close
          </button>

          <button
            onClick={handleCopyLink}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 inline-flex items-center gap-1.5 transition-all"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Export URL</span>
          </button>
        </div>
      </div>
    </div>
  );
}
