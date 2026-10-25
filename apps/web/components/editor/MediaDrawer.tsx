"use client";

import React, { useState } from "react";
import {
  Upload,
  Play,
  Plus,
  X,
  Sparkles,
  GripVertical,
  Check,
} from "lucide-react";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { useShallow } from "zustand/react/shallow";
import { CaptionPreset } from "@/lib/timeline-types";
import { cn } from "@/lib/utils";
import { saveMediaToIDB } from "@/lib/idb";
import {
  EDITOR_DRAG_MIME,
  serializeDragPayload,
  EditorDragPayload,
} from "@/lib/editor/drag-drop-types";
import { TranscriptDrawer } from "./TranscriptDrawer";
import { ResourceLibraryDrawer } from "./ResourceLibraryDrawer";
import { CAPTION_TEMPLATES } from "@/lib/editor/caption-templates";

export type MediaDrawerTab = "library" | "media" | "captions" | "broll" | "graphics" | "audio" | "transcript";

interface MediaDrawerProps {
  activeTab?: MediaDrawerTab;
  onTabChange?: (tab: MediaDrawerTab) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const PRESET_MUSIC = [
  {
    name: "Chill Lofi Morning Beat",
    url: "/assets/audio/chill-bgm.mp3",
    duration: 30,
  },
  {
    name: "Ambient Shimmer Synth",
    url: "/assets/audio/chill-bgm.mp3",
    duration: 25,
  },
];


export function MediaDrawer({
  activeTab = "media",
  onTabChange,
  isOpenMobile = false,
  onCloseMobile,
}: MediaDrawerProps) {
  const [currentTab, setCurrentTab] = useState<MediaDrawerTab>(activeTab);
  const [captionInput, setCaptionInput] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<CaptionPreset>("tiktok_yellow");
  const [captionFeedback, setCaptionFeedback] = useState<string | null>(null);

  const {
    project,
    playheadTime,
    selectedItem,
    addCaption,
    updateCaption,
    dispatchOperation,
    addAudioClip,
  } = useTimelineStore(
    useShallow((state) => ({
      project: state.project,
      playheadTime: state.playheadTime,
      selectedItem: state.selectedItem,
      addCaption: state.addCaption,
      updateCaption: state.updateCaption,
      dispatchOperation: state.dispatchOperation,
      addAudioClip: state.addAudioClip,
    }))
  );

  const handleTabSelect = (tab: MediaDrawerTab) => {
    setCurrentTab(tab);
    onTabChange?.(tab);
  };

  const handleDragStart = (e: React.DragEvent, payload: EditorDragPayload) => {
    const serialized = serializeDragPayload(payload);
    e.dataTransfer.setData(EDITOR_DRAG_MIME, serialized);
    e.dataTransfer.setData("text/plain", serialized);
    e.dataTransfer.effectAllowed = "copy";
  };

  // Handle local video upload / selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const blobUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    const insertUploadedClip = (rawDuration: number) => {
      let safeDuration = 30;
      if (Number.isFinite(rawDuration) && rawDuration > 0) {
        safeDuration = Math.round(rawDuration * 10) / 10;
      }

      const newClip = {
        id: `clip-${Date.now()}`,
        sourceUrl: blobUrl,
        name: file.name,
        start: 0,
        end: safeDuration,
        sourceStart: 0,
        sourceEnd: safeDuration,
        speed: 1,
        volume: 100,
        zoomFactor: 1.0,
      };

      // Persist the actual video file so it survives page reloads
      saveMediaToIDB(newClip.id, file).catch(console.error);

      useTimelineStore.setState((state) => ({
        project: {
          ...state.project,
          duration: Math.max(safeDuration, 3),
          tracks: {
            ...state.project.tracks,
            videoTrack: [newClip],
          },
        },
      }));
    };

    video.onloadedmetadata = () => {
      insertUploadedClip(video.duration);
    };

    video.onerror = () => {
      insertUploadedClip(30);
    };

