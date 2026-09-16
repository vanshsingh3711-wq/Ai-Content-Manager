"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { evaluatePropertyAtTime, hasAnyKeyframes } from "@/lib/keyframes";

interface TransformableOverlayProps {
  id: string;
  type: "video" | "broll" | "caption";
  clip: any; // Passing the whole clip to access keyframes
  position?: {x: number, y: number};
  scale?: number;
  rotation?: number;
  isSelected: boolean;
  children: React.ReactNode;
}

export function TransformableOverlay({
  id,
  type,
  clip,
  position = { x: 50, y: type === 'caption' ? 75 : 50 },
  scale = 1.0,
  rotation = 0,
  isSelected,
  children,
}: TransformableOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Interpolate values based on playheadTime and clip keyframes
  const playheadTime = useTimelineStore((state) => state.playheadTime);
  const localTime = playheadTime - (clip?.start || 0);
  
  const currentPos = evaluatePropertyAtTime(clip?.animation, "position", localTime, position);
  const currentScale = evaluatePropertyAtTime(clip?.animation, "scale", localTime, scale);
  const currentRotation = evaluatePropertyAtTime(clip?.animation, "rotation", localTime, rotation);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    const store = useTimelineStore.getState();
    store.setSelectedItem({ type: type as any, id });

    const startX = e.clientX;
    const startY = e.clientY;
    const initialPosX = currentPos.x;
    const initialPosY = currentPos.y;

    const parentNode = containerRef.current?.parentElement;
    const parentWidth = parentNode?.clientWidth || 500;
    const parentHeight = parentNode?.clientHeight || 500;

    const handlePointerMove = (moveEv: PointerEvent) => {
      const deltaX = moveEv.clientX - startX;
      const deltaY = moveEv.clientY - startY;

      const newPosX = initialPosX + (deltaX / parentWidth) * 100;
      const newPosY = initialPosY + (deltaY / parentHeight) * 100;

      const currentStore = useTimelineStore.getState();
      const currentLocalTime = currentStore.playheadTime - clip.start;
      
      const updateWithKeyframes = (updateFn: Function) => {
        if (hasAnyKeyframes(clip.animation, "position")) {
          currentStore.setKeyframe(type, id, "position", currentLocalTime, { x: newPosX, y: newPosY }, false);
        } else {
          updateFn(id, { position: { x: newPosX, y: newPosY } }, false);
        }
      };

      if (type === "video") updateWithKeyframes(currentStore.updateVideoClip);
      if (type === "broll") updateWithKeyframes(currentStore.updateBRollClip);
      if (type === "caption") updateWithKeyframes(currentStore.updateCaption);
    };

    const handlePointerUp = () => {
      useTimelineStore.getState().commitHistory();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const handleScalePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const store = useTimelineStore.getState();
    store.setSelectedItem({ type: type as any, id });

    const startX = e.clientX;
    const initialScale = currentScale;

    const handlePointerMove = (moveEv: PointerEvent) => {
      const deltaX = moveEv.clientX - startX;
      const newScale = Math.max(0.1, initialScale + deltaX * 0.01);

      const currentStore = useTimelineStore.getState();
      const currentLocalTime = currentStore.playheadTime - clip.start;

      const updateWithKeyframes = (updateFn: Function) => {
        if (hasAnyKeyframes(clip.animation, "scale")) {
          currentStore.setKeyframe(type, id, "scale", currentLocalTime, newScale, false);
        } else {
          updateFn(id, { scale: newScale }, false);
        }
      };

      if (type === "video") updateWithKeyframes(currentStore.updateVideoClip);
      if (type === "broll") updateWithKeyframes(currentStore.updateBRollClip);
      if (type === "caption") updateWithKeyframes(currentStore.updateCaption);
    };

    const handlePointerUp = () => {
      useTimelineStore.getState().commitHistory();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const isVideoType = type === "video" || type === "broll";

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute flex items-center justify-center transition-none cursor-grab active:cursor-grabbing",
        isSelected ? "ring-2 ring-indigo-500 rounded-sm z-50" : "hover:ring-1 hover:ring-white/50"
      )}
      style={{
        left: `${currentPos.x}%`,
        top: `${currentPos.y}%`,
        width: isVideoType ? "100%" : "auto",
        height: isVideoType ? "100%" : "auto",
        transform: `translate(-50%, -50%) scale(${currentScale}) rotate(${currentRotation}deg)`,
      }}
      onPointerDown={handlePointerDown}
    >
      {/* Content wrapper to isolate child events if necessary */}
      <div className={cn("w-full h-full pointer-events-none flex items-center justify-center")}>
        {children}
      </div>

      {isSelected && (
        <>
          {/* Scale Handle (Bottom Right) */}
          <div
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white cursor-nwse-resize shadow-md"
            onPointerDown={handleScalePointerDown}
          />
        </>
      )}
    </div>
  );
}
