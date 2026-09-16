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
} from "lucide-react";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { useShallow } from "zustand/react/shallow";
import { CaptionPreset } from "@/lib/timeline-types";
import { cn } from "@/lib/utils";
import { saveMediaToIDB } from "@/lib/idb";

interface MediaDrawerProps {
  activeTab?: "media" | "captions" | "broll" | "audio";
  onTabChange?: (tab: "media" | "captions" | "broll" | "audio") => void;
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

export function MediaDrawer({
  activeTab = "media",
  onTabChange,
  isOpenMobile = false,
  onCloseMobile,
}: MediaDrawerProps) {
  const [currentTab, setCurrentTab] = useState<"media" | "captions" | "broll" | "audio">(activeTab);
  const [brollSearch, setBrollSearch] = useState("");
  const [captionInput, setCaptionInput] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<CaptionPreset>("tiktok_yellow");

  const {
    project,
    playheadTime,
    addCaption,
    addBRollClip,
    addAudioClip,
    setPlayheadTime,
  } = useTimelineStore(useShallow((state) => ({
    project: state.project,
    playheadTime: state.playheadTime,
    addCaption: state.addCaption,
    addBRollClip: state.addBRollClip,
    addAudioClip: state.addAudioClip,
    setPlayheadTime: state.setPlayheadTime,
  })));

  const handleTabSelect = (tab: "media" | "captions" | "broll" | "audio") => {
    setCurrentTab(tab);
    onTabChange?.(tab);
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

  const presets: { id: CaptionPreset; label: string; previewClass: string }[] = [
    {
      id: "tiktok_yellow",
      label: "TikTok Yellow",
      previewClass: "bg-black text-yellow-300 font-extrabold border border-yellow-400/40",
    },
    {
      id: "hormozi_bold",
      label: "Hormozi Bold",
      previewClass: "bg-red-600 text-white font-black border border-white",
    },
    {
      id: "clean_white",
      label: "Clean Minimal",
      previewClass: "bg-black/70 text-white font-semibold",
    },
    {
      id: "neon_glow",
      label: "Cyber Glow",
      previewClass: "bg-slate-900 text-cyan-300 font-bold border border-cyan-400/50",
    },
  ];

  return (
    <aside
      className={cn(
        "w-64 md:w-72 border-r border-slate-800/80 bg-[#0d1017] flex flex-col z-30 transition-transform select-none shadow-2xl",
        isOpenMobile ? "fixed inset-y-0 left-0 translate-x-0" : "hidden md:flex"
      )}
    >
      {/* Mobile Close Bar */}
      {isOpenMobile && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-950 md:hidden">
          <span className="text-xs font-bold text-slate-300 capitalize">{currentTab} Studio</span>
          <button
            onClick={onCloseMobile}
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Tabs */}
      <div className="flex items-center border-b border-slate-800/80 p-1.5 gap-1 bg-slate-950/40">
        <button
          onClick={() => handleTabSelect("media")}
          className={cn(
            "flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-all",
            currentTab === "media"
              ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          )}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Media</span>
        </button>

        <button
          onClick={() => handleTabSelect("captions")}
          className={cn(
            "flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-all",
            currentTab === "captions"
              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          )}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Text</span>
        </button>

        <button
          onClick={() => handleTabSelect("broll")}
          className={cn(
            "flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-all",
            currentTab === "broll"
              ? "bg-purple-600/30 text-purple-300 border border-purple-500/40"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          )}
        >
          <Film className="w-3.5 h-3.5" />
          <span>B-Roll</span>
        </button>

        <button
          onClick={() => handleTabSelect("audio")}
          className={cn(
            "flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-all",
            currentTab === "audio"
              ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          )}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Audio</span>
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-3 text-slate-200">
        {/* TAB 1: MEDIA UPLOAD */}
        {currentTab === "media" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Project Footage
              </h3>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700/80 hover:border-indigo-500/60 rounded-xl p-5 cursor-pointer bg-slate-900/40 hover:bg-slate-900/70 transition-all group">
                <div className="h-10 w-10 rounded-full bg-indigo-600/15 group-hover:bg-indigo-600/25 flex items-center justify-center mb-2 transition-colors">
                  <Upload className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-xs font-bold text-slate-200 group-hover:text-white">
                  Pick Video File
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 text-center">
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
                <h4 className="text-[11px] font-semibold text-slate-400 mb-2">Clips on Timeline</h4>
                <div className="space-y-1.5">
                  {project.tracks.videoTrack.map((clip, i) => (
                    <div
                      key={clip.id}
                      onClick={() => setPlayheadTime(clip.start)}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs"
                    >
                      <span className="truncate max-w-[140px] font-medium text-slate-300">
                        {clip.name || `Clip ${i + 1}`}
                      </span>
                      <span className="font-mono text-[10px] text-indigo-400">
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
            <form onSubmit={handleAddCaptionSubmit} className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Add Subtitle / Text
              </label>
              <textarea
                value={captionInput}
                onChange={(e) => setCaptionInput(e.target.value)}
                placeholder="Type your caption here..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-400 outline-none focus:border-yellow-500/70 resize-none"
              />
              <button
                type="submit"
                disabled={!captionInput.trim()}
                className="w-full py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-lg flex items-center justify-center gap-1 transition-all disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Place at Playhead</span>
              </button>
            </form>

            {/* Presets */}
            <div>
              <h4 className="text-[11px] font-semibold text-slate-400 mb-2">Caption Presets</h4>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={cn(
                      "p-2 rounded-lg border text-left transition-all text-xs flex flex-col justify-between",
                      selectedPreset === preset.id
                        ? "border-yellow-400/80 bg-yellow-950/20"
                        : "border-slate-800 bg-slate-900/50 hover:bg-slate-900"
                    )}
                  >
                    <span className="text-[10px] font-bold text-slate-300 mb-1">{preset.label}</span>
                    <div className={cn("text-[10px] px-1.5 py-0.5 rounded text-center truncate", preset.previewClass)}>
                      SAMPLE
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: B-ROLL OVERLAYS */}
        {currentTab === "broll" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={brollSearch}
                onChange={(e) => setBrollSearch(e.target.value)}
                placeholder="Search stock footage..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-2 py-1.5 text-xs text-white placeholder-slate-400 outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-slate-400">Popular Stock Clips</h4>
              {STOCK_BROLL.map((clip, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 transition-all flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200">{clip.name}</span>
                    <span className="text-[10px] text-purple-400">{clip.tag}</span>
                  </div>
                  <button
                    onClick={() =>
                      addBRollClip({
                        sourceUrl: clip.url,
                        name: clip.name,
                        start: playheadTime,
                        end: playheadTime + 3.0,
                        opacity: 100,
                        fitMode: "cover",
                      })
                    }
                    className="p-1 rounded bg-purple-600 hover:bg-purple-500 text-white shadow"
                    title="Insert at Playhead"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIO TRACKS */}
        {currentTab === "audio" && (
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold text-slate-400">Royalty-Free Audio</h4>
            {PRESET_MUSIC.map((track, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-200">{track.name}</span>
                  <span className="text-[10px] text-emerald-400">{track.duration}s loop</span>
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
                  className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white shadow"
                  title="Insert at Playhead"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
