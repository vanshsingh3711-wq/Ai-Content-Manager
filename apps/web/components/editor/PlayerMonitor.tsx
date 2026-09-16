"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Diamond,
} from "lucide-react";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { useShallow } from "zustand/react/shallow";
import { AspectRatio } from "@/lib/timeline-types";
import { cn } from "@/lib/utils";
import { TransformableOverlay } from "./TransformableOverlay";
import { evaluatePropertyAtTime, getExactKeyframe } from "@/lib/keyframes";

export function PlayerMonitor() {
  const {
    project,
    playheadTime,
    isPlaying,
    safeZoneVisible,
    selectedItem,
    setPlayheadTime,
    setIsPlaying,
    togglePlay,
    setKeyframe,
    removeKeyframe,
  } = useTimelineStore(useShallow((state) => ({
    project: state.project,
    playheadTime: state.playheadTime,
    isPlaying: state.isPlaying,
    safeZoneVisible: state.safeZoneVisible,
    selectedItem: state.selectedItem,
    setPlayheadTime: state.setPlayheadTime,
    setIsPlaying: state.setIsPlaying,
    togglePlay: state.togglePlay,
    setKeyframe: state.setKeyframe,
    removeKeyframe: state.removeKeyframe,
  })));

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const brollVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Find the active main video clip at current playhead
  const activeVideoClip = project.tracks.videoTrack.find(
    (c) => playheadTime >= c.start && playheadTime < c.end
  );

  // Derive active B-Roll clip directly
  const activeBroll = project.tracks.brollTrack.find(
    (b) => playheadTime >= b.start && playheadTime < b.end
  ) || null;

  // Derive active Caption block directly
  const activeCaption = project.tracks.textTrack.find(
    (t) => playheadTime >= t.start && playheadTime < t.end
  ) || null;

  // Global keyframe detection and toggling
  let activeSelectedClip: any = null;
  if (selectedItem) {
    if (selectedItem.type === "video") activeSelectedClip = project.tracks.videoTrack.find((c) => c.id === selectedItem.id);
    else if (selectedItem.type === "broll") activeSelectedClip = project.tracks.brollTrack.find((c) => c.id === selectedItem.id);
    else if (selectedItem.type === "caption") activeSelectedClip = project.tracks.textTrack.find((c) => c.id === selectedItem.id);
  }

  const selectedLocalTime = activeSelectedClip ? playheadTime - activeSelectedClip.start : 0;
  const isSelectedOutOfBounds = activeSelectedClip ? selectedLocalTime < 0 || selectedLocalTime > (activeSelectedClip.end - activeSelectedClip.start) : true;
  
  const hasTransformKeyframe = activeSelectedClip && !isSelectedOutOfBounds && (
    getExactKeyframe(activeSelectedClip.animation, "scale", selectedLocalTime) ||
    getExactKeyframe(activeSelectedClip.animation, "position", selectedLocalTime)
  );

  const toggleGlobalKeyframe = () => {
    if (!activeSelectedClip || !selectedItem || isSelectedOutOfBounds) return;
    
    if (hasTransformKeyframe) {
      removeKeyframe(selectedItem.type, activeSelectedClip.id, "scale", selectedLocalTime);
      removeKeyframe(selectedItem.type, activeSelectedClip.id, "position", selectedLocalTime);
    } else {
      const currentScale = evaluatePropertyAtTime(activeSelectedClip.animation, "scale", selectedLocalTime, activeSelectedClip.scale ?? 1.0);
      const currentPos = evaluatePropertyAtTime(activeSelectedClip.animation, "position", selectedLocalTime, activeSelectedClip.position ?? {x: 50, y: 50});
      
      setKeyframe(selectedItem.type, activeSelectedClip.id, "scale", selectedLocalTime, currentScale, false);
      setKeyframe(selectedItem.type, activeSelectedClip.id, "position", selectedLocalTime, currentPos, true);
    }
  };

  // Sync HTML5 video currentTime with store playheadTime using fast hardware seeking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (activeVideoClip) {
      // Calculate source time based on clip offset
      const clipOffset = (playheadTime - activeVideoClip.start) * (activeVideoClip.speed || 1);
      const targetSourceTime = Math.max(0, activeVideoClip.sourceStart + clipOffset);

      // Force a seek if difference is large
      if (Math.abs(video.currentTime - targetSourceTime) > 0.15) {
        // CapCut-style hardware keyframe seeking (bypasses full frame decode for 60fps scrubbing)
        if ("fastSeek" in video && typeof (video as any).fastSeek === "function") {
          try {
            (video as any).fastSeek(targetSourceTime);
          } catch {
            video.currentTime = targetSourceTime;
          }
        } else {
          video.currentTime = targetSourceTime;
        }
      }
      
      const localTime = playheadTime - activeVideoClip.start;
      const currentVolume = evaluatePropertyAtTime(activeVideoClip.animation, "volume", localTime, activeVideoClip.volume ?? 100);
      
      video.playbackRate = activeVideoClip.speed || 1;
      video.volume = currentVolume / 100;
    }
  }, [playheadTime, activeVideoClip]);

  // Play / Pause handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(() => {});
      if (brollVideoRef.current) brollVideoRef.current.play().catch(() => {});
    } else {
      video.pause();
      if (brollVideoRef.current) brollVideoRef.current.pause();
    }
  }, [isPlaying]);

  // Handle continuous playback clock driven by native playback
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const state = useTimelineStore.getState();
      if (!state.isPlaying) return;

      const video = videoRef.current;
      const activeClip = state.project.tracks.videoTrack.find(
        (c) => state.playheadTime >= c.start && state.playheadTime < c.end
      );

      if (video && !video.paused && activeClip) {
        // Source time to timeline time
        const clipOffset = (video.currentTime - activeClip.sourceStart) / (activeClip.speed || 1);
        const newPlayhead = activeClip.start + clipOffset;

        if (newPlayhead >= state.project.duration) {
          state.setPlayheadTime(0);
          state.setIsPlaying(false);
          return;
        } else if (Number.isFinite(newPlayhead) && Math.abs(newPlayhead - state.playheadTime) > 0.05) {
          state.setPlayheadTime(newPlayhead);
        }
      } else {
        // Fallback synthetic clock if no active video clip at position
        const delta = (now - lastTime) / 1000;
        const newPlayhead = state.playheadTime + delta;
        if (newPlayhead >= state.project.duration) {
          state.setPlayheadTime(0);
          state.setIsPlaying(false);
          return;
        } else {
          state.setPlayheadTime(newPlayhead);
        }
      }

      lastTime = now;
      animationFrameId = requestAnimationFrame(tick);
    };

    if (isPlaying) {
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying]);

  // Keyboard shortcut listener: Space to play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        setPlayheadTime(Math.max(0, playheadTime - (e.shiftKey ? 5 : 1)));
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        setPlayheadTime(Math.min(project.duration, playheadTime + (e.shiftKey ? 5 : 1)));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, playheadTime, project.duration, setPlayheadTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${millis}`;
  };

  // Compute aspect ratio styles
  const getAspectRatioClasses = (ratio: AspectRatio) => {
    switch (ratio) {
      case "9:16":
        return "h-full aspect-[9/16] max-h-[460px] md:max-h-[520px]";
      case "16:9":
        return "w-full aspect-[16/9] max-w-[620px]";
      case "1:1":
        return "h-full aspect-square max-h-[420px]";
      case "4:5":
        return "h-full aspect-[4/5] max-h-[460px]";
      default:
        return "h-full aspect-[9/16] max-h-[460px]";
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-2 md:p-4 bg-[#08090e] relative overflow-hidden select-none">
      {/* Viewport Frame */}
      <div
        onPointerDown={() => useTimelineStore.getState().setSelectedItem(null)}
        className={cn(
          "relative bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800/80 flex items-center justify-center transition-all duration-300",
          getAspectRatioClasses(project.aspectRatio)
        )}
      >
        {/* Main Video Layer */}
        {activeVideoClip ? (
          <TransformableOverlay
            id={activeVideoClip.id}
            type="video"
            clip={activeVideoClip}
            positionX={activeVideoClip.positionX ?? 50}
            positionY={activeVideoClip.positionY ?? 50}
            scale={activeVideoClip.scale ?? activeVideoClip.zoomFactor ?? 1.0}
            rotation={activeVideoClip.rotation ?? 0}
            isSelected={selectedItem?.id === activeVideoClip.id}
          >
            <video
              ref={videoRef}
              src={activeVideoClip.sourceUrl}
              muted={isMuted}
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
            />
          </TransformableOverlay>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <RotateCcw className="w-8 h-8 mb-2 animate-spin text-slate-400" />
            <p className="text-xs">No media at current timestamp</p>
          </div>
        )}

        {/* B-Roll Overlay Layer */}
        {activeBroll && (
          <TransformableOverlay
            id={activeBroll.id}
            type="broll"
            clip={activeBroll}
            positionX={activeBroll.positionX ?? 50}
            positionY={activeBroll.positionY ?? 50}
            scale={activeBroll.scale ?? 1.0}
            rotation={activeBroll.rotation ?? 0}
            isSelected={selectedItem?.id === activeBroll.id}
          >
            <div
              className="w-full h-full transition-opacity duration-200"
              style={{ opacity: evaluatePropertyAtTime(activeBroll.animation?.opacity, playheadTime - activeBroll.start, activeBroll.opacity ?? 100) / 100 }}
            >
              <video
                ref={brollVideoRef}
                src={activeBroll.sourceUrl}
                muted
                autoPlay
                loop
                playsInline
                className={cn(
                  "w-full h-full",
                  activeBroll.fitMode === "contain" ? "object-contain" : "object-cover"
                )}
              />
            </div>
          </TransformableOverlay>
        )}

        {/* Captions Overlay Layer */}
        {activeCaption && (
          <TransformableOverlay
            id={activeCaption.id}
            type="caption"
            clip={activeCaption}
            positionX={activeCaption.positionX ?? 50}
            positionY={activeCaption.positionY ?? 75}
            scale={activeCaption.scale ?? 1.0}
            rotation={activeCaption.rotation ?? 0}
            isSelected={selectedItem?.id === activeCaption.id}
          >
            <div className="flex justify-center transition-all duration-150">
              {activeCaption.stylePreset === "tiktok_yellow" && (
                <span className="font-extrabold uppercase tracking-wide text-center text-xl md:text-2xl text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] px-3 py-1 bg-black/50 backdrop-blur-xs rounded-lg border border-yellow-400/30">
                  {activeCaption.text}
                </span>
              )}
              {activeCaption.stylePreset === "hormozi_bold" && (
                <span className="font-black uppercase tracking-tight text-center text-2xl md:text-3xl text-white drop-shadow-[0_4px_8px_rgba(0,0,0,1)] px-4 py-1.5 bg-red-600 rounded-md border-2 border-white shadow-xl rotate-[-1deg]">
                  {activeCaption.text}
                </span>
              )}
              {activeCaption.stylePreset === "clean_white" && (
                <span className="font-semibold text-center text-lg md:text-xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] px-3 py-0.5 bg-black/40 rounded-md">
                  {activeCaption.text}
                </span>
              )}
              {activeCaption.stylePreset === "neon_glow" && (
                <span className="font-bold text-center text-xl md:text-2xl text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)] px-3 py-1 bg-slate-950/70 rounded-lg border border-cyan-400/50">
                  {activeCaption.text}
                </span>
              )}
            </div>
          </TransformableOverlay>
        )}

        {/* Safe Zone Overlay (Shorts/Reels) */}
        {safeZoneVisible && (
          <div className="absolute inset-0 pointer-events-none z-30 border-2 border-dashed border-red-500/40 m-2 rounded-lg flex flex-col justify-between p-3 text-[10px] text-red-400/80 font-mono">
            <div className="flex justify-between">
              <span>SAFE ZONE TOP</span>
              <span>CAMERA CUTOUT</span>
            </div>
            <div className="self-end mr-1 space-y-3 text-right">
              <div className="p-1 bg-red-950/60 rounded border border-red-500/30">LIKE / COMMENTS</div>
              <div className="p-1 bg-red-950/60 rounded border border-red-500/30">SHARE / SOUND</div>
            </div>
            <div>SAFE ZONE BOTTOM (CAPTION & PROFILE)</div>
          </div>
        )}
      </div>

      {/* Playback Controls Bar */}
      <div className="mt-3 flex items-center justify-between w-full max-w-md px-4 py-1.5 bg-[#0f131d]/90 backdrop-blur-md rounded-xl border border-slate-800/80 text-slate-300 shadow-lg">
        {/* Timestamp */}
        <div className="font-mono text-xs text-slate-400 tabular-nums">
          <span className="text-white font-semibold">{formatTime(playheadTime)}</span>
          <span className="mx-1 text-slate-400">/</span>
          <span>{formatTime(project.duration)}</span>
        </div>

        {/* Center transport buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPlayheadTime(Math.max(0, playheadTime - 1))}
            title="Step backward 1s (Left Arrow)"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={togglePlay}
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 transition-transform"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            onClick={() => setPlayheadTime(Math.min(project.duration, playheadTime + 1))}
            title="Step forward 1s (Right Arrow)"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Volume & Fullscreen */}
        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={toggleGlobalKeyframe}
            disabled={!activeSelectedClip || isSelectedOutOfBounds}
            title={hasTransformKeyframe ? "Remove Transform Keyframe" : "Add Transform Keyframe"}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              (!activeSelectedClip || isSelectedOutOfBounds) ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-800",
              hasTransformKeyframe ? "text-indigo-400" : "hover:text-white"
            )}
          >
            <Diamond className={cn("w-3.5 h-3.5", hasTransformKeyframe && "fill-indigo-400")} />
          </button>
          
          <div className="h-3 w-[1px] bg-slate-700 mx-0.5" />
          
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Unmute" : "Mute"}
            className="p-1.5 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
