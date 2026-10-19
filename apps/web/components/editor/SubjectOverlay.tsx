"use client";

import React from "react";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { useShallow } from "zustand/react/shallow";
import { filterActiveSafeZones } from "@/lib/layout/subject-avoidance";
import { SubjectSafeZone } from "@/lib/timeline-types";
import { UserCheck, ShieldAlert } from "lucide-react";

const EMPTY_SAFE_ZONES: SubjectSafeZone[] = [];

export function SubjectOverlay() {
  const { subjectOverlayVisible, safeZones, playheadTime } = useTimelineStore(
    useShallow((state) => ({
      subjectOverlayVisible: state.subjectOverlayVisible,
      safeZones: state.project.safeZones ?? EMPTY_SAFE_ZONES,
      playheadTime: state.playheadTime,
    }))
  );

  if (!subjectOverlayVisible) {
    return null;
  }

  const activeZones = filterActiveSafeZones(safeZones, playheadTime);

  return (
    <div
      data-testid="subject-overlay-container"
      className="absolute inset-0 pointer-events-none z-35 overflow-hidden"
    >
      {/* Top Status Pill */}
      <div className="absolute top-2 left-2 z-40 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-950/85 backdrop-blur-md border border-emerald-500/40 text-[10px] font-mono text-emerald-300 shadow-xl">
        <UserCheck className="w-3 h-3 text-emerald-400" />
        <span>PRESENTER SAFE ZONES: {activeZones.length > 0 ? "DETECTED" : "SCANNING"}</span>
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            activeZones.length > 0 ? "bg-emerald-400 animate-pulse" : "bg-neutral-500"
          }`}
        />
      </div>

      {/* Render active subject bounding boxes */}
      {activeZones.map((sz) => {
        const confidencePct = Math.round((sz.confidence ?? 1.0) * 100);
        return (
          <div
            key={sz.id}
            data-testid={`subject-safe-zone-${sz.id}`}
            style={{
              left: `${sz.x}%`,
              top: `${sz.y}%`,
              width: `${sz.width}%`,
              height: `${sz.height}%`,
            }}
            className="absolute border-2 border-dashed border-emerald-400/80 bg-emerald-500/10 rounded-xl transition-all duration-100 flex flex-col justify-between p-1.5"
          >
            {/* Corner Targeting Accents */}
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-emerald-400" />

            {/* Header Badge */}
            <div className="self-start flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/50 text-[9px] font-mono font-bold text-emerald-300 shadow-md">
              <ShieldAlert className="w-2.5 h-2.5 text-emerald-400" />
              <span>AVOIDANCE AREA ({confidencePct}%)</span>
            </div>

            {/* Subtle center crosshair */}
            <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
              <div className="w-4 h-[1px] bg-emerald-400" />
              <div className="h-4 w-[1px] bg-emerald-400 -ml-2" />
            </div>

            {/* Footer Tag */}
            <div className="self-end text-[8px] font-mono text-emerald-400/90 bg-black/60 px-1 rounded">
              DO NOT OCCUPY
            </div>
          </div>
        );
      })}
    </div>
  );
}
