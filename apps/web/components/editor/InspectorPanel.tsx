"use client";

import React, { useState } from "react";
import {
  Sliders,
  Volume2,
  Gauge,
  ZoomIn,
  Type,
  Film,
  Trash2,
  MoveVertical,
  Diamond,
  BrainCircuit,
  Check,
  Layers,
  Sparkles,
  Copy,
  RotateCcw,
  Palette,
  Grid,
} from "lucide-react";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { useShallow } from "zustand/react/shallow";
import { CaptionPreset, TransitionPreset } from "@/lib/timeline-types";
import { cn } from "@/lib/utils";
import { getExactKeyframe, evaluatePropertyAtTime, hasAnyKeyframes } from "@/lib/keyframes";
import { isEffectGraphic, EFFECT_PRESETS, EFFECT_CATEGORIES } from "@/lib/editor/video-effects";
import { CAPTION_TEMPLATES } from "@/lib/editor/caption-templates";
import { RESOURCE_CATALOG } from "@/lib/library/resource-registry";

function KeyframeToggle({ clip, trackType, property, currentValue }: { clip: any, trackType: any, property: string, currentValue: any }) {
  const { playheadTime, setKeyframe, removeKeyframe } = useTimelineStore();
  const localTime = playheadTime - clip.start;
  const isOutOfBounds = localTime < 0 || localTime > (clip.end - clip.start);
  
  const existingKf = getExactKeyframe(clip.animation, property, localTime);
  const isActive = !!existingKf; // State B
  const isAnimated = hasAnyKeyframes(clip.animation, property); // State C

  if (isOutOfBounds) return <div className="w-5" />; // Spacer

  return (
    <button
      onClick={() => {
        if (isActive) removeKeyframe(trackType, clip.id, property, localTime);
        else setKeyframe(trackType, clip.id, property, localTime, currentValue);
      }}
      className={cn(
        "p-0.5 flex items-center justify-center rounded hover:bg-neutral-900 transition-colors",
        isActive ? "text-white" : isAnimated ? "text-white border border-white/50" : "text-neutral-500 hover:text-neutral-300"
      )}
      title={isActive ? "Remove Keyframe" : "Add Keyframe at Playhead"}
    >
      <Diamond className={cn("w-3.5 h-3.5", isActive && "fill-white")} />
    </button>
  );
}

function FeedbackUI({ type, original, current }: { type: string, original: any, current: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch("http://localhost:8000/api/v1/jobs/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: "educational_explainer", // Hardcoded for demo
          original: original,
          correction: current,
          reason: reason
        })
      });
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setReason("");
      }, 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="w-full py-2 px-3 mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
        <Check className="w-4 h-4" /> Feedback Learned!
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all mt-4"
      >
        <BrainCircuit className="w-3.5 h-3.5" />
        <span>Train AI (Submit Correction)</span>
      </button>
    );
  }

  return (
    <div className="w-full mt-4 p-3 bg-neutral-900 border border-indigo-500/30 rounded-lg space-y-2 text-xs">
      <div className="text-indigo-300 font-bold flex items-center gap-1.5 mb-2">
        <BrainCircuit className="w-3.5 h-3.5" /> 
        Explain Correction
      </div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Why did you change this?"
        className="w-full bg-black/50 border border-neutral-800 rounded p-2 text-white outline-none focus:border-indigo-500 resize-none h-16"
      />
      <div className="flex gap-2">
        <button
          onClick={() => setIsOpen(false)}
          className="flex-1 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!reason || submitting}
          className="flex-1 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50"
        >
          {submitting ? "Sending..." : "Submit"}
        </button>
      </div>
    </div>
  );
}

function TransformControls({ clip, trackType, updateFn }: { clip: any, trackType: "video"|"broll"|"caption"|"graphic", updateFn: Function }) {
  const { playheadTime } = useTimelineStore();
  const commitHistory = () => {
    useTimelineStore.getState().commitHistory();
  };
  
  const handleScrub = (property: string, value: any) => {
    const localTime = playheadTime - clip.start;
    if (localTime >= 0 && localTime <= (clip.end - clip.start) && hasAnyKeyframes(clip.animation, property)) {
      useTimelineStore.getState().setKeyframe(trackType, clip.id, property, localTime, value, false);
    } else {
      updateFn(clip.id, { [property]: value }, false);
    }
  };

  const defaultY = trackType === "caption" ? 75 : 50;
  const currentPosition = evaluatePropertyAtTime(clip.animation, "position", playheadTime - clip.start, clip.position ?? {x: 50, y: defaultY});
  const currentScale = evaluatePropertyAtTime(clip.animation, "scale", playheadTime - clip.start, clip.scale ?? 1.0);
  const currentRotation = evaluatePropertyAtTime(clip.animation, "rotation", playheadTime - clip.start, clip.rotation ?? 0);

  const setPositionPreset = (x: number, y: number) => {
    handleScrub("position", { x, y });
    commitHistory();
  };

  const handleResetTransform = () => {
    handleScrub("position", { x: 50, y: defaultY });
    handleScrub("scale", 1.0);
    handleScrub("rotation", 0);
    commitHistory();
  };

  return (
    <div className="space-y-4 pt-4 border-t border-neutral-900">
      <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2 flex justify-between items-center">
        <span>Transform & Layout</span>
        <button
          onClick={handleResetTransform}
          title="Reset Transform (Position, Scale, Rotation)"
          className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          <span>Reset</span>
        </button>
      </h4>

      {/* Quick Alignment 9-Grid & Snapping */}
      <div>
        <div className="flex justify-between items-center text-neutral-500 mb-1.5">
          <span className="flex items-center gap-1 text-[11px] font-medium">
            <Grid className="w-3 h-3 text-neutral-400" />
            Quick Alignment
          </span>
          <span className="text-[9px] text-neutral-400 font-mono">9-Point Snapping</span>
        </div>
        <div className="flex items-center gap-2.5">
          {/* 3x3 Snapping Grid */}
          <div className="grid grid-cols-3 gap-1 bg-neutral-900 p-1.5 rounded-lg border border-neutral-800 shrink-0">
            {[
              { label: "TL", x: 20, y: 20 },
              { label: "TC", x: 50, y: 20 },
              { label: "TR", x: 80, y: 20 },
              { label: "ML", x: 20, y: 50 },
              { label: "MC", x: 50, y: 50 },
              { label: "MR", x: 80, y: 50 },
              { label: "BL", x: 20, y: 80 },
              { label: "BC", x: 50, y: 80 },
              { label: "BR", x: 80, y: 80 },
            ].map((pt) => {
              const isSelected =
                Math.abs(currentPosition.x - pt.x) < 8 &&
                Math.abs(currentPosition.y - pt.y) < 8;
              return (
                <button
                  key={pt.label}
                  type="button"
                  title={`Align to ${pt.label} (X:${pt.x}%, Y:${pt.y}%)`}
                  onClick={() => setPositionPreset(pt.x, pt.y)}
                  className={cn(
                    "w-4 h-4 rounded-sm border transition-colors cursor-pointer",
                    isSelected
                      ? "bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                      : "bg-neutral-800 border-neutral-700/60 hover:bg-neutral-700 hover:border-neutral-500"
                  )}
                />
              );
            })}
          </div>
          {/* Preset Buttons */}
          <div className="flex flex-col gap-1 flex-1">
            <button
              type="button"
              onClick={() => setPositionPreset(50, 50)}
              className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] text-neutral-300 hover:text-white text-left font-medium transition-colors cursor-pointer flex items-center justify-between"
            >
              <span>Center</span>
              <span className="font-mono text-[9px] text-neutral-400">50, 50</span>
            </button>
            <button
              type="button"
              onClick={() => setPositionPreset(50, 80)}
              className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] text-neutral-300 hover:text-white text-left font-medium transition-colors cursor-pointer flex items-center justify-between"
            >
              <span>Lower Third</span>
              <span className="font-mono text-[9px] text-neutral-400">50, 80</span>
            </button>
            <button
              type="button"
              onClick={() => setPositionPreset(50, 18)}
              className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] text-neutral-300 hover:text-white text-left font-medium transition-colors cursor-pointer flex items-center justify-between"
            >
              <span>Top Banner</span>
              <span className="font-mono text-[9px] text-neutral-400">50, 18</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Position (Vector) */}
      <div className="space-y-2">
        <div className="flex justify-between text-neutral-500 mb-1">
          <span>Position</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-white text-[10px]">
              X:{Math.round(currentPosition.x)}% Y:{Math.round(currentPosition.y)}%
            </span>
            <KeyframeToggle clip={clip} trackType={trackType} property="position" currentValue={currentPosition} />
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="range"
            min="0"
            max="100"
            value={currentPosition.x}
            onChange={(e) => handleScrub("position", { ...currentPosition, x: parseFloat(e.target.value) })}
            onPointerUp={commitHistory}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
          />
          <input
            type="range"
            min="0"
            max="100"
            value={currentPosition.y}
            onChange={(e) => handleScrub("position", { ...currentPosition, y: parseFloat(e.target.value) })}
            onPointerUp={commitHistory}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>
      </div>

      {/* Scale */}
      <div>
        <div className="flex justify-between text-neutral-500 mb-1">
          <span>Scale</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-white">
              {currentScale.toFixed(2)}x
            </span>
            <KeyframeToggle clip={clip} trackType={trackType} property="scale" currentValue={currentScale} />
          </div>
        </div>
        <input
          type="range"
          min="0.1"
          max="5.0"
          step="0.1"
          value={currentScale}
          onChange={(e) => handleScrub("scale", parseFloat(e.target.value))}
          onPointerUp={commitHistory}
          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
        />
      </div>

      {/* Rotation */}
      <div>
        <div className="flex justify-between text-neutral-500 mb-1">
          <span>Rotation</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-white">
              {Math.round(currentRotation)}°
            </span>
            <KeyframeToggle clip={clip} trackType={trackType} property="rotation" currentValue={currentRotation} />
          </div>
        </div>
        <input
          type="range"
          min="-180"
          max="180"
          value={currentRotation}
          onChange={(e) => handleScrub("rotation", parseFloat(e.target.value))}
          onPointerUp={commitHistory}
          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
        />
      </div>
    </div>
  );
}

