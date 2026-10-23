"use client";

import React, { useState } from "react";
import {
  Upload,
  Type,
  Film,
  Music,
  Plus,
  Search,
  X,
  Sparkles,
  GripVertical,
  Mic,
  Shapes,
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

const STOCK_BROLL = [
  {
    name: "Cyberpunk City Lights",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    tag: "City",
  },
  {
    name: "Developer Coding Screen",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    tag: "Tech",
  },
  {
    name: "Cinematic Nature Drone",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    tag: "Nature",
  },
];

const PRESET_MUSIC = [
  {
    name: "Chill Lofi Morning Beat",
    url: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
    duration: 30,
  },
  {
    name: "Upbeat Motivational Tech",
    url: "https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg",
    duration: 25,
  },
];

const MOTION_GRAPHIC_PRESETS = [
  {
    name: "Rising Growth Chart",
    compositionId: "chart-reveal",
    description: "Rising animated multi-stage growth graph",
    badge: "Chart",
    duration: 4.0,
    props: {
      title: "GROWTH TREND",
      badgeText: "SURGE +165%",
      dataPoint1: "Stage 1: Baseline",
      val1: "1.0x",
      dataPoint2: "Stage 2: +85%",
      val2: "1.85x",
      dataPoint3: "Stage 3: +165% Surge",
      val3: "2.65x 🔥",
      accentColor: "#22d3ee",
      personality: "technical",
    },
  },
  {
    name: "Animated Counter",
    compositionId: "animated_counter",
    description: "Numeric growth ticker & KPI stat",
    badge: "Counter",
    duration: 4.0,
    props: { startValue: 0, endValue: 100, prefix: "$", suffix: "k" },
  },
  {
    name: "Animated KPI",
    compositionId: "animated_kpi",
    description: "Metric card with percentage trend",
    badge: "Metric",
    duration: 4.0,
    props: { title: "MRR Growth", value: "$48,500", change: "+32%" },
  },
  {
    name: "Animated Arrow",
    compositionId: "animated_arrow",
    description: "Curved highlight arrow callout",
    badge: "Attention",
    duration: 3.5,
    props: { label: "Look Here" },
  },
  {
    name: "Hero Reveal Card",
    compositionId: "hero_reveal",
    description: "Punchy headline & title overlay",
    badge: "Headline",
    duration: 4.0,
    props: { title: "NEXT-GEN CREATION" },
  },
  {
    name: "Metric Reveal Card",
    compositionId: "metric_reveal",
    description: "Progress indicator card",
    badge: "Progress",
    duration: 4.0,
    props: { progress: 85 },
  },
  {
    name: "Cooked Motion Card",
    compositionId: "cooked_card",
    description: "Modern card with sleek glow borders",
    badge: "Card",
    duration: 4.5,
    props: { headline: "Pro Feature" },
  },
];

export function MediaDrawer({
  activeTab = "media",
  onTabChange,
  isOpenMobile = false,
  onCloseMobile,
}: MediaDrawerProps) {
  const [currentTab, setCurrentTab] = useState<MediaDrawerTab>(activeTab);
  const [brollSearch, setBrollSearch] = useState("");
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
    addBRollClip,
    addAudioClip,
    addGraphicElement,
    setPlayheadTime,
  } = useTimelineStore(
    useShallow((state) => ({
      project: state.project,
      playheadTime: state.playheadTime,
      selectedItem: state.selectedItem,
      addCaption: state.addCaption,
      updateCaption: state.updateCaption,
      dispatchOperation: state.dispatchOperation,
      addBRollClip: state.addBRollClip,
      addAudioClip: state.addAudioClip,
      addGraphicElement: state.addGraphicElement,
      setPlayheadTime: state.setPlayheadTime,
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
        "w-72 md:w-80 border-r border-neutral-900 bg-neutral-950 flex flex-col z-30 transition-transform select-none shadow-2xl",
        isOpenMobile ? "fixed inset-y-0 left-0 translate-x-0" : "hidden md:flex"
      )}
    >
      {/* Mobile Close Bar */}
      {isOpenMobile && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-900 bg-neutral-950 md:hidden">
          <span className="text-xs font-bold text-neutral-400 capitalize">{currentTab} Studio</span>
          <button
            onClick={onCloseMobile}
            className="p-1 text-neutral-500 hover:text-white rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Tabs */}
      <div className="flex items-center border-b border-neutral-900 p-1 gap-0.5 bg-neutral-950 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleTabSelect("library")}
          className={cn(
            "flex-1 py-1.5 px-1.5 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0",
            currentTab === "library"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs"
              : "text-neutral-500 hover:text-white hover:bg-neutral-900/50"
          )}
          title="Shared Resource Library (Shapes, Captions, Transitions, SFX)"
        >
          <Shapes className="w-3 h-3 text-emerald-400" />
          <span>Library</span>
        </button>

        <button
          onClick={() => handleTabSelect("media")}
          className={cn(
            "flex-1 py-1.5 px-1 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0",
            currentTab === "media"
              ? "bg-white/10 text-white border border-neutral-700"
              : "text-neutral-500 hover:text-white hover:bg-neutral-900/50"
          )}
          title="Video Media"
        >
          <Upload className="w-3 h-3" />
          <span>Media</span>
        </button>

        <button
          onClick={() => handleTabSelect("captions")}
          className={cn(
            "flex-1 py-1.5 px-1 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0",
            currentTab === "captions"
              ? "bg-white/10 text-white border border-neutral-700"
              : "text-neutral-500 hover:text-white hover:bg-neutral-900/50"
          )}
          title="Captions & Text"
        >
          <Type className="w-3 h-3" />
          <span>Text</span>
        </button>

        <button
          onClick={() => handleTabSelect("broll")}
          className={cn(
            "flex-1 py-1.5 px-1 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0",
            currentTab === "broll"
              ? "bg-white/10 text-white border border-neutral-700"
              : "text-neutral-500 hover:text-white hover:bg-neutral-900/50"
          )}
          title="B-Roll Footage"
        >
          <Film className="w-3 h-3" />
          <span>B-Roll</span>
        </button>

        <button
          onClick={() => handleTabSelect("graphics")}
          className={cn(
            "flex-1 py-1.5 px-1 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0",
            currentTab === "graphics"
              ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/30"
              : "text-neutral-500 hover:text-white hover:bg-neutral-900/50"
          )}
          title="Motion Graphics Cards"
        >
          <Sparkles className="w-3 h-3 text-yellow-400" />
          <span>Cards</span>
        </button>

        <button
          onClick={() => handleTabSelect("audio")}
          className={cn(
            "flex-1 py-1.5 px-1 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0",
            currentTab === "audio"
              ? "bg-white/10 text-white border border-neutral-700"
              : "text-neutral-500 hover:text-white hover:bg-neutral-900/50"
          )}
          title="Royalty-Free Music"
        >
          <Music className="w-3 h-3" />
          <span>Audio</span>
        </button>

        <button
          onClick={() => handleTabSelect("transcript")}
          className={cn(
            "flex-1 py-1.5 px-1 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0",
            currentTab === "transcript"
              ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/30"
              : "text-neutral-500 hover:text-white hover:bg-neutral-900/50"
          )}
          title="Word-level Transcript & Beats"
        >
          <Mic className="w-3 h-3 text-yellow-400" />
          <span>Script</span>
        </button>
      </div>

      {/* Drawer Content */}
      <div className={cn("flex-1 overflow-y-auto text-neutral-300", (currentTab === "library" || currentTab === "broll" || currentTab === "graphics") ? "p-0" : "p-3")}>
        {/* TAB 0: RESOURCE LIBRARY */}
        {currentTab === "library" && <ResourceLibraryDrawer />}

        {/* TAB 1: MEDIA UPLOAD */}
        {currentTab === "media" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                Project Footage
              </h3>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-700 hover:border-white/60 rounded-xl p-5 cursor-pointer bg-neutral-900/40 hover:bg-neutral-900/70 transition-all group">
                <div className="h-10 w-10 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center mb-2 transition-colors">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-bold text-neutral-300 group-hover:text-white">
                  Pick Video File
                </span>
                <span className="text-[10px] text-neutral-500 mt-0.5 text-center">
                  Instant local load (MP4, MOV, WebM)
                </span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {project.tracks.videoTrack.length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold text-neutral-500 mb-2">Clips on Timeline</h4>
                <div className="space-y-1.5">
                  {project.tracks.videoTrack.map((clip, i) => (
                    <div
                      key={clip.id}
                      onClick={() => setPlayheadTime(clip.start)}
                      className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 cursor-pointer text-xs"
                    >
                      <span className="truncate max-w-[140px] font-medium text-neutral-300">
                        {clip.name || `Clip ${i + 1}`}
                      </span>
                      <span className="font-mono text-[10px] text-neutral-400">
                        {(clip.end - clip.start).toFixed(1)}s
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
