"use client";

import React from "react";
import {
  Sliders,
  Volume2,
  Gauge,
  ZoomIn,
  Type,
  Film,
  Trash2,
  MoveVertical,
} from "lucide-react";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { useShallow } from "zustand/react/shallow";
import { CaptionPreset } from "@/lib/timeline-types";
import { cn } from "@/lib/utils";

export function InspectorPanel() {
  const {
    project,
    selectedItem,
    updateVideoClip,
    updateCaption,
    updateBRollClip,
    deleteClip,
    setSelectedItem,
  } = useTimelineStore(useShallow((state) => ({
    project: state.project,
    selectedItem: state.selectedItem,
    updateVideoClip: state.updateVideoClip,
    updateCaption: state.updateCaption,
    updateBRollClip: state.updateBRollClip,
    deleteClip: state.deleteClip,
    setSelectedItem: state.setSelectedItem,
  })));

  if (!selectedItem) {
    return (
      <aside className="w-60 border-l border-slate-800/80 bg-[#0d1017] p-4 hidden lg:flex flex-col select-none text-slate-300">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" />
          <span>Project Info</span>
        </h3>
        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Aspect Ratio</span>
            <span className="font-semibold text-white">{project.aspectRatio}</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Duration</span>
            <span className="font-mono text-white">{project.duration.toFixed(1)}s</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Total Video Clips</span>
            <span className="font-semibold text-indigo-400">{project.tracks.videoTrack.length}</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Captions</span>
            <span className="font-semibold text-yellow-400">{project.tracks.textTrack.length}</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">B-Roll Overlays</span>
            <span className="font-semibold text-purple-400">{project.tracks.brollTrack.length}</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-6 text-center">
          Click any clip on the timeline to inspect and tweak its settings.
        </p>
      </aside>
    );
  }

  // Selected: Video Clip
  if (selectedItem.type === "video") {
    const clip = project.tracks.videoTrack.find((c) => c.id === selectedItem.id);
    if (!clip) return null;

    return (
      <aside className="w-64 border-l border-slate-800/80 bg-[#0d1017] p-4 flex flex-col select-none text-slate-300">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            <span>Clip Settings</span>
          </h3>
          <button
            onClick={() => setSelectedItem(null)}
            className="text-[10px] text-slate-400 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 text-xs flex-1 overflow-y-auto">
          {/* Speed Slider */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Gauge className="w-3 h-3" /> Speed
              </span>
              <span className="font-mono text-white">{clip.speed || 1}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={clip.speed || 1}
              onChange={(e) =>
                updateVideoClip(clip.id, { speed: parseFloat(e.target.value) })
              }
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Volume Slider */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> Volume
              </span>
              <span className="font-mono text-white">{clip.volume ?? 100}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={clip.volume ?? 100}
              onChange={(e) =>
                updateVideoClip(clip.id, { volume: parseInt(e.target.value) })
              }
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Zoom Factor */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <ZoomIn className="w-3 h-3" /> Face Zoom
              </span>
              <span className="font-mono text-white">{clip.zoomFactor || 1.0}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="1.4"
              step="0.05"
              value={clip.zoomFactor || 1.0}
              onChange={(e) =>
                updateVideoClip(clip.id, { zoomFactor: parseFloat(e.target.value) })
              }
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Transition */}
          <div>
            <label className="block text-slate-400 mb-1">Transition In</label>
            <select
              value={clip.transitionIn || ""}
              onChange={(e) =>
                updateVideoClip(clip.id, {
                  transitionIn: (e.target.value as "fade" | "dissolve" | "slide_left" | "zoom_in") || undefined,
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="">None (Cut)</option>
              <option value="fade">Fade In</option>
              <option value="dissolve">Dissolve</option>
              <option value="slide_left">Slide Left</option>
              <option value="zoom_in">Zoom Pop</option>
            </select>
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => deleteClip("video", clip.id)}
          className="w-full py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all mt-4"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Clip</span>
        </button>
      </aside>
    );
  }

  // Selected: Caption Block
  if (selectedItem.type === "caption") {
    const caption = project.tracks.textTrack.find((t) => t.id === selectedItem.id);
    if (!caption) return null;

    return (
      <aside className="w-64 border-l border-slate-800/80 bg-[#0d1017] p-4 flex flex-col select-none text-slate-300">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5" />
            <span>Caption Settings</span>
          </h3>
          <button
            onClick={() => setSelectedItem(null)}
            className="text-[10px] text-slate-400 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 text-xs flex-1 overflow-y-auto">
          {/* Edit Text */}
          <div>
            <label className="block text-slate-400 mb-1">Subtitle Text</label>
            <textarea
              value={caption.text}
              onChange={(e) => updateCaption(caption.id, { text: e.target.value })}
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-500 resize-none"
            />
          </div>

          {/* Preset Selector */}
          <div>
            <label className="block text-slate-400 mb-1">Style Preset</label>
            <select
              value={caption.stylePreset}
              onChange={(e) =>
                updateCaption(caption.id, {
                  stylePreset: e.target.value as CaptionPreset,
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white outline-none focus:border-yellow-500"
            >
              <option value="tiktok_yellow">TikTok Yellow</option>
              <option value="hormozi_bold">Hormozi Bold Red</option>
              <option value="clean_white">Clean Minimal</option>
              <option value="neon_glow">Cyber Neon Glow</option>
            </select>
          </div>

          {/* Position Y Slider */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <MoveVertical className="w-3 h-3" /> Vertical Position
              </span>
              <span className="font-mono text-white">{caption.positionY || 75}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="90"
              value={caption.positionY || 75}
              onChange={(e) =>
                updateCaption(caption.id, { positionY: parseInt(e.target.value) })
              }
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
          </div>
        </div>

        <button
          onClick={() => deleteClip("caption", caption.id)}
          className="w-full py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all mt-4"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Caption</span>
        </button>
      </aside>
    );
  }

  // Selected: B-Roll Clip
  if (selectedItem.type === "broll") {
    const broll = project.tracks.brollTrack.find((b) => b.id === selectedItem.id);
    if (!broll) return null;

    return (
      <aside className="w-64 border-l border-slate-800/80 bg-[#0d1017] p-4 flex flex-col select-none text-slate-300">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5" />
            <span>B-Roll Overlay</span>
          </h3>
          <button
            onClick={() => setSelectedItem(null)}
            className="text-[10px] text-slate-400 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 text-xs flex-1 overflow-y-auto">
          {/* Opacity Slider */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Opacity</span>
              <span className="font-mono text-white">{broll.opacity ?? 100}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={broll.opacity ?? 100}
              onChange={(e) =>
                updateBRollClip(broll.id, { opacity: parseInt(e.target.value) })
              }
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Fit Mode */}
          <div>
            <label className="block text-slate-400 mb-1">Fit Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => updateBRollClip(broll.id, { fitMode: "cover" })}
                className={cn(
                  "flex-1 py-1 rounded text-xs font-semibold border",
                  broll.fitMode === "cover"
                    ? "bg-purple-600 text-white border-purple-500"
                    : "bg-slate-900 text-slate-400 border-slate-800"
                )}
              >
                Cover
              </button>
              <button
                onClick={() => updateBRollClip(broll.id, { fitMode: "contain" })}
                className={cn(
                  "flex-1 py-1 rounded text-xs font-semibold border",
                  broll.fitMode === "contain"
                    ? "bg-purple-600 text-white border-purple-500"
                    : "bg-slate-900 text-slate-400 border-slate-800"
                )}
              >
                Contain
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => deleteClip("broll", broll.id)}
          className="w-full py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all mt-4"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Overlay</span>
        </button>
      </aside>
    );
  }

  return null;
}
