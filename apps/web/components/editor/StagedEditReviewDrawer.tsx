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
  Sliders,
  ChevronDown,
  ChevronUp,
  Globe,
  BarChart2,
  Gauge,
  Terminal,
  Monitor,
} from "lucide-react";
import { EditPlanProposal, ProposedEditItem } from "@/lib/ai/copilot-types";
import { cn } from "@/lib/utils";

export interface ProposedEditParamCustomizerProps {
  edit: ProposedEditItem;
  onUpdateProps: (editId: string, updatedProps: Record<string, any>) => void;
  onUpdateTimeRange: (editId: string, start: number, end: number) => void;
  onSwitchType: (editId: string, newType: "graphic" | "broll", template?: string) => void;
}

export function ProposedEditParamCustomizer({
  edit,
  onUpdateProps,
  onUpdateTimeRange,
  onSwitchType,
}: ProposedEditParamCustomizerProps) {
  const currentComposition =
    edit.action_type === "graphic"
      ? (edit.operation?.element?.compositionId || "hero_reveal").toLowerCase().replace(/_/g, "-")
      : null;

  const props = edit.operation?.element?.props || {};

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 0 && val < edit.end) {
      onUpdateTimeRange(edit.id, val, edit.end);
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > edit.start) {
      onUpdateTimeRange(edit.id, edit.start, val);
    }
  };

  return (
    <div
      data-testid={`customizer-panel-${edit.id}`}
      className="mt-3 pt-3 border-t border-neutral-800/90 bg-neutral-950/80 -mx-3.5 -mb-3.5 p-3.5 rounded-b-xl space-y-3.5 animate-in fade-in duration-150"
    >
      <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
        <span className="flex items-center gap-1.5 text-yellow-400">
          <Sliders className="w-3.5 h-3.5" /> Parameter Customizer
        </span>
        <span className="text-[10px] text-neutral-500 font-mono">Instant Preview</span>
      </div>

      {/* 1. TIMING CONTROLS */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
          Timing Range (Seconds)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 focus-within:border-yellow-400/60 transition-colors">
            <span className="text-[10px] text-neutral-500 font-mono mr-2">Start:</span>
            <input
              type="number"
              step="0.1"
              min="0"
              max={Math.max(0, edit.end - 0.1)}
              value={edit.start}
              onChange={handleStartChange}
              data-testid={`timing-start-input-${edit.id}`}
              className="w-full bg-transparent text-xs font-mono text-white outline-none"
            />
            <span className="text-[10px] text-neutral-500 font-mono">s</span>
          </div>

          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 focus-within:border-yellow-400/60 transition-colors">
            <span className="text-[10px] text-neutral-500 font-mono mr-2">End:</span>
            <input
              type="number"
              step="0.1"
              min={edit.start + 0.1}
              value={edit.end}
              onChange={handleEndChange}
              data-testid={`timing-end-input-${edit.id}`}
              className="w-full bg-transparent text-xs font-mono text-white outline-none"
            />
            <span className="text-[10px] text-neutral-500 font-mono">s</span>
          </div>
        </div>
      </div>

      {/* 2. TEMPLATE / VISUAL MODE SWITCHER */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
          Visual Mode & Template
        </label>
        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => onSwitchType(edit.id, "broll")}
            data-testid={`template-btn-broll-${edit.id}`}
            className={cn(
              "p-2 rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer",
              edit.action_type === "broll"
                ? "bg-purple-500/20 border-purple-500/60 text-purple-300 shadow-sm"
                : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800"
            )}
          >
            <Film className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium truncate w-full text-center">Stock B-Roll</span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchType(edit.id, "graphic", "app-screen-upload")}
            data-testid={`template-btn-app-upload-${edit.id}`}
            className={cn(
              "p-2 rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer",
              edit.action_type === "graphic" && currentComposition === "app-screen-upload"
                ? "bg-sky-500/20 border-sky-500/60 text-sky-300 shadow-sm"
                : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800"
            )}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium truncate w-full text-center">App Upload</span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchType(edit.id, "graphic", "browser-walkthrough")}
            data-testid={`template-btn-browser-${edit.id}`}
            className={cn(
              "p-2 rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer",
              edit.action_type === "graphic" && currentComposition === "browser-walkthrough"
                ? "bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-sm"
                : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800"
            )}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium truncate w-full text-center">Web Capture</span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchType(edit.id, "graphic", "chart-reveal")}
            data-testid={`template-btn-chart-${edit.id}`}
            className={cn(
              "p-2 rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer",
              edit.action_type === "graphic" && currentComposition === "chart-reveal"
                ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm"
                : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800"
            )}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium truncate w-full text-center">Growth Chart</span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchType(edit.id, "graphic", "metric-reveal")}
            data-testid={`template-btn-metric-${edit.id}`}
            className={cn(
              "p-2 rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer",
              edit.action_type === "graphic" && currentComposition === "metric-reveal"
                ? "bg-indigo-500/20 border-indigo-500/60 text-indigo-300 shadow-sm"
                : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800"
            )}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium truncate w-full text-center">Key Metric</span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchType(edit.id, "graphic", "cooked-terminal")}
            data-testid={`template-btn-terminal-${edit.id}`}
            className={cn(
              "p-2 rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer",
              edit.action_type === "graphic" && currentComposition === "cooked-terminal"
                ? "bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm"
                : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800"
            )}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium truncate w-full text-center">Terminal</span>
          </button>
        </div>
      </div>

      {/* 3. DYNAMIC INLINE PROP EDITORS */}
      {edit.action_type === "graphic" && currentComposition === "app-screen-upload" && (
        <div className="space-y-2 pt-1 border-t border-neutral-900">
          <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
            App Upload Details
          </label>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[10px] text-neutral-500 block mb-0.5">App Title:</span>
              <input
                type="text"
                value={props.appName || "Video Studio App"}
                onChange={(e) => onUpdateProps(edit.id, { appName: e.target.value })}
                data-testid={`prop-app-name-${edit.id}`}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-white font-mono text-xs focus:border-sky-400/60 outline-none"
              />
            </div>

            <div>
              <span className="text-[10px] text-neutral-500 block mb-0.5">File Name:</span>
              <input
                type="text"
                value={props.fileName || "upload_video.mp4"}
                onChange={(e) => onUpdateProps(edit.id, { fileName: e.target.value })}
                data-testid={`prop-file-name-${edit.id}`}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-white font-mono text-xs focus:border-sky-400/60 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[10px] text-neutral-500">Progress:</span>
                  <span className="text-[10px] font-mono text-sky-400 font-bold">
                    {props.progress ?? 100}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={props.progress ?? 100}
                  onChange={(e) => onUpdateProps(edit.id, { progress: parseInt(e.target.value, 10) })}
                  data-testid={`prop-progress-slider-${edit.id}`}
                  className="w-full accent-sky-400 cursor-pointer h-1 bg-neutral-800 rounded-lg"
                />
              </div>

              <div>
                <span className="text-[10px] text-neutral-500 block mb-0.5">Status Label:</span>
                <input
                  type="text"
                  value={props.status || "Upload Complete"}
                  onChange={(e) => onUpdateProps(edit.id, { status: e.target.value })}
                  data-testid={`prop-status-${edit.id}`}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono text-xs focus:border-sky-400/60 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {edit.action_type === "graphic" && currentComposition === "browser-walkthrough" && (
        <div className="space-y-2 pt-1 border-t border-neutral-900">
          <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
            Web Evidence Details
          </label>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[10px] text-neutral-500 block mb-0.5">Website URL:</span>
              <input
                type="text"
                value={props.url || "https://example.com"}
                onChange={(e) => onUpdateProps(edit.id, { url: e.target.value })}
                data-testid={`prop-web-url-${edit.id}`}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-white font-mono text-xs focus:border-cyan-400/60 outline-none"
              />
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block mb-0.5">Tab Title:</span>
              <input
                type="text"
                value={props.tabTitle || "Web Evidence"}
                onChange={(e) => onUpdateProps(edit.id, { tabTitle: e.target.value })}
                data-testid={`prop-web-tab-${edit.id}`}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-white font-mono text-xs focus:border-cyan-400/60 outline-none"
              />
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block mb-0.5">Highlight Overlay:</span>
              <input
                type="text"
                value={props.highlightText || "Key Source"}
                onChange={(e) => onUpdateProps(edit.id, { highlightText: e.target.value })}
                data-testid={`prop-web-highlight-${edit.id}`}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-white font-mono text-xs focus:border-cyan-400/60 outline-none"
              />
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block mb-1">Display Format / Aspect Ratio:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "16:9", label: "Desktop (16:9)" },
                  { id: "9:16", label: "Phone (9:16)" },
                  { id: "1:1", label: "Square (1:1)" },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={async () => {
                      onUpdateProps(edit.id, { format: fmt.id, aspectRatio: fmt.id });
                      if (props.url) {
                        try {
                          const res = await fetch("/api/v1/editor/capture-web", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ url: props.url, format: fmt.id }),
                          });
                          if (res.ok) {
                            const data = await res.json();
                            if (data.preview_url) {
                              onUpdateProps(edit.id, { screenshotUrl: data.preview_url, format: fmt.id, aspectRatio: fmt.id });
                            }
                          }
                        } catch {
                          // silently retain existing capture
                        }
                      }
                    }}
                    data-testid={`prop-web-format-${fmt.id.replace(":", "-")}-${edit.id}`}
                    className={cn(
                      "px-2 py-1.5 rounded-lg border text-[10px] font-mono transition-all text-center cursor-pointer",
                      (props.format || props.aspectRatio || "16:9") === fmt.id
                        ? "bg-cyan-500/20 border-cyan-500/60 text-cyan-300 font-bold shadow-sm"
                        : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800"
                    )}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {edit.action_type === "graphic" && currentComposition === "chart-reveal" && (
        <div className="space-y-2 pt-1 border-t border-neutral-900">
          <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
            Chart Data Points
          </label>
          <div className="space-y-1.5 text-xs">
            <div>
              <span className="text-[10px] text-neutral-500 block mb-0.5">Chart Title:</span>
              <input
                type="text"
                value={props.title || "GROWTH TREND"}
                onChange={(e) => onUpdateProps(edit.id, { title: e.target.value })}
                data-testid={`prop-chart-title-${edit.id}`}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-white font-mono text-xs outline-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <input
                type="text"
                value={props.dataPoint1 || ""}
                placeholder="Stage 1"
                onChange={(e) => onUpdateProps(edit.id, { dataPoint1: e.target.value })}
                className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono text-[11px] outline-none"
              />
              <input
                type="text"
                value={props.dataPoint2 || ""}
                placeholder="Stage 2"
                onChange={(e) => onUpdateProps(edit.id, { dataPoint2: e.target.value })}
                className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono text-[11px] outline-none"
              />
              <input
                type="text"
                value={props.dataPoint3 || ""}
                placeholder="Stage 3"
                onChange={(e) => onUpdateProps(edit.id, { dataPoint3: e.target.value })}
                className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono text-[11px] outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {edit.action_type === "graphic" && currentComposition === "metric-reveal" && (
        <div className="space-y-2 pt-1 border-t border-neutral-900">
          <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
            Metric Highlight
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-neutral-500 block mb-0.5">Label:</span>
              <input
                type="text"
                value={props.label || "KEY METRIC"}
                onChange={(e) => onUpdateProps(edit.id, { label: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono text-xs outline-none"
              />
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block mb-0.5">Metric:</span>
              <input
                type="text"
                value={props.metric || "+140%"}
                onChange={(e) => onUpdateProps(edit.id, { metric: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono text-xs outline-none"
              />
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block mb-0.5">Delta:</span>
              <input
                type="text"
                value={props.delta || "Target"}
                onChange={(e) => onUpdateProps(edit.id, { delta: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono text-xs outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {edit.action_type === "broll" && (
        <div className="space-y-2 pt-1 border-t border-neutral-900">
          <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
            Stock Video Settings
          </label>
          <div>
            <span className="text-[10px] text-neutral-500 block mb-0.5">Title / Subject:</span>
            <input
              type="text"
              value={edit.title}
              onChange={(e) => onUpdateProps(edit.id, { title: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-white font-mono text-xs outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface StagedEditReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: EditPlanProposal | null;
  onApplySelected: (edits: ProposedEditItem[]) => void;
  onApplySingle?: (edit: ProposedEditItem) => void;
  onRejectSingle?: (editId: string) => void;
  onUpdateEdit?: (updatedEdit: ProposedEditItem) => void;
}

export function StagedEditReviewDrawer({
  isOpen,
  onClose,
  proposal,
  onApplySelected,
  onApplySingle,
  onRejectSingle,
  onUpdateEdit,
}: StagedEditReviewDrawerProps) {
  const [editsState, setEditsState] = useState<ProposedEditItem[]>(() => {
    if (!proposal) return [];
    return proposal.edits.map((e) => ({ ...e }));
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    if (!proposal) return new Set();
    return new Set(proposal.edits.map((e) => e.id));
  });

  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (proposal) {
      setEditsState(proposal.edits.map((e) => ({ ...e })));
      setSelectedIds(new Set(proposal.edits.map((e) => e.id)));
      setAppliedIds(new Set());
      setRejectedIds(new Set());
      setExpandedIds(new Set());
    }
  }, [proposal?.plan_id, proposal?.id]);

  if (!isOpen || !proposal) return null;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
    const pendingIds = editsState
      .filter((e) => !appliedIds.has(e.id) && !rejectedIds.has(e.id))
      .map((e) => e.id);
    setSelectedIds(new Set(pendingIds));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleUpdateTimeRange = (editId: string, newStart: number, newEnd: number) => {
    setEditsState((prev) =>
      prev.map((edit) => {
        if (edit.id !== editId) return edit;
        const updated: ProposedEditItem = {
          ...edit,
          start: newStart,
          end: newEnd,
          operation: {
            ...edit.operation,
            element: edit.operation?.element
              ? {
                  ...edit.operation.element,
                  start: newStart,
                  end: newEnd,
                }
              : edit.operation?.element,
            splitTime: edit.operation?.type === "split_clip" ? newStart : edit.operation?.splitTime,
          },
        };
        if (onUpdateEdit) onUpdateEdit(updated);
        return updated;
      })
    );
  };

  const handleUpdateProps = (editId: string, updatedProps: Record<string, any>) => {
    setEditsState((prev) =>
      prev.map((edit) => {
        if (edit.id !== editId) return edit;
        const currentElement = edit.operation?.element || {};
        const currentProps = currentElement.props || {};
        const mergedProps = { ...currentProps, ...updatedProps };

        let updatedTitle = edit.title;
        if (updatedProps.title) updatedTitle = updatedProps.title;
        if (updatedProps.appName && edit.action_type === "graphic") {
          updatedTitle = `App Upload: ${updatedProps.appName}`;
        }
        if (updatedProps.tabTitle && edit.action_type === "graphic") {
          updatedTitle = `Web Evidence: ${updatedProps.tabTitle}`;
        }

        const updated: ProposedEditItem = {
          ...edit,
          title: updatedTitle,
          operation: {
            ...edit.operation,
            element: {
              ...currentElement,
              name: updatedTitle,
              props: mergedProps,
            },
          },
        };
        if (onUpdateEdit) onUpdateEdit(updated);
        return updated;
      })
    );
  };

  const handleSwitchType = (editId: string, newType: "graphic" | "broll", template?: string) => {
    setEditsState((prev) =>
      prev.map((edit) => {
        if (edit.id !== editId) return edit;

        if (newType === "broll") {
          const updated: ProposedEditItem = {
            ...edit,
            action_type: "broll",
            track: "broll",
            title: "Stock Video Footage",
            description: "High-quality stock footage overlaying timeline.",
            preview_url: edit.preview_url || "https://images.pexels.com/videos/12345/preview.jpg",
            operation: {
              type: "add_element",
              track: "broll",
              element: {
                id: edit.operation?.element?.id || `broll-${Date.now()}`,
                name: "Stock Video Footage",
                start: edit.start,
                end: edit.end,
                src: edit.operation?.element?.src || "https://videos.pexels.com/12345.mp4",
                fitMode: "cover",
                opacity: 100,
              },
            },
          };
          if (onUpdateEdit) onUpdateEdit(updated);
          return updated;
        }

        // newType === "graphic"
        const compId = template || "app-screen-upload";
        let defaultProps: Record<string, any> = {};
        let titleText = "Motion Graphic";

        if (compId === "app-screen-upload") {
          titleText = "App Screen Upload";
          defaultProps = {
            title: "VIDEO UPLOAD",
            appName: "Video Studio App",
            fileName: "upload_video.mp4",
            fileSize: "48.2 MB",
            progress: 100,
            status: "Upload Complete",
          };
        } else if (compId === "browser-walkthrough") {
          titleText = "Browser Walkthrough";
          defaultProps = {
            url: "https://example.com",
            tabTitle: "Web Evidence",
            highlightText: "Featured Source",
          };
        } else if (compId === "chart-reveal") {
          titleText = "Rising Growth Chart";
          defaultProps = {
            title: "GROWTH TREND",
            dataPoint1: "Stage 1: Baseline",
            dataPoint2: "Stage 2: +85%",
            dataPoint3: "Stage 3: +165% Surge",
          };
        } else if (compId === "metric-reveal") {
          titleText = "Metric Reveal";
          defaultProps = {
            label: "KEY METRIC",
            metric: "+140%",
            delta: "Target Exceeded",
          };
        } else if (compId === "cooked-terminal") {
          titleText = "Terminal Code";
          defaultProps = {
            command: "npm run deploy",
            output: "Server running: 100% production ready",
          };
        }

        const updated: ProposedEditItem = {
          ...edit,
          action_type: "graphic",
          track: "graphic",
          title: titleText,
          description: `Customized ${titleText} motion card.`,
          operation: {
            type: "add_element",
            track: "graphic",
            element: {
              id: edit.operation?.element?.id || `graphic-${Date.now()}`,
              name: titleText,
              compositionId: compId,
              props: defaultProps,
              start: edit.start,
              end: edit.end,
              position: { x: 50, y: 35 },
              scale: 1.0,
              rotation: 0,
            },
          },
        };
        if (onUpdateEdit) onUpdateEdit(updated);
        return updated;
      })
    );
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
    const toApply = editsState.filter(
      (e) => selectedIds.has(e.id) && !appliedIds.has(e.id) && !rejectedIds.has(e.id)
    );
    if (toApply.length === 0) return;

    toApply.forEach((e) => appliedIds.add(e.id));
    setAppliedIds(new Set(appliedIds));
    onApplySelected(toApply);
  };

  const pendingEdits = editsState.filter(
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
      className="fixed inset-y-0 right-0 z-[60] w-full sm:w-[460px] md:w-[500px] bg-neutral-950/95 backdrop-blur-xl border-l border-neutral-800 shadow-2xl flex flex-col transition-all duration-300 select-none animate-in slide-in-from-right duration-200"
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
                {editsState.length} {editsState.length === 1 ? "Edit" : "Edits"}
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">Review, customize parameters, and apply</p>
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
        {editsState.map((edit) => {
          const isApplied = appliedIds.has(edit.id);
          const isRejected = rejectedIds.has(edit.id);
          const isSelected = selectedIds.has(edit.id);
          const isExpanded = expandedIds.has(edit.id);
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
                      <Film className="w-3 h-3 text-yellow-400" /> Preview Visual
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

              {/* Collapsible Parameter Customizer */}
              {isExpanded && !isApplied && !isRejected && (
                <ProposedEditParamCustomizer
                  edit={edit}
                  onUpdateProps={handleUpdateProps}
                  onUpdateTimeRange={handleUpdateTimeRange}
                  onSwitchType={handleSwitchType}
                />
              )}

              {/* Individual Card Controls */}
              {!isApplied && !isRejected && (
                <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleExpand(edit.id)}
                    data-testid={`customize-edit-btn-${edit.id}`}
                    className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-yellow-400 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{isExpanded ? "Hide Controls" : "Customize"}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>

                  <div className="flex items-center gap-2">
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
              {appliedIds.size} of {editsState.length} applied
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
