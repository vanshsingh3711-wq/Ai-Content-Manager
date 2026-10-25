"use client";

import React from "react";
import {
  Scissors,
  Trash2,
  ZoomIn,
  ZoomOut,
  Type,
  Film,
} from "lucide-react";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { useShallow } from "zustand/react/shallow";
import { MediaDrawerTab } from "./MediaDrawer";

interface TimelineToolbarProps {
  onOpenDrawer?: (tab: MediaDrawerTab) => void;
}

export function TimelineToolbar({ onOpenDrawer }: TimelineToolbarProps) {
  const {
    selectedItem,
    zoomLevel,
    setZoomLevel,
    splitClipAtPlayhead,
    deleteClip,
    addCaption,
    addBRollClip,
    addAudioClip,
    playheadTime,
  } = useTimelineStore(
    useShallow((state) => ({
      selectedItem: state.selectedItem,
      zoomLevel: state.zoomLevel,
      setZoomLevel: state.setZoomLevel,
      splitClipAtPlayhead: state.splitClipAtPlayhead,
      deleteClip: state.deleteClip,
      addCaption: state.addCaption,
      addBRollClip: state.addBRollClip,
      addAudioClip: state.addAudioClip,
      playheadTime: state.playheadTime,
    }))
  );

  const handleSplit = () => {
    if (selectedItem) {
      splitClipAtPlayhead(selectedItem.type, selectedItem.id);
    } else {
      splitClipAtPlayhead("video");
    }
  };

  const handleDelete = () => {
    if (selectedItem) {
      deleteClip(selectedItem.type, selectedItem.id);
    }
  };

  const handleAddText = () => {
    addCaption({ text: "NEW TEXT", position: { x: 50, y: 50 } });
  };

  const handleAddBRoll = () => {
    addBRollClip({
      sourceUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      name: "Stock B-Roll",
      start: playheadTime,
      end: playheadTime + 3,
      opacity: 100,
      fitMode: "cover",
    });
  };

  const handleAddAudio = () => {
    addAudioClip({
      sourceUrl: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
      name: "Background Music",
      start: playheadTime,
      end: playheadTime + 10,
      volume: 80,
      fadeIn: 1,
      fadeOut: 1,
      isBgm: true,
    });
  };

  const handleAddSFX = () => {
    addAudioClip({
      sourceUrl: "https://actions.google.com/sounds/v1/alarms/beep_short.ogg",
      name: "Sound Effect",
      start: playheadTime,
      end: playheadTime + 1,
      volume: 100,
      fadeIn: 0,
      fadeOut: 0,
      isBgm: false,
    });
  };

  return (
    <div className="h-10 border-b border-white/[0.06] bg-[#0d1017] px-4 flex items-center justify-between select-none text-white/70">
      {/* Left Editing Tools matching Image 2 mockup */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-neutral-300 tracking-tight">Timeline ruler</span>

        <div className="flex items-center gap-1">
          {/* Split Button (II / Scissors) */}
          <button
            onClick={handleSplit}
            title="Split clip at playhead (S)"
            className="p-1.5 rounded hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors active:scale-95 cursor-pointer"
          >
            <Scissors className="w-3.5 h-3.5" />
          </button>

          {/* Add Text (T) */}
          <button
            onClick={handleAddText}
            title="Add Caption Text (T)"
            className="p-1.5 rounded hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors active:scale-95 cursor-pointer"
          >
            <Type className="w-3.5 h-3.5" />
          </button>

          {/* Add Overlay / Media (+) */}
          <button
            onClick={handleAddBRoll}
            title="Add B-Roll Overlay"
            className="p-1.5 rounded hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors active:scale-95 cursor-pointer"
          >
            <Film className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button */}
          {selectedItem && (
            <button
              onClick={handleDelete}
              title="Delete selected clip (Del)"
              className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Quick Add B-Roll / SFX / Library pills */}
          <div className="hidden lg:flex items-center gap-1 ml-2">
            <button
              onClick={() => onOpenDrawer?.("library")}
              className="px-2 py-0.5 text-[11px] text-neutral-400 hover:text-white rounded hover:bg-white/[0.06] transition-colors"
            >
              Library
            </button>
            <button
              onClick={handleAddAudio}
              className="px-2 py-0.5 text-[11px] text-neutral-400 hover:text-white rounded hover:bg-white/[0.06] transition-colors"
            >
              + Audio
            </button>
            <button
              onClick={handleAddSFX}
              className="px-2 py-0.5 text-[11px] text-neutral-400 hover:text-white rounded hover:bg-white/[0.06] transition-colors"
            >
              + SFX
            </button>
          </div>
        </div>
      </div>

      {/* Right Controls: Zoom Slider matching Image 2 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-400 font-medium">Zoom</span>
        <button
          onClick={() => setZoomLevel(zoomLevel - 10)}
          className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/[0.06] transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <input
          type="range"
          min="15"
          max="120"
          value={zoomLevel}
          onChange={(e) => setZoomLevel(Number(e.target.value))}
          className="w-20 md:w-28 h-1 bg-white/[0.12] rounded-lg appearance-none cursor-pointer accent-violet-500"
          title="Timeline Zoom"
        />

        <button
          onClick={() => setZoomLevel(zoomLevel + 10)}
          className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/[0.06] transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
