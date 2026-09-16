"use client";

import React from "react";
import {
  Scissors,
  Film,
  Type,
  Music,
  Trash2,
} from "lucide-react";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";

interface MobileBottomBarProps {
  onOpenDrawer: (tab: "media" | "captions" | "broll" | "audio") => void;
}

export function MobileBottomBar({ onOpenDrawer }: MobileBottomBarProps) {
  const {
    selectedItem,
    splitClipAtPlayhead,
    deleteClip,
  } = useTimelineStore(useShallow((state) => ({
    selectedItem: state.selectedItem,
    splitClipAtPlayhead: state.splitClipAtPlayhead,
    deleteClip: state.deleteClip,
  })));

  const handleSplit = () => {
    if (selectedItem?.type === "video") {
      splitClipAtPlayhead(selectedItem.id);
    } else {
      splitClipAtPlayhead();
    }
  };

  const handleDelete = () => {
    if (selectedItem) {
      deleteClip(selectedItem.type, selectedItem.id);
    }
  };

  return (
    <div className="h-14 border-t border-slate-800/80 bg-[#0c0f17] md:hidden px-2 flex items-center justify-around z-40 select-none">
      {/* Split */}
      <button
        onClick={handleSplit}
        className="flex flex-col items-center gap-1 text-slate-300 active:text-indigo-400 p-1"
      >
        <Scissors className="w-4 h-4 text-indigo-400" />
        <span className="text-[10px] font-semibold">Split</span>
      </button>

      {/* B-Roll */}
      <button
        onClick={() => onOpenDrawer("broll")}
        className="flex flex-col items-center gap-1 text-slate-300 active:text-purple-400 p-1"
      >
        <Film className="w-4 h-4 text-purple-400" />
        <span className="text-[10px] font-semibold">Overlay</span>
      </button>

      {/* Text / Captions */}
      <button
        onClick={() => onOpenDrawer("captions")}
        className="flex flex-col items-center gap-1 text-slate-300 active:text-yellow-400 p-1"
      >
        <Type className="w-4 h-4 text-yellow-400" />
        <span className="text-[10px] font-semibold">Text</span>
      </button>

      {/* Audio */}
      <button
        onClick={() => onOpenDrawer("audio")}
        className="flex flex-col items-center gap-1 text-slate-300 active:text-emerald-400 p-1"
      >
        <Music className="w-4 h-4 text-emerald-400" />
        <span className="text-[10px] font-semibold">Audio</span>
      </button>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={!selectedItem}
        className={cn(
          "flex flex-col items-center gap-1 p-1 transition-opacity",
          selectedItem ? "text-rose-400 opacity-100" : "text-slate-400 opacity-40 cursor-not-allowed"
        )}
      >
        <Trash2 className="w-4 h-4" />
        <span className="text-[10px] font-semibold">Delete</span>
      </button>
    </div>
  );
}
