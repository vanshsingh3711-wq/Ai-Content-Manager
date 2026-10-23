"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  History,
  X,
  RotateCcw,
  Trash2,
  BookmarkPlus,
  Loader2,
  Calendar,
  Layers,
  Film,
  Sparkles,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info,
} from "lucide-react";
import { TimelineProject } from "@/lib/timeline-types";
import {
  ProjectSnapshotSummary,
  getSnapshots,
  createSnapshot,
  restoreSnapshot,
  deleteSnapshot,
} from "@/lib/api/snapshots";
import { cn } from "@/lib/utils";

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  currentProject: TimelineProject;
  onRestoreProject: (project: TimelineProject, versionLabel: string) => void;
}

function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return "Just now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Recent";
  }
}

export function VersionHistoryDrawer({
  isOpen,
  onClose,
  videoId,
  currentProject,
  onRestoreProject,
}: VersionHistoryDrawerProps) {
  const [snapshots, setSnapshots] = useState<ProjectSnapshotSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New Checkpoint Form State
  const [newLabel, setNewLabel] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);

  // Fetch snapshots from backend
  const fetchSnapshots = useCallback(async () => {
    if (!videoId || videoId === "new") return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSnapshots(videoId);
      setSnapshots(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load version history.");
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    if (isOpen) {
      fetchSnapshots();
    }
  }, [isOpen, fetchSnapshots]);

  // Handle Create Snapshot Checkpoint
  const handleCreateSnapshot = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedLabel = newLabel.trim();
    if (!trimmedLabel || isCreating) return;

    setIsCreating(true);
    setError(null);
    try {
      const created = await createSnapshot(videoId, {
        label: trimmedLabel,
        description: newDescription.trim() || undefined,
        timeline_project: currentProject,
      });

      setStatusMessage({
        type: "success",
        text: `Checkpoint v${created.version} ('${created.label}') created successfully!`,
      });
      setNewLabel("");
      setNewDescription("");
      await fetchSnapshots();
    } catch (err: any) {
      setError(err?.message || "Failed to create checkpoint.");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Restore Snapshot Checkpoint
  const handleRestore = async (snap: ProjectSnapshotSummary) => {
    setRestoringId(snap.id);
    setError(null);
    try {
      const res = await restoreSnapshot(videoId, snap.id);
      if (res && res.timeline_project) {
        onRestoreProject(res.timeline_project, `v${res.version} - ${res.label}`);
        setStatusMessage({
          type: "success",
          text: `Successfully restored to Version ${res.version} ('${res.label}')!`,
        });
        setConfirmRestoreId(null);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to restore checkpoint.");
    } finally {
      setRestoringId(null);
    }
  };

  // Handle Delete Snapshot Checkpoint
  const handleDelete = async (snapId: string) => {
    setDeletingId(snapId);
    setError(null);
    try {
      await deleteSnapshot(videoId, snapId);
      setSnapshots((prev) => prev.filter((s) => s.id !== snapId));
      setConfirmDeleteId(null);
      setStatusMessage({
        type: "success",
        text: "Checkpoint removed from version history.",
      });
    } catch (err: any) {
      setError(err?.message || "Failed to delete checkpoint.");
    } finally {
      setDeletingId(null);
    }
  };

  // Compute live draft stats
  const currentTracks = currentProject.tracks || {};
  const currentCuts = currentTracks.videoTrack?.length || 0;
  const currentAudio = currentTracks.audioTrack?.length || 0;
  const currentCaptions = currentTracks.textTrack?.length || 0;
  const currentGraphics = currentTracks.graphicsTrack?.length || 0;
  const currentBroll = currentTracks.brollTrack?.length || 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        data-testid="history-drawer-backdrop"
      />

      {/* Slide-Over Drawer Container */}
      <aside
        className="relative w-full max-w-md bg-neutral-950 border-l border-neutral-800 text-white flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-right duration-300 select-none"
        role="dialog"
        aria-modal="true"
        aria-label="Version History"
      >
        {/* Drawer Header */}
        <header className="px-5 py-4 border-b border-neutral-900 bg-black/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Version History
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                  Cloud
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                Browse, create snapshots, and restore 1-click checkpoints.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchSnapshots()}
              disabled={isLoading}
              title="Refresh version list"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Status / Alert Banner */}
        {statusMessage && (
          <div
            className={cn(
              "px-4 py-2.5 border-b text-xs flex items-center justify-between transition-all",
              statusMessage.type === "success"
                ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                : "bg-red-950/40 border-red-800/60 text-red-300"
            )}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              )}
              <span className="truncate">{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-neutral-400 hover:text-white text-xs ml-2"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-950/30 border border-red-800/50 rounded-lg text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Error</p>
              <p className="text-[11px] text-red-400 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {/* 1. Save Checkpoint Form */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2.5">
              <BookmarkPlus className="w-3.5 h-3.5 text-emerald-400" />
              <h3 className="text-xs font-semibold text-neutral-200">Save Checkpoint</h3>
            </div>
            <form onSubmit={handleCreateSnapshot} className="space-y-2">
              <div>
                <input
                  type="text"
                  placeholder="Checkpoint name (e.g., 'Before cutting scene 2')"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  disabled={isCreating}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Optional notes or description..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  disabled={isCreating}
                  className="w-full bg-neutral-950 border border-neutral-800/70 rounded-lg px-3 py-1.5 text-[11px] text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition-colors"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Freezes active timeline state
                </span>
                <button
                  type="submit"
                  disabled={!newLabel.trim() || isCreating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm shadow-emerald-950"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>Save Checkpoint</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 2. Current Draft Live Card */}
          <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-neutral-300">Live Active Project</span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">
                {currentProject.duration.toFixed(1)}s total
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono">
                {currentCuts} Cut{currentCuts === 1 ? "" : "s"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono">
                {currentCaptions} Caption{currentCaptions === 1 ? "" : "s"}
              </span>
              {currentGraphics > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono">
                  {currentGraphics} Graphic{currentGraphics === 1 ? "" : "s"}
                </span>
              )}
              {currentBroll > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono">
                  {currentBroll} B-roll
                </span>
              )}
              {currentAudio > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono">
                  {currentAudio} Audio
                </span>
              )}
            </div>
          </div>

          {/* 3. Checkpoints List Section Header */}
          <div className="flex items-center justify-between pt-1">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Checkpoints ({snapshots.length})
            </h3>
            {snapshots.length > 0 && (
              <span className="text-[10px] text-neutral-500">Sorted newest first</span>
            )}
          </div>

          {/* Loading State */}
          {isLoading && snapshots.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-neutral-500 space-y-2">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
              <p className="text-xs">Loading version checkpoints...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && snapshots.length === 0 && (
            <div className="py-10 border border-dashed border-neutral-800 rounded-xl flex flex-col items-center justify-center text-center p-6 text-neutral-500 space-y-2">
              <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 mb-1">
                <History className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-semibold text-neutral-300">No checkpoints saved yet</h4>
              <p className="text-[11px] text-neutral-500 max-w-xs">
                Create a checkpoint above to preserve milestones, experiment fearlessly, and rollback anytime.
              </p>
            </div>
          )}

          {/* Snapshots Timeline Items */}
          <div className="space-y-3">
            {snapshots.map((snap) => {
              const isConfirmingDelete = confirmDeleteId === snap.id;
              const isConfirmingRestore = confirmRestoreId === snap.id;
              const isRestoringThis = restoringId === snap.id;
              const isDeletingThis = deletingId === snap.id;

              return (
                <div
                  key={snap.id}
                  data-testid={`snapshot-item-${snap.version}`}
                  className="group relative bg-neutral-900/40 hover:bg-neutral-900/70 border border-neutral-800/80 hover:border-neutral-700/80 rounded-xl p-3.5 transition-all flex flex-col gap-2.5"
                >
                  {/* Top Bar: Version Pill + Label + Time */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        v{snap.version}
                      </span>
                      <h4 className="text-xs font-semibold text-white tracking-tight">
                        {snap.label}
                      </h4>
                    </div>
                    <span className="text-[10px] text-neutral-500 flex items-center gap-1 shrink-0 font-mono">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(snap.created_at)}
                    </span>
                  </div>

                  {/* Description if present */}
                  {snap.description && (
                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                      {snap.description}
                    </p>
                  )}

                  {/* Clip Breakdown Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800/80 text-neutral-300 font-mono">
                      {snap.clip_counts?.video || 0} Cut{(snap.clip_counts?.video || 0) === 1 ? "" : "s"}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800/80 text-neutral-300 font-mono">
                      {snap.clip_counts?.captions || 0} Caption{(snap.clip_counts?.captions || 0) === 1 ? "" : "s"}
                    </span>
                    {(snap.clip_counts?.graphics || 0) > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800/80 text-neutral-300 font-mono">
                        {snap.clip_counts.graphics} Graphic{snap.clip_counts.graphics === 1 ? "" : "s"}
                      </span>
                    )}
                    {(snap.clip_counts?.broll || 0) > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800/80 text-neutral-300 font-mono">
                        {snap.clip_counts.broll} B-roll
                      </span>
                    )}
                    {(snap.clip_counts?.audio || 0) > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800/80 text-neutral-300 font-mono">
                        {snap.clip_counts.audio} Audio
                      </span>
                    )}
                  </div>

                  {/* Actions / Confirmation Row */}
                  <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between">
                    {/* Restore Action */}
                    {isConfirmingRestore ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-yellow-400 font-medium">Rollback to v{snap.version}?</span>
                        <button
                          onClick={() => handleRestore(snap)}
                          disabled={isRestoringThis}
                          className="px-2 py-1 rounded bg-yellow-500 hover:bg-yellow-400 text-black text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          {isRestoringThis ? "Restoring..." : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmRestoreId(null)}
                          className="px-1.5 py-1 text-neutral-400 hover:text-white text-[10px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRestoreId(snap.id)}
                        disabled={isRestoringThis}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-300 hover:text-emerald-400 transition-colors cursor-pointer py-0.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore Version</span>
                      </button>
                    )}

                    {/* Delete Action */}
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-red-400 font-medium">Delete?</span>
                        <button
                          onClick={() => handleDelete(snap.id)}
                          disabled={isDeletingThis}
                          className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          {isDeletingThis ? "Deleting..." : "Yes"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1.5 py-1 text-neutral-400 hover:text-white text-[10px]"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(snap.id)}
                        className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-900 transition-colors cursor-pointer"
                        title="Delete checkpoint"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
