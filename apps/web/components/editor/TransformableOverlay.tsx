"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";

interface TransformableOverlayProps {
  id: string;
  type: "video" | "broll" | "caption";
  positionX?: number;
  positionY?: number;
  scale?: number;
  rotation?: number;
  isSelected: boolean;
  children: React.ReactNode;
}

export function TransformableOverlay({
  id,
  type,
  positionX = 50,
  positionY = 50,
  scale = 1.0,
  rotation = 0,
  isSelected,
  children,
}: TransformableOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    useTimelineStore.getState().setSelectedItem({ type: type as any, id });

    const startX = e.clientX;
    const startY = e.clientY;
    const initialPosX = positionX;
    const initialPosY = positionY;

    // We calculate movement as a percentage of the parent viewport size
    const parentNode = containerRef.current?.parentElement;
    const parentWidth = parentNode?.clientWidth || 500;
    const parentHeight = parentNode?.clientHeight || 500;

    const handlePointerMove = (moveEv: PointerEvent) => {
      const deltaX = moveEv.clientX - startX;
      const deltaY = moveEv.clientY - startY;

      const newPosX = initialPosX + (deltaX / parentWidth) * 100;
      const newPosY = initialPosY + (deltaY / parentHeight) * 100;

      const store = useTimelineStore.getState();
      if (type === "video") store.updateVideoClip(id, { positionX: newPosX, positionY: newPosY });
      if (type === "broll") store.updateBRollClip(id, { positionX: newPosX, positionY: newPosY });
      if (type === "caption") store.updateCaption(id, { positionX: newPosX, positionY: newPosY });
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const handleScalePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    useTimelineStore.getState().setSelectedItem({ type: type as any, id });

    const startX = e.clientX;
    const initialScale = scale;

    const handlePointerMove = (moveEv: PointerEvent) => {
      const deltaX = moveEv.clientX - startX;
      // 100 pixels = 1.0 scale change
      const newScale = Math.max(0.1, initialScale + deltaX * 0.01);

      const store = useTimelineStore.getState();
      if (type === "video") store.updateVideoClip(id, { scale: newScale });
      if (type === "broll") store.updateBRollClip(id, { scale: newScale });
      if (type === "caption") store.updateCaption(id, { scale: newScale });
    };

    const handlePointerUp = () => {
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
        left: `${positionX}%`,
        top: `${positionY}%`,
        width: isVideoType ? "100%" : "auto",
        height: isVideoType ? "100%" : "auto",
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
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
