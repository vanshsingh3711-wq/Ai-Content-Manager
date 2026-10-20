"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { evaluatePropertyAtTime, hasAnyKeyframes } from "@/lib/keyframes";
import { calculateSnapping, calculateRotationSnapping } from "@/lib/editor/snapping";

export type ResizeHandleType = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

interface TransformableOverlayProps {
  id: string;
  type: "video" | "broll" | "caption" | "graphic";
  clip: any; // Passing the whole clip to access keyframes
  position?: { x: number; y: number };
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
  clip,
  position,
  positionX,
  positionY,
  scale = 1.0,
  rotation = 0,
  isSelected,
  children,
}: TransformableOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const resolvedPosition = position ?? {
    x: positionX ?? clip?.position?.x ?? 50,
    y: positionY ?? clip?.position?.y ?? (type === "caption" ? 75 : 50),
  };

  // Interpolate values based on playheadTime and clip keyframes
  const playheadTime = useTimelineStore((state) => state.playheadTime);
  const localTime = playheadTime - (clip?.start || 0);

  const currentPos = evaluatePropertyAtTime(clip?.animation, "position", localTime, resolvedPosition);
  const currentScale = evaluatePropertyAtTime(clip?.animation, "scale", localTime, scale);
  const currentRotation = evaluatePropertyAtTime(clip?.animation, "rotation", localTime, rotation);

  // Body Drag with 1.5% Magnetic Snapping & isUserLocked mark
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    const store = useTimelineStore.getState();
    store.setSelectedItem({ type: type as any, id });

    const startX = typeof e.clientX === "number" ? e.clientX : 0;
    const startY = typeof e.clientY === "number" ? e.clientY : 0;
    const initialPosX = typeof currentPos?.x === "number" ? currentPos.x : 50;
    const initialPosY = typeof currentPos?.y === "number" ? currentPos.y : 50;

    const parentNode = containerRef.current?.parentElement;
    const parentWidth = parentNode?.clientWidth || 500;
    const parentHeight = parentNode?.clientHeight || 500;

    let hasMoved = false;

    const handlePointerMove = (moveEv: PointerEvent) => {
      hasMoved = true;
      const moveX = typeof moveEv.clientX === "number" ? moveEv.clientX : startX;
      const moveY = typeof moveEv.clientY === "number" ? moveEv.clientY : startY;
      const deltaX = moveX - startX;
      const deltaY = moveY - startY;

      const rawPosX = initialPosX + (deltaX / parentWidth) * 100;
      const rawPosY = initialPosY + (deltaY / parentHeight) * 100;

      // Calculate magnetic snapping (1.5% threshold)
      const snapResult = calculateSnapping(rawPosX, rawPosY, { threshold: 1.5 });
      const newPosX = snapResult.x;
      const newPosY = snapResult.y;

      // Broadcast active snap guides to viewport overlay
      useTimelineStore.getState().setActiveSnapGuides(snapResult.guides);

      const currentStore = useTimelineStore.getState();
      const currentLocalTime = currentStore.playheadTime - (clip?.start || 0);

      const updateWithKeyframes = (updateFn: Function) => {
        if (hasAnyKeyframes(clip?.animation, "position")) {
          currentStore.setKeyframe(type, id, "position", currentLocalTime, { x: newPosX, y: newPosY }, false);
          updateFn(id, { position: { x: newPosX, y: newPosY }, positionX: newPosX, positionY: newPosY, isUserLocked: true }, false);
        } else {
          updateFn(id, { position: { x: newPosX, y: newPosY }, positionX: newPosX, positionY: newPosY, isUserLocked: true }, false);
        }
      };

      if (type === "video") updateWithKeyframes(currentStore.updateVideoClip);
      if (type === "broll") updateWithKeyframes(currentStore.updateBRollClip);
      if (type === "caption") updateWithKeyframes(currentStore.updateCaption);
      if (type === "graphic") updateWithKeyframes(currentStore.updateGraphicElement);
    };

    const handlePointerUp = () => {
      useTimelineStore.getState().setActiveSnapGuides([]);
      if (hasMoved) {
        useTimelineStore.getState().commitHistory();
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // 8-Point Bounding Box Resizing with isUserLocked mark
  const handleResizePointerDown = (e: React.PointerEvent, handle: ResizeHandleType) => {
    e.stopPropagation();
    e.preventDefault();
    const store = useTimelineStore.getState();
    store.setSelectedItem({ type: type as any, id });

    const startX = typeof e.clientX === "number" ? e.clientX : 0;
    const startY = typeof e.clientY === "number" ? e.clientY : 0;
    const initialScale = typeof currentScale === "number" ? currentScale : 1.0;

    let hasResized = false;

    const handlePointerMove = (moveEv: PointerEvent) => {
      hasResized = true;
      const moveX = typeof moveEv.clientX === "number" ? moveEv.clientX : startX;
      const moveY = typeof moveEv.clientY === "number" ? moveEv.clientY : startY;
      const deltaX = moveX - startX;
      const deltaY = moveY - startY;

      let scaleDelta = 0;
      switch (handle) {
        case "se":
          scaleDelta = (deltaX + deltaY) / 2;
          break;
        case "nw":
          scaleDelta = (-deltaX - deltaY) / 2;
          break;
        case "ne":
          scaleDelta = (deltaX - deltaY) / 2;
          break;
        case "sw":
          scaleDelta = (-deltaX + deltaY) / 2;
          break;
        case "e":
          scaleDelta = deltaX;
          break;
        case "w":
          scaleDelta = -deltaX;
          break;
        case "s":
          scaleDelta = deltaY;
          break;
        case "n":
          scaleDelta = -deltaY;
          break;
      }

      const newScale = Math.max(0.1, Math.min(10, Number((initialScale + scaleDelta * 0.01).toFixed(3))));

      const currentStore = useTimelineStore.getState();
      const currentLocalTime = currentStore.playheadTime - (clip?.start || 0);

      const updateWithKeyframes = (updateFn: Function) => {
        if (hasAnyKeyframes(clip?.animation, "scale")) {
          currentStore.setKeyframe(type, id, "scale", currentLocalTime, newScale, false);
          updateFn(id, { scale: newScale, isUserLocked: true }, false);
        } else {
          updateFn(id, { scale: newScale, isUserLocked: true }, false);
        }
      };

      if (type === "video") updateWithKeyframes(currentStore.updateVideoClip);
      if (type === "broll") updateWithKeyframes(currentStore.updateBRollClip);
      if (type === "caption") updateWithKeyframes(currentStore.updateCaption);
      if (type === "graphic") updateWithKeyframes(currentStore.updateGraphicElement);
    };

    const handlePointerUp = () => {
      if (hasResized) {
        useTimelineStore.getState().commitHistory();
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // Rotation Knob with 4° Magnetic Snapping & isUserLocked mark
  const handleRotatePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const store = useTimelineStore.getState();
    store.setSelectedItem({ type: type as any, id });

    const elem = containerRef.current;
    if (!elem) return;

    const rect = elem.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let hasRotated = false;

    const handlePointerMove = (moveEv: PointerEvent) => {
      hasRotated = true;
      const moveX = typeof moveEv.clientX === "number" ? moveEv.clientX : centerX;
      const moveY = typeof moveEv.clientY === "number" ? moveEv.clientY : centerY;
      const rad = Math.atan2(moveY - centerY, moveX - centerX);
      let deg = (rad * 180) / Math.PI;
      // Offset by 90deg because rotation stem is at top-center
      deg = deg + 90;

      const snapResult = calculateRotationSnapping(deg, 4.0);
      const newRotation = snapResult.angle;

      const currentStore = useTimelineStore.getState();
      const currentLocalTime = currentStore.playheadTime - (clip?.start || 0);

      const updateWithKeyframes = (updateFn: Function) => {
        if (hasAnyKeyframes(clip?.animation, "rotation")) {
          currentStore.setKeyframe(type, id, "rotation", currentLocalTime, newRotation, false);
          updateFn(id, { rotation: newRotation, isUserLocked: true }, false);
        } else {
          updateFn(id, { rotation: newRotation, isUserLocked: true }, false);
        }
      };

      if (type === "video") updateWithKeyframes(currentStore.updateVideoClip);
      if (type === "broll") updateWithKeyframes(currentStore.updateBRollClip);
      if (type === "caption") updateWithKeyframes(currentStore.updateCaption);
      if (type === "graphic") updateWithKeyframes(currentStore.updateGraphicElement);
    };

    const handlePointerUp = () => {
      if (hasRotated) {
        useTimelineStore.getState().commitHistory();
      }
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
      data-testid={`transformable-overlay-${id}`}
      className={cn(
        "absolute flex items-center justify-center transition-none cursor-grab active:cursor-grabbing select-none",
        isSelected
          ? "ring-2 ring-cyan-400 rounded-sm z-50 shadow-[0_0_15px_rgba(34,211,238,0.25)]"
          : "hover:ring-1 hover:ring-white/50"
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
      {/* Content wrapper */}
      <div className={cn("w-full h-full pointer-events-none flex items-center justify-center")}>
        {children}
      </div>

      {isSelected && (
        <>
          {/* Rotation Stem and Knob */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
            <div
              data-handle="rotation"
              className="w-4 h-4 rounded-full bg-cyan-400 border-2 border-neutral-900 shadow-md cursor-grab active:cursor-grabbing hover:scale-125 transition-transform flex items-center justify-center"
              title="Drag to rotate (Snaps at 0°, 45°, 90°, 180°)"
              onPointerDown={handleRotatePointerDown}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-950" />
            </div>
            <div className="w-[1.5px] h-3 bg-cyan-400" />
          </div>

          {/* 4 Corner Resize Handles */}
          <div
            data-handle="nw"
            className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-sm border-2 border-cyan-500 cursor-nwse-resize shadow-md hover:scale-125 transition-transform pointer-events-auto z-10"
            title="Resize NW"
            onPointerDown={(e) => handleResizePointerDown(e, "nw")}
          />
          <div
            data-handle="ne"
            className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-sm border-2 border-cyan-500 cursor-nesw-resize shadow-md hover:scale-125 transition-transform pointer-events-auto z-10"
            title="Resize NE"
            onPointerDown={(e) => handleResizePointerDown(e, "ne")}
          />
          <div
            data-handle="se"
            className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white rounded-sm border-2 border-cyan-500 cursor-nwse-resize shadow-md hover:scale-125 transition-transform pointer-events-auto z-10"
            title="Resize SE"
            onPointerDown={(e) => handleResizePointerDown(e, "se")}
          />
          <div
            data-handle="sw"
            className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white rounded-sm border-2 border-cyan-500 cursor-nesw-resize shadow-md hover:scale-125 transition-transform pointer-events-auto z-10"
            title="Resize SW"
            onPointerDown={(e) => handleResizePointerDown(e, "sw")}
          />

          {/* 4 Edge Resize Handles */}
          <div
            data-handle="n"
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-sm border-2 border-cyan-500 cursor-ns-resize shadow-md hover:scale-125 transition-transform pointer-events-auto z-10"
            title="Resize N"
            onPointerDown={(e) => handleResizePointerDown(e, "n")}
          />
          <div
            data-handle="s"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white rounded-sm border-2 border-cyan-500 cursor-ns-resize shadow-md hover:scale-125 transition-transform pointer-events-auto z-10"
            title="Resize S"
            onPointerDown={(e) => handleResizePointerDown(e, "s")}
          />
          <div
            data-handle="e"
            className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-sm border-2 border-cyan-500 cursor-ew-resize shadow-md hover:scale-125 transition-transform pointer-events-auto z-10"
            title="Resize E"
            onPointerDown={(e) => handleResizePointerDown(e, "e")}
          />
          <div
            data-handle="w"
            className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-sm border-2 border-cyan-500 cursor-ew-resize shadow-md hover:scale-125 transition-transform pointer-events-auto z-10"
            title="Resize W"
            onPointerDown={(e) => handleResizePointerDown(e, "w")}
          />
        </>
      )}
    </div>
  );
}

