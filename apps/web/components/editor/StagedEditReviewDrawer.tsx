"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  Film,
  Wand2,
  AlertTriangle,
  Play,
  CheckSquare,
  Square,
  Undo2,
} from "lucide-react";
import { EditPlanProposal, ProposedEditItem } from "@/lib/ai/copilot-types";
import { cn } from "@/lib/utils";

interface StagedEditReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: EditPlanProposal | null;
  onApplySelected: (edits: ProposedEditItem[]) => void;
  onApplySingle?: (edit: ProposedEditItem) => void;
  onRejectSingle?: (editId: string) => void;
}

export function StagedEditReviewDrawer({
  isOpen,
  onClose,
  proposal,
  onApplySelected,
  onApplySingle,
  onRejectSingle,
}: StagedEditReviewDrawerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    if (!proposal) return new Set();
    return new Set(proposal.edits.map((e) => e.id));
  });

  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);

  useEffect(() => {
    if (proposal) {
      setSelectedIds(new Set(proposal.edits.map((e) => e.id)));
      setAppliedIds(new Set());
      setRejectedIds(new Set());
      setActivePreviewId(null);
    }
  }, [proposal?.id]);

  if (!isOpen || !proposal) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    const pendingIds = proposal.edits
      .filter((e) => !appliedIds.has(e.id) && !rejectedIds.has(e.id))
      .map((e) => e.id);
    setSelectedIds(new Set(pendingIds));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleApplySingleClick = (edit: ProposedEditItem) => {
    setAppliedIds((prev) => new Set(prev).add(edit.id));
    if (onApplySingle) {
      onApplySingle(edit);
    } else {
      onApplySelected([edit]);
    }
  };

  const handleRejectClick = (editId: string) => {
    setRejectedIds((prev) => new Set(prev).add(editId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(editId);
      return next;
    });
    if (onRejectSingle) {
      onRejectSingle(editId);
    }
  };

  const handleApplyBatch = () => {
    const toApply = proposal.edits.filter(
      (e) => selectedIds.has(e.id) && !appliedIds.has(e.id) && !rejectedIds.has(e.id)
    );
    if (toApply.length === 0) return;

    toApply.forEach((e) => appliedIds.add(e.id));
    setAppliedIds(new Set(appliedIds));
    onApplySelected(toApply);
  };

  const pendingEdits = proposal.edits.filter(
    (e) => !appliedIds.has(e.id) && !rejectedIds.has(e.id)
  );
  const selectedCount = pendingEdits.filter((e) => selectedIds.has(e.id)).length;

  const getBadgeStyle = (actionType: string) => {
    switch (actionType) {
      case "broll":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "graphic":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "sfx":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "transition":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "caption":
      default:
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    }
  };

  return (
    <aside
      data-testid="staged-edit-review-drawer"
      className="fixed inset-y-0 right-0 z-[60] w-full sm:w-[440px] md:w-[480px] bg-neutral-950/95 backdrop-blur-xl border-l border-neutral-800 shadow-2xl flex flex-col transition-all duration-300 select-none animate-in slide-in-from-right duration-200"
    >
      {/* 1. Header */}
      <div className="h-14 px-4 border-b border-neutral-900 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-white tracking-wide">Proposed Edit Plan</h2>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 font-mono font-medium">
                {proposal.edits.length} {proposal.edits.length === 1 ? "Edit" : "Edits"}
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">Review, preview, and apply changes</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer"
          title="Close review drawer (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Directive Summary Bar */}
      <div className="px-4 py-3 bg-neutral-900/60 border-b border-neutral-900/80">
        <div className="text-[11px] text-neutral-400 mb-1">
          Prompt: <span className="text-neutral-200 italic font-medium">"{proposal.user_prompt}"</span>
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed font-sans">{proposal.summary}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-neutral-500 font-mono">
          <span className="uppercase px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
            {proposal.scope.replace("_", " ")}
          </span>
          <span>•</span>
          <span>Timeline: {proposal.total_duration_seconds.toFixed(1)}s total</span>
          {proposal.scope === "whole_video" && (
            <>
              <span>•</span>
              <span className="text-yellow-400/90 font-medium bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20">
                Pacing: 1 visual / 3–5s · Spaced SFX
              </span>
            </>
          )}
        </div>
      </div>

      {/* 3. Batch Controls Bar */}
      {pendingEdits.length > 1 && (
        <div className="px-4 py-2 border-b border-neutral-900/60 bg-black/20 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="hover:text-white text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-yellow-400" /> Select All
            </button>
            <span className="text-neutral-600">|</span>
            <button
              onClick={deselectAll}
              className="hover:text-white text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 text-neutral-500" /> Clear
            </button>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">
            {selectedCount} of {pendingEdits.length} selected
          </span>
        </div>
      )}

      {/* 4. Edit Cards Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {proposal.edits.map((edit) => {
          const isApplied = appliedIds.has(edit.id);
          const isRejected = rejectedIds.has(edit.id);
          const isSelected = selectedIds.has(edit.id);
          const duration = Math.max(0.1, edit.end - edit.start);

          return (
            <div
              key={edit.id}
              data-testid={`proposed-edit-card-${edit.id}`}
              className={cn(
                "p-3.5 rounded-xl border transition-all duration-200 relative",
                isApplied
                  ? "bg-emerald-950/20 border-emerald-500/30 opacity-75"
                  : isRejected
                  ? "bg-neutral-900/30 border-neutral-800 opacity-40 grayscale"
                  : isSelected
                  ? "bg-neutral-900/80 border-neutral-700 shadow-sm"
                  : "bg-neutral-900/40 border-neutral-800/80"
              )}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  {!isApplied && !isRejected && (
                    <button
                      onClick={() => toggleSelect(edit.id)}
                      className="mt-0.5 text-neutral-400 hover:text-yellow-400 transition-colors cursor-pointer"
                      title={isSelected ? "Deselect edit" : "Select edit"}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <Square className="w-4 h-4 text-neutral-500" />
                      )}
                    </button>
                  )}

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider",
                          getBadgeStyle(edit.action_type)
                        )}
                      >
                        {edit.action_type}
                      </span>
                      <h3 className="text-xs font-semibold text-white tracking-wide">
                        {edit.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-400 font-mono">
                      <Clock className="w-3 h-3 text-neutral-500" />
                      <span>
                        {edit.start.toFixed(1)}s – {edit.end.toFixed(1)}s ({duration.toFixed(1)}s)
                      </span>
                      <span>•</span>
                      <span className="capitalize">{edit.track} Track</span>
                    </div>
                  </div>
                </div>

                {isApplied && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Applied
                  </span>
                )}
                {isRejected && (
                  <span className="text-[11px] font-medium text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full shrink-0">
                    Skipped
                  </span>
                )}
              </div>

              {/* Preview Thumbnail (if media available) */}
              {edit.preview_url && (
                <div className="mt-2.5 rounded-lg overflow-hidden border border-neutral-800 bg-black relative group">
                  <img
                    src={edit.preview_url}
                    alt={edit.title}
                    className="w-full h-28 object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                    <span className="text-[10px] text-neutral-300 font-mono flex items-center gap-1">
                      <Film className="w-3 h-3 text-yellow-400" /> Stock Clip Preview
                    </span>
                  </div>
                </div>
              )}

              {/* Description & Reasoning */}
              <p className="mt-2 text-xs text-neutral-300 leading-relaxed font-sans">
                {edit.description}
              </p>

              {edit.reason && (
                <div className="mt-2 text-[11px] text-neutral-400 bg-neutral-950/60 p-2 rounded-lg border border-neutral-800/80">
                  <span className="text-yellow-400/90 font-medium">💡 Reason: </span>
                  {edit.reason}
                </div>
              )}

              {/* Destructive / Conflict Warnings */}
              {edit.is_destructive && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Replaces footage over this timeline span.</span>
                </div>
              )}

              {/* Individual Card Controls */}
              {!isApplied && !isRejected && (
                <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleRejectClick(edit.id)}
                    className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApplySingleClick(edit)}
                    className="px-3 py-1 text-xs font-semibold text-neutral-950 bg-yellow-400 hover:bg-yellow-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> Accept
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 5. Sticky Footer Action Bar */}
      <div className="p-4 border-t border-neutral-900 bg-black/60 flex items-center justify-between gap-3">
        <div className="text-xs text-neutral-400 font-mono">
          {appliedIds.size > 0 ? (
            <span className="text-emerald-400 font-semibold">
              {appliedIds.size} of {proposal.edits.length} applied
            </span>
          ) : (
            <span>{selectedCount} selected</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            Done
          </button>
          <button
            onClick={handleApplyBatch}
            disabled={selectedCount === 0}
            className={cn(
              "px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm",
              selectedCount > 0
                ? "bg-yellow-400 hover:bg-yellow-300 text-neutral-950 shadow-yellow-400/10"
                : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
            )}
          >
            <Wand2 className="w-3.5 h-3.5" />
            Apply Selected ({selectedCount})
          </button>
        </div>
      </div>
    </aside>
  );
}
