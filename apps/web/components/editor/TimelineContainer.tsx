"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Type,
  Film,
  Video,
  Music,
  Sparkles,
} from "lucide-react";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";
import { ClipFilmstrip } from "./ClipFilmstrip";
import {
  EDITOR_DRAG_MIME,
  deserializeDragPayload,
  projectPointerToTimelineTimestamp,
  createAddElementOperationFromDrop,
} from "@/lib/editor/drag-drop-types";
import { isEffectGraphic } from "@/lib/editor/video-effects";

interface TimelineKeyframe {
  time: number;
  value: number;
  interpolation?: "linear" | "easeIn" | "easeOut" | "easeInOut";
}

interface TimelinePropertyAnimation {
  keyframes?: TimelineKeyframe[];
}

interface KeyframeClip {
  id: string;
  start: number;
  end: number;
  animation?: Record<string, TimelinePropertyAnimation>;
}

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
  clip: KeyframeClip;
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
      Object.entries(clip.animation).forEach(([prop, propState]) => {
        if (propState?.keyframes?.some((kf) => Math.abs(kf.time - initialTime) <= 0.05)) {
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
          const kf = clip.animation?.[prop]?.keyframes?.find((k) => Math.abs(k.time - initialTime) <= 0.05);
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
        isActive ? "bg-red-500 border-red-300 shadow-red-500/50" : "bg-white border-neutral-500"
      )}
      style={{ left: `${leftPosition}px`, marginLeft: '-5px' }}
      onPointerDown={handleDrag}
    />
  );
};

