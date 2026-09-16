"use client";

import React from "react";
import {
  Scissors,
  Trash2,
  ZoomIn,
  ZoomOut,
  Type,
  Film,
  Music,
  Zap,
} from "lucide-react";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";

interface TimelineToolbarProps {
  onOpenDrawer?: (tab: "media" | "captions" | "broll" | "audio") => void;
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
  } = useTimelineStore(useShallow((state) => ({
    selectedItem: state.selectedItem,
    zoomLevel: state.zoomLevel,
    setZoomLevel: state.setZoomLevel,
    splitClipAtPlayhead: state.splitClipAtPlayhead,
    deleteClip: state.deleteClip,
    addCaption: state.addCaption,
    addBRollClip: state.addBRollClip,
    addAudioClip: state.addAudioClip,
    playheadTime: state.playheadTime,
  })));

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
      sourceUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      name: "Stock B-Roll",
      start: playheadTime,
      end: playheadTime + 3,
      opacity: 100,
      fitMode: "cover"
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
    <div className="h-10 border-b border-slate-800/80 bg-[#0d1017] px-3 flex items-center justify-between select-none text-slate-300">
      {/* Left Editing Tools */}
      <div className="flex items-center gap-1">
        {/* Split Button */}
        <button
          onClick={handleSplit}
          title="Split clip at playhead (S)"
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Split</span>
        </button>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={!selectedItem}
          title="Delete selected clip (Del)"
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all",
            selectedItem
              ? "bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-600 hover:text-white cursor-pointer active:scale-95"
              : "border-slate-800 text-slate-400 opacity-40 cursor-not-allowed"
          )}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>

        <div className="h-3.5 w-[1px] bg-slate-800 mx-1 shrink-0" />

        {/* Quick Add Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto shrink-0 max-w-[150px] sm:max-w-none [scrollbar-width:none]">
          <button
            onClick={handleAddText}
            className="flex items-center gap-1 px-2 py-1 text-xs whitespace-nowrap text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <Type className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <span className="hidden sm:inline">Add Text</span>
          </button>
          <button
            onClick={handleAddBRoll}
            className="flex items-center gap-1 px-2 py-1 text-xs whitespace-nowrap text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <Film className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="hidden sm:inline">Add B-Roll</span>
          </button>
          <button
            onClick={handleAddAudio}
            className="flex items-center gap-1 px-2 py-1 text-xs whitespace-nowrap text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <Music className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Add Audio</span>
          </button>
          <button
            onClick={handleAddSFX}
            className="flex items-center gap-1 px-2 py-1 text-xs whitespace-nowrap text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="hidden sm:inline">Add SFX</span>
          </button>
        </div>
      </div>

      {/* Right Zoom Slider */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setZoomLevel(zoomLevel - 10)}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
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
          className="w-16 md:w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          title="Timeline Zoom"
        />

        <button
          onClick={() => setZoomLevel(zoomLevel + 10)}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
