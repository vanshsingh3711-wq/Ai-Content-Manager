"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Download,
  Sparkles,
  History,
} from "lucide-react";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { useShallow } from "zustand/react/shallow";
import { AspectRatio } from "@/lib/timeline-types";
import { cn } from "@/lib/utils";

interface EditorTopNavProps {
  onExport?: () => void;
  isExporting?: boolean;
  isDrawerOpen?: boolean;
  onToggleDrawer?: () => void;
  isAssistantOpen?: boolean;
  onToggleAssistant?: () => void;
  isHistoryOpen?: boolean;
  onToggleHistory?: () => void;
}

export function EditorTopNav({
  onExport,
  isExporting,
  isAssistantOpen,
  onToggleAssistant,
  isHistoryOpen,
  onToggleHistory,
}: EditorTopNavProps) {
  const {
    project,
    aspectRatio,
    safeZoneVisible,
    past,
    future,
    undo,
    redo,
    setAspectRatio,
    setSafeZoneVisible,
  } = useTimelineStore(
    useShallow((state) => ({
      project: state.project,
      aspectRatio: state.project.aspectRatio,
      safeZoneVisible: state.safeZoneVisible,
      past: state.past,
      future: state.future,
      undo: state.undo,
      redo: state.redo,
      setAspectRatio: state.setAspectRatio,
      setSafeZoneVisible: state.setSafeZoneVisible,
    }))
  );

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");

  const displayTitle = project.title || "Compound Interest Explained";

  const startEditing = () => {
    setEditTitle(displayTitle);
    setIsEditingTitle(true);
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (editTitle.trim()) {
      useTimelineStore.setState((state) => ({
        project: { ...state.project, title: editTitle.trim() },
      }));
    }
  };

  return (
    <header className="h-14 glass-panel bg-[#0d1017]/90 backdrop-blur-xl border-b border-white/[0.06] px-3 md:px-5 flex items-center justify-between z-40 select-none">
      {/* Left section: Back [ < ] + Title + Undo/Redo */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white/70 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-xs"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        {/* Project Title */}
        <div className="flex items-center">
          {isEditingTitle ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleTitleSubmit()}
              autoFocus
              className="bg-white/[0.06] border border-violet-500/50 rounded-lg px-2.5 py-1 text-xs text-white outline-none font-semibold max-w-[200px]"
            />
          ) : (
            <button
              onClick={startEditing}
              className="text-xs md:text-sm font-semibold text-white/95 hover:text-violet-300 truncate max-w-[220px] text-left transition-colors cursor-pointer"
              title="Click to rename project"
            >
              {displayTitle}
            </button>
          )}
        </div>

        {/* Grouped Undo / Redo */}
        <div className="flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl p-0.5 ml-1">
          <button
            onClick={undo}
            disabled={past.length === 0}
            title="Undo (Ctrl+Z)"
            className={cn(
              "p-1.5 rounded-lg text-white/60 transition-colors",
              past.length > 0
                ? "hover:text-white hover:bg-white/[0.08] cursor-pointer"
                : "opacity-30 cursor-not-allowed"
            )}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3 bg-white/[0.08]" />
          <button
            onClick={redo}
            disabled={future.length === 0}
            title="Redo (Ctrl+Y)"
            className={cn(
              "p-1.5 rounded-lg text-white/60 transition-colors",
              future.length > 0
                ? "hover:text-white hover:bg-white/[0.08] cursor-pointer"
                : "opacity-30 cursor-not-allowed"
            )}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center: Segmented Aspect Ratio Control + Safe Zone Switch */}
      <div className="flex items-center gap-3">
        {/* Aspect Ratio Segmented Pills */}
        <div className="flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl p-1 gap-1">
          {(["9:16", "16:9", "1:1"] as AspectRatio[]).map((ratio) => {
            const active = aspectRatio === ratio;
            return (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  active
                    ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]"
                    : "text-white/40 hover:text-white hover:bg-white/[0.04]"
                )}
              >
                {ratio}
              </button>
            );
          })}
        </div>

        {/* Safe Zone iOS-style Switch */}
        <button
          onClick={() => setSafeZoneVisible(!safeZoneVisible)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer"
          title="Toggle Social Safe Zone Guides"
        >
          <span className="text-xs text-white/60 font-medium">Safe zone</span>
          <div
            className={cn(
              "w-8 h-4 rounded-full relative transition-colors duration-200",
              safeZoneVisible ? "bg-violet-600" : "bg-white/15"
            )}
          >
            <div
              className={cn(
                "w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform duration-200 shadow-sm",
                safeZoneVisible ? "translate-x-4.5" : "translate-x-0.5"
              )}
            />
          </div>
        </button>
      </div>

      {/* Right: AI Copilot + History + Export */}
      <div className="flex items-center gap-2.5">
        {onToggleAssistant && (
          <button
            onClick={onToggleAssistant}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
              isAssistantOpen
                ? "bg-violet-600/30 border-violet-500 text-violet-200 shadow-[0_0_16px_rgba(124,58,237,0.35)]"
                : "bg-violet-600/15 border-violet-500/40 text-violet-300 hover:bg-violet-600/25 shadow-[0_0_12px_rgba(124,58,237,0.2)]"
            )}
            title="Toggle AI Copilot (Cmd+K)"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-300" />
            <span>AI Copilot</span>
          </button>
        )}

        {onToggleHistory && (
          <button
            onClick={onToggleHistory}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-white/70 hover:text-white transition-all cursor-pointer",
              isHistoryOpen && "bg-white/[0.08] text-white border-white/20"
            )}
            title="Project Version History & Checkpoints"
          >
            <History className="w-3.5 h-3.5 text-white/50" />
            <span>Versions</span>
          </button>
        )}

        <button
          onClick={onExport}
          disabled={isExporting}
          className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:opacity-90 active:scale-95 text-white px-4 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-[0_0_20px_rgba(124,58,237,0.45)] transition-all cursor-pointer disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Rendering...</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 fill-white" />
              <span>Export</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
