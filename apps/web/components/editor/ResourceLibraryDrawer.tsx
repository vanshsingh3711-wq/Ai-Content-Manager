"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Shapes,
  Type,
  Sparkles,
  Music,
  Film,
  Plus,
  Sliders,
  Check,
  AlertCircle,
  GripVertical,
  Layers,
  ChevronDown,
  ChevronUp,
  Tag,
  Info,
  Clock,
  RotateCcw,
  Zap,
  Smartphone,
  Monitor,
  Filter,
  TrendingUp,
} from "lucide-react";
import {
  LibraryResource,
  LibraryResourceType,
  ResourceParameterDefinition,
} from "@/lib/library/resource-types";
import {
  getAllResources,
  searchResources,
  createOperationFromResource,
} from "@/lib/library/resource-registry";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { useShallow } from "zustand/react/shallow";
import {
  EDITOR_DRAG_MIME,
  serializeDragPayload,
  EditorDragPayload,
} from "@/lib/editor/drag-drop-types";
import { cn } from "@/lib/utils";
import { ResourceVisualPreview } from "./ResourceVisualPreview";

interface ResourceLibraryDrawerProps {
  initialCategory?: string;
  onApplied?: (resourceName: string) => void;
}

const CATEGORIES = [
  { id: "All", label: "All Packs", icon: Layers },
  { id: "Finance", label: "Finance", icon: TrendingUp },
  { id: "Shapes", label: "Shapes", icon: Shapes },
  { id: "B-Roll Stock", label: "B-Roll", icon: Film },
  { id: "Visual Effects", label: "Effects", icon: Sparkles },
  { id: "Motion Graphics", label: "Cards", icon: Zap },
  { id: "Captions", label: "Captions", icon: Type },
  { id: "Transitions", label: "Transitions", icon: Sparkles },
  { id: "Audio SFX", label: "Sound FX", icon: Music },
];

const ASPECT_RATIO_FILTERS = [
  { id: "all", label: "All Ratios", icon: null },
  { id: "9:16", label: "9:16 (Vertical)", icon: Smartphone },
  { id: "16:9", label: "16:9 (Landscape)", icon: Monitor },
];

const BROLL_THEMES = [
  { id: "all", label: "All Themes" },
  { id: "Urban", label: "Urban & City" },
  { id: "Tech", label: "Tech & Code" },
  { id: "Nature", label: "Nature & Aerial" },
  { id: "Lifestyle", label: "Lifestyle & Cafe" },
  { id: "Business", label: "Business & Office" },
  { id: "Abstract", label: "Abstract & Cyber" },
];

const SORT_OPTIONS: { id: "default" | "name" | "duration_asc" | "duration_desc"; label: string }[] = [
  { id: "default", label: "Sort: Featured" },
  { id: "name", label: "Name (A-Z)" },
  { id: "duration_asc", label: "Duration (Short to Long)" },
  { id: "duration_desc", label: "Duration (Long to Short)" },
];