    video.src = blobUrl;
  };

  const handleAddCaptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!captionInput.trim()) return;
    addCaption({
      text: captionInput.trim(),
      stylePreset: selectedPreset,
    });
    setCaptionInput("");
  };

  const handleApplyPreset = (presetId: CaptionPreset) => {
    setSelectedPreset(presetId);
    const existingCaptions = project.tracks.textTrack || [];

    if (existingCaptions.length > 0) {
      if (selectedItem?.type === "caption") {
        updateCaption(selectedItem.id, { stylePreset: presetId });
        setCaptionFeedback(`Applied '${presetId.replace(/_/g, " ")}' effect to selected text`);
      } else {
        const subOps = existingCaptions.map((c) => ({
          type: "update_properties" as const,
          targetId: c.id,
          targetType: "caption" as const,
          properties: { stylePreset: presetId },
        }));

        dispatchOperation({
          type: "batch",
          operations: subOps,
          description: `Apply ${presetId.replace(/_/g, " ")} caption effect to text`,
        });
        setCaptionFeedback(
          `Applied '${presetId.replace(/_/g, " ")}' effect to text (${existingCaptions.length} captions)`
        );
      }

      setTimeout(() => setCaptionFeedback(null), 3500);
    }
  };

  const presets = CAPTION_TEMPLATES.map((tmpl) => ({
    id: tmpl.id,
    label: tmpl.name,
    previewClass: tmpl.previewClass,
  }));

  return (
    <aside
      className={cn(
        "w-72 md:w-80 border-r border-white/[0.06] bg-[#0d1017] flex flex-col z-30 transition-transform select-none shadow-2xl",
        isOpenMobile ? "fixed inset-y-0 left-0 translate-x-0" : "hidden md:flex"
      )}
    >
      {/* Mobile Close Bar */}
      {isOpenMobile && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] bg-[#090b10] md:hidden">
          <span className="text-xs font-bold text-white/70 capitalize">{currentTab} Studio</span>
          <button
            onClick={onCloseMobile}
            className="p-1 text-white/40 hover:text-white rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Tabs matching Mockup: Media | Audio | B-Roll | Text | Graphics */}
      <div className="flex items-center border-b border-white/[0.06] px-3 py-2.5 gap-4 bg-[#0d1017]">
        {[
          { id: "media", label: "Media" },
          { id: "audio", label: "Audio" },
          { id: "broll", label: "B-Roll" },
          { id: "captions", label: "Text" },
          { id: "graphics", label: "Graphics" },
        ].map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabSelect(tab.id as MediaDrawerTab)}
              className={cn(
                "text-xs font-semibold pb-1.5 transition-all cursor-pointer relative",
                isActive
                  ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-violet-500 after:rounded-full"
                  : "text-white/40 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto text-neutral-300 p-3">
        {/* TAB 1: MEDIA 3-COLUMN ASSET GRID (MATCHES MOCKUP) */}
        {currentTab === "media" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {/* Card 1: Upload / Folder card with glowing violet border */}
              <label className="aspect-square rounded-xl border-2 border-violet-500/70 bg-violet-950/20 hover:bg-violet-950/40 hover:border-violet-400 hover:shadow-[0_0_16px_rgba(124,58,237,0.35)] flex flex-col items-center justify-center cursor-pointer transition-all group">
                <div className="w-8 h-8 rounded-lg bg-violet-600/30 flex items-center justify-center text-violet-300 group-hover:scale-105 transition-transform">
                  <Upload className="w-4 h-4" />
                </div>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Card 2: Minimalist Exponential Curve (Matches Mockup) */}
              <div
                draggable
                onDragStart={(e) =>
                  handleDragStart(e, {
                    type: "graphic",
                    compositionId: "chart-reveal",
                    name: "Growth Curve",
                    duration: 4.0,
                    props: { title: "GROWTH TREND", badgeText: "SURGE +165%" },
                  })
                }
                className="aspect-square rounded-xl bg-[#10131a] border border-white/[0.08] hover:border-violet-500/60 p-2 flex flex-col justify-center items-center cursor-grab transition-all group overflow-hidden"
              >
                <svg viewBox="0 0 40 24" className="w-full h-8 text-neutral-300 stroke-current fill-none stroke-[2]">
                  <path d="M4 22 C 18 21, 26 15, 36 3" />
                </svg>
              </div>

              {/* Card 3: Compound Interest Chart Card (Matches Mockup) */}
              <div
                draggable
                onDragStart={(e) =>
                  handleDragStart(e, {
                    type: "graphic",
                    compositionId: "animated_counter",
                    name: "Compound Interest",
                    duration: 4.0,
                    props: { startValue: 0, endValue: 100, prefix: "$" },
                  })
                }
                className="aspect-square rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-violet-500/60 p-1.5 flex flex-col justify-between cursor-grab transition-all group overflow-hidden"
              >
                <div className="text-[7px] font-mono text-neutral-400 font-bold truncate">Compound Interest</div>
                <div className="h-9 w-full bg-white/95 rounded p-1 flex flex-col justify-between shadow-xs">
                  <div className="flex justify-between items-center text-[5px] text-neutral-600 font-bold">
                    <span>Capital</span>
                    <span className="text-violet-600">+12%</span>
                  </div>
                  <svg viewBox="0 0 36 16" className="w-full h-5 text-purple-600 stroke-current fill-none stroke-[1.8]">
                    <path d="M2 14 C 12 13, 20 8, 34 2" />
                  </svg>
                </div>
              </div>

              {/* Cards 4-9: Video Clip Thumbnails with Play Badges (Matches Mockup) */}
              {[
                { name: "Coffee Talk", url: "/demo_media/friends.mp4", thumb: "/demo_thumbs/thumb_friends.jpg", dur: "10s" },
                { name: "Golden Walk", url: "/demo_media/walk.mp4", thumb: "/demo_thumbs/thumb_walk.jpg", dur: "10s" },
                { name: "Scenic Loft", url: "/demo_media/mindful.mp4", thumb: "/demo_thumbs/thumb_mindful.jpg", dur: "30s" },
                { name: "NYC Skyline", url: "/demo_media/skyline.mp4", thumb: "/demo_thumbs/thumb_skyline.jpg", dur: "18s" },
                { name: "Campus Life", url: "/demo_media/hall.mp4", thumb: "/demo_thumbs/thumb_hall.jpg", dur: "10s" },
                { name: "Creative Desk", url: "/demo_media/desk.mp4", thumb: "/demo_thumbs/thumb_desk.jpg", dur: "15s" },
              ].map((clip, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={(e) =>
                    handleDragStart(e, {
                      type: "broll",
                      sourceUrl: clip.url,
                      name: clip.name,
                      duration: 4.0,
                      fitMode: "cover",
                    })
                  }
                  className="aspect-square rounded-xl bg-neutral-900 border border-white/[0.08] hover:border-violet-500/80 flex flex-col items-center justify-center relative cursor-grab group overflow-hidden transition-all shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={clip.thumb}
                    alt={clip.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all"
                  />
                  <div className="absolute inset-0 bg-black/25 group-hover:bg-transparent transition-colors" />
                  <div className="relative w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    <Play className="w-2.5 h-2.5 text-white fill-white ml-0.5" />
                  </div>
                  <span className="absolute bottom-1 right-1 text-[8px] font-mono px-1 rounded bg-black/80 backdrop-blur-xs text-white/90">
                    {clip.dur}
                  </span>
                </div>
              ))}

              {/* Cards 10-12: Glowing Cyan Waveform Audio Cards */}
              {[
                { name: "Audio clip 1", dur: "30s" },
                { name: "Audio clip 2", dur: "25s" },
                { name: "Audio clip 3", dur: "18s" },
              ].map((aud, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={(e) =>
                    handleDragStart(e, {
                      type: "audio",
                      sourceUrl: PRESET_MUSIC[0].url,
                      name: aud.name,
                      duration: 15,
                      volume: 80,
                    })
                  }
                  className="aspect-square rounded-xl bg-[#09151e] border border-cyan-500/30 hover:border-cyan-400 p-1.5 flex flex-col justify-between cursor-grab transition-all group overflow-hidden shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                >
                  <div className="h-6 flex items-center justify-center gap-0.5">
                    {[3, 7, 5, 9, 6, 8, 4, 10, 6, 8, 5].map((h, idx) => (
                      <div
                        key={idx}
                        className="w-1 bg-cyan-400 rounded-full"
                        style={{ height: `${h * 2}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] font-semibold text-cyan-300 truncate text-center block">
                    {aud.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CAPTIONS & TEXT */}
        {currentTab === "captions" && (
          <div className="space-y-4">
            {captionFeedback && (
              <div className="p-2 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg text-xs flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{captionFeedback}</span>
              </div>
            )}

            <form onSubmit={handleAddCaptionSubmit} className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                Add Subtitle / Text
              </label>
              <textarea
                value={captionInput}
                onChange={(e) => setCaptionInput(e.target.value)}
                placeholder="Type your caption here..."
                rows={2}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-white resize-none"
              />
              <button
                type="submit"
                disabled={!captionInput.trim()}
                className="w-full py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-lg flex items-center justify-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Place at Playhead</span>
              </button>
            </form>

            {/* Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <h4 className="text-[11px] font-semibold text-neutral-300">Caption Style Effects</h4>
                </div>
                <span className="text-[10px] text-yellow-400/80 font-mono">Click to apply effect</span>
              </div>

              {project.tracks.textTrack?.length > 0 && (
                <div className="mb-2 flex items-center justify-between gap-1 text-[10px] px-1 py-1 rounded bg-neutral-900/60 border border-neutral-800">
                  <span className="text-neutral-400 truncate">
                    {selectedItem?.type === "caption"
                      ? "1 caption selected"
                      : `${project.tracks.textTrack.length} captions on timeline`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(selectedPreset)}
                    className="px-2 py-0.5 rounded bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    Apply to All Text
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    data-testid={`caption-preset-${preset.id}`}
                    draggable
                    onDragStart={(e) =>
                      handleDragStart(e, {
                        type: "caption",
                        stylePreset: preset.id,
                        text: captionInput.trim() || preset.label,
                      })
                    }
                    onClick={() => handleApplyPreset(preset.id as CaptionPreset)}
                    title="Click to apply caption effect to text"
                    className={cn(
                      "p-2 rounded-lg border text-left transition-all text-xs flex flex-col justify-between cursor-pointer active:scale-95 group hover:border-yellow-400/60 shadow-sm",
                      selectedPreset === preset.id
                        ? "border-yellow-400/60 bg-yellow-400/10 ring-1 ring-yellow-400/30"
                        : "border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-neutral-300">{preset.label}</span>
                      <GripVertical className="w-3 h-3 text-neutral-600 group-hover:text-yellow-400 transition-colors" />
                    </div>
                    <div className={cn("text-[10px] px-1.5 py-0.5 rounded text-center truncate", preset.previewClass)}>
                      SAMPLE
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: B-ROLL OVERLAYS */}
        {currentTab === "broll" && (
          <ResourceLibraryDrawer initialCategory="B-Roll Stock" />
        )}

        {/* TAB 4: MOTION GRAPHICS CARDS */}
        {currentTab === "graphics" && (
          <ResourceLibraryDrawer initialCategory="Motion Graphics" />
        )}

        {/* TAB 5: AUDIO TRACKS */}
        {currentTab === "audio" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-semibold text-neutral-500">Royalty-Free Audio</h4>
              <span className="text-[10px] text-yellow-400/80 font-mono">Drag to timeline</span>
            </div>
            {PRESET_MUSIC.map((track, i) => (
              <div
                key={i}
                draggable
                onDragStart={(e) =>
                  handleDragStart(e, {
                    type: "audio",
                    name: track.name,
                    sourceUrl: track.url,
                    duration: track.duration,
                    isBgm: true,
                  })
                }
                className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-yellow-400/50 transition-all flex items-center justify-between cursor-grab active:cursor-grabbing group shadow-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <GripVertical className="w-3.5 h-3.5 text-neutral-600 group-hover:text-yellow-400 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-neutral-200 truncate">{track.name}</span>
                    <span className="text-[10px] text-neutral-500">{track.duration}s loop</span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    addAudioClip({
                      sourceUrl: track.url,
                      name: track.name,
                      start: playheadTime,
                      end: playheadTime + track.duration,
                      volume: 75,
                      fadeIn: 1,
                      fadeOut: 1,
                      isBgm: true,
                    })
                  }
                  className="p-1 rounded bg-white hover:bg-neutral-200 text-black shadow cursor-pointer shrink-0 ml-2"
                  title="Insert at Playhead"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TAB 6: TRANSCRIPT & SCRIPT BEATS */}
        {currentTab === "transcript" && (
          <TranscriptDrawer className="h-full -m-3" />
        )}
      </div>
    </aside>
  );
}