const ClipKeyframes = ({
  clip,
  trackType,
  playheadTime,
  zoomLevel,
}: {
  clip: KeyframeClip;
  trackType: "video" | "broll" | "caption" | "audio";
  playheadTime: number;
  zoomLevel: number;
}) => {
  if (!clip.animation) return null;
  
  const times = new Set<number>();
  Object.values(clip.animation).forEach((propState) => {
    propState?.keyframes?.forEach((kf) => times.add(kf.time));
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
    dispatchOperation,
  } = useTimelineStore(useShallow((state) => ({
    project: state.project,
    playheadTime: state.playheadTime,
    zoomLevel: state.zoomLevel,
    selectedItem: state.selectedItem,
    setPlayheadTime: state.setPlayheadTime,
    setSelectedItem: state.setSelectedItem,
    dispatchOperation: state.dispatchOperation,
  })));

  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Drag-and-drop target track state
  const [dropTargetTrack, setDropTargetTrack] = useState<"caption" | "graphic" | "broll" | "video" | "audio" | null>(null);

  const handleTrackDrop = (
    e: React.DragEvent,
    _targetTrackHint?: "caption" | "graphic" | "broll" | "video" | "audio"
  ) => {
    void _targetTrackHint;
    e.preventDefault();
    setDropTargetTrack(null);

    const rawData =
      e.dataTransfer.getData(EDITOR_DRAG_MIME) ||
      e.dataTransfer.getData("text/plain");
    if (!rawData) return;

    const payload = deserializeDragPayload(rawData);
    if (!payload) return;

    const trackRect = scrollRef.current?.getBoundingClientRect();
    if (!trackRect) return;

    const scrollLeft = scrollRef.current.scrollLeft;
    const dropTimestamp = projectPointerToTimelineTimestamp(
      e.clientX,
      trackRect,
      project.duration,
      zoomLevel,
      scrollLeft
    );

    if (payload.type === "transition") {
      const videoClips = project.tracks.videoTrack || [];
      if (videoClips.length >= 2) {
        let closestCutIndex = 0;
        let minDistance = Infinity;
        for (let i = 0; i < videoClips.length - 1; i++) {
          const cutTime = videoClips[i].end;
          const dist = Math.abs(dropTimestamp - cutTime);
          if (dist < minDistance) {
            minDistance = dist;
            closestCutIndex = i;
          }
        }
        const fromClip = videoClips[closestCutIndex];
        const toClip = videoClips[closestCutIndex + 1];
        const transId = `trans-${Date.now()}`;
        dispatchOperation({
          type: "add_transition",
          id: transId,
          track: "video",
          fromClipId: fromClip.id,
          toClipId: toClip.id,
          preset: payload.preset,
          duration: payload.duration || 0.5,
          alignment: "center",
        });
        setSelectedItem({ type: "transition", id: transId });
      }
      return;
    }

    if (payload.type === "caption") {
      const textClips = project.tracks.textTrack || [];
      const targetCaption = textClips.find(
        (c) => dropTimestamp >= c.start && dropTimestamp <= c.end
      );
      if (targetCaption) {
        dispatchOperation({
          type: "update_properties",
          targetType: "caption",
          targetId: targetCaption.id,
          properties: { stylePreset: payload.stylePreset },
        });
        setSelectedItem({ type: "caption", id: targetCaption.id });
        setPlayheadTime(dropTimestamp);
        return;
      }
    }

    const operation = createAddElementOperationFromDrop(payload, {
      timestamp: dropTimestamp,
      durationLimit: project.duration,
    });

    dispatchOperation(operation);
    setPlayheadTime(dropTimestamp);

    if ("element" in operation && operation.element && typeof operation.element === "object" && "id" in operation.element) {
      setSelectedItem({
        type: payload.type as "caption" | "broll" | "audio" | "graphic" | "video",
        id: (operation.element as { id: string }).id,
      });
    }
  };

  // Dragging states
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [trimmingClip, setTrimmingClip] = useState<{
    clipId: string;
    type: "video" | "broll" | "caption" | "audio" | "graphic";
    handle: "start" | "end";
    initialStart: number;
    initialEnd: number;
    initialX: number;
    currentX: number;
  } | null>(null);

  const [movingClip, setMovingClip] = useState<{
    id: string;
    type: "broll" | "caption" | "audio" | "graphic";
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
            if (trimmingClip.type === "graphic") store.updateGraphicElement(trimmingClip.clipId, { end: newEnd });
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
        } else if (movingClip.type === "graphic") {
          store.updateGraphicElement(movingClip.id, { start: newStart, end: newEnd });
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
          } else if (selectedItem.type === "graphic") {
            const item = (project.tracks.graphicsTrack || []).find((t) => t.id === selectedItem.id);
            if (item) store.addGraphicElement({ ...item, start: item.end, end: item.end + (item.end - item.start) });
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
      const formatted = `00:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

      markers.push(
        <div
          key={sec}
          className="absolute top-0 flex flex-col items-center pointer-events-none"
          style={{ left: `${x}px` }}
        >
          <div className="h-2 w-[1px] bg-neutral-800" />
          <span className="text-[9px] text-neutral-500 font-mono mt-0.5 select-none">
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
      className="flex-1 flex flex-row bg-[#080a0f] select-none relative overflow-hidden"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Fixed Left Track Headers Column (Mockup Image 2) */}
      <div className="w-20 md:w-24 shrink-0 bg-[#0a0d14] border-r border-white/[0.06] flex flex-col pt-6 z-20 select-none">
        {/* Track 1: Video */}
        <div className="h-11 my-1.5 flex items-center px-1.5">
          <div className="w-full flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-md bg-[#7c3aed] text-white text-[11px] font-semibold shadow-md shadow-violet-950/40">
            <Video className="w-3 h-3 shrink-0" />
            <span>Video</span>
          </div>
        </div>

        {/* Track 2: Audio */}
        <div className="h-9 my-1.5 flex items-center px-1.5">
          <div className="w-full flex items-center justify-center gap-1 px-1.5 py-1 rounded-md bg-[#06b6d4] text-black text-[11px] font-semibold shadow-md shadow-cyan-950/30">
            <Music className="w-3 h-3 shrink-0 text-black" />
            <span>Audio</span>
          </div>
        </div>

        {/* Track 3: Overlay (B-Roll & Graphics) */}
        <div className="h-9 my-1.5 flex items-center px-1.5">
          <div className="w-full flex items-center justify-center gap-1 px-1.5 py-1 rounded-md bg-[#10b981] text-black text-[11px] font-semibold shadow-md shadow-emerald-950/30">
            <Film className="w-3 h-3 shrink-0 text-black" />
            <span>Overlay</span>
          </div>
        </div>

        {/* Track 4: Caption */}
        <div className="h-9 my-1.5 flex items-center px-1.5">
          <div className="w-full flex items-center justify-center gap-1 px-1.5 py-1 rounded-md bg-[#f59e0b] text-black text-[11px] font-semibold shadow-md shadow-amber-950/30">
            <Type className="w-3 h-3 shrink-0 text-black" />
            <span>Caption</span>
          </div>
        </div>
      </div>

      {/* Scrollable Timeline Viewport */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-auto relative scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        <div
          className="relative min-h-[260px] pb-8 pt-6"
          style={{ width: `${timelineWidth}px` }}
        >
          {/* Ruler Bar */}
          <div className="absolute top-0 left-0 right-0 h-6 border-b border-neutral-900 bg-[#090c12] cursor-pointer">
            {renderRuler()}
          </div>

          {/* White Playhead Needle across entire timeline (Mockup Image 2) */}
          <div
            className="absolute top-0 bottom-0 z-30 pointer-events-none transition-all duration-75 flex flex-col items-center -ml-[5px]"
            style={{ left: `${timeToPixels(playheadTime)}px` }}
          >
            {/* Playhead Inverted White Triangle Top Handle */}
            <div className="w-0 h-0 border-x-[5px] border-x-transparent border-t-[8px] border-t-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
            <div className="w-[1.5px] h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
          </div>

          {/* TRACK 1: Main Video Track (Primary Footage) */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
              setDropTargetTrack("video");
            }}
            onDragLeave={() => setDropTargetTrack(null)}
            onDrop={(e) => handleTrackDrop(e, "video")}
            className={cn(
              "my-1.5 relative h-11 border-y bg-neutral-950/60 flex items-center transition-colors",
              dropTargetTrack === "video"
                ? "border-violet-400 bg-violet-500/10 ring-1 ring-violet-400/50"
                : "border-neutral-900"
            )}
          >
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
                    "clip-item absolute h-9 rounded-md border flex items-center justify-between group cursor-pointer transition-all shadow-md overflow-hidden",
                    isSelected
                      ? "bg-violet-600/90 border-violet-300 ring-2 ring-violet-400/40 z-10 shadow-[0_0_16px_rgba(124,58,237,0.4)]"
                      : "bg-[#7c3aed]/80 border-violet-500/40 hover:bg-violet-600/80"
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
                    className="clip-handle w-2.5 h-full hover:bg-violet-300 bg-violet-400/20 flex items-center justify-center cursor-ew-resize transition-colors z-20"
                    title="Drag to trim start"
                  >
                    <div className="w-[1px] h-3 bg-white/80 rounded-full" />
                  </div>

                  <ClipKeyframes clip={clip} trackType="video" playheadTime={playheadTime} zoomLevel={zoomLevel} />

                  {/* Clip Label */}
                  <div className="flex-1 px-2 flex flex-col justify-center truncate pointer-events-none">
                    <span className="text-[11px] font-semibold text-white truncate drop-shadow-md">
                      {clip.name || `Video ${idx + 1}`}
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
                    className="clip-handle w-2.5 h-full hover:bg-violet-300 bg-violet-400/20 flex items-center justify-center cursor-ew-resize transition-colors z-20"
                    title="Drag to trim end"
                  >
                    <div className="w-[1px] h-3 bg-white/80 rounded-full" />
                  </div>
                </div>
              );
            })}

            {/* Visual Transitions between Adjacent Clips */}
            {(project.transitions || []).map((trans) => {
              const fromClip = project.tracks.videoTrack.find((c) => c.id === trans.fromClipId);
              const toClip = project.tracks.videoTrack.find((c) => c.id === trans.toClipId);
              if (!fromClip || !toClip) return null;

              const cutTime = fromClip.end;
              const duration = trans.duration || 0.5;
              const isSelected = selectedItem?.type === "transition" && selectedItem?.id === trans.id;

              let startWindow = cutTime - duration / 2;
              if (trans.alignment === "start") startWindow = cutTime;
              else if (trans.alignment === "end") startWindow = cutTime - duration;

              const left = timeToPixels(startWindow);
              const width = Math.max(36, timeToPixels(duration));

              return (
                <div
                  key={trans.id}
                  data-testid={`transition-badge-${trans.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem({ type: "transition", id: trans.id });
                  }}
                  className={cn(
                    "absolute top-1 bottom-1 z-30 rounded-md border flex items-center justify-center px-1.5 cursor-pointer transition-all shadow-md backdrop-blur-sm group select-none",
                    isSelected
                      ? "bg-amber-500/85 border-amber-300 text-black ring-2 ring-amber-400 font-bold"
                      : "bg-neutral-900/90 border-amber-500/60 text-amber-300 hover:bg-amber-950/90 hover:border-amber-400"
                  )}
                  style={{ left: `${left}px`, width: `${width}px` }}
                  title={`Transition: ${trans.preset} (${duration}s)`}
                >
                  <div className="flex items-center gap-1 text-[10px] pointer-events-none truncate">
                    <Sparkles className={cn("w-3 h-3 shrink-0", isSelected ? "text-black" : "text-amber-400")} />
                    <span className="truncate uppercase font-mono tracking-tighter text-[9px]">
                      {trans.preset.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TRACK 2: Background Music & Audio Track */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
              setDropTargetTrack("audio");
            }}
            onDragLeave={() => setDropTargetTrack(null)}
            onDrop={(e) => handleTrackDrop(e, "audio")}
            className={cn(
              "my-1.5 relative h-9 border-y bg-neutral-950/40 flex items-center transition-colors",
              dropTargetTrack === "audio"
                ? "border-cyan-400 bg-cyan-500/10 ring-1 ring-cyan-400/50"
                : "border-neutral-900"
            )}
          >
            {(project.tracks.audioTrack || []).length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-neutral-600 pointer-events-none italic">
                Drag audio tracks here
              </div>
            )}

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
                      ? "bg-cyan-500 border-cyan-200 text-black ring-2 ring-cyan-300 z-10 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                      : "bg-[#06b6d4]/85 border-cyan-400/50 text-black hover:bg-cyan-400",
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
                    className="clip-handle w-2.5 h-full hover:bg-cyan-300 bg-cyan-600/20 flex items-center justify-center cursor-ew-resize transition-colors z-20 absolute left-0 top-0 bottom-0"
                    title="Drag to trim start"
                  >
                    <div className="w-[1px] h-3 bg-black/60 rounded-full pointer-events-none" />
                  </div>

                  <ClipKeyframes clip={audio} trackType="audio" playheadTime={playheadTime} zoomLevel={zoomLevel} />
                  <span className="truncate flex-1 text-center px-3 pointer-events-none font-medium">{audio.name || "Audio"}</span>

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
                    className="clip-handle w-2.5 h-full hover:bg-cyan-300 bg-cyan-600/20 flex items-center justify-center cursor-ew-resize transition-colors z-20 absolute right-0 top-0 bottom-0"
                    title="Drag to trim end"
                  >
                    <div className="w-[1px] h-3 bg-black/60 rounded-full pointer-events-none" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* TRACK 3: Overlay (B-Roll & Graphics Track) */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
              setDropTargetTrack("broll");
            }}
            onDragLeave={() => setDropTargetTrack(null)}
            onDrop={(e) => handleTrackDrop(e, "broll")}
            className={cn(
              "my-1.5 relative h-9 border-y bg-neutral-950/40 flex items-center transition-colors",
              dropTargetTrack === "broll"
                ? "border-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-400/50"
                : "border-neutral-900"
            )}
          >
            {/* Render B-Roll Clips */}
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
                    "clip-item absolute h-7 rounded-md border flex items-center px-2 text-xs font-semibold truncate cursor-pointer transition-all shadow-sm",
                    isSelected
                      ? "bg-emerald-500 border-emerald-200 text-black ring-2 ring-emerald-300 z-10 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                      : "bg-[#10b981]/85 border-emerald-400/50 text-black hover:bg-emerald-400",
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
                    className="clip-handle w-2.5 h-full hover:bg-emerald-300 bg-emerald-600/20 flex items-center justify-center cursor-ew-resize transition-colors z-20 absolute left-0 top-0 bottom-0"
                    title="Drag to trim start"
                  >
                    <div className="w-[1px] h-3 bg-black/60 rounded-full pointer-events-none" />
                  </div>

                  <ClipKeyframes clip={broll} trackType="broll" playheadTime={playheadTime} zoomLevel={zoomLevel} />
                  <span className="truncate flex-1 text-center px-3 pointer-events-none font-medium">{broll.name || "Overlay"}</span>

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
                    className="clip-handle w-2.5 h-full hover:bg-emerald-300 bg-emerald-600/20 flex items-center justify-center cursor-ew-resize transition-colors z-20 absolute right-0 top-0 bottom-0"
                    title="Drag to trim end"
                  >
                    <div className="w-[1px] h-3 bg-black/60 rounded-full pointer-events-none" />
                  </div>
                </div>
              );
            })}

            {/* Render Motion Graphics & Visual Effects */}
            {(project.tracks.graphicsTrack || []).map((graphic) => {
              const { tempStart, tempEnd } = getRenderTimes(graphic.id, graphic.start, graphic.end);
              const isMoving = movingClip?.id === graphic.id;
              const deltaX = isMoving ? movingClip.currentX - movingClip.initialX : 0;
              const left = timeToPixels(tempStart) + deltaX;
              const width = Math.max(20, timeToPixels(tempEnd - tempStart));
              const isSelected = selectedItem?.id === graphic.id;
              const isEffect = isEffectGraphic(graphic);

              return (
                <div
                  key={graphic.id}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSelectedItem({ type: "graphic", id: graphic.id });
                    setMovingClip({
                      id: graphic.id,
                      type: "graphic",
                      initialStart: graphic.start,
                      initialEnd: graphic.end,
                      initialX: e.clientX,
                      currentX: e.clientX,
                    });
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                  }}
                  className={cn(
                    "clip-item absolute h-7 rounded-md border flex items-center px-2 text-xs font-semibold truncate cursor-pointer transition-all shadow-sm",
                    isSelected
                      ? "bg-emerald-400 border-white text-black ring-2 ring-emerald-300 z-10 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                      : "bg-emerald-600/80 border-emerald-400/50 text-white hover:bg-emerald-500",
                    isMoving && "opacity-75 z-50 cursor-grabbing scale-[1.02]"
                  )}
                  style={{ left: `${left}px`, width: `${width}px` }}
                >
                  <span className="truncate flex-1 text-center px-1 pointer-events-none">
                    {graphic.name || (isEffect ? `FX: ${graphic.props?.effectType || "Overlay"}` : graphic.compositionId)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* TRACK 4: Captions & Text Track */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
              setDropTargetTrack("caption");
            }}
            onDragLeave={() => setDropTargetTrack(null)}
            onDrop={(e) => handleTrackDrop(e, "caption")}
            className={cn(
              "my-1.5 relative h-9 border-y bg-neutral-950/40 flex items-center transition-colors",
              dropTargetTrack === "caption"
                ? "border-amber-400 bg-amber-500/10 ring-1 ring-amber-400/50"
                : "border-neutral-900"
            )}
          >
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
                      ? "bg-amber-500 border-amber-200 text-black ring-2 ring-amber-300 z-10 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                      : "bg-[#f59e0b]/85 border-amber-400/50 text-black hover:bg-amber-400",
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
                    className="clip-handle w-2.5 h-full hover:bg-amber-300 bg-amber-600/20 flex items-center justify-center cursor-ew-resize transition-colors z-20 absolute left-0 top-0 bottom-0"
                    title="Drag to trim start"
                  >
                    <div className="w-[1px] h-3 bg-black/60 rounded-full pointer-events-none" />
                  </div>

                  <ClipKeyframes clip={caption} trackType="caption" playheadTime={playheadTime} zoomLevel={zoomLevel} />
                  <span className="truncate flex-1 text-center px-3 pointer-events-none font-medium">{caption.text}</span>

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
                    className="clip-handle w-2.5 h-full hover:bg-amber-300 bg-amber-600/20 flex items-center justify-center cursor-ew-resize transition-colors z-20 absolute right-0 top-0 bottom-0"
                    title="Drag to trim end"
                  >
                    <div className="w-[1px] h-3 bg-black/60 rounded-full pointer-events-none" />
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
