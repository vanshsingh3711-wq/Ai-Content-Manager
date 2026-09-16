"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Type,
  Film,
  Video,
  Music,
} from "lucide-react";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";
import { ClipFilmstrip } from "./ClipFilmstrip";

const KeyframeDiamond = ({
  time,
  leftPosition,
  isActive,
  clip,
  trackType,
}: {
  time: number;
  leftPosition: number;
  isActive: boolean;
  clip: any;
  trackType: "video" | "broll" | "caption" | "audio";
}) => {
  const handleDrag = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const store = useTimelineStore.getState();
    const startX = e.clientX;
    const initialTime = time;
    const duration = clip.end - clip.start;
    
    // Determine which properties have this keyframe exactly at this time
    const animatedProps: string[] = [];
    if (clip.animation) {
      Object.entries(clip.animation).forEach(([prop, propState]: [string, any]) => {
        if (propState?.keyframes?.some((kf: any) => Math.abs(kf.time - initialTime) <= 0.05)) {
          animatedProps.push(prop);
        }
      });
    }

    let finalTime = initialTime;

    const onMove = (moveEv: PointerEvent) => {
      const deltaX = moveEv.clientX - startX;
      const deltaTime = deltaX / store.zoomLevel;
      finalTime = Math.max(0, Math.min(duration, initialTime + deltaTime));
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      
      if (Math.abs(finalTime - initialTime) > 0.1) {
        // Find existing keyframes and move them
        animatedProps.forEach((prop) => {
          const kf = clip.animation[prop].keyframes.find((k: any) => Math.abs(k.time - initialTime) <= 0.05);
          if (kf) {
            store.removeKeyframe(trackType, clip.id, prop, initialTime);
            store.setKeyframe(trackType, clip.id, prop, finalTime, kf.value, false, kf.interpolation);
          }
        });
        store.commitHistory();
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      className={cn(
        "absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 border shadow-md z-30 transition-transform hover:scale-110 cursor-ew-resize",
        isActive ? "bg-red-500 border-red-300 shadow-red-500/50" : "bg-white border-slate-400"
      )}
      style={{ left: `${leftPosition}px`, marginLeft: '-5px' }}
      onPointerDown={handleDrag}
    />
  );
};

const ClipKeyframes = ({ clip, trackType, playheadTime, zoomLevel }: { clip: any, trackType: any, playheadTime: number, zoomLevel: number }) => {
  if (!clip.animation) return null;
  
  const times = new Set<number>();
  Object.values(clip.animation).forEach((propState: any) => {
    propState?.keyframes?.forEach((kf: any) => times.add(kf.time));
  });

  const duration = clip.end - clip.start;
  const clipStartTime = clip.start || 0;

  return (
    <>
      {Array.from(times).map((time) => {
        if (time < 0 || time > duration) return null;
        
        // Calculate relative time in case absolute time was accidentally stored
        const relativeTime = time >= clipStartTime && clipStartTime > 0 ? time - clipStartTime : time;
        const leftPosition = relativeTime * zoomLevel;
        
        const localTime = playheadTime - clip.start;
        const isActive = Math.abs(localTime - time) <= 0.05;

        return (
          <KeyframeDiamond
            key={time}
            time={time}
            leftPosition={leftPosition}
            isActive={isActive}
            clip={clip}
            trackType={trackType}
          />
        );
      })}
    </>
  );
};

export function TimelineContainer() {
  const {
    project,
    playheadTime,
    zoomLevel,
    selectedItem,
    setPlayheadTime,
    setSelectedItem,
    trimVideoClip,
  } = useTimelineStore(useShallow((state) => ({
    project: state.project,
    playheadTime: state.playheadTime,
    zoomLevel: state.zoomLevel,
    selectedItem: state.selectedItem,
    setPlayheadTime: state.setPlayheadTime,
    setSelectedItem: state.setSelectedItem,
    trimVideoClip: state.trimVideoClip,
  })));

  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Dragging states
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [trimmingClip, setTrimmingClip] = useState<{
    clipId: string;
    type: "video" | "broll" | "caption" | "audio";
    handle: "start" | "end";
    initialStart: number;
    initialEnd: number;
    initialX: number;
    currentX: number;
  } | null>(null);

  const [movingClip, setMovingClip] = useState<{
    id: string;
    type: "broll" | "caption" | "audio";
    initialStart: number;
    initialEnd: number;
    initialX: number;
    currentX: number;
  } | null>(null);

  // Safe duration to protect against Infinity / NaN metadata errors
  const safeDuration =
    Number.isFinite(project.duration) && project.duration > 0
      ? Math.min(project.duration, 7200)
      : 30;

  // Timeline width based on duration and zoom level (pixels per second)
  const timelineWidth = Math.max(1200, safeDuration * zoomLevel + 400);

  const timeToPixels = (time: number) => {
    const validTime = Number.isFinite(time) ? Math.max(0, time) : 0;
    return validTime * zoomLevel;
  };
  const pixelsToTime = (pixels: number) => Math.max(0, pixels / zoomLevel);

  const getRenderTimes = (clipId: string, originalStart: number, originalEnd: number) => {
    let tempStart = originalStart;
    let tempEnd = originalEnd;
    if (trimmingClip?.clipId === clipId) {
      const deltaX = trimmingClip.currentX - trimmingClip.initialX;
      const deltaTime = deltaX / zoomLevel;
      if (trimmingClip.handle === "start") {
        tempStart = Math.max(0, trimmingClip.initialStart + deltaTime);
        tempStart = Math.min(tempStart, trimmingClip.initialEnd - 0.2);
      } else {
        tempEnd = Math.max(trimmingClip.initialStart + 0.2, trimmingClip.initialEnd + deltaTime);
      }
    }
    return { tempStart, tempEnd };
  };

  // Scrubbing on pointer events
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".clip-handle") || (e.target as HTMLElement).closest(".clip-item")) {
      return;
    }
    const rect = scrollRef.current?.getBoundingClientRect();
    if (!rect || !scrollRef.current) return;

    const clickX = e.clientX - rect.left + scrollRef.current.scrollLeft;
    setPlayheadTime(pixelsToTime(clickX));
    setIsScrubbing(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isScrubbing) {
      const rect = scrollRef.current?.getBoundingClientRect();
      if (!rect || !scrollRef.current) return;
      const currentX = e.clientX - rect.left + scrollRef.current.scrollLeft;
      setPlayheadTime(pixelsToTime(currentX));
    } else if (trimmingClip) {
      setTrimmingClip((prev) => (prev ? { ...prev, currentX: e.clientX } : null));
    } else if (movingClip) {
      setMovingClip((prev) => (prev ? { ...prev, currentX: e.clientX } : null));
    }
  };

  const handlePointerUp = () => {
    setIsScrubbing(false);
    
    if (trimmingClip) {
      const deltaX = trimmingClip.currentX - trimmingClip.initialX;
      const deltaTime = deltaX / zoomLevel;
      if (Math.abs(deltaX) > 0) {
        if (trimmingClip.handle === "start") {
          const newStart = Math.max(0, trimmingClip.initialStart + deltaTime);
          if (trimmingClip.initialEnd - newStart >= 0.2) {
            if (trimmingClip.type === "video") {
              useTimelineStore.getState().trimVideoClip(trimmingClip.clipId, newStart, trimmingClip.initialEnd);
            } else {
              const store = useTimelineStore.getState();
              if (trimmingClip.type === "caption") store.updateCaption(trimmingClip.clipId, { start: newStart });
              if (trimmingClip.type === "broll") store.updateBRollClip(trimmingClip.clipId, { start: newStart });
              if (trimmingClip.type === "audio") store.updateAudioClip(trimmingClip.clipId, { start: newStart });
            }
          }
        } else {
          const newEnd = Math.max(trimmingClip.initialStart + 0.2, trimmingClip.initialEnd + deltaTime);
          if (trimmingClip.type === "video") {
            useTimelineStore.getState().trimVideoClip(trimmingClip.clipId, trimmingClip.initialStart, newEnd);
          } else {
            const store = useTimelineStore.getState();
            if (trimmingClip.type === "caption") store.updateCaption(trimmingClip.clipId, { end: newEnd });
            if (trimmingClip.type === "broll") store.updateBRollClip(trimmingClip.clipId, { end: newEnd });
            if (trimmingClip.type === "audio") store.updateAudioClip(trimmingClip.clipId, { end: newEnd });
          }
        }
      }
      setTrimmingClip(null);
    }

    if (movingClip) {
      const deltaX = movingClip.currentX - movingClip.initialX;
      if (Math.abs(deltaX) > 0.5) {
        const deltaTime = deltaX / zoomLevel;
        const newStart = Math.max(0, movingClip.initialStart + deltaTime);
        const duration = movingClip.initialEnd - movingClip.initialStart;
        const newEnd = newStart + duration;

        const store = useTimelineStore.getState();
        if (movingClip.type === "caption") {
          store.updateCaption(movingClip.id, { start: newStart, end: newEnd });
        } else if (movingClip.type === "broll") {
          store.updateBRollClip(movingClip.id, { start: newStart, end: newEnd });
        } else if (movingClip.type === "audio") {
          store.updateAudioClip(movingClip.id, { start: newStart, end: newEnd });
        }
      }
      setMovingClip(null);
    }
  };

  // Keyboard shortcut: Delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === "Delete" || e.code === "Backspace") {
        if (selectedItem) {
          useTimelineStore.getState().deleteClip(selectedItem.type, selectedItem.id);
        }
      } else if (e.code === "KeyS") {
        e.preventDefault();
        useTimelineStore.getState().splitClipAtPlayhead(
          selectedItem?.type || "video",
          selectedItem?.id
        );
      } else if (e.code === "KeyD" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (selectedItem) {
          const store = useTimelineStore.getState();
          const { project } = store;
          if (selectedItem.type === "caption") {
            const item = project.tracks.textTrack.find((t) => t.id === selectedItem.id);
            if (item) store.addCaption({ ...item, start: item.end, end: item.end + (item.end - item.start) });
          } else if (selectedItem.type === "broll") {
            const item = project.tracks.brollTrack.find((t) => t.id === selectedItem.id);
            if (item) store.addBRollClip({ ...item, start: item.end, end: item.end + (item.end - item.start) });
          } else if (selectedItem.type === "audio") {
            const item = project.tracks.audioTrack.find((t) => t.id === selectedItem.id);
            if (item) store.addAudioClip({ ...item, start: item.end, end: item.end + (item.end - item.start) });
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem]);

  // Generate ruler markers safely
  const renderRuler = () => {
    const step = zoomLevel >= 60 ? 1 : zoomLevel >= 30 ? 2 : 5;
    const markers = [];
    const maxMarkers = 500; // Hard boundary against infinite loops
    for (let sec = 0; sec <= safeDuration + 10 && markers.length < maxMarkers; sec += step) {
      const x = timeToPixels(sec);
      const mins = Math.floor(sec / 60);
      const secs = sec % 60;
      const formatted = `${mins}:${secs.toString().padStart(2, "0")}`;

      markers.push(
        <div
          key={sec}
          className="absolute top-0 flex flex-col items-center pointer-events-none"
          style={{ left: `${x}px` }}
        >
          <div className="h-2 w-[1px] bg-slate-700" />
          <span className="text-[9px] text-slate-400 font-mono mt-0.5 select-none">
            {formatted}
          </span>
        </div>
      );
    }
    return markers;
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col bg-[#0b0e16] select-none relative overflow-hidden"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Scrollable Timeline Viewport */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-auto relative scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        <div
          className="relative min-h-[260px] pb-8 pt-6"
          style={{ width: `${timelineWidth}px` }}
        >
          {/* Ruler Bar */}
          <div className="absolute top-0 left-0 right-0 h-6 border-b border-slate-800/80 bg-[#0d111b] cursor-pointer">
            {renderRuler()}
          </div>

          {/* Red Playhead Line across entire timeline */}
          <div
            className="absolute top-0 bottom-0 z-30 pointer-events-none transition-all duration-75 flex flex-col items-center"
            style={{ left: `${timeToPixels(playheadTime)}px` }}
          >
            {/* Playhead Top Handle */}
            <div className="w-3.5 h-3.5 bg-red-500 rounded-b-sm shadow-md shadow-red-500/50 -mt-0.5" />
            <div className="w-[2px] h-full bg-red-500 shadow-sm shadow-red-500/50" />
          </div>

          {/* TRACK 1: Text & Captions */}
          <div className="mt-2 mb-2 relative h-9 border-y border-slate-800/40 bg-slate-950/40 flex items-center">
            <div className="sticky left-2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-[10px] text-yellow-400 font-semibold shadow">
              <Type className="w-3 h-3" />
              <span>Captions</span>
            </div>

            {project.tracks.textTrack.map((caption) => {
              const { tempStart, tempEnd } = getRenderTimes(caption.id, caption.start, caption.end);
              const isMoving = movingClip?.id === caption.id;
              const deltaX = isMoving ? movingClip.currentX - movingClip.initialX : 0;
              const left = timeToPixels(tempStart) + deltaX;
              const width = Math.max(20, timeToPixels(tempEnd - tempStart));
              const isSelected = selectedItem?.id === caption.id;

              return (
                <div
                  key={caption.id}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSelectedItem({ type: "caption", id: caption.id });
                    setMovingClip({
                      id: caption.id,
                      type: "caption",
                      initialStart: caption.start,
                      initialEnd: caption.end,
                      initialX: e.clientX,
                      currentX: e.clientX,
                    });
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                  }}
                  className={cn(
                    "clip-item absolute h-7 rounded-md border flex items-center px-2 text-xs font-semibold truncate cursor-pointer transition-all shadow-sm",
                    isSelected
                      ? "bg-yellow-500/30 border-yellow-400 text-yellow-200 ring-2 ring-yellow-400/40 z-10"
                      : "bg-yellow-600/20 border-yellow-500/30 text-yellow-300 hover:bg-yellow-600/30",
                    isMoving && "opacity-75 z-50 cursor-grabbing scale-[1.02]"
                  )}
                  style={{ left: `${left}px`, width: `${width}px` }}
                >
                  {/* Left Trim Handle */}
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setTrimmingClip({
                        clipId: caption.id,
                        type: "caption",
                        handle: "start",
                        initialStart: caption.start,
                        initialEnd: caption.end,
                        initialX: e.clientX,
                        currentX: e.clientX,
                      });
                      (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    }}
                    className="clip-handle w-2.5 h-full hover:bg-yellow-400 bg-yellow-500/20 flex items-center justify-center cursor-ew-resize transition-colors z-20 absolute left-0 top-0 bottom-0"
                    title="Drag to trim start"
                  >
                    <div className="w-[1px] h-3 bg-white/70 rounded-full pointer-events-none" />
                  </div>

                  <ClipKeyframes clip={caption} trackType="caption" playheadTime={playheadTime} zoomLevel={zoomLevel} />
                  <span className="truncate flex-1 text-center px-3 pointer-events-none">{caption.text}</span>

                  {/* Right Trim Handle */}
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setTrimmingClip({
                        clipId: caption.id,
                        type: "caption",
                        handle: "end",
                        initialStart: caption.start,
                        initialEnd: caption.end,
                        initialX: e.clientX,
                        currentX: e.clientX,
                      });
                      (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    }}
                    className="clip-handle w-2.5 h-full hover:bg-yellow-400 bg-yellow-500/20 flex items-center justify-center cursor-ew-resize transition-colors z-20 absolute right-0 top-0 bottom-0"
                    title="Drag to trim end"
                  >
                    <div className="w-[1px] h-3 bg-white/70 rounded-full pointer-events-none" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* TRACK 2: B-Roll & Overlays */}
          <div className="mb-2 relative h-10 border-y border-slate-800/40 bg-slate-950/40 flex items-center">
            <div className="sticky left-2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-[10px] text-purple-400 font-semibold shadow">
              <Film className="w-3 h-3" />
              <span>B-Roll</span>
            </div>

            {project.tracks.brollTrack.map((broll) => {
              const { tempStart, tempEnd } = getRenderTimes(broll.id, broll.start, broll.end);
              const isMoving = movingClip?.id === broll.id;
              const deltaX = isMoving ? movingClip.currentX - movingClip.initialX : 0;
              const left = timeToPixels(tempStart) + deltaX;
              const width = Math.max(20, timeToPixels(tempEnd - tempStart));
              const isSelected = selectedItem?.id === broll.id;

              return (
                <div
                  key={broll.id}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSelectedItem({ type: "broll", id: broll.id });
                    setMovingClip({
                      id: broll.id,
                      type: "broll",
                      initialStart: broll.start,
                      initialEnd: broll.end,
                      initialX: e.clientX,
                      currentX: e.clientX,
                    });
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                  }}
                  className={cn(
                    "clip-item absolute h-8 rounded-md border flex items-center px-2 text-xs font-medium truncate cursor-pointer transition-all shadow-sm",
                    isSelected
                      ? "bg-purple-600/40 border-purple-400 text-white ring-2 ring-purple-400/40 z-10"
                      : "bg-purple-900/30 border-purple-500/30 text-purple-200 hover:bg-purple-800/40",
                    isMoving && "opacity-75 z-50 cursor-grabbing scale-[1.02]"
                  )}
                  style={{ left: `${left}px`, width: `${width}px` }}
                >
                  {/* Left Trim Handle */}
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setTrimmingClip({
                        clipId: broll.id,
                        type: "broll",
                        handle: "start",
                        initialStart: broll.start,
                        initialEnd: broll.end,
                        initialX: e.clientX,
                        currentX: e.clientX,
                      });
                      (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    }}
                    className="clip-handle w-2.5 h-full hover:bg-purple-400 bg-purple-500/20 flex items-center justify-center cursor-ew-resize transition-colors z-20 absolute left-0 top-0 bottom-0"
                    title="Drag to trim start"
                  >
                    <div className="w-[1px] h-4 bg-white/70 rounded-full pointer-events-none" />
                  </div>

                  <ClipKeyframes clip={broll} trackType="broll" playheadTime={playheadTime} zoomLevel={zoomLevel} />
                  <span className="truncate font-semibold flex-1 text-center px-3 pointer-events-none">{broll.name || "B-Roll Clip"}</span>

                  {/* Right Trim Handle */}
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setTrimmingClip({
                        clipId: broll.id,
                        type: "broll",
                        handle: "end",
                        initialStart: broll.start,
                        initialEnd: broll.end,
                        initialX: e.clientX,
                        currentX: e.clientX,
                      });
                      (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    }}
                    className="clip-handle w-2.5 h-full hover:bg-purple-400 bg-purple-500/20 flex items-center justify-center cursor-ew-resize transition-colors z-20 absolute right-0 top-0 bottom-0"
                    title="Drag to trim end"
                  >
                    <div className="w-[1px] h-4 bg-white/70 rounded-full pointer-events-none" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* TRACK 3: Main Video Track (Primary Footage) */}
          <div className="mb-2 relative h-14 border-y border-slate-800/80 bg-slate-950/80 flex items-center">
            <div className="sticky left-2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-[10px] text-indigo-400 font-semibold shadow">
              <Video className="w-3 h-3" />
              <span>Main Video</span>
            </div>

            {project.tracks.videoTrack.map((clip, idx) => {
              const { tempStart, tempEnd } = getRenderTimes(clip.id, clip.start, clip.end);
              const left = timeToPixels(tempStart);
              const width = Math.max(24, timeToPixels(tempEnd - tempStart));
              const isSelected = selectedItem?.id === clip.id;

              return (
                <div
                  key={clip.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem({ type: "video", id: clip.id });
                  }}
                  className={cn(
                    "clip-item absolute h-12 rounded-lg border flex items-center justify-between group cursor-pointer transition-all shadow-md overflow-hidden",
                    isSelected
                      ? "bg-indigo-600/35 border-indigo-400 ring-2 ring-indigo-400/50 z-10"
                      : "bg-indigo-950/40 border-indigo-500/30 hover:bg-indigo-900/40"
                  )}
                  style={{ left: `${left}px`, width: `${width}px` }}
                >
                  {/* Background Asynchronous Thumbnail Filmstrip */}
                  <ClipFilmstrip
                    sourceUrl={clip.sourceUrl}
                    start={clip.start}
                    end={clip.end}
                    width={width}
                  />

                  {/* Left Trim Handle */}
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setTrimmingClip({
                        clipId: clip.id,
                        type: "video",
                        handle: "start",
                        initialStart: clip.start,
                        initialEnd: clip.end,
                        initialX: e.clientX,
                        currentX: e.clientX,
                      });
                      (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    }}
                    className="clip-handle w-3 h-full hover:bg-indigo-400 bg-indigo-500/20 flex items-center justify-center cursor-ew-resize transition-colors z-20"
                    title="Drag to trim start"
                  >
                    <div className="w-0.5 h-4 bg-white/70 rounded-full" />
                  </div>

                  <ClipKeyframes clip={clip} trackType="video" playheadTime={playheadTime} zoomLevel={zoomLevel} />

                  {/* Clip Label */}
                  <div className="flex-1 px-2 flex flex-col justify-center truncate pointer-events-none">
                    <span className="text-xs font-bold text-white truncate">
                      {clip.name || `Clip ${idx + 1}`}
                    </span>
                    <span className="text-[10px] text-indigo-300 font-mono">
                      {(clip.end - clip.start).toFixed(1)}s • {clip.speed || 1}x
                    </span>
                  </div>

                  {/* Right Trim Handle */}
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setTrimmingClip({
                        clipId: clip.id,
                        type: "video",
                        handle: "end",
                        initialStart: clip.start,
                        initialEnd: clip.end,
                        initialX: e.clientX,
                        currentX: e.clientX,
                      });
                      (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    }}
                    className="clip-handle w-3 h-full hover:bg-indigo-400 bg-indigo-500/20 flex items-center justify-center cursor-ew-resize transition-colors z-20"
                    title="Drag to trim end"
                  >
                    <div className="w-0.5 h-4 bg-white/70 rounded-full" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* TRACK 4: Background Music & Audio */}
          <div className="relative h-9 border-y border-slate-800/40 bg-slate-950/40 flex items-center">
            <div className="sticky left-2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-[10px] text-emerald-400 font-semibold shadow">
              <Music className="w-3 h-3" />
              <span>Audio</span>
            </div>

            {project.tracks.audioTrack.map((audio) => {
              const { tempStart, tempEnd } = getRenderTimes(audio.id, audio.start, audio.end);
              const isMoving = movingClip?.id === audio.id;
              const deltaX = isMoving ? movingClip.currentX - movingClip.initialX : 0;
              const left = timeToPixels(tempStart) + deltaX;
              const width = Math.max(20, timeToPixels(tempEnd - tempStart));
              const isSelected = selectedItem?.id === audio.id;

              return (
                <div
                  key={audio.id}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSelectedItem({ type: "audio", id: audio.id });
                    setMovingClip({
                      id: audio.id,
                      type: "audio",
                      initialStart: audio.start,
                      initialEnd: audio.end,
                      initialX: e.clientX,
                      currentX: e.clientX,
                    });
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                  }}
                  className={cn(
                    "clip-item absolute h-7 rounded-md border flex items-center px-2 text-xs font-semibold truncate cursor-pointer transition-all shadow-sm",
                    isSelected
                      ? "bg-emerald-600/40 border-emerald-400 text-white ring-2 ring-emerald-400/40 z-10"
                      : "bg-emerald-900/30 border-emerald-500/30 text-emerald-300 hover:bg-emerald-800/30",
                    isMoving && "opacity-75 z-50 cursor-grabbing scale-[1.02]"
                  )}
                  style={{ left: `${left}px`, width: `${width}px` }}
                >
                  {/* Left Trim Handle */}
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setTrimmingClip({
                        clipId: audio.id,
                        type: "audio",
                        handle: "start",
                        initialStart: audio.start,
                        initialEnd: audio.end,
                        initialX: e.clientX,
                        currentX: e.clientX,
                      });
                      (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    }}
                    className="clip-handle w-2.5 h-full hover:bg-emerald-400 bg-emerald-500/20 flex items-center justify-center cursor-ew-resize transition-colors z-20 absolute left-0 top-0 bottom-0"
                    title="Drag to trim start"
                  >
                    <div className="w-[1px] h-3 bg-white/70 rounded-full pointer-events-none" />
                  </div>

                  <ClipKeyframes clip={audio} trackType="audio" playheadTime={playheadTime} zoomLevel={zoomLevel} />
                  <span className="truncate flex-1 text-center px-3 pointer-events-none">{audio.name || "Music Track"}</span>

                  {/* Right Trim Handle */}
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setTrimmingClip({
                        clipId: audio.id,
                        type: "audio",
                        handle: "end",
                        initialStart: audio.start,
                        initialEnd: audio.end,
                        initialX: e.clientX,
                        currentX: e.clientX,
                      });
                      (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    }}
                    className="clip-handle w-2.5 h-full hover:bg-emerald-400 bg-emerald-500/20 flex items-center justify-center cursor-ew-resize transition-colors z-20 absolute right-0 top-0 bottom-0"
                    title="Drag to trim end"
                  >
                    <div className="w-[1px] h-3 bg-white/70 rounded-full pointer-events-none" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
