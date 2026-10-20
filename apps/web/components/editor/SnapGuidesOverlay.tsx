"use client";

import React from "react";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { useShallow } from "zustand/react/shallow";

export function SnapGuidesOverlay() {
  const activeSnapGuides = useTimelineStore(
    useShallow((state) => state.activeSnapGuides)
  );

  if (!activeSnapGuides || activeSnapGuides.length === 0) {
    return null;
  }

  const hasCenterV = activeSnapGuides.some(
    (g) => g.orientation === "vertical" && g.position === 50
  );
  const hasCenterH = activeSnapGuides.some(
    (g) => g.orientation === "horizontal" && g.position === 50
  );
  const hasCenterCrosshair = hasCenterV && hasCenterH;

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {activeSnapGuides.map((guide) => {
        if (guide.orientation === "vertical") {
          return (
            <div
              key={guide.id}
              className="absolute top-0 bottom-0 pointer-events-none flex flex-col justify-between items-center"
              style={{ left: `${guide.position}%` }}
            >
              <div className="w-[1.5px] h-full bg-cyan-400/90 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              {guide.label && (
                <span className="absolute top-2 px-1.5 py-0.5 rounded bg-neutral-950/90 border border-cyan-400 text-cyan-300 font-mono text-[9px] -translate-x-1/2 shadow-lg">
                  {guide.label}
                </span>
              )}
            </div>
          );
        }

        if (guide.orientation === "horizontal") {
          return (
            <div
              key={guide.id}
              className="absolute left-0 right-0 pointer-events-none flex justify-between items-center"
              style={{ top: `${guide.position}%` }}
            >
              <div className="h-[1.5px] w-full bg-cyan-400/90 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              {guide.label && (
                <span className="absolute left-2 px-1.5 py-0.5 rounded bg-neutral-950/90 border border-cyan-400 text-cyan-300 font-mono text-[9px] -translate-y-1/2 shadow-lg">
                  {guide.label}
                </span>
              )}
            </div>
          );
        }

        return null;
      })}

      {hasCenterCrosshair && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-cyan-400 flex items-center justify-center bg-cyan-950/80 shadow-[0_0_12px_rgba(34,211,238,1)] animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
        </div>
      )}
    </div>
  );
}
