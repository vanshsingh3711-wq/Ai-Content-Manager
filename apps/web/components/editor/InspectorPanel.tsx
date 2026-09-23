"use client";

import React from "react";
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
} from "lucide-react";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { useShallow } from "zustand/react/shallow";
import { CaptionPreset } from "@/lib/timeline-types";
import { cn } from "@/lib/utils";
import { getExactKeyframe, evaluatePropertyAtTime, hasAnyKeyframes } from "@/lib/keyframes";

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

function TransformControls({ clip, trackType, updateFn }: { clip: any, trackType: "video"|"broll"|"caption", updateFn: Function }) {
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

  return (
    <div className="space-y-4 pt-4 border-t border-neutral-900">
      <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2 flex justify-between items-center">
        <span>Transform</span>
      </h4>
      
      {/* Position (Vector) */}
      <div className="space-y-2">
        <div className="flex justify-between text-neutral-500 mb-1">
          <span>Position</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-white text-[10px]">
              X:{Math.round(currentPosition.x)} Y:{Math.round(currentPosition.y)}
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
    deleteClip,
    setSelectedItem,
    playheadTime,
    setKeyframe,
  } = useTimelineStore(useShallow((state) => ({
    project: state.project,
    selectedItem: state.selectedItem,
    updateVideoClip: state.updateVideoClip,
    updateCaption: state.updateCaption,
    updateBRollClip: state.updateBRollClip,
    deleteClip: state.deleteClip,
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
    const caption = project.tracks.textTrack.find((t) => t.id === selectedItem.id);
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
              <option value="tiktok_yellow">TikTok Yellow</option>
              <option value="hormozi_bold">Hormozi Bold Red</option>
              <option value="clean_white">Clean Minimal</option>
              <option value="neon_glow">Cyber Neon Glow</option>
            </select>
          </div>
          
          <TransformControls clip={caption} trackType="caption" updateFn={updateCaption} />
        </div>

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

  return null;
}