export function InspectorPanel() {
  const {
    project,
    selectedItem,
    updateVideoClip,
    updateCaption,
    updateBRollClip,
    updateGraphicElement,
    deleteClip,
    updateTransition,
    deleteTransition,
    setSelectedItem,
    playheadTime,
    setKeyframe,
  } = useTimelineStore(useShallow((state) => ({
    project: state.project,
    selectedItem: state.selectedItem,
    updateVideoClip: state.updateVideoClip,
    updateCaption: state.updateCaption,
    updateBRollClip: state.updateBRollClip,
    updateGraphicElement: state.updateGraphicElement,
    deleteClip: state.deleteClip,
    updateTransition: state.updateTransition,
    deleteTransition: state.deleteTransition,
    setSelectedItem: state.setSelectedItem,
    playheadTime: state.playheadTime,
    setKeyframe: state.setKeyframe,
  })));

  // Helper to handle input scrubbing with auto-keyframing
  const handleScrub = (trackType: any, clip: any, property: string, value: number, updateFn: Function) => {
    const localTime = playheadTime - clip.start;
    // If the playhead is over the clip and it has ANY keyframes for this property, auto-insert/update keyframe
    if (localTime >= 0 && localTime <= (clip.end - clip.start) && hasAnyKeyframes(clip.animation, property)) {
      setKeyframe(trackType, clip.id, property, localTime, value, false);
    } else {
      updateFn(clip.id, { [property]: value }, false);
    }
  };

  const commitHistory = () => {
    useTimelineStore.getState().commitHistory();
  };

  if (!selectedItem) {
    return (
      <aside className="w-60 border-l border-neutral-900 bg-neutral-950 p-4 hidden lg:flex flex-col select-none text-slate-300">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" />
          <span>Project Info</span>
        </h3>
        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between p-2 rounded bg-neutral-900/60 border border-neutral-900">
            <span className="text-neutral-500">Aspect Ratio</span>
            <span className="font-semibold text-white">{project.aspectRatio}</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-neutral-900/60 border border-neutral-900">
            <span className="text-neutral-500">Duration</span>
            <span className="font-mono text-white">{project.duration.toFixed(1)}s</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-neutral-900/60 border border-neutral-900">
            <span className="text-neutral-500">Total Video Clips</span>
            <span className="font-semibold text-white">{project.tracks.videoTrack.length}</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-neutral-900/60 border border-neutral-900">
            <span className="text-neutral-500">Captions</span>
            <span className="font-semibold text-yellow-400">{project.tracks.textTrack.length}</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-neutral-900/60 border border-neutral-900">
            <span className="text-neutral-500">B-Roll Overlays</span>
            <span className="font-semibold text-neutral-400">{project.tracks.brollTrack.length}</span>
          </div>
        </div>
        <p className="text-[11px] text-neutral-500 mt-6 text-center">
          Click any clip on the timeline to inspect and tweak its settings.
        </p>
      </aside>
    );
  }

  // Selected: Video Clip
  if (selectedItem.type === "video") {
    const clip = project.tracks.videoTrack.find((c) => c.id === selectedItem.id);
    if (!clip) return null;

    return (
      <aside className="w-64 border-l border-neutral-900 bg-neutral-950 p-4 flex flex-col select-none text-slate-300">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-900 mb-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            <span>Clip Settings</span>
          </h3>
          <button
            onClick={() => setSelectedItem(null)}
            className="text-[10px] text-neutral-500 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 text-xs flex-1 overflow-y-auto">
          {/* Speed Slider */}
          <div>
            <div className="flex justify-between text-neutral-500 mb-1">
              <span className="flex items-center gap-1">
                <Gauge className="w-3 h-3" /> Speed
              </span>
              <span className="font-mono text-white">{clip.speed || 1}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={clip.speed || 1}
              onChange={(e) => updateVideoClip(clip.id, { speed: parseFloat(e.target.value) }, false)}
              onPointerUp={commitHistory}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          {/* Volume Slider (Keyframable) */}
          <div>
            <div className="flex justify-between text-neutral-500 mb-1">
              <span className="flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> Volume
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-white">
                  {Math.round(evaluatePropertyAtTime(clip.animation, "volume", playheadTime - clip.start, clip.volume ?? 100))}%
                </span>
                <KeyframeToggle clip={clip} trackType="video" property="volume" currentValue={evaluatePropertyAtTime(clip.animation, "volume", playheadTime - clip.start, clip.volume ?? 100)} />
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={evaluatePropertyAtTime(clip.animation, "volume", playheadTime - clip.start, clip.volume ?? 100)}
              onChange={(e) => handleScrub("video", clip, "volume", parseInt(e.target.value), updateVideoClip)}
              onPointerUp={commitHistory}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          {/* Zoom Factor (Keyframable) */}
          <div>
            <div className="flex justify-between text-neutral-500 mb-1">
              <span className="flex items-center gap-1">
                <ZoomIn className="w-3 h-3" /> Face Zoom
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-white">
                  {evaluatePropertyAtTime(clip.animation, "zoomFactor", playheadTime - clip.start, clip.zoomFactor ?? 1.0).toFixed(2)}x
                </span>
                <KeyframeToggle clip={clip} trackType="video" property="zoomFactor" currentValue={evaluatePropertyAtTime(clip.animation, "zoomFactor", playheadTime - clip.start, clip.zoomFactor ?? 1.0)} />
              </div>
            </div>
            <input
              type="range"
              min="1.0"
              max="2.0"
              step="0.05"
              value={evaluatePropertyAtTime(clip.animation, "zoomFactor", playheadTime - clip.start, clip.zoomFactor ?? 1.0)}
              onChange={(e) => handleScrub("video", clip, "zoomFactor", parseFloat(e.target.value), updateVideoClip)}
              onPointerUp={commitHistory}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          {/* Transition */}
          <div>
            <label className="block text-neutral-500 mb-1">Transition In</label>
            <select
              value={clip.transitionIn || ""}
              onChange={(e) =>
                updateVideoClip(clip.id, {
                  transitionIn: (e.target.value as "fade" | "dissolve" | "slide_left" | "zoom_in") || undefined,
                })
              }
              className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-1.5 text-xs text-white outline-none focus:border-white"
            >
              <option value="">None (Cut)</option>
              <option value="fade">Fade In</option>
              <option value="dissolve">Dissolve</option>
              <option value="slide_left">Slide Left</option>
              <option value="zoom_in">Zoom Pop</option>
            </select>
          </div>
          
          <TransformControls clip={clip} trackType="video" updateFn={updateVideoClip} />
        </div>

        {/* Delete */}
        <button
          onClick={() => deleteClip("video", clip.id)}
          className="w-full py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all mt-4"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Clip</span>
        </button>
      </aside>
    );
  }

  // Selected: Caption Block
  if (selectedItem.type === "caption") {
    const caption =
      (project.tracks.textTrack || []).find((t) => t.id === selectedItem.id) ||
      ((project.tracks as any).captionTrack || []).find((t: any) => t.id === selectedItem.id);
    if (!caption) return null;

    return (
      <aside className="w-64 border-l border-neutral-900 bg-neutral-950 p-4 flex flex-col select-none text-slate-300">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-900 mb-4">
          <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5" />
            <span>Caption Settings</span>
          </h3>
          <button
            onClick={() => setSelectedItem(null)}
            className="text-[10px] text-neutral-500 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 text-xs flex-1 overflow-y-auto">
          {/* Edit Text */}
          <div>
            <label className="block text-neutral-500 mb-1">Subtitle Text</label>
            <textarea
              value={caption.text}
              onChange={(e) => updateCaption(caption.id, { text: e.target.value })}
              rows={2}
              className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-white resize-none"
            />
          </div>

          {/* Preset Selector */}
          <div>
            <label className="block text-neutral-500 mb-1">Style Preset</label>
            <select
              value={caption.stylePreset}
              onChange={(e) =>
                updateCaption(caption.id, {
                  stylePreset: e.target.value as CaptionPreset,
                })
              }
              className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-1.5 text-xs text-white outline-none focus:border-white"
            >
              {CAPTION_TEMPLATES.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name}
                </option>
              ))}
            </select>
          </div>
          
          <TransformControls clip={caption} trackType="caption" updateFn={updateCaption} />
        </div>

        <FeedbackUI 
          type="caption" 
          original={{ preset: "unknown", text: "unknown" }} 
          current={{ preset: caption.stylePreset, text: caption.text }} 
        />

        <button
          onClick={() => deleteClip("caption", caption.id)}
          className="w-full py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all mt-4"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Caption</span>
        </button>
      </aside>
    );
  }

  // Selected: B-Roll Clip
  if (selectedItem.type === "broll") {
    const broll = project.tracks.brollTrack.find((b) => b.id === selectedItem.id);
    if (!broll) return null;

    return (
      <aside className="w-64 border-l border-neutral-900 bg-neutral-950 p-4 flex flex-col select-none text-slate-300">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-900 mb-4">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5" />
            <span>B-Roll Overlay</span>
          </h3>
          <button
            onClick={() => setSelectedItem(null)}
            className="text-[10px] text-neutral-500 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 text-xs flex-1 overflow-y-auto">
          {/* Opacity Slider (Keyframable) */}
          <div>
            <div className="flex justify-between text-neutral-500 mb-1">
              <span className="flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> Opacity
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-white">
                  {Math.round(evaluatePropertyAtTime(broll.animation, "opacity", playheadTime - broll.start, broll.opacity ?? 100))}%
                </span>
                <KeyframeToggle clip={broll} trackType="broll" property="opacity" currentValue={evaluatePropertyAtTime(broll.animation, "opacity", playheadTime - broll.start, broll.opacity ?? 100)} />
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={evaluatePropertyAtTime(broll.animation, "opacity", playheadTime - broll.start, broll.opacity ?? 100)}
              onChange={(e) => handleScrub("broll", broll, "opacity", parseInt(e.target.value), updateBRollClip)}
              onPointerUp={commitHistory}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          {/* Fit Mode */}
          <div>
            <label className="block text-neutral-500 mb-1">Fit Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => updateBRollClip(broll.id, { fitMode: "cover" })}
                className={cn(
                  "flex-1 py-1 rounded text-xs font-semibold border",
                  broll.fitMode === "cover"
                    ? "bg-white text-black border-white"
                    : "bg-slate-900 text-neutral-500 border-neutral-900"
                )}
              >
                Cover
              </button>
              <button
                onClick={() => updateBRollClip(broll.id, { fitMode: "contain" })}
                className={cn(
                  "flex-1 py-1 rounded text-xs font-semibold border",
                  broll.fitMode === "contain"
                    ? "bg-white text-white border-white"
                    : "bg-slate-900 text-neutral-500 border-neutral-900"
                )}
              >
                Contain
              </button>
            </div>
          </div>
          
          <TransformControls clip={broll} trackType="broll" updateFn={updateBRollClip} />
        </div>
        
        <FeedbackUI 
          type="broll" 
          original={{ fitMode: "unknown" }} 
          current={{ fitMode: broll.fitMode }} 
        />

        <button
          onClick={() => deleteClip("broll", broll.id)}
          className="w-full py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all mt-4"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Overlay</span>
        </button>
      </aside>
    );
  }

  // Selected: Graphic Element (Motion Graphic or Visual Video Effect)
  if (selectedItem.type === "graphic") {
    const graphic = (project.tracks.graphicsTrack || []).find((g) => g.id === selectedItem.id);
    if (!graphic) return null;

    const isEffect = isEffectGraphic(graphic);

    if (isEffect) {
      const currentEffectType = (
        graphic.props?.effectType ||
        (graphic.compositionId || "").replace(/^fx[-_]/, "") ||
        "rgb_glitch"
      ).toLowerCase();
      const currentIntensity = typeof graphic.props?.intensity === "number" ? graphic.props.intensity : 80;
      const currentOpacity = graphic.opacity ?? 100;
      const activeDef = EFFECT_PRESETS.find((p) => p.id === currentEffectType);

      return (
        <aside className="w-64 border-l border-neutral-900 bg-neutral-950 p-4 flex flex-col select-none text-slate-300">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-900 mb-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Visual Video Effect</span>
            </h3>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-[10px] text-neutral-500 hover:text-white cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="space-y-4 text-xs flex-1 overflow-y-auto">
            {/* Effect Name */}
            <div>
              <label className="block text-neutral-500 mb-1 font-medium">Effect Name</label>
              <input
                type="text"
                value={graphic.name}
                onChange={(e) => updateGraphicElement(graphic.id, { name: e.target.value })}
                className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-400"
              />
            </div>

            {/* Effect Preset Dropdown (Categorized) */}
            <div>
              <label className="block text-neutral-500 mb-1 font-medium">Effect Preset (25 Effects)</label>
              <select
                value={currentEffectType}
                onChange={(e) => {
                  const newType = e.target.value;
                  const newPreset = EFFECT_PRESETS.find((p) => p.id === newType);
                  updateGraphicElement(graphic.id, {
                    name: newPreset?.label || graphic.name,
                    props: {
                      ...graphic.props,
                      effectType: newType,
                    },
                  });
                }}
                className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-emerald-300 outline-none focus:border-emerald-400 cursor-pointer"
              >
                {EFFECT_CATEGORIES.map((cat) => (
                  <optgroup key={cat} label={cat} className="bg-neutral-900 text-neutral-300">
                    {EFFECT_PRESETS.filter((p) => p.category === cat).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {activeDef && (
                <p className="mt-1 text-[10px] text-neutral-400 leading-tight">
                  {activeDef.description}
                </p>
              )}
            </div>

            {/* Filter Intensity Slider */}
            <div>
              <div className="flex justify-between text-neutral-500 mb-1">
                <span className="font-medium">Filter Intensity</span>
                <span className="text-emerald-400 font-mono text-[11px] font-bold">
                  {currentIntensity}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={currentIntensity}
                onChange={(e) =>
                  updateGraphicElement(graphic.id, {
                    props: { ...graphic.props, intensity: parseInt(e.target.value) },
                  })
                }
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            {/* Layer Opacity Slider */}
            <div>
              <div className="flex justify-between text-neutral-500 mb-1">
                <span className="font-medium">Layer Opacity</span>
                <span className="text-white font-mono text-[11px]">{currentOpacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={currentOpacity}
                onChange={(e) =>
                  updateGraphicElement(graphic.id, {
                    opacity: parseInt(e.target.value),
                  })
                }
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            {/* Parameter Controls for Specific Presets */}
            {currentEffectType.includes("vignette") && (
              <div>
                <div className="flex justify-between text-neutral-500 mb-1">
                  <span className="font-medium">Feather Radius</span>
                  <span className="text-white font-mono text-[11px]">
                    {graphic.props?.feather ?? 60}%
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="90"
                  value={graphic.props?.feather ?? 60}
                  onChange={(e) =>
                    updateGraphicElement(graphic.id, {
                      props: { ...graphic.props, feather: parseInt(e.target.value) },
                    })
                  }
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>
            )}

            {(currentEffectType.includes("golden") || currentEffectType.includes("sunset")) && (
              <div>
                <div className="flex justify-between text-neutral-500 mb-1">
                  <span className="font-medium">Golden Warmth</span>
                  <span className="text-amber-400 font-mono text-[11px]">
                    {graphic.props?.warmth ?? 80}%
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={graphic.props?.warmth ?? 80}
                  onChange={(e) =>
                    updateGraphicElement(graphic.id, {
                      props: { ...graphic.props, warmth: parseInt(e.target.value) },
                    })
                  }
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>
            )}

            {(currentEffectType.includes("flare") || currentEffectType.includes("anamorphic")) && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Flare Color Tint</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={graphic.props?.flareColor || "#38bdf8"}
                    onChange={(e) =>
                      updateGraphicElement(graphic.id, {
                        props: { ...graphic.props, flareColor: e.target.value },
                      })
                    }
                    className="w-8 h-8 rounded border border-neutral-700 bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-xs text-neutral-400">
                    {graphic.props?.flareColor || "#38bdf8"}
                  </span>
                </div>
              </div>
            )}

            {(currentEffectType.includes("flash") || currentEffectType.includes("burst")) && (
              <div>
                <div className="flex justify-between text-neutral-500 mb-1">
                  <span className="font-medium">Decay Speed</span>
                  <span className="text-white font-mono text-[11px]">
                    {(graphic.props?.decaySpeed ?? 2).toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.5"
                  value={graphic.props?.decaySpeed ?? 2}
                  onChange={(e) =>
                    updateGraphicElement(graphic.id, {
                      props: { ...graphic.props, decaySpeed: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>
            )}

            {/* Timeline Placement */}
            <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80 space-y-1 text-[11px]">
              <div className="text-neutral-500 font-medium">Timeline Placement:</div>
              <div className="flex justify-between text-neutral-300 font-mono">
                <span>Start: {graphic.start.toFixed(2)}s</span>
                <span>End: {graphic.end.toFixed(2)}s</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">
                Duration: {(graphic.end - graphic.start).toFixed(2)}s (Directly affects video)
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              deleteClip("graphic", graphic.id);
              setSelectedItem(null);
            }}
            className="w-full py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all mt-4 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Effect</span>
          </button>
        </aside>
      );
    }

    const resourceDef = RESOURCE_CATALOG.find(
      (r) =>
        r.id === graphic.props?.resourceId ||
        r.id === graphic.id ||
        r.defaultProps?.compositionId === graphic.compositionId ||
        r.id.replace(/^mg-/, "") === graphic.compositionId?.replace(/_/g, "-")
    );

    const gProps = graphic.props || {};

    const updateProp = (key: string, value: any) => {
      updateGraphicElement(graphic.id, {
        props: {
          ...gProps,
          [key]: value,
        },
      });
    };

    const handledKeys = new Set([
      "channelName", "name", "author", "headline", "title", "supporting", "role", "label",
      "handle", "platform", "actionText", "subCount", "buttonText", "buttonColor",
      "quote", "review", "text", "beforeLabel", "afterLabel", "beforeText", "afterText",
      "seconds", "progress", "rating", "from", "to", "startValue", "endValue", "prefix", "suffix",
      "value", "change", "delta", "item1", "item2", "item3", "items", "accentColor",
      "badgeText", "badge", "dataPoint1", "val1", "dataPoint2", "val2", "dataPoint3", "val3",
      "bar1Label", "bar1Val", "bar2Label", "bar2Val", "bar3Label", "bar3Val", "bar4Label", "bar4Val",
      "colorTheme", "color", "resourceId", "compositionId", "personality", "fillColor", "strokeColor",
      "strokeWidth", "shapeType", "command", "code", "output", "windowTitle", "sender",
      "message1", "message2", "question", "answer", "step1", "step2", "step3", "step4",
      "appName", "fileName", "fileSize", "fileType", "status", "icon", "concept", "emoji",
      "likes", "likesCount", "likeCount", "direction", "cornerRadius", "radius", "lineLength",
      "lineStyle", "tailPosition",
    ]);

    return (
      <aside className="w-64 border-l border-neutral-900 bg-neutral-950 p-4 flex flex-col select-none text-slate-300">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-900 mb-4">
          <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Motion Graphic</span>
          </h3>
          <button
            onClick={() => setSelectedItem(null)}
            className="text-[10px] text-neutral-500 hover:text-white cursor-pointer"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 text-xs flex-1 overflow-y-auto pr-0.5">
          {/* Graphic Element Title & Composition */}
          <div>
            <label className="block text-neutral-500 mb-1 font-medium">Element Name</label>
            <input
              type="text"
              value={graphic.name}
              onChange={(e) => updateGraphicElement(graphic.id, { name: e.target.value })}
              className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="block text-neutral-500 mb-1 font-medium">Template Type</label>
            <div className="p-2 rounded-lg bg-neutral-900/90 border border-neutral-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-yellow-400 font-bold truncate">
                {resourceDef?.name || graphic.compositionId}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 shrink-0">
                Customizable
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* CUSTOMIZABLE TEMPLATE PROPERTIES SECTION                  */}
          {/* ========================================================= */}
          <div className="border-t border-neutral-800/80 pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                Template Content
              </span>
              <span className="text-[9px] text-emerald-400 font-mono">Live On Video</span>
            </div>

            {/* 1. Primary Text / Name / Channel / Author */}
            {gProps.channelName !== undefined && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Channel Name</label>
                <input
                  type="text"
                  value={gProps.channelName}
                  onChange={(e) => updateProp("channelName", e.target.value)}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400"
                />
              </div>
            )}

            {gProps.name !== undefined && gProps.channelName === undefined && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Speaker / Host Name</label>
                <input
                  type="text"
                  value={gProps.name}
                  onChange={(e) => updateProp("name", e.target.value)}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400"
                />
              </div>
            )}

            {gProps.author !== undefined && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Author / Reviewer Name</label>
                <input
                  type="text"
                  value={gProps.author}
                  onChange={(e) => updateProp("author", e.target.value)}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400"
                />
              </div>
            )}

            {/* 2. Headline / Title */}
            {gProps.headline !== undefined && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Main Headline</label>
                <input
                  type="text"
                  value={gProps.headline}
                  onChange={(e) => updateProp("headline", e.target.value)}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400"
                />
              </div>
            )}

            {gProps.title !== undefined && gProps.step1 === undefined && gProps.appName === undefined && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Title / Subtitle</label>
                <input
                  type="text"
                  value={gProps.title}
                  onChange={(e) => updateProp("title", e.target.value)}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400 font-bold"
                />
              </div>
            )}

            {/* Surge Badge / Header Tag */}
            {(gProps.badgeText !== undefined || gProps.badge !== undefined || graphic.compositionId === "chart-reveal" || graphic.compositionId === "rising-graph") && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Surge Badge Text</label>
                <input
                  type="text"
                  value={gProps.badgeText ?? gProps.badge ?? "SURGE +165%"}
                  onChange={(e) => {
                    updateProp("badgeText", e.target.value);
                    if (gProps.badge !== undefined) updateProp("badge", e.target.value);
                  }}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-cyan-300 outline-none focus:border-cyan-400 font-mono font-bold"
                />
              </div>
            )}

            {/* Multi-Stage Milestone Cards (Stage 1, Stage 2, Stage 3) */}
            {(gProps.dataPoint1 !== undefined || graphic.compositionId === "chart-reveal" || graphic.compositionId === "rising-graph") && (
              <div className="space-y-2 border border-neutral-800/80 rounded-xl p-2.5 bg-neutral-900/40">
                <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Growth Milestones & Multipliers
                </span>
                
                {/* Stage 1 */}
                <div className="grid grid-cols-3 gap-1.5 items-center">
                  <div className="col-span-2">
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Stage 1 Label</label>
                    <input
                      type="text"
                      value={gProps.dataPoint1 ?? "Stage 1: Baseline"}
                      onChange={(e) => updateProp("dataPoint1", e.target.value)}
                      className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-white outline-none focus:border-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Multiplier</label>
                    <input
                      type="text"
                      value={gProps.val1 ?? "1.0x"}
                      onChange={(e) => updateProp("val1", e.target.value)}
                      className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-white font-mono outline-none focus:border-yellow-400 font-bold"
                    />
                  </div>
                </div>

                {/* Stage 2 */}
                <div className="grid grid-cols-3 gap-1.5 items-center">
                  <div className="col-span-2">
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Stage 2 Label</label>
                    <input
                      type="text"
                      value={gProps.dataPoint2 ?? "Stage 2: +85%"}
                      onChange={(e) => updateProp("dataPoint2", e.target.value)}
                      className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-white outline-none focus:border-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Multiplier</label>
                    <input
                      type="text"
                      value={gProps.val2 ?? "1.85x"}
                      onChange={(e) => updateProp("val2", e.target.value)}
                      className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-indigo-300 font-mono outline-none focus:border-yellow-400 font-bold"
                    />
                  </div>
                </div>

                {/* Stage 3 (Peak Surge) */}
                <div className="grid grid-cols-3 gap-1.5 items-center">
                  <div className="col-span-2">
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Stage 3 (Peak) Label</label>
                    <input
                      type="text"
                      value={gProps.dataPoint3 ?? "Stage 3: +165% Surge"}
                      onChange={(e) => updateProp("dataPoint3", e.target.value)}
                      className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-white outline-none focus:border-yellow-400 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Peak Value</label>
                    <input
                      type="text"
                      value={gProps.val3 ?? "2.65x 🔥"}
                      onChange={(e) => updateProp("val3", e.target.value)}
                      className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-cyan-300 font-mono outline-none focus:border-cyan-400 font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Equalizer Bars */}
            {(gProps.bar1Val !== undefined || graphic.compositionId === "chart-reveal" || graphic.compositionId === "rising-graph") && (
              <div className="space-y-2 border border-neutral-800/80 rounded-xl p-2.5 bg-neutral-900/40">
                <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Chart Equalizer Bars
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { labelKey: "bar1Label", valKey: "bar1Val", defL: "Q1", defV: "+35%" },
                    { labelKey: "bar2Label", valKey: "bar2Val", defL: "Q2", defV: "+65%" },
                    { labelKey: "bar3Label", valKey: "bar3Val", defL: "Q3", defV: "+110%" },
                    { labelKey: "bar4Label", valKey: "bar4Val", defL: "SURGE", defV: "+165%" },
                  ].map((bar) => (
                    <div key={bar.labelKey} className="space-y-1">
                      <input
                        type="text"
                        placeholder={bar.defV}
                        value={gProps[bar.valKey] ?? bar.defV}
                        onChange={(e) => updateProp(bar.valKey, e.target.value)}
                        className="w-full bg-slate-900 border border-neutral-800 rounded p-1 text-[10px] text-center font-mono text-cyan-300 outline-none focus:border-cyan-400 font-bold"
                      />
                      <input
                        type="text"
                        placeholder={bar.defL}
                        value={gProps[bar.labelKey] ?? bar.defL}
                        onChange={(e) => updateProp(bar.labelKey, e.target.value)}
                        className="w-full bg-slate-900/60 border border-neutral-800/60 rounded p-0.5 text-[9px] text-center font-mono text-neutral-400 outline-none focus:border-neutral-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Role / Supporting Tag / Label */}
            {gProps.supporting !== undefined && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Supporting Badge</label>
                <input
                  type="text"
                  value={gProps.supporting}
                  onChange={(e) => updateProp("supporting", e.target.value)}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400"
                />
              </div>
            )}

            {gProps.role !== undefined && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Role / Status Badge</label>
                <input
                  type="text"
                  value={gProps.role}
                  onChange={(e) => updateProp("role", e.target.value)}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400"
                />
              </div>
            )}

            {gProps.label !== undefined && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Label Text</label>
                <input
                  type="text"
                  value={gProps.label}
                  onChange={(e) => updateProp("label", e.target.value)}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400"
                />
              </div>
            )}

            {/* 4. Social Handles & Buttons */}
            {gProps.handle !== undefined && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Social Handle / Tag</label>
                <input
                  type="text"
                  value={gProps.handle}
                  onChange={(e) => updateProp("handle", e.target.value)}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400 font-mono"
                />
              </div>
            )}

            {gProps.platform !== undefined && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Social Platform</label>
                <select
                  value={gProps.platform}
                  onChange={(e) => updateProp("platform", e.target.value)}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400 cursor-pointer"
                >
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram</option>
                  <option value="twitter">X (Twitter)</option>
                </select>
              </div>
            )}

            {gProps.actionText !== undefined && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Call to Action Text</label>
                <input
                  type="text"
                  value={gProps.actionText}
                  onChange={(e) => updateProp("actionText", e.target.value)}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400"
                />
              </div>
            )}

            {gProps.subCount !== undefined && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Subscriber Count</label>
                <input
                  type="text"
                  value={gProps.subCount}
                  onChange={(e) => updateProp("subCount", e.target.value)}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400 font-mono"
                />
              </div>
            )}

            {gProps.buttonText !== undefined && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Button Text</label>
                <input
                  type="text"
                  value={gProps.buttonText}
                  onChange={(e) => updateProp("buttonText", e.target.value)}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400 uppercase font-bold"
                />
              </div>
            )}

            {/* 5. Quotes, Reviews & Multiline Text */}
            {gProps.quote !== undefined && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Quote Text</label>
                <textarea
                  rows={3}
                  value={gProps.quote}
                  onChange={(e) => updateProp("quote", e.target.value)}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400 resize-none italic"
                />
              </div>
            )}

            {gProps.review !== undefined && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Testimonial Review</label>
                <textarea
                  rows={3}
                  value={gProps.review}
                  onChange={(e) => updateProp("review", e.target.value)}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400 resize-none"
                />
              </div>
            )}

            {gProps.text !== undefined && gProps.quote === undefined && gProps.review === undefined && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Body / Post Text</label>
                <textarea
                  rows={2}
                  value={gProps.text}
                  onChange={(e) => updateProp("text", e.target.value)}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400 resize-none"
                />
              </div>
            )}

            {/* 6. Before & After Split Inputs */}
            {gProps.beforeLabel !== undefined && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-500 mb-1 font-medium">Before Label</label>
                  <input
                    type="text"
                    value={gProps.beforeLabel}
                    onChange={(e) => updateProp("beforeLabel", e.target.value)}
                    className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-1.5 text-xs text-rose-300 outline-none focus:border-rose-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1 font-medium">After Label</label>
                  <input
                    type="text"
                    value={gProps.afterLabel}
                    onChange={(e) => updateProp("afterLabel", e.target.value)}
                    className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-1.5 text-xs text-emerald-300 outline-none focus:border-emerald-400 font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {gProps.beforeText !== undefined && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Before Description</label>
                <input
                  type="text"
                  value={gProps.beforeText}
                  onChange={(e) => updateProp("beforeText", e.target.value)}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400"
                />
              </div>
            )}

            {gProps.afterText !== undefined && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">After Description</label>
                <input
                  type="text"
                  value={gProps.afterText}
                  onChange={(e) => updateProp("afterText", e.target.value)}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400 font-bold"
                />
              </div>
            )}

            {/* 7. Numbers, Counters, Countdown Seconds & Ratings */}
            {(typeof gProps.seconds === "number" || graphic.compositionId === "countdown-timer") && (
              <div>
                <div className="flex justify-between text-neutral-500 mb-1">
                  <span className="font-medium">Countdown Seconds</span>
                  <span className="text-amber-400 font-mono text-[11px] font-bold">
                    {gProps.seconds || 5}s
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={gProps.seconds || 5}
                  onChange={(e) => updateProp("seconds", parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>
            )}

            {typeof gProps.progress === "number" && (
              <div>
                <div className="flex justify-between text-neutral-500 mb-1">
                  <span className="font-medium">Completion Percentage</span>
                  <span className="text-indigo-400 font-mono text-[11px] font-bold">
                    {gProps.progress}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={gProps.progress}
                  onChange={(e) => updateProp("progress", parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                />
              </div>
            )}

            {typeof gProps.rating === "number" && (
              <div>
                <div className="flex justify-between text-neutral-500 mb-1">
                  <span className="font-medium">Star Rating</span>
                  <span className="text-amber-400 font-bold text-xs">
                    {"★".repeat(gProps.rating || 5)} ({gProps.rating || 5}/5)
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={gProps.rating || 5}
                  onChange={(e) => updateProp("rating", parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>
            )}

            {(typeof gProps.from === "number" || typeof gProps.to === "number" || typeof gProps.startValue === "number" || typeof gProps.endValue === "number") && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-500 mb-1 font-medium">Start Value</label>
                  <input
                    type="number"
                    value={gProps.from ?? gProps.startValue ?? 0}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      updateProp("from", v);
                      if (gProps.startValue !== undefined) updateProp("startValue", v);
                    }}
                    className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-1.5 text-xs text-white outline-none focus:border-yellow-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1 font-medium">Target Value</label>
                  <input
                    type="number"
                    value={gProps.to ?? gProps.endValue ?? 10000}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      updateProp("to", v);
                      if (gProps.endValue !== undefined) updateProp("endValue", v);
                    }}
                    className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-1.5 text-xs text-white outline-none focus:border-yellow-400 font-mono"
                  />
                </div>
              </div>
            )}

            {(gProps.prefix !== undefined || gProps.suffix !== undefined) && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-500 mb-1 font-medium">Prefix Symbol</label>
                  <input
                    type="text"
                    value={gProps.prefix ?? ""}
                    onChange={(e) => updateProp("prefix", e.target.value)}
                    className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-1.5 text-xs text-white outline-none focus:border-yellow-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1 font-medium">Suffix Symbol</label>
                  <input
                    type="text"
                    value={gProps.suffix ?? ""}
                    onChange={(e) => updateProp("suffix", e.target.value)}
                    className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-1.5 text-xs text-white outline-none focus:border-yellow-400 font-mono"
                  />
                </div>
              </div>
            )}

            {(gProps.value !== undefined || gProps.change !== undefined) && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-500 mb-1 font-medium">Metric Value</label>
                  <input
                    type="text"
                    value={gProps.value || "$48,500"}
                    onChange={(e) => updateProp("value", e.target.value)}
                    className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-1.5 text-xs text-white outline-none focus:border-yellow-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1 font-medium">Trend / Delta</label>
                  <input
                    type="text"
                    value={gProps.change || "+32%"}
                    onChange={(e) => updateProp("change", e.target.value)}
                    className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-1.5 text-xs text-emerald-400 outline-none focus:border-emerald-400 font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {/* 8. Checklist Items */}
            {gProps.item1 !== undefined && (
              <div className="space-y-1.5">
                <label className="block text-neutral-500 font-medium">Checklist Points</label>
                <input
                  type="text"
                  value={gProps.item1}
                  onChange={(e) => {
                    const newItems = [e.target.value, gProps.item2 || "", gProps.item3 || ""];
                    updateGraphicElement(graphic.id, {
                      props: { ...gProps, item1: e.target.value, items: newItems },
                    });
                  }}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-1.5 text-xs text-white outline-none focus:border-yellow-400"
                />
                {gProps.item2 !== undefined && (
                  <input
                    type="text"
                    value={gProps.item2}
                    onChange={(e) => {
                      const newItems = [gProps.item1 || "", e.target.value, gProps.item3 || ""];
                      updateGraphicElement(graphic.id, {
                        props: { ...gProps, item2: e.target.value, items: newItems },
                      });
                    }}
                    className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-1.5 text-xs text-white outline-none focus:border-yellow-400"
                  />
                )}
                {gProps.item3 !== undefined && (
                  <input
                    type="text"
                    value={gProps.item3}
                    onChange={(e) => {
                      const newItems = [gProps.item1 || "", gProps.item2 || "", e.target.value];
                      updateGraphicElement(graphic.id, {
                        props: { ...gProps, item3: e.target.value, items: newItems },
                      });
                    }}
                    className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-1.5 text-xs text-white outline-none focus:border-yellow-400"
                  />
                )}
              </div>
            )}

            {/* Terminal / Code Typing */}
            {(gProps.command !== undefined || gProps.code !== undefined) && (
              <div className="space-y-2 border border-neutral-800/80 rounded-xl p-2.5 bg-neutral-900/40">
                <span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                  Terminal & Code Command
                </span>
                <div>
                  <label className="block text-[10px] text-neutral-400 mb-0.5">Prompt Command</label>
                  <input
                    type="text"
                    value={gProps.command ?? gProps.code ?? "npm run deploy"}
                    onChange={(e) => {
                      updateProp("command", e.target.value);
                      if (gProps.code !== undefined) updateProp("code", e.target.value);
                    }}
                    className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-white font-mono outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-400 mb-0.5">Terminal Output</label>
                  <input
                    type="text"
                    value={gProps.output ?? "Server running: 100% production ready"}
                    onChange={(e) => updateProp("output", e.target.value)}
                    className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-emerald-300 font-mono outline-none focus:border-emerald-400"
                  />
                </div>
                {gProps.windowTitle !== undefined && (
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Window Title</label>
                    <input
                      type="text"
                      value={gProps.windowTitle}
                      onChange={(e) => updateProp("windowTitle", e.target.value)}
                      className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-neutral-300 font-mono outline-none focus:border-emerald-400"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Direct Message Dialogue */}
            {(gProps.message1 !== undefined || gProps.question !== undefined || graphic.compositionId === "cooked-chat") && (
              <div className="space-y-2 border border-neutral-800/80 rounded-xl p-2.5 bg-neutral-900/40">
                <span className="block text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                  Direct Message Conversation
                </span>
                <div>
                  <label className="block text-[10px] text-neutral-400 mb-0.5">Sender Name</label>
                  <input
                    type="text"
                    value={gProps.sender ?? "Alex"}
                    onChange={(e) => updateProp("sender", e.target.value)}
                    className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-white outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-400 mb-0.5">Incoming Bubble (Them)</label>
                  <input
                    type="text"
                    value={gProps.message1 ?? gProps.question ?? "Did you test the new motion graphics?"}
                    onChange={(e) => {
                      updateProp("message1", e.target.value);
                      if (gProps.question !== undefined) updateProp("question", e.target.value);
                    }}
                    className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-white outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-400 mb-0.5">Reply Bubble (Me)</label>
                  <input
                    type="text"
                    value={gProps.message2 ?? gProps.answer ?? "Yes, they look absolutely insane! 🔥"}
                    onChange={(e) => {
                      updateProp("message2", e.target.value);
                      if (gProps.answer !== undefined) updateProp("answer", e.target.value);
                    }}
                    className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-sky-300 outline-none focus:border-sky-400 font-medium"
                  />
                </div>
              </div>
            )}

            {/* Connected Workflow Pipeline */}
            {(gProps.step1 !== undefined || graphic.compositionId === "cooked-flow") && (
              <div className="space-y-2 border border-neutral-800/80 rounded-xl p-2.5 bg-neutral-900/40">
                <span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Pipeline Steps Sequence
                </span>
                <div>
                  <label className="block text-[10px] text-neutral-400 mb-0.5">Pipeline Header</label>
                  <input
                    type="text"
                    value={gProps.title ?? "WORKFLOW PIPELINE"}
                    onChange={(e) => updateProp("title", e.target.value)}
                    className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-white outline-none focus:border-emerald-400 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Step 1</label>
                    <input
                      type="text"
                      value={gProps.step1 ?? "1. Ingest Video"}
                      onChange={(e) => updateProp("step1", e.target.value)}
                      className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Step 2</label>
                    <input
                      type="text"
                      value={gProps.step2 ?? "2. AI Auto-Edit"}
                      onChange={(e) => updateProp("step2", e.target.value)}
                      className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Step 3</label>
                    <input
                      type="text"
                      value={gProps.step3 ?? "3. 4K Export"}
                      onChange={(e) => updateProp("step3", e.target.value)}
                      className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                  {gProps.step4 !== undefined && (
                    <div>
                      <label className="block text-[10px] text-neutral-400 mb-0.5">Step 4</label>
                      <input
                        type="text"
                        value={gProps.step4}
                        onChange={(e) => updateProp("step4", e.target.value)}
                        className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-white outline-none focus:border-emerald-400"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* App Screen Video Upload */}
            {(gProps.appName !== undefined || gProps.fileName !== undefined || graphic.compositionId === "app-screen-upload") && (
              <div className="space-y-2 border border-neutral-800/80 rounded-xl p-2.5 bg-neutral-900/40">
                <span className="block text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                  App Screen Metadata
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">App Name</label>
                    <input
                      type="text"
                      value={gProps.appName ?? "Video Studio Pro"}
                      onChange={(e) => updateProp("appName", e.target.value)}
                      className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-white outline-none focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Window Header</label>
                    <input
                      type="text"
                      value={gProps.title ?? "VIDEO UPLOAD"}
                      onChange={(e) => updateProp("title", e.target.value)}
                      className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-white outline-none focus:border-sky-400 uppercase font-mono font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-400 mb-0.5">Uploaded File Name</label>
                  <input
                    type="text"
                    value={gProps.fileName ?? "production_export.mp4"}
                    onChange={(e) => updateProp("fileName", e.target.value)}
                    className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-white font-mono outline-none focus:border-sky-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">File Size</label>
                    <input
                      type="text"
                      value={gProps.fileSize ?? "48.2 MB"}
                      onChange={(e) => updateProp("fileSize", e.target.value)}
                      className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-neutral-300 font-mono outline-none focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">File Type</label>
                    <input
                      type="text"
                      value={gProps.fileType ?? "MP4 Video"}
                      onChange={(e) => updateProp("fileType", e.target.value)}
                      className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-neutral-300 font-mono outline-none focus:border-sky-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-400 mb-0.5">Status Message</label>
                  <input
                    type="text"
                    value={gProps.status ?? "Upload Complete"}
                    onChange={(e) => updateProp("status", e.target.value)}
                    className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-emerald-400 font-mono outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            )}

            {/* Vector Shapes Configuration */}
            {(gProps.shapeType !== undefined || graphic.compositionId === "shape" || graphic.compositionId?.startsWith("shape-")) && (
              <div className="space-y-2 border border-neutral-800/80 rounded-xl p-2.5 bg-neutral-900/40">
                <span className="block text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                  Vector Shape Geometry
                </span>
                <div>
                  <label className="block text-[10px] text-neutral-400 mb-0.5">Shape Type</label>
                  <select
                    value={gProps.shapeType || "rectangle"}
                    onChange={(e) => updateProp("shapeType", e.target.value)}
                    className="w-full bg-slate-900 border border-neutral-800 rounded-md p-1.5 text-xs text-white outline-none focus:border-sky-400 cursor-pointer"
                  >
                    <option value="rectangle">Rectangle</option>
                    <option value="rounded_rect">Rounded Rectangle</option>
                    <option value="circle">Circle</option>
                    <option value="line">Accent Line</option>
                    <option value="arrow">Callout Arrow</option>
                    <option value="speech_bubble">Speech Bubble</option>
                    <option value="star">Glowing Star</option>
                    <option value="badge">Badge Pill</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Fill Color</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={gProps.fillColor || "#0284c7"}
                        onChange={(e) => updateProp("fillColor", e.target.value)}
                        className="w-6 h-6 rounded border border-neutral-700 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={gProps.fillColor || "#0284c7"}
                        onChange={(e) => updateProp("fillColor", e.target.value)}
                        className="w-full bg-slate-900 border border-neutral-800 rounded p-1 text-[10px] font-mono text-white outline-none focus:border-sky-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Border Color</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={gProps.strokeColor || "#38bdf8"}
                        onChange={(e) => updateProp("strokeColor", e.target.value)}
                        className="w-6 h-6 rounded border border-neutral-700 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={gProps.strokeColor || "#38bdf8"}
                        onChange={(e) => updateProp("strokeColor", e.target.value)}
                        className="w-full bg-slate-900 border border-neutral-800 rounded p-1 text-[10px] font-mono text-white outline-none focus:border-sky-400"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-neutral-400 mb-0.5">
                    <span>Border Width</span>
                    <span className="font-mono text-sky-400 font-bold">{gProps.strokeWidth ?? 2}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="16"
                    value={gProps.strokeWidth ?? 2}
                    onChange={(e) => updateProp("strokeWidth", parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                </div>
              </div>
            )}

            {/* Direction Selector (Arrow / Pointer / Shapes) */}
            {(gProps.direction !== undefined || graphic.compositionId === "animated-arrow" || graphic.compositionId === "arrow") && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Pointer Direction</label>
                <select
                  value={gProps.direction || "down"}
                  onChange={(e) => updateProp("direction", e.target.value)}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400 cursor-pointer"
                >
                  <option value="down">Down (↓)</option>
                  <option value="up">Up (↑)</option>
                  <option value="left">Left (←)</option>
                  <option value="right">Right (→)</option>
                </select>
              </div>
            )}

            {/* Icon / Concept / Emoji */}
            {(gProps.icon !== undefined || gProps.concept !== undefined || gProps.emoji !== undefined) && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Badge / Concept Icon</label>
                <input
                  type="text"
                  value={gProps.icon ?? gProps.concept ?? gProps.emoji ?? "⚡"}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (gProps.icon !== undefined) updateProp("icon", v);
                    if (gProps.concept !== undefined) updateProp("concept", v);
                    if (gProps.emoji !== undefined) updateProp("emoji", v);
                  }}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400 font-mono text-center text-lg"
                />
              </div>
            )}

            {/* Social Likes Count */}
            {(gProps.likes !== undefined || gProps.likesCount !== undefined || gProps.likeCount !== undefined) && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Heart / Like Count</label>
                <input
                  type="text"
                  value={gProps.likes ?? gProps.likesCount ?? gProps.likeCount ?? "18.4K"}
                  onChange={(e) => {
                    updateProp("likes", e.target.value);
                    if (gProps.likesCount !== undefined) updateProp("likesCount", e.target.value);
                  }}
                  className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-rose-400 font-mono font-bold outline-none focus:border-rose-400"
                />
              </div>
            )}

            {/* 9. Colors & Accent (ALWAYS VISIBLE FOR ALL GRAPHICS) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-neutral-500 font-medium flex items-center gap-1">
                  <Palette className="w-3 h-3 text-cyan-400" />
                  Accent & Glow Color
                </label>
                <span className="font-mono text-[10px] text-neutral-400">
                  {gProps.accentColor || resourceDef?.defaultProps?.accentColor || "#38bdf8"}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="color"
                  value={gProps.accentColor || resourceDef?.defaultProps?.accentColor || "#38bdf8"}
                  onChange={(e) => {
                    updateProp("accentColor", e.target.value);
                    if (gProps.colorTheme !== undefined) updateProp("colorTheme", e.target.value);
                  }}
                  className="w-8 h-8 rounded-lg border border-neutral-700 bg-transparent cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={gProps.accentColor || resourceDef?.defaultProps?.accentColor || "#38bdf8"}
                  onChange={(e) => {
                    updateProp("accentColor", e.target.value);
                    if (gProps.colorTheme !== undefined) updateProp("colorTheme", e.target.value);
                  }}
                  className="flex-1 bg-slate-900 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono outline-none focus:border-cyan-400"
                />
              </div>

              {/* 6 Quick Palette Swatches */}
              <div className="flex items-center justify-between gap-1">
                {[
                  { name: "Cyan", hex: "#38bdf8" },
                  { name: "Emerald", hex: "#10b981" },
                  { name: "Amber", hex: "#f59e0b" },
                  { name: "Rose", hex: "#f43f5e" },
                  { name: "Purple", hex: "#8b5cf6" },
                  { name: "Violet", hex: "#a855f7" },
                ].map((palette) => {
                  const current = (gProps.accentColor || resourceDef?.defaultProps?.accentColor || "#38bdf8").toLowerCase();
                  const isSelected = current === palette.hex.toLowerCase();
                  return (
                    <button
                      key={palette.hex}
                      type="button"
                      title={palette.name}
                      onClick={() => {
                        updateProp("accentColor", palette.hex);
                        if (gProps.colorTheme !== undefined) updateProp("colorTheme", palette.hex);
                      }}
                      className={cn(
                        "w-6 h-6 rounded-md transition-all cursor-pointer border flex items-center justify-center",
                        isSelected
                          ? "border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                          : "border-transparent hover:scale-105 opacity-80 hover:opacity-100"
                      )}
                      style={{ backgroundColor: palette.hex }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white drop-shadow" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {gProps.buttonColor !== undefined && (
              <div>
                <label className="block text-neutral-500 mb-1 font-medium">Button Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={gProps.buttonColor || "#dc2626"}
                    onChange={(e) => updateProp("buttonColor", e.target.value)}
                    className="w-8 h-8 rounded border border-neutral-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={gProps.buttonColor || "#dc2626"}
                    onChange={(e) => updateProp("buttonColor", e.target.value)}
                    className="flex-1 bg-slate-900 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono outline-none focus:border-yellow-400"
                  />
                </div>
              </div>
            )}

            {/* Dynamic Parameter Fallback for any unhandled parameters */}
            {resourceDef?.parameters?.filter((p) => !handledKeys.has(p.name)).map((param) => {
              const val = gProps[param.name] ?? param.default ?? "";
              if (param.type === "number") {
                return (
                  <div key={param.name}>
                    <label className="block text-neutral-500 mb-1 font-medium">{param.label || param.name}</label>
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => updateProp(param.name, Number(e.target.value))}
                      className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400 font-mono"
                    />
                  </div>
                );
              }
              if (param.type === "color") {
                return (
                  <div key={param.name}>
                    <label className="block text-neutral-500 mb-1 font-medium">{param.label || param.name}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={val || "#38bdf8"}
                        onChange={(e) => updateProp(param.name, e.target.value)}
                        className="w-8 h-8 rounded border border-neutral-700 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={val || "#38bdf8"}
                        onChange={(e) => updateProp(param.name, e.target.value)}
                        className="flex-1 bg-slate-900 border border-neutral-800 rounded-lg p-1.5 text-xs text-white font-mono outline-none focus:border-yellow-400"
                      />
                    </div>
                  </div>
                );
              }
              return (
                <div key={param.name}>
                  <label className="block text-neutral-500 mb-1 font-medium">{param.label || param.name}</label>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => updateProp(param.name, e.target.value)}
                    className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-400"
                  />
                </div>
              );
            })}
          </div>

          {/* Transform & Animation Keyframes Controls */}
          <div className="border-t border-neutral-800/80 pt-3">
            <span className="block text-[11px] font-bold text-neutral-300 uppercase tracking-wider mb-2">
              Transform & Layout
            </span>
            <TransformControls clip={graphic} trackType="graphic" updateFn={updateGraphicElement} />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => {
              const store = useTimelineStore.getState();
              const { id, ...rest } = graphic;
              store.addGraphicElement({
                ...rest,
                start: graphic.end,
                end: graphic.end + (graphic.end - graphic.start),
              });
            }}
            className="flex-1 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </button>
          <button
            onClick={() => {
              deleteClip("graphic", graphic.id);
              setSelectedItem(null);
            }}
            className="flex-1 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Graphic</span>
          </button>
        </div>
      </aside>
    );
  }

  // Selected: Transition
  if (selectedItem.type === "transition") {
    const transition = (project.transitions || []).find((t) => t.id === selectedItem.id);
    if (!transition) return null;

    const fromClip = project.tracks.videoTrack.find((c) => c.id === transition.fromClipId);
    const toClip = project.tracks.videoTrack.find((c) => c.id === transition.toClipId);

    const presetOptions: { id: TransitionPreset; label: string }[] = [
      { id: "crossfade", label: "Crossfade (Dissolve)" },
      { id: "fade_to_black", label: "Fade to Black (Dip)" },
      { id: "wipe_left", label: "Wipe Left" },
      { id: "wipe_right", label: "Wipe Right" },
      { id: "slide_up", label: "Slide Up" },
      { id: "zoom_in", label: "Zoom In" },
      { id: "whip_pan", label: "Whip Pan" },
    ];

    return (
      <aside className="w-64 border-l border-neutral-900 bg-neutral-950 p-4 flex flex-col select-none text-slate-300">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-900 mb-4">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Video Transition</span>
          </h3>
          <button
            onClick={() => setSelectedItem(null)}
            className="text-[10px] text-neutral-500 hover:text-white cursor-pointer"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 text-xs flex-1 overflow-y-auto">
          {/* Preset Selector */}
          <div>
            <label className="block text-neutral-500 mb-1 font-medium">Transition Preset</label>
            <select
              value={transition.preset}
              onChange={(e) =>
                updateTransition(transition.id, { preset: e.target.value as TransitionPreset })
              }
              className="w-full bg-slate-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
            >
              {presetOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Duration Slider */}
          <div>
            <div className="flex justify-between text-neutral-500 mb-1">
              <span className="font-medium">Duration</span>
              <span className="text-white font-mono text-[11px]">{transition.duration.toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.05"
              value={transition.duration}
              onChange={(e) =>
                updateTransition(transition.id, { duration: parseFloat(e.target.value) })
              }
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Cut Alignment */}
          <div>
            <label className="block text-neutral-500 mb-1 font-medium">Cut Alignment</label>
            <div className="grid grid-cols-3 gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
              {(["start", "center", "end"] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => updateTransition(transition.id, { alignment: align })}
                  className={cn(
                    "py-1 rounded text-[10px] font-semibold capitalize transition-all",
                    transition.alignment === align
                      ? "bg-amber-400 text-black shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                  )}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>

          {/* Connected Clips Info */}
          <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80 space-y-1.5 text-[11px]">
            <div className="text-neutral-500 font-medium">Connected Clips:</div>
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-neutral-400">From:</span>
              <span className="text-white font-mono truncate">{fromClip?.name || transition.fromClipId}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-neutral-400">To:</span>
              <span className="text-white font-mono truncate">{toClip?.name || transition.toClipId}</span>
            </div>
          </div>
        </div>

        {/* Delete Transition Button */}
        <button
          onClick={() => {
            deleteTransition(transition.id);
            setSelectedItem(null);
          }}
          className="w-full py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all mt-4 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Transition</span>
        </button>
      </aside>
    );
  }

  return null;
}
