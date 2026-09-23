"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Smartphone,
  Monitor,
  Square,
  Download,
  ShieldCheck,
  PanelLeft,
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
}

export function EditorTopNav({ onExport, isExporting, isDrawerOpen, onToggleDrawer }: EditorTopNavProps) {
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
  } = useTimelineStore(useShallow((state) => ({
    project: state.project,
    aspectRatio: state.project.aspectRatio,
    safeZoneVisible: state.safeZoneVisible,
    past: state.past,
    future: state.future,
    undo: state.undo,
    redo: state.redo,
    setAspectRatio: state.setAspectRatio,
    setSafeZoneVisible: state.setSafeZoneVisible,
  })));

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(project.title);

  const ratios: { label: string; value: AspectRatio; icon: typeof Smartphone }[] = [
    { label: "9:16 (TikTok/Reels)", value: "9:16", icon: Smartphone },
    { label: "16:9 (YouTube)", value: "16:9", icon: Monitor },
    { label: "1:1 (Square)", value: "1:1", icon: Square },
  ];

  return (
    <header className="h-14 border-b border-neutral-900 bg-black/95 backdrop-blur-md px-3 md:px-5 flex items-center justify-between z-40 select-none">
      {/* Left section: Back + Title */}
      <div className="flex items-center gap-2 md:gap-4">
        <Link
          href="/dashboard"
          className="p-1.5 text-neutral-500 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors flex items-center gap-1 text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Exit Studio</span>
        </Link>

        {onToggleDrawer && (
          <button
            onClick={onToggleDrawer}
            className="p-1.5 text-neutral-500 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors hidden md:flex items-center justify-center"
            title="Toggle Sidebar"
          >
            <PanelLeft className={cn("w-4 h-4 transition-transform", isDrawerOpen ? "text-white" : "")} />
          </button>
        )}

        <div className="h-4 w-[1px] bg-neutral-800 hidden sm:block" />

        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
              autoFocus
              className="bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-xs text-white outline-none font-medium max-w-[150px] md:max-w-[220px]"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="text-xs md:text-sm font-semibold text-neutral-300 hover:text-white truncate max-w-[140px] md:max-w-[240px] text-left"
              title="Click to rename"
            >
              {title || "Untitled Project"}
            </button>
          )}

          <span className="hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 font-mono">
            CapCut Mode
          </span>
        </div>
      </div>

      {/* Center: Undo/Redo + Aspect Ratio */}
      <div className="flex items-center gap-1.5 md:gap-3">
        {/* Undo / Redo */}
        <div className="flex items-center bg-neutral-950 border border-neutral-900 rounded-lg p-0.5">
          <button
            onClick={undo}
            disabled={past.length === 0}
            title="Undo (Ctrl+Z)"
            className={cn(
              "p-1.5 rounded text-neutral-500 transition-colors",
              past.length > 0 ? "hover:text-white hover:bg-neutral-900 cursor-pointer" : "opacity-35 cursor-not-allowed"
            )}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            title="Redo (Ctrl+Y)"
            className={cn(
              "p-1.5 rounded text-neutral-500 transition-colors",
              future.length > 0 ? "hover:text-white hover:bg-neutral-900 cursor-pointer" : "opacity-35 cursor-not-allowed"
            )}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="hidden sm:flex items-center bg-neutral-950 border border-neutral-900 rounded-lg p-0.5">
          {ratios.map((r) => {
            const Icon = r.icon;
            const active = aspectRatio === r.value;
            return (
              <button
                key={r.value}
                onClick={() => setAspectRatio(r.value)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all",
                  active
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900"
                )}
                title={r.label}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{r.value}</span>
              </button>
            );
          })}
        </div>

        {/* Safe Zone Toggle */}
        <button
          onClick={() => setSafeZoneVisible(!safeZoneVisible)}
          className={cn(
            "p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all",
            safeZoneVisible
              ? "bg-white/10 border-neutral-700 text-white"
              : "border-neutral-900 bg-neutral-950 text-neutral-500 hover:text-neutral-300"
          )}
          title="Toggle Social UI Safe Zone"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[11px]">Safe Zone</span>
        </button>
      </div>

      {/* Right: Export Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={onExport}
          disabled={isExporting}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-black hover:bg-neutral-200 shadow-md shadow-white/5 active:scale-95 transition-all disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>Rendering...</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
