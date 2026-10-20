"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Mic,
  Clock,
  Sparkles,
  Zap,
  Bookmark,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { useShallow } from "zustand/react/shallow";
import { TranscriptWord, ScriptBeat } from "@/lib/timeline-types";
import { getActiveWordAtTimestamp } from "@/lib/ai/transcript-matcher";
import { cn } from "@/lib/utils";

interface TranscriptDrawerProps {
  onClose?: () => void;
  className?: string;
}

export function TranscriptDrawer({ onClose, className }: TranscriptDrawerProps) {
  const { project, playheadTime, setPlayheadTime, dispatchOperation } = useTimelineStore(
    useShallow((state) => ({
      project: state.project,
      playheadTime: state.playheadTime,
      setPlayheadTime: state.setPlayheadTime,
      dispatchOperation: state.dispatchOperation,
    }))
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | "all">("all");

  // Extract transcript words from project or generate sample words from captions/timeline
  const transcriptWords: TranscriptWord[] = useMemo(() => {
    if (project.transcript?.words && project.transcript.words.length > 0) {
      return project.transcript.words;
    }

    // Default sample words matching the initial project demo
    return [
      { word: "Welcome", start: 0.5, end: 1.1, probability: 0.98 },
      { word: "to", start: 1.15, end: 1.35, probability: 0.99 },
      { word: "the", start: 1.4, end: 1.6, probability: 0.99 },
      { word: "future", start: 1.65, end: 2.3, probability: 0.97 },
      { word: "of", start: 2.35, end: 2.55, probability: 0.99 },
      { word: "automated", start: 2.6, end: 3.2, probability: 0.96 },
      { word: "video", start: 3.25, end: 3.7, probability: 0.98 },
      { word: "creation.", start: 3.75, end: 4.3, probability: 0.95 },
      { word: "Build", start: 4.5, end: 5.0, probability: 0.99 },
      { word: "viral", start: 5.05, end: 5.5, probability: 0.97 },
      { word: "clips", start: 5.55, end: 6.0, probability: 0.98 },
      { word: "like", start: 6.05, end: 6.35, probability: 0.99 },
      { word: "a", start: 6.4, end: 6.55, probability: 0.99 },
      { word: "pro", start: 6.6, end: 7.2, probability: 0.98 },
      { word: "with", start: 7.3, end: 7.6, probability: 0.99 },
      { word: "synchronized", start: 7.65, end: 8.4, probability: 0.95 },
      { word: "motion", start: 8.45, end: 9.0, probability: 0.97 },
      { word: "graphics.", start: 9.05, end: 9.8, probability: 0.96 },
      { word: "Subscribe", start: 10.0, end: 10.7, probability: 0.99 },
      { word: "for", start: 10.75, end: 11.0, probability: 0.99 },
      { word: "more!", start: 11.05, end: 11.8, probability: 0.98 },
    ];
  }, [project.transcript]);

  // Extract storytelling script beats
  const scriptBeats: ScriptBeat[] = useMemo(() => {
    if (project.transcript?.beatSheet?.beats && project.transcript.beatSheet.beats.length > 0) {
      return project.transcript.beatSheet.beats;
    }

    // Default sample beats
    return [
      { id: 1, start: 0.5, end: 4.3, text: "Welcome to the future of automated video creation", role: "hook", energy: "high", importance: 5 },
      { id: 2, start: 4.5, end: 9.8, text: "Build viral clips like a pro with synchronized motion graphics", role: "story", energy: "medium", importance: 4 },
      { id: 3, start: 10.0, end: 12.0, text: "Subscribe for more content", role: "cta", energy: "high", importance: 5 },
    ];
  }, [project.transcript]);

  // Active word based on player playhead
  const activeWord = useMemo(() => {
    return getActiveWordAtTimestamp(transcriptWords, playheadTime);
  }, [transcriptWords, playheadTime]);

  // Filtered words for search
  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) return transcriptWords;
    const query = searchQuery.toLowerCase();
    return transcriptWords.filter((w) => w.word.toLowerCase().includes(query));
  }, [transcriptWords, searchQuery]);

  // Quick action: Add badge at clicked word
  const handleAddBadgeAtWord = (word: TranscriptWord) => {
    dispatchOperation({
      type: "add_element",
      track: "graphic",
      element: {
        id: `graphic-${Date.now()}`,
        name: word.word.toUpperCase(),
        compositionId: "pop_up_badge",
        props: {
          text: word.word.toUpperCase(),
          variant: "success",
        },
        start: word.start,
        end: Math.min(project.duration, Number((word.start + 3.0).toFixed(2))),
        position: { x: 50, y: 30 },
        scale: 1.0,
      },
    });
  };

  return (
    <div
      data-testid="transcript-drawer"
      className={cn("flex flex-col h-full bg-neutral-950 text-neutral-200 select-none", className)}
    >
      {/* Header */}
      <div className="p-3 border-b border-neutral-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide">Transcript & Beats</h3>
            <p className="text-[10px] text-neutral-400">Word-level timing & storytelling sync</p>
          </div>
        </div>
      </div>

      {/* Storytelling Beats Strip */}
      <div className="p-2.5 border-b border-neutral-900 bg-neutral-900/40">
        <div className="flex items-center gap-1 mb-1.5 text-[10px] font-mono text-neutral-400">
          <Bookmark className="w-3 h-3 text-yellow-400" />
          <span>SCRIPT BEATS (CLICK TO JUMP)</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {scriptBeats.map((beat) => {
            const isActive = playheadTime >= beat.start && playheadTime < beat.end;
            return (
              <button
                key={beat.id}
                data-testid={`beat-chip-${beat.role}`}
                onClick={() => setPlayheadTime(beat.start)}
                className={cn(
                  "shrink-0 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 border",
                  isActive
                    ? "bg-yellow-400 text-black border-yellow-300 shadow-md shadow-yellow-400/20 scale-102"
                    : "bg-neutral-900/90 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-white"
                )}
              >
                <span>{beat.role}</span>
                <span className="opacity-70 text-[9px]">{beat.start.toFixed(1)}s</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-2.5 border-b border-neutral-900">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            data-testid="transcript-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search spoken words in transcript..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-400/50"
          />
        </div>
      </div>

      {/* Interactive Transcript Words Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="text-[10px] font-mono text-neutral-500 flex items-center justify-between">
          <span>CLICK ANY WORD TO SEEK PLAYHEAD</span>
          <span className="text-yellow-400/80">Active: {playheadTime.toFixed(2)}s</span>
        </div>

        <div
          data-testid="transcript-words-container"
          className="flex flex-wrap gap-x-1.5 gap-y-2 leading-relaxed text-sm p-3 rounded-xl bg-neutral-900/40 border border-neutral-850"
        >
          {filteredWords.map((item, idx) => {
            const isWordActive = playheadTime >= item.start && playheadTime <= item.end;
            return (
              <span
                key={`${item.word}-${item.start}-${idx}`}
                data-testid={`transcript-word-${item.start}`}
                onClick={() => setPlayheadTime(item.start)}
                title={`Click to seek to ${item.start.toFixed(2)}s (Confidence: ${Math.round((item.probability ?? 1) * 100)}%)`}
                className={cn(
                  "cursor-pointer px-1 py-0.5 rounded transition-all select-none inline-flex items-center",
                  isWordActive
                    ? "bg-yellow-400 text-black font-extrabold shadow-md shadow-yellow-400/20 scale-105"
                    : "text-neutral-300 hover:text-white hover:bg-neutral-800"
                )}
              >
                {item.word}
              </span>
            );
          })}
        </div>

        {/* Selected / Active Word Quick Context Card */}
        {activeWord && (
          <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <span className="text-xs font-bold text-white">Current Spoken: "{activeWord.word}"</span>
                <p className="text-[10px] font-mono text-neutral-400">
                  {activeWord.start.toFixed(2)}s - {activeWord.end.toFixed(2)}s
                </p>
              </div>
            </div>

            <button
              onClick={() => handleAddBadgeAtWord(activeWord)}
              data-testid="quick-add-badge-btn"
              className="px-2 py-1 rounded bg-yellow-400/10 border border-yellow-400/30 hover:bg-yellow-400 hover:text-black text-yellow-400 text-[10px] font-bold transition-all flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              <span>Add Badge</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