export function ResourceLibraryDrawer({ initialCategory, onApplied }: ResourceLibraryDrawerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || "All");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"default" | "name" | "duration_asc" | "duration_desc">("default");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedResourceId, setExpandedResourceId] = useState<string | null>(null);
  const [hoveredResourceId, setHoveredResourceId] = useState<string | null>(null);
  const [customParams, setCustomParams] = useState<Record<string, any>>({});
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    project,
    playheadTime,
    selectedItem,
    dispatchOperation,
    setSelectedItem,
  } = useTimelineStore(
    useShallow((state) => ({
      project: state.project,
      playheadTime: state.playheadTime,
      selectedItem: state.selectedItem,
      dispatchOperation: state.dispatchOperation,
      setSelectedItem: state.setSelectedItem,
    }))
  );

  // Filtered resources
  const resources = useMemo(() => {
    return searchResources(searchQuery, {
      category: selectedCategory === "All" ? undefined : selectedCategory,
      aspectRatio: selectedAspectRatio,
      subCategory: selectedSubCategory,
      sortBy: sortBy,
    });
  }, [searchQuery, selectedCategory, selectedAspectRatio, selectedSubCategory, sortBy]);

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    if (catId !== "B-Roll Stock" && catId !== "All") {
      setSelectedAspectRatio("all");
      setSelectedSubCategory("all");
    }
  };

  const handleParamChange = (paramName: string, value: any) => {
    setCustomParams((prev) => ({
      ...prev,
      [paramName]: value,
    }));
  };

  const handleToggleCustomize = (resource: LibraryResource) => {
    if (expandedResourceId === resource.id) {
      setExpandedResourceId(null);
      setCustomParams({});
    } else {
      setExpandedResourceId(resource.id);
      // Pre-fill defaults
      const defaults: Record<string, any> = {};
      resource.parameters.forEach((p) => {
        defaults[p.name] = resource.defaultProps[p.name] ?? p.default;
      });
      setCustomParams(defaults);
    }
  };

  // Drag start handler
  const handleDragStart = (e: React.DragEvent, resource: LibraryResource) => {
    let payload: EditorDragPayload | null = null;
    const mergedProps = { ...resource.defaultProps, ...customParams };

    if (resource.type === "shape" || resource.type === "motion_graphic") {
      payload = {
        type: "graphic",
        compositionId: (mergedProps as any).compositionId || (resource.type === "shape" ? "shape" : "hero_reveal"),
        name: resource.name,
        duration: resource.defaultDuration,
        props: mergedProps,
      };
    } else if (resource.type === "caption_preset") {
      payload = {
        type: "caption",
        stylePreset: (mergedProps as any).stylePreset || "tiktok_yellow",
        text: (mergedProps as any).text || resource.name,
      };
    } else if (resource.type === "sfx") {
      payload = {
        type: "audio",
        name: resource.name,
        sourceUrl: (mergedProps as any).sourceUrl || "/assets/audio/whoosh.mp3",
        duration: resource.defaultDuration,
        volume: (mergedProps as any).volume || 80,
        isBgm: false,
      };
    } else if (resource.type === "broll") {
      payload = {
        type: "broll",
        name: resource.name,
        sourceUrl: (mergedProps as any).sourceUrl || "",
        duration: resource.defaultDuration,
        fitMode: (mergedProps as any).fitMode || "cover",
      };
    } else if (resource.type === "effect") {
      payload = {
        type: "graphic",
        compositionId: "effect_overlay",
        name: resource.name,
        duration: resource.defaultDuration,
        props: {
          effectType: (mergedProps as any).effectType || resource.id.replace("fx-", ""),
          ...mergedProps,
        },
      };
    } else if (resource.type === "transition") {
      payload = {
        type: "transition",
        preset: (mergedProps as any).preset || "crossfade",
        name: resource.name,
        duration: resource.defaultDuration || 0.5,
      };
    }

    if (payload) {
      const serialized = serializeDragPayload(payload);
      e.dataTransfer.setData(EDITOR_DRAG_MIME, serialized);
      e.dataTransfer.setData("text/plain", serialized);
      e.dataTransfer.effectAllowed = "copy";
    }
  };

  // Direct 1-click apply handler
  const handleApplyResource = (resource: LibraryResource) => {
    setFeedbackMessage(null);

    // If it's a transition, check for adjacent video cuts
    let targetClipAId: string | undefined;
    let targetClipBId: string | undefined;

    if (resource.type === "transition") {
      const videoClips = project.tracks.videoTrack || [];
      if (videoClips.length < 2) {
        setFeedbackMessage({
          type: "error",
          text: "Transitions require at least 2 adjacent clips on the timeline.",
        });
        return;
      }

      // Find the cut closest to playhead
      let closestCutIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < videoClips.length - 1; i++) {
        const cutTime = videoClips[i].end;
        const dist = Math.abs(playheadTime - cutTime);
        if (dist < minDistance) {
          minDistance = dist;
          closestCutIndex = i;
        }
      }

      targetClipAId = videoClips[closestCutIndex].id;
      targetClipBId = videoClips[closestCutIndex + 1].id;
    }

    let targetCaptionId: string | undefined;
    const existingCaptions = project.tracks.textTrack || [];

    if (resource.type === "caption_preset") {
      if (selectedItem?.type === "caption") {
        targetCaptionId = selectedItem.id;
      }
    }

    const mergedProps = { ...resource.defaultProps, ...customParams };

    const result = createOperationFromResource(resource, {
      timestamp: playheadTime,
      duration: resource.defaultDuration,
      customProps: mergedProps,
      targetClipAId,
      targetClipBId,
      text: mergedProps.text,
      targetCaptionId,
      existingCaptions,
      applyToAllCaptions: !targetCaptionId,
    });

    if (!result.success || !result.operation) {
      setFeedbackMessage({
        type: "error",
        text: result.error || "Failed to apply resource.",
      });
      return;
    }

    // Dispatch through editor's canonical operation bus
    dispatchOperation(result.operation);

    if (resource.type === "transition" && (result.operation as any)?.id) {
      setSelectedItem({ type: "transition", id: (result.operation as any).id });
    }

    if (resource.type === "caption_preset" && existingCaptions.length > 0) {
      setFeedbackMessage({
        type: "success",
        text: targetCaptionId
          ? `Applied '${resource.name}' caption effect to selected text`
          : `Applied '${resource.name}' caption effect to text (${existingCaptions.length} captions)`,
      });
    } else {
      setFeedbackMessage({
        type: "success",
        text: `Added '${resource.name}' to timeline at ${playheadTime.toFixed(1)}s`,
      });
    }
    onApplied?.(resource.name);

    // Auto-clear message
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-200 select-none">
      {/* 1. Header & Search Bar */}
      <div className="p-3 border-b border-neutral-800/80 space-y-2.5 bg-black/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Shapes className="w-3.5 h-3.5 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Resource Library
            </h3>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
            {resources.length} items
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shapes, captions, SFX, transitions..."
            className="w-full bg-neutral-900/90 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-emerald-500/80 transition-colors"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 whitespace-nowrap transition-all cursor-pointer",
                  active
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 border border-neutral-800 hover:bg-neutral-900"
                )}
              >
                <Icon className="w-3 h-3" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filter & Sort Toolbar */}
        <div className="pt-2 border-t border-neutral-800/60 space-y-2">
          <div className="flex items-center justify-between gap-2">
            {/* Aspect Ratio Filter Pills (Shown for B-Roll Stock or All) */}
            {(selectedCategory === "B-Roll Stock" || selectedCategory === "All") ? (
              <div className="flex items-center gap-1 bg-neutral-900/90 p-0.5 rounded-lg border border-neutral-800">
                {ASPECT_RATIO_FILTERS.map((item) => {
                  const Icon = item.icon;
                  const active = selectedAspectRatio === item.id;
                  return (
                    <button
                      key={item.id}
                      data-testid={`filter-aspect-${item.id}`}
                      onClick={() => setSelectedAspectRatio(item.id)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer",
                        active
                          ? "bg-violet-600/30 text-violet-300 border border-violet-500/50 shadow-sm"
                          : "text-neutral-400 hover:text-white"
                      )}
                    >
                      {Icon && <Icon className="w-2.5 h-2.5" />}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-medium">
                <Tag className="w-3 h-3 text-neutral-500" />
                <span>{selectedCategory}</span>
              </div>
            )}

            {/* Sort Dropdown & Reset */}
            <div className="flex items-center gap-1.5 shrink-0">
              {(selectedAspectRatio !== "all" || selectedSubCategory !== "all" || sortBy !== "default") && (
                <button
                  type="button"
                  data-testid="reset-filters-btn"
                  onClick={() => {
                    setSelectedAspectRatio("all");
                    setSelectedSubCategory("all");
                    setSortBy("default");
                  }}
                  className="p-1 rounded text-neutral-400 hover:text-emerald-400 hover:bg-neutral-900 transition-colors cursor-pointer"
                  title="Reset filters"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}

              <select
                data-testid="resource-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort Resources"
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-[10px] text-neutral-300 focus:text-white focus:border-emerald-500/80 outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sub-Category Theme Pills (When in B-Roll Stock) */}
          {selectedCategory === "B-Roll Stock" && (
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-neutral-500 shrink-0 mr-0.5">
                Theme:
              </span>
              {BROLL_THEMES.map((theme) => {
                const active = selectedSubCategory === theme.id;
                return (
                  <button
                    key={theme.id}
                    data-testid={`filter-theme-${theme.id.toLowerCase()}`}
                    onClick={() => setSelectedSubCategory(theme.id)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-medium whitespace-nowrap transition-colors cursor-pointer",
                      active
                        ? "bg-neutral-200 text-neutral-900 font-bold shadow-sm"
                        : "bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 border border-neutral-800"
                    )}
                  >
                    {theme.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. Feedback Notification Banner */}
      {feedbackMessage && (
        <div
          className={cn(
            "mx-3 mt-2 px-3 py-2 rounded-lg border text-xs flex items-center gap-2 animate-in fade-in duration-200",
            feedbackMessage.type === "success"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
              : "bg-red-950/40 border-red-800 text-red-300"
          )}
        >
          {feedbackMessage.type === "success" ? (
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          )}
          <span className="text-[11px] truncate flex-1">{feedbackMessage.text}</span>
        </div>
      )}

      {/* 3. Resources Visual Grid (CapCut Style) */}
      <div className="flex-1 overflow-y-auto p-3">
        {resources.length === 0 ? (
          <div className="py-12 border border-dashed border-neutral-800 rounded-xl text-center p-6 text-neutral-500 space-y-1.5">
            <Shapes className="w-6 h-6 mx-auto text-neutral-600 mb-1" />
            <p className="text-xs font-semibold text-neutral-300">No resources found</p>
            <p className="text-[11px] text-neutral-500">
              No items match current filters. Try resetting aspect ratio, theme, or search query.
            </p>
            {(selectedAspectRatio !== "all" || selectedSubCategory !== "all" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedAspectRatio("all");
                  setSelectedSubCategory("all");
                  setSearchQuery("");
                }}
                className="mt-2 px-3 py-1 text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 border border-emerald-500/40 rounded-md bg-emerald-500/10 cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {resources.map((res) => {
              const isExpanded = expandedResourceId === res.id;
              const hasParams = res.parameters.length > 0;
              const isHovered = hoveredResourceId === res.id;

              return (
                <div
                  key={res.id}
                  data-testid={`library-resource-card-${res.id}`}
                  onMouseEnter={() => setHoveredResourceId(res.id)}
                  onMouseLeave={() => setHoveredResourceId(null)}
                  className={cn(
                    "group relative rounded-xl border bg-neutral-900/60 hover:bg-neutral-900/90 transition-all duration-200 overflow-hidden flex flex-col shadow-sm cursor-pointer",
                    isExpanded
                      ? "border-emerald-500/60 ring-1 ring-emerald-500/40 col-span-2"
                      : "border-neutral-800/80 hover:border-neutral-700"
                  )}
                >
                  {/* Visual Preview Box */}
                  <div
                    draggable={res.isSupported}
                    onDragStart={(e) => handleDragStart(e, res)}
                    className={cn(
                      "relative w-full overflow-hidden bg-neutral-950 flex items-center justify-center cursor-grab active:cursor-grabbing border-b border-neutral-800/60",
                      isExpanded ? "h-36" : "aspect-[16/10]"
                    )}
                    title="Drag onto Canvas or Timeline"
                  >
                    <ResourceVisualPreview
                      resource={res}
                      customProps={isExpanded ? customParams : undefined}
                      isHovered={isHovered}
                    />

                    {/* Floating Controls on Hover (Zero text labels on preview, pure visual playback) */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none flex flex-col justify-between p-1.5 z-10">
                      {/* Top Bar: Drag Grip + Customize Button */}
                      <div className="flex items-center justify-between pointer-events-auto">
                        <span
                          className="p-1 rounded bg-black/60 backdrop-blur-sm text-neutral-400 hover:text-white border border-white/10"
                          title="Drag onto Canvas or Timeline"
                        >
                          <GripVertical className="w-3 h-3 text-emerald-400" />
                        </span>

                        {hasParams && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCustomize(res);
                            }}
                            className={cn(
                              "p-1 rounded border backdrop-blur-sm transition-colors cursor-pointer",
                              isExpanded
                                ? "bg-emerald-500/30 border-emerald-500/60 text-emerald-300"
                                : "bg-black/60 border-white/10 text-neutral-300 hover:text-white"
                            )}
                            title="Customize Parameters"
                          >
                            <Sliders className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Bottom Bar: 1-Click Add / Apply Style Button */}
                      <div className="flex items-center justify-end pointer-events-auto">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyResource(res);
                          }}
                          className={cn(
                            "px-2 py-0.5 rounded-full text-white text-[10px] font-bold flex items-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer pointer-events-auto",
                            res.type === "caption_preset"
                              ? "bg-amber-600 hover:bg-amber-500 shadow-amber-950/80"
                              : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/80"
                          )}
                          title={
                            res.type === "caption_preset"
                              ? "Apply caption effect to text"
                              : "Insert at Playhead"
                          }
                        >
                          {res.type === "caption_preset" ? (
                            <>
                              <Sparkles className="w-3 h-3 stroke-[2.5]" />
                              <span>Apply Style</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3 stroke-[3]" />
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="p-2 flex items-center justify-between gap-1 min-w-0">
                    <span
                      className="text-[11px] font-semibold text-white tracking-tight truncate"
                      title={res.name}
                    >
                      {res.name}
                    </span>
                    <span className="font-mono text-[9px] text-neutral-400 shrink-0">
                      {res.defaultDuration}s
                    </span>
                  </div>

                  {/* Expandable Parameter Customizer (Spans full width when expanded) */}
                  {isExpanded && hasParams && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="p-3 border-t border-neutral-800/80 bg-neutral-950/90 space-y-2.5 animate-in fade-in duration-150"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          <Sliders className="w-3 h-3" />
                          Custom Parameters
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleCustomize(res)}
                          className="text-[9px] text-neutral-400 hover:text-white"
                        >
                          Close
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {res.parameters.map((param) => {
                          const val =
                            customParams[param.name] ??
                            res.defaultProps[param.name] ??
                            param.default;

                          if (param.type === "color") {
                            return (
                              <div key={param.name} className="flex flex-col gap-1">
                                <label className="text-[9px] text-neutral-400 font-medium">
                                  {param.label}
                                </label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="color"
                                    value={val}
                                    onChange={(e) =>
                                      handleParamChange(param.name, e.target.value)
                                    }
                                    className="w-6 h-6 rounded border border-neutral-700 bg-transparent cursor-pointer p-0"
                                  />
                                  <span className="text-[9px] font-mono text-neutral-300 uppercase">
                                    {val}
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          if (param.type === "number") {
                            return (
                              <div key={param.name} className="flex flex-col gap-1">
                                <label className="text-[9px] text-neutral-400 font-medium">
                                  {param.label}
                                </label>
                                <input
                                  type="number"
                                  value={val}
                                  min={param.min}
                                  max={param.max}
                                  step={param.step || 1}
                                  onChange={(e) =>
                                    handleParamChange(
                                      param.name,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[10px] text-white outline-none focus:border-emerald-500 font-mono"
                                />
                              </div>
                            );
                          }

                          if (param.type === "select" && param.options) {
                            return (
                              <div key={param.name} className="flex flex-col gap-1">
                                <label className="text-[9px] text-neutral-400 font-medium">
                                  {param.label}
                                </label>
                                <select
                                  value={val}
                                  onChange={(e) =>
                                    handleParamChange(param.name, e.target.value)
                                  }
                                  className="bg-neutral-950 border border-neutral-800 rounded px-1.5 py-1 text-[9px] text-white outline-none focus:border-emerald-500 font-mono"
                                >
                                  {param.options.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          }

                          return (
                            <div key={param.name} className="flex flex-col gap-1 col-span-2">
                              <label className="text-[9px] text-neutral-400 font-medium">
                                {param.label}
                              </label>
                              <input
                                type="text"
                                value={val}
                                onChange={(e) =>
                                  handleParamChange(param.name, e.target.value)
                                }
                                className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[10px] text-white outline-none focus:border-emerald-500"
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-1 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleApplyResource(res)}
                          className={cn(
                            "px-3 py-1 rounded text-white text-[10px] font-bold flex items-center gap-1 shadow transition-all active:scale-95 cursor-pointer",
                            res.type === "caption_preset"
                              ? "bg-amber-600 hover:bg-amber-500 shadow-amber-950/80"
                              : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/80"
                          )}
                          title={
                            res.type === "caption_preset"
                              ? "Apply caption effect to text"
                              : "Insert at Playhead"
                          }
                        >
                          {res.type === "caption_preset" ? (
                            <>
                              <Sparkles className="w-3 h-3 stroke-[2.5]" />
                              <span>Apply Effect to Text</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3 stroke-[2.5]" />
                              <span>Insert with Custom Settings</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
