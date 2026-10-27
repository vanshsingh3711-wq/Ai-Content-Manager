"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  ExternalLink,
  Smartphone,
  Monitor,
} from "lucide-react";
import { Drawer, Badge, Button, Tabs } from "@/components/ui";
import { VideoJob, VideoStatus } from "./types";
import { cn, formatDate } from "@/lib/utils";

export interface VideoDetailDrawerProps {
  video: VideoJob | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoDetailDrawer({
  video,
  isOpen,
  onClose,
}: VideoDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<string>("edits");
  const [copied, setCopied] = useState(false);

  if (!video) return null;

  let parsedEditData: any = null;
  try {
    if (video.edit_decision_list) {
      parsedEditData = JSON.parse(video.edit_decision_list);
    }
  } catch {}

  const edits =
    parsedEditData?.validated_edits ||
    parsedEditData?.edits ||
    parsedEditData?.raw_edits ||
    [];

  const transcript =
    parsedEditData?.unified_analysis?.transcript ||
    parsedEditData?.bracketed_transcript ||
    "";

  const settings = parsedEditData?.settings || {};
  const aspectRatio = settings?.aspect_ratio || (video.video_type === "faceless_short" ? "9:16" : "16:9");
  const videoStyle = settings?.video_style || "viral";
  const captionPreset = settings?.caption_preset || "tiktok_yellow";

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const playableUrl =
    video.rendered_url?.trim() ||
    (video.status === "COMPLETED"
      ? `${apiUrl}/api/v1/videos/${video.id}/rendered-file`
      : video.source_url?.trim() || null);

  const handleCopyLink = () => {
    if (playableUrl) {
      navigator.clipboard.writeText(playableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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

  const detailTabs = [
    { id: "edits", label: `Timeline Beats (${edits.length})` },
    { id: "transcript", label: "Transcript" },
    { id: "style", label: "Configuration" },
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={video.title}
      description={`Created ${formatDate(video.created_at)} • ${video.video_type.replace(/_/g, " ")}`}
      size="lg"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {playableUrl && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyLink}
                  leftIcon={
                    copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {copied ? "Copied" : "Copy Link"}
                </Button>

                <a href={playableUrl} download target="_blank" rel="noreferrer">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    Download MP4
                  </Button>
                </a>
              </>
            )}
          </div>

          <Link href={`/dashboard/editor/${video.id}`} onClick={onClose}>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Scissors className="w-3.5 h-3.5" />}
            >
              Open in Studio NLE
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Inline Video Player / Stream Canvas */}
        <div className="relative w-full aspect-video rounded-xl bg-black overflow-hidden border border-white/[0.08] shadow-2xl flex items-center justify-center">
          {playableUrl ? (
            <video
              src={playableUrl}
              controls
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-white/40 space-y-2">
              <Film className="w-8 h-8 opacity-40 animate-pulse" />
              <div className="text-xs">
                {video.status === "COMPLETED"
                  ? "Stream loading..."
                  : `Video is currently ${video.status.toLowerCase().replace(/_/g, " ")}`}
              </div>
            </div>
          )}
        </div>

        {/* Status & Aspect Ratio Overview */}
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs">
          <span className="text-white/40">Status:</span>
          <Badge
            variant={video.status === "COMPLETED" ? "done" : "rendering"}
            size="sm"
          >
            {video.status.replace(/_/g, " ")}
          </Badge>

          <span className="text-white/20 mx-1">|</span>

          <span className="text-white/40">Aspect Ratio:</span>
          <span className="text-cyan-300 font-mono font-semibold">
            {aspectRatio}
          </span>

          <span className="text-white/20 mx-1">|</span>

          <span className="text-white/40">Pacing:</span>
          <span className="text-white capitalize">{videoStyle}</span>
        </div>

        {/* Tab Navigation */}
        <Tabs
          tabs={detailTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          size="sm"
        />

        {/* Tab 1: Timeline Beats / Edits */}
        {activeTab === "edits" && (
          <div className="space-y-2">
            {edits.length === 0 ? (
              <div className="py-8 text-center text-xs text-white/30">
                No edit decisions registered for this video yet.
              </div>
            ) : (
              edits.map((edit: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors text-xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-white/[0.05] flex items-center justify-center shrink-0 mt-0.5">
                      {getActionIcon(edit.action)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-white capitalize">
                        {edit.action?.replace(/_/g, " ") || "Cut"}
                      </div>
                      <div className="text-[11px] text-white/40 mt-0.5 truncate">
                        {edit.description || edit.text || edit.reason || "Autonomous AI transition point"}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 shrink-0">
                    {edit.start_time !== undefined
                      ? `${edit.start_time.toFixed(1)}s`
                      : `#${idx + 1}`}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Transcript */}
        {activeTab === "transcript" && (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-white/70 leading-relaxed font-sans max-h-80 overflow-y-auto whitespace-pre-wrap">
            {transcript || "Speech transcription not yet loaded for this video."}
          </div>
        )}

        {/* Tab 3: Style Configuration */}
        {activeTab === "style" && (
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
              <span className="text-[10px] font-mono text-white/40 uppercase">
                Subtitle Docking Settings
              </span>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Preset:</span>
                <span className="font-semibold text-white capitalize">
                  {captionPreset.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Docking Anchor:</span>
                <span className="font-mono text-cyan-300">y = 1440 (Safe Zone)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Overlap Clearance:</span>
                <span className="font-mono text-emerald-400">≥ 20ms buffer</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
