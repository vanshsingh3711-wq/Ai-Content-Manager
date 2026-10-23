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
  Type,
  Edit3,
  Check,
  X,
  Palette,
} from "lucide-react";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { useShallow } from "zustand/react/shallow";
import { TranscriptWord, ScriptBeat, CaptionPreset } from "@/lib/timeline-types";
import { EditOperation } from "@/lib/operations/operation-types";
import { getActiveWordAtTimestamp } from "@/lib/ai/transcript-matcher";
import { cn } from "@/lib/utils";
import { CAPTION_TEMPLATES } from "@/lib/editor/caption-templates";

interface TranscriptDrawerProps {
  onClose?: () => void;
  className?: string;
}

export const CAPTION_STYLE_PRESETS = CAPTION_TEMPLATES;

export function TranscriptDrawer({ onClose, className }: TranscriptDrawerProps) {
  const { project, playheadTime, setPlayheadTime, dispatchOperation, setTranscript } = useTimelineStore(
    useShallow((state) => ({
      project: state.project,
      playheadTime: state.playheadTime,
      setPlayheadTime: state.setPlayheadTime,
      dispatchOperation: state.dispatchOperation,
      setTranscript: state.setTranscript,
    }))
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<CaptionPreset>("tiktok_yellow");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Word editing states
  const [editingWordIdx, setEditingWordIdx] = useState<number | null>(null);
  const [editingWordText, setEditingWordText] = useState("");

  // Extract transcript words from project or generate sample words from captions/timeline
  const transcriptWords: TranscriptWord[] = useMemo(() => {
    if (project.transcript?.words && project.transcript.words.length > 0) {
      return project.transcript.words;
    }

    // Default sample words matching initial project demo
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

  // Apply kinetic caption style across all captions (or generate if none exist)
  const handleApplyCaptionStyle = (preset: CaptionPreset) => {
    setSelectedPreset(preset);
    const existingCaptions = project.tracks.textTrack || [];

    if (existingCaptions.length > 0) {
      const subOps: EditOperation[] = existingCaptions.map((c) => ({
        type: "update_properties",
        targetId: c.id,
        targetType: "caption",
        properties: { stylePreset: preset },
      }));

      dispatchOperation({
        type: "batch",
        operations: subOps,
        description: `Apply ${preset.replace(/_/g, " ")} style across ${subOps.length} captions`,
      });

      setStatusMessage(`Applied ${preset.replace(/_/g, " ")} style to all captions`);
      setTimeout(() => setStatusMessage(null), 3500);
    } else {
      // Generate captions from transcript words
      const subOps: EditOperation[] = [];
      const chunkSize = 4;
      for (let i = 0; i < transcriptWords.length; i += chunkSize) {
        const chunk = transcriptWords.slice(i, i + chunkSize);
        const phrase = chunk.map((w) => w.word).join(" ");
        const start = chunk[0].start;
        const end = chunk[chunk.length - 1].end;
        subOps.push({
          type: "add_element",
          track: "caption",
          element: {
            id: `caption-${Date.now()}-${i}`,
            text: phrase,
            start,
            end,
            stylePreset: preset,
            position: { x: 50, y: 75 },
            scale: 1.0,
          },
        });
      }

      dispatchOperation({
        type: "batch",
        operations: subOps,
        description: `Generate ${preset.replace(/_/g, " ")} captions from transcript`,
      });

      setStatusMessage(`Generated ${subOps.length} captions with ${preset.replace(/_/g, " ")} style`);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

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

  // Start inline word text editing
  const handleStartWordEdit = (word: TranscriptWord, idx: number) => {
    setEditingWordIdx(idx);
    setEditingWordText(word.word);
  };

  // Save inline word edit & sync with overlapping caption blocks
  const handleSaveWordEdit = () => {
    if (editingWordIdx === null || !editingWordText.trim()) {
      setEditingWordIdx(null);
      return;
    }

    const updatedWords = [...transcriptWords];
    const targetWord = updatedWords[editingWordIdx];
    if (!targetWord) {
      setEditingWordIdx(null);
      return;
    }

    const oldWordText = targetWord.word;
    const newWordText = editingWordText.trim();
    updatedWords[editingWordIdx] = {
      ...targetWord,
      word: newWordText,
    };

    // 1. Update transcript words in project store
    setTranscript({
      ...project.transcript,
      words: updatedWords,
      beatSheet: project.transcript?.beatSheet,
    });

    // 2. Synchronize any caption overlapping targetWord.start
    const existingCaptions = project.tracks.textTrack || [];
    const overlappingCaption = existingCaptions.find(
      (c) => targetWord.start >= c.start && targetWord.start <= c.end
    );

    if (overlappingCaption) {
      // Replace old word in caption text if present, or append
      let nextCaptionText = overlappingCaption.text;
      if (nextCaptionText.includes(oldWordText)) {
        nextCaptionText = nextCaptionText.replace(oldWordText, newWordText);
      } else {
        nextCaptionText = `${nextCaptionText} ${newWordText}`.trim();
      }

      dispatchOperation({
        type: "update_properties",
        targetId: overlappingCaption.id,
        targetType: "caption",
        properties: { text: nextCaptionText },
      });
    }

    setStatusMessage(`Updated "${oldWordText}" to "${newWordText}" & synced captions`);
    setTimeout(() => setStatusMessage(null), 3000);
    setEditingWordIdx(null);
    setEditingWordText("");
  };

  return (
    <div
      data-testid="transcript-drawer"
      className={cn("flex flex-col h-full bg-neutral-950 text-neutral-200 select-none", className)}
    >
      {/* 1. Header */}
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

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Kinetic Captions Styler Toolbar (Phase 6) */}
      <div className="p-2.5 border-b border-neutral-900 bg-neutral-900/60 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-yellow-400 uppercase tracking-wider font-semibold">
            <Palette className="w-3.5 h-3.5" />
            <span>Kinetic Captions Styler</span>
          </div>
          <span className="text-[9px] font-mono text-neutral-500">
            {project.tracks.textTrack?.length || 0} Captions
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {CAPTION_STYLE_PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                data-testid={`caption-style-${preset.id}`}
                onClick={() => handleApplyCaptionStyle(preset.id)}
                title={preset.description}
                className={cn(
                  "p-1.5 rounded-lg border text-left flex flex-col gap-0.5 transition-all cursor-pointer",
                  isSelected
                    ? "bg-yellow-400/15 border-yellow-400/60 shadow-sm"
                    : "bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("text-[9px] px-1 py-0.2 rounded font-mono", preset.badge)}>
                    {preset.name}
                  </span>
                  {isSelected && <Check className="w-3 h-3 text-yellow-400" />}
                </div>
                <span className="text-[8px] text-neutral-400 truncate">
                  {preset.description.split(" ")[0]} Style
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          data-testid="apply-caption-style-btn"
          onClick={() => handleApplyCaptionStyle(selectedPreset)}
          className="w-full py-1 rounded-md bg-yellow-400/10 border border-yellow-400/30 hover:bg-yellow-400 hover:text-black text-yellow-400 text-[10px] font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Type className="w-3 h-3" />
          <span>Apply {selectedPreset.replace(/_/g, " ").toUpperCase()} Across Timeline</span>
        </button>

        {statusMessage && (
          <div className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded text-center animate-in fade-in duration-150">
            {statusMessage}
          </div>
        )}
      </div>

      {/* 3. Storytelling Beats Strip */}
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
                  "shrink-0 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 border cursor-pointer",
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

      {/* 4. Search Bar */}
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

      {/* 5. Interactive Transcript Words Body */}
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
            const isBeingEdited = editingWordIdx === idx;

            if (isBeingEdited) {
              return (
                <span key={`edit-${idx}`} className="inline-flex items-center gap-1 bg-yellow-400/20 border border-yellow-400/50 px-1.5 py-0.5 rounded">
                  <input
                    type="text"
                    data-testid="edit-word-input"
                    value={editingWordText}
                    autoFocus
                    onChange={(e) => setEditingWordText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveWordEdit();
                      if (e.key === "Escape") setEditingWordIdx(null);
                    }}
                    className="bg-transparent text-xs text-white font-bold outline-none w-20"
                  />
                  <button
                    data-testid="save-word-edit-btn"
                    onClick={handleSaveWordEdit}
                    className="p-0.5 text-yellow-400 hover:text-white"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setEditingWordIdx(null)}
                    className="p-0.5 text-neutral-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            }

            return (
              <span
                key={`${item.word}-${item.start}-${idx}`}
                data-testid={`transcript-word-${item.start}`}
                onClick={() => setPlayheadTime(item.start)}
                onDoubleClick={() => handleStartWordEdit(item, idx)}
                title={`Click to seek to ${item.start.toFixed(2)}s (Double-click to edit text)`}
                className={cn(
                  "cursor-pointer px-1 py-0.5 rounded transition-all select-none inline-flex items-center group relative",
                  isWordActive
                    ? "bg-yellow-400 text-black font-extrabold shadow-md shadow-yellow-400/20 scale-105"
                    : "text-neutral-300 hover:text-white hover:bg-neutral-800"
                )}
              >
                <span>{item.word}</span>
                <button
                  type="button"
                  data-testid={`edit-word-btn-${idx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartWordEdit(item, idx);
                  }}
                  className="hidden group-hover:inline-block ml-1 opacity-60 hover:opacity-100 text-yellow-400"
                  title="Edit word text"
                >
                  <Edit3 className="w-2.5 h-2.5" />
                </button>
              </span>
            );
          })}
        </div>

        {/* 6. Selected / Active Word Quick Context Card */}
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

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  const idx = transcriptWords.findIndex((w) => w.start === activeWord.start);
                  if (idx >= 0) handleStartWordEdit(activeWord, idx);
                }}
                data-testid="quick-edit-word-btn"
                className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-white text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3 text-yellow-400" />
                <span>Edit Text</span>
              </button>

              <button
                onClick={() => handleAddBadgeAtWord(activeWord)}
                data-testid="quick-add-badge-btn"
                className="px-2 py-1 rounded bg-yellow-400/10 border border-yellow-400/30 hover:bg-yellow-400 hover:text-black text-yellow-400 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Zap className="w-3 h-3" />
                <span>Add Badge</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
