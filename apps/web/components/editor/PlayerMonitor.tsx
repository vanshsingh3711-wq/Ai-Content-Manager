"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Diamond,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { useShallow } from "zustand/react/shallow";
import { AspectRatio } from "@/lib/timeline-types";
import { cn } from "@/lib/utils";
import { TransformableOverlay } from "./TransformableOverlay";
import { SnapGuidesOverlay } from "./SnapGuidesOverlay";
import { SubjectOverlay } from "./SubjectOverlay";
import { GraphicCanvasRenderer } from "./GraphicCanvasRenderer";
import { evaluatePropertyAtTime, getExactKeyframe } from "@/lib/keyframes";
import { getSafeZoneForAspectRatio } from "@/lib/layout/aspect-ratio-reflow";
import {
  EDITOR_DRAG_MIME,
  deserializeDragPayload,
  projectPointerToCanvasCoordinates,
  createAddElementOperationFromDrop,
} from "@/lib/editor/drag-drop-types";
import { getVideoEffectStyle, isEffectGraphic } from "@/lib/editor/video-effects";
import { getCaptionTemplate } from "@/lib/editor/caption-templates";

export function PlayerMonitor() {
  const {
    project,
    playheadTime,
    isPlaying,
    safeZoneVisible,
    subjectOverlayVisible,
    toggleSubjectOverlay,
    selectedItem,
    setPlayheadTime,
    setIsPlaying,
    togglePlay,
    setKeyframe,
    removeKeyframe,
    dispatchOperation,
    setSelectedItem,
  } = useTimelineStore(useShallow((state) => ({
    project: state.project,
    playheadTime: state.playheadTime,
    isPlaying: state.isPlaying,
    safeZoneVisible: state.safeZoneVisible,
    subjectOverlayVisible: state.subjectOverlayVisible,
    toggleSubjectOverlay: state.toggleSubjectOverlay,
    selectedItem: state.selectedItem,
    setPlayheadTime: state.setPlayheadTime,
    setIsPlaying: state.setIsPlaying,
    togglePlay: state.togglePlay,
    setKeyframe: state.setKeyframe,
    removeKeyframe: state.removeKeyframe,
    dispatchOperation: state.dispatchOperation,
    setSelectedItem: state.setSelectedItem,
  })));

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const outgoingVideoRef = useRef<HTMLVideoElement | null>(null);
  const incomingVideoRef = useRef<HTMLVideoElement | null>(null);
  const brollVideoRef = useRef<HTMLVideoElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Find the active main video clip at current playhead
  const activeVideoClip = project.tracks.videoTrack.find(
    (c) => playheadTime >= c.start && playheadTime < c.end
  );

  // Derive active B-Roll clip directly
  const activeBroll = project.tracks.brollTrack.find(
    (b) => playheadTime >= b.start && playheadTime < b.end
  ) || null;

  // Derive active Caption block directly
  const activeCaption =
    (project.tracks.textTrack || []).find((t) => playheadTime >= t.start && playheadTime < t.end) ||
    (project.tracks.captionTrack || []).find((t) => playheadTime >= t.start && playheadTime < t.end) ||
    null;

  // Derive active Visual Effect overlay and standard Motion Graphic separately
  const activeEffect = useMemo(() => {
    return (
      (project.tracks.graphicsTrack || []).find(
        (g) => playheadTime >= g.start && playheadTime < g.end && isEffectGraphic(g)
      ) || null
    );
  }, [project.tracks.graphicsTrack, playheadTime]);

  const activeMotionGraphics = useMemo(() => {
    return (project.tracks.graphicsTrack || []).filter(
      (g) => playheadTime >= g.start && playheadTime < g.end && !isEffectGraphic(g)
    );
  }, [project.tracks.graphicsTrack, playheadTime]);

  const activeMotionGraphic = activeMotionGraphics[0] || null;

  // Combined reference for backwards compatibility
  const activeGraphic = activeMotionGraphic || activeEffect;

  // Real-time video shader and motion transform style matching active effect
  const videoEffectStyle = useMemo(() => {
    return getVideoEffectStyle(activeEffect, playheadTime);
  }, [activeEffect, playheadTime]);

  // Derive active transition across video cuts (Phase 4)
  const activeTransition = useMemo(() => {
    const transitions = project.transitions || [];
    for (const trans of transitions) {
      const fromClip = project.tracks.videoTrack.find((c) => c.id === trans.fromClipId);
      const toClip = project.tracks.videoTrack.find((c) => c.id === trans.toClipId);
      if (!fromClip || !toClip) continue;

      const cutTime = fromClip.end;
      const halfDur = (trans.duration || 0.5) / 2;
      let startWindow = cutTime - halfDur;
      let endWindow = cutTime + halfDur;

      if (trans.alignment === "start") {
        startWindow = cutTime;
        endWindow = cutTime + (trans.duration || 0.5);
      } else if (trans.alignment === "end") {
        startWindow = cutTime - (trans.duration || 0.5);
        endWindow = cutTime;
      }

      if (playheadTime >= startWindow && playheadTime <= endWindow) {
        const dur = Math.max(0.01, endWindow - startWindow);
        const progress = Math.min(1, Math.max(0, (playheadTime - startWindow) / dur));
        return {
          transition: trans,
          fromClip,
          toClip,
          progress,
          preset: trans.preset,
        };
      }
    }
    return null;
  }, [project.transitions, project.tracks.videoTrack, playheadTime]);

  const getDualStreamTransitionStyles = (): {
    outgoingStyle: React.CSSProperties;
    incomingStyle: React.CSSProperties;
  } => {
    if (!activeTransition) {
      return { outgoingStyle: {}, incomingStyle: {} };
    }
    const { preset, progress } = activeTransition;

    switch (preset) {
      case "crossfade":
        return {
          outgoingStyle: { opacity: Math.max(0, Math.min(1, 1 - progress)), zIndex: 10 },
          incomingStyle: { opacity: Math.max(0, Math.min(1, progress)), zIndex: 11 },
        };
      case "fade_to_black":
        return {
          outgoingStyle: {
            opacity: progress < 0.5 ? Math.max(0, 1 - progress * 2) : 0,
            zIndex: 10,
          },
          incomingStyle: {
            opacity: progress >= 0.5 ? Math.max(0, (progress - 0.5) * 2) : 0,
            zIndex: 11,
          },
        };
      case "wipe_left":
        return {
          outgoingStyle: { zIndex: 10 },
          incomingStyle: {
            clipPath: `inset(0 0 0 ${(1 - progress) * 100}%)`,
            zIndex: 11,
          },
        };
      case "wipe_right":
        return {
          outgoingStyle: { zIndex: 10 },
          incomingStyle: {
            clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
            zIndex: 11,
          },
        };
      case "slide_up":
        return {
          outgoingStyle: { zIndex: 10 },
          incomingStyle: {
            transform: `translateY(${(1 - progress) * 100}%)`,
            zIndex: 11,
          },
        };
      case "zoom_in":
        return {
          outgoingStyle: {
            transform: `scale(${1 + progress * 0.3})`,
            opacity: Math.max(0, 1 - progress),
            zIndex: 10,
          },
          incomingStyle: {
            transform: `scale(${0.7 + progress * 0.3})`,
            opacity: Math.max(0, Math.min(1, progress)),
            zIndex: 11,
          },
        };
      case "whip_pan":
        return {
          outgoingStyle: {
            transform: `translateX(${-progress * 100}%)`,
            filter: `blur(${Math.sin(progress * Math.PI) * 8}px)`,
            zIndex: 10,
          },
          incomingStyle: {
            transform: `translateX(${(1 - progress) * 100}%)`,
            filter: `blur(${Math.sin(progress * Math.PI) * 8}px)`,
            zIndex: 11,
          },
        };
      default:
        return {
          outgoingStyle: { opacity: 1 - progress, zIndex: 10 },
          incomingStyle: { opacity: progress, zIndex: 11 },
        };
    }
  };

  // Global keyframe detection and toggling
  let activeSelectedClip: any = null;
  if (selectedItem) {
    if (selectedItem.type === "video") activeSelectedClip = project.tracks.videoTrack.find((c) => c.id === selectedItem.id);
    else if (selectedItem.type === "broll") activeSelectedClip = project.tracks.brollTrack.find((c) => c.id === selectedItem.id);
    else if (selectedItem.type === "caption") activeSelectedClip = project.tracks.textTrack.find((c) => c.id === selectedItem.id);
    else if (selectedItem.type === "graphic") activeSelectedClip = (project.tracks.graphicsTrack || []).find((c) => c.id === selectedItem.id);
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
    // 1. Single video element
    const video = videoRef.current;
    if (video && activeVideoClip) {
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

    // 2. Dual-stream transition videos
    if (activeTransition) {
      const outVideo = outgoingVideoRef.current;
      if (outVideo && activeTransition.fromClip) {
        const fromClip = activeTransition.fromClip;
        const fromOffset = (playheadTime - fromClip.start) * (fromClip.speed || 1);
        const targetSourceTime = Math.max(0, fromClip.sourceStart + fromOffset);

        if (Math.abs(outVideo.currentTime - targetSourceTime) > 0.15) {
          if ("fastSeek" in outVideo && typeof (outVideo as any).fastSeek === "function") {
            try {
              (outVideo as any).fastSeek(targetSourceTime);
            } catch {
              outVideo.currentTime = targetSourceTime;
            }
          } else {
            outVideo.currentTime = targetSourceTime;
          }
        }
        outVideo.playbackRate = fromClip.speed || 1;
        const baseVol = (fromClip.volume ?? 100) / 100;
        const transVol = activeTransition.preset === "fade_to_black"
          ? (activeTransition.progress < 0.5 ? 1 - activeTransition.progress * 2 : 0)
          : (1 - activeTransition.progress);
        outVideo.volume = Math.max(0, Math.min(1, baseVol * transVol));
      }

      const inVideo = incomingVideoRef.current;
      if (inVideo && activeTransition.toClip) {
        const toClip = activeTransition.toClip;
        const toOffset = (playheadTime - toClip.start) * (toClip.speed || 1);
        const targetSourceTime = Math.max(0, toClip.sourceStart + toOffset);

        if (Math.abs(inVideo.currentTime - targetSourceTime) > 0.15) {
          if ("fastSeek" in inVideo && typeof (inVideo as any).fastSeek === "function") {
            try {
              (inVideo as any).fastSeek(targetSourceTime);
            } catch {
              inVideo.currentTime = targetSourceTime;
            }
          } else {
            inVideo.currentTime = targetSourceTime;
          }
        }
        inVideo.playbackRate = toClip.speed || 1;
        const baseVol = (toClip.volume ?? 100) / 100;
        const transVol = activeTransition.preset === "fade_to_black"
          ? (activeTransition.progress >= 0.5 ? (activeTransition.progress - 0.5) * 2 : 0)
          : activeTransition.progress;
        inVideo.volume = Math.max(0, Math.min(1, baseVol * transVol));
      }
    }

    // 3. Dual video synchronization for B-roll overlay
    const broll = brollVideoRef.current;
    if (broll && activeBroll) {
      const brollOffset = Math.max(0, playheadTime - activeBroll.start);
      if (Math.abs(broll.currentTime - brollOffset) > 0.15) {
        if ("fastSeek" in broll && typeof (broll as any).fastSeek === "function") {
          try {
            (broll as any).fastSeek(brollOffset);
          } catch {
            broll.currentTime = brollOffset;
          }
        } else {
          broll.currentTime = brollOffset;
        }
      }
      const brollVolume = evaluatePropertyAtTime(
        activeBroll.animation,
        "volume",
        brollOffset,
        activeBroll.volume ?? 0
      );
      broll.volume = Math.max(0, Math.min(1, brollVolume / 100));
      broll.muted = brollVolume === 0 || activeBroll.muted !== false;
    }
  }, [playheadTime, activeVideoClip, activeTransition, activeBroll]);

  // Play / Pause handling
  useEffect(() => {
    const video = videoRef.current;
    const outVideo = outgoingVideoRef.current;
    const inVideo = incomingVideoRef.current;
    const broll = brollVideoRef.current;

    if (isPlaying) {
      if (video) video.play().catch(() => {});
      if (outVideo) outVideo.play().catch(() => {});
      if (inVideo) inVideo.play().catch(() => {});
      if (broll) broll.play().catch(() => {});
    } else {
      try { video?.pause(); } catch {}
      try { outVideo?.pause(); } catch {}
      try { inVideo?.pause(); } catch {}
      try { broll?.pause(); } catch {}
    }
  }, [isPlaying, !!activeTransition]);

  // Handle continuous playback clock driven by native playback
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const state = useTimelineStore.getState();
      if (!state.isPlaying) return;

      const video = videoRef.current;
      const outVideo = outgoingVideoRef.current;
      const inVideo = incomingVideoRef.current;
      const activeClip = state.project.tracks.videoTrack.find(
        (c) => state.playheadTime >= c.start && state.playheadTime < c.end
      );

      let leadVideo: HTMLVideoElement | null = null;
      let leadClip: any = null;

      if (activeTransition) {
        if (activeTransition.progress < 0.5 && outVideo && !outVideo.paused) {
          leadVideo = outVideo;
          leadClip = activeTransition.fromClip;
        } else if (inVideo && !inVideo.paused) {
          leadVideo = inVideo;
          leadClip = activeTransition.toClip;
        } else if (outVideo && !outVideo.paused) {
          leadVideo = outVideo;
          leadClip = activeTransition.fromClip;
        }
      } else if (video && !video.paused && activeClip) {
        leadVideo = video;
        leadClip = activeClip;
      }

      if (leadVideo && leadClip) {
        // Source time to timeline time
        const clipOffset = (leadVideo.currentTime - leadClip.sourceStart) / (leadClip.speed || 1);
        const newPlayhead = leadClip.start + clipOffset;

        // Synchronize secondary transition stream
        if (activeTransition) {
          if (leadVideo === outVideo && inVideo && !inVideo.paused) {
            const expectedInTime = activeTransition.toClip.sourceStart + (newPlayhead - activeTransition.toClip.start) * (activeTransition.toClip.speed || 1);
            if (Math.abs(inVideo.currentTime - expectedInTime) > 0.25) {
              inVideo.currentTime = Math.max(0, expectedInTime);
            }
          } else if (leadVideo === inVideo && outVideo && !outVideo.paused) {
            const expectedOutTime = activeTransition.fromClip.sourceStart + (newPlayhead - activeTransition.fromClip.start) * (activeTransition.fromClip.speed || 1);
            if (Math.abs(outVideo.currentTime - expectedOutTime) > 0.25) {
              outVideo.currentTime = Math.max(0, expectedOutTime);
            }
          }
        }

        // Synchronize and correct drift for active B-roll overlay
        const broll = brollVideoRef.current;
        if (broll && !broll.paused && activeBroll) {
          const expectedBrollTime = Math.max(0, newPlayhead - activeBroll.start);
          if (Math.abs(broll.currentTime - expectedBrollTime) > 0.25) {
            broll.currentTime = expectedBrollTime;
          }
        }

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
  }, [isPlaying, !!activeTransition, activeBroll]);

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
    <div className="flex-1 flex flex-col items-center justify-center p-2 md:p-4 bg-black relative overflow-hidden select-none">
      {/* Viewport Frame */}
      <div
        ref={viewportRef}
        onPointerDown={() => useTimelineStore.getState().setSelectedItem(null)}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) {
            setIsDragOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);

          const rawData =
            e.dataTransfer.getData(EDITOR_DRAG_MIME) ||
            e.dataTransfer.getData("text/plain");
          if (!rawData) return;

          const payload = deserializeDragPayload(rawData);
          if (!payload) return;

          // Audio belongs on the timeline tracks
          if (payload.type === "audio") return;

          const rect = viewportRef.current?.getBoundingClientRect();
          const position = rect
            ? projectPointerToCanvasCoordinates(e.clientX, e.clientY, rect)
            : { x: 50, y: 50 };

          if (payload.type === "caption") {
            const textClips = project.tracks.textTrack || [];
            const activeCaption = textClips.find(
              (c) => playheadTime >= c.start && playheadTime <= c.end
            );
            if (activeCaption) {
              dispatchOperation({
                type: "update_properties",
                targetType: "caption",
                targetId: activeCaption.id,
                properties: { stylePreset: payload.stylePreset },
              });
              setSelectedItem({ type: "caption", id: activeCaption.id });
              return;
            }
          }

          const operation = createAddElementOperationFromDrop(payload, {
            timestamp: playheadTime,
            position,
            durationLimit: project.duration,
          });

          dispatchOperation(operation);

          if ((operation as any).element?.id) {
            setSelectedItem({
              type: payload.type as any,
              id: (operation as any).element.id,
            });
          }
        }}
        className={cn(
          "relative bg-black rounded-xl overflow-hidden shadow-2xl border flex items-center justify-center transition-all duration-300",
          isDragOver
            ? "border-yellow-400 ring-4 ring-yellow-400/20"
            : "border-neutral-900",
          getAspectRatioClasses(project.aspectRatio)
        )}
      >
        {isDragOver && (
          <div className="absolute inset-0 z-50 pointer-events-none bg-yellow-400/10 backdrop-blur-xs flex flex-col items-center justify-center border-2 border-dashed border-yellow-400">
            <div className="px-3.5 py-1.5 rounded-full bg-neutral-950/90 border border-yellow-400 text-yellow-400 text-xs font-bold shadow-2xl flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span>Drop onto Canvas ({playheadTime.toFixed(1)}s)</span>
            </div>
          </div>
        )}
        {/* Active Transition Indicator Badge */}
        {activeTransition && (
          <div
            data-testid="active-transition-indicator"
            className="absolute top-3 left-3 z-40 px-2.5 py-1 rounded-md bg-neutral-950/80 border border-yellow-400/50 backdrop-blur-md text-[10px] text-yellow-400 font-mono flex items-center gap-1.5 shadow-lg pointer-events-none"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
            <span>
              Transition: {activeTransition.preset} ({(activeTransition.progress * 100).toFixed(0)}%)
            </span>
          </div>
        )}

        {/* Active Visual Effect Indicator Badge */}
        {activeEffect && (
          <div
            data-testid="active-effect-indicator"
            className={cn(
              "absolute top-3 z-40 px-2.5 py-1 rounded-md bg-neutral-950/85 border border-emerald-400/50 backdrop-blur-md text-[10px] text-emerald-300 font-mono flex items-center gap-1.5 shadow-lg pointer-events-none",
              activeTransition ? "left-44" : "left-3"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="capitalize">
              FX: {(activeEffect.props?.effectType || activeEffect.name || "Active").replace(/_/g, " ")} ({activeEffect.props?.intensity ?? 80}%)
            </span>
          </div>
        )}

        {/* Main Video Layer (Dual-Stream Transition or Single Video) */}
        {activeTransition ? (
          <div
            data-testid="transition-dual-stream-container"
            className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
          >
            {/* Outgoing Stream (Clip A) */}
            <div
              data-testid="transition-outgoing-stream"
              className="absolute inset-0 w-full h-full transition-all duration-75"
              style={{
                ...getDualStreamTransitionStyles().outgoingStyle,
                ...videoEffectStyle,
              }}
            >
              <video
                ref={outgoingVideoRef}
                src={activeTransition.fromClip.proxyUrl || activeTransition.fromClip.sourceUrl}
                muted={isMuted}
                playsInline
                preload="auto"
                autoPlay={isPlaying}
                onLoadedMetadata={(e) => {
                  if (isPlaying) (e.target as HTMLVideoElement).play().catch(() => {});
                }}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Incoming Stream (Clip B) */}
            <div
              data-testid="transition-incoming-stream"
              className="absolute inset-0 w-full h-full transition-all duration-75"
              style={{
                ...getDualStreamTransitionStyles().incomingStyle,
                ...videoEffectStyle,
              }}
            >
              <video
                ref={incomingVideoRef}
                src={activeTransition.toClip.proxyUrl || activeTransition.toClip.sourceUrl}
                muted={isMuted}
                playsInline
                preload="auto"
                autoPlay={isPlaying}
                onLoadedMetadata={(e) => {
                  if (isPlaying) (e.target as HTMLVideoElement).play().catch(() => {});
                }}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ) : activeVideoClip ? (
          <TransformableOverlay
            id={activeVideoClip.id}
            type="video"
            clip={activeVideoClip}
            positionX={activeVideoClip.positionX ?? activeVideoClip.position?.x ?? 50}
            positionY={activeVideoClip.positionY ?? activeVideoClip.position?.y ?? 50}
            scale={activeVideoClip.scale ?? activeVideoClip.zoomFactor ?? 1.0}
            rotation={activeVideoClip.rotation ?? 0}
            isSelected={selectedItem?.id === activeVideoClip.id}
          >
            <div
              className="w-full h-full transition-all duration-75 overflow-hidden"
              style={videoEffectStyle}
            >
              <video
                ref={videoRef}
                src={activeVideoClip.proxyUrl || activeVideoClip.sourceUrl}
                muted={isMuted}
                playsInline
                preload="auto"
                autoPlay={isPlaying}
                onLoadedMetadata={(e) => {
                  if (isPlaying) (e.target as HTMLVideoElement).play().catch(() => {});
                }}
                className="w-full h-full object-cover"
              />
            </div>
          </TransformableOverlay>
        ) : (
          <div className="flex flex-col items-center justify-center text-neutral-500 p-6 text-center">
            <RotateCcw className="w-8 h-8 mb-2 animate-spin text-neutral-500" />
            <p className="text-xs">No media at current timestamp</p>
          </div>
        )}

        {/* B-Roll Overlay Layer */}
        {activeBroll && (
          <TransformableOverlay
            id={activeBroll.id}
            type="broll"
            clip={activeBroll}
            positionX={activeBroll.positionX ?? activeBroll.position?.x ?? 50}
            positionY={activeBroll.positionY ?? activeBroll.position?.y ?? 50}
            scale={activeBroll.scale ?? 1.0}
            rotation={activeBroll.rotation ?? 0}
            isSelected={selectedItem?.id === activeBroll.id}
          >
            <div
              className="w-full h-full transition-opacity duration-200"
              style={{
                opacity: evaluatePropertyAtTime(activeBroll.animation, "opacity", playheadTime - activeBroll.start, activeBroll.opacity ?? 100) / 100,
                ...videoEffectStyle,
              }}
            >
              <video
                ref={brollVideoRef}
                src={activeBroll.proxyUrl || activeBroll.sourceUrl}
                muted={activeBroll.volume === undefined || activeBroll.volume === 0 || activeBroll.muted !== false}
                playsInline
                className={cn(
                  "w-full h-full",
                  activeBroll.fitMode === "contain" ? "object-contain" : "object-cover"
                )}
              />
            </div>
          </TransformableOverlay>
        )}

        {/* Captions Overlay Layer - Suppressed when a Motion Graphic is active to avoid visual collision */}
        {activeCaption && (!activeMotionGraphics.length || selectedItem?.id === activeCaption.id) && (
          <TransformableOverlay
            id={activeCaption.id}
            type="caption"
            clip={activeCaption}
            positionX={activeCaption.positionX ?? activeCaption.position?.x ?? 50}
            positionY={activeCaption.positionY ?? activeCaption.position?.y ?? ((project as any)?.videoType === "faceless_short" || (project as any)?.isFaceless ? 50 : 75)}
            scale={activeCaption.scale ?? 1.0}
            rotation={activeCaption.rotation ?? 0}
            isSelected={selectedItem?.id === activeCaption.id}
          >
            {(() => {
              const template = getCaptionTemplate(activeCaption.stylePreset);
              // Split tokens preserving whitespace and newlines for 100% textContent integrity
              const rawTokens = activeCaption.text.split(/(\s+)/);

              // Precompute word index for each token
              const tokenWordIndices: (number | null)[] = [];
              let wordCounter = 0;
              rawTokens.forEach((tok) => {
                if (/^\s+$/.test(tok)) {
                  tokenWordIndices.push(null);
                } else {
                  tokenWordIndices.push(wordCounter++);
                }
              });
              const totalWords = wordCounter;

              let activeWordIdx = -1;
              const captionWords = (activeCaption as any).words;
              if (Array.isArray(captionWords) && captionWords.length > 0) {
                // Precise word-level timestamps if available from Whisper
                activeWordIdx = captionWords.findIndex(
                  (w: any) =>
                    playheadTime >= (w.start ?? 0) &&
                    playheadTime <= (w.end ?? activeCaption.end)
                );
                if (activeWordIdx === -1) {
                  if (
                    playheadTime >=
                    (captionWords[captionWords.length - 1]?.end ?? activeCaption.end)
                  ) {
                    activeWordIdx = totalWords - 1;
                  } else {
                    for (let i = captionWords.length - 1; i >= 0; i--) {
                      if (playheadTime >= (captionWords[i]?.start ?? 0)) {
                        activeWordIdx = i;
                        break;
                      }
                    }
                  }
                }
              } else if (totalWords > 0) {
                // Proportional speech progression synced dynamically to playhead position
                const capDur = Math.max(0.1, activeCaption.end - activeCaption.start);
                const elapsed = Math.max(0, playheadTime - activeCaption.start);
                const progress = Math.min(0.999, Math.max(0, elapsed / capDur));
                activeWordIdx = Math.floor(progress * totalWords);
              }

              const wordsPerWindow = (project as any)?.videoType === "faceless_short" || (project as any)?.isFaceless ? 3 : 3;

              // Rolling window matching subtitle_generator.py (3 words per screen)
              let windowStart = 0;
              let windowEnd = totalWords;
              if (totalWords > wordsPerWindow) {
                const safeActiveIdx = Math.max(0, Math.min(totalWords - 1, activeWordIdx >= 0 ? activeWordIdx : 0));
                windowStart = Math.floor(safeActiveIdx / wordsPerWindow) * wordsPerWindow;
                windowEnd = Math.min(totalWords, windowStart + wordsPerWindow);
              }

              const getActiveWordClasses = (templateId: string, isActive: boolean, isPast: boolean) => {
                if (isActive) {
                  switch (templateId) {
                    case "tiktok_yellow":
                      return "scale-115 text-yellow-300 drop-shadow-[0_0_16px_rgba(250,204,21,1)] font-black z-10";
                    case "hormozi_bold":
                      return "scale-115 text-yellow-300 drop-shadow-[0_0_16px_rgba(253,224,71,1)] bg-neutral-950/70 px-1.5 py-0.5 rounded-md z-10";
                    case "clean_white":
                      return "scale-110 text-white font-black drop-shadow-[0_0_12px_rgba(255,255,255,1)] underline decoration-cyan-400 decoration-2 z-10";
                    case "neon_glow":
                      return "scale-115 text-cyan-200 drop-shadow-[0_0_20px_rgba(34,211,238,1)] z-10";
                    case "karaoke_gradient":
                      return "scale-115 bg-gradient-to-r from-violet-200 via-pink-200 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_0_16px_rgba(244,114,182,1)] font-black z-10";
                    case "boxed_pill":
                      return "scale-110 bg-white text-black px-1.5 py-0.5 rounded-full shadow-lg font-black z-10";
                    case "comic_pop":
                      return "scale-115 text-yellow-200 drop-shadow-[3px_3px_0px_#000] rotate-[-2deg] z-10";
                    case "fire_gradient":
                      return "scale-115 bg-gradient-to-r from-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_16px_rgba(245,158,11,1)] font-black z-10";
                    case "minimal_boxed":
                      return "scale-110 text-emerald-200 drop-shadow-[0_0_12px_rgba(52,211,153,1)] font-black z-10";
                    default:
                      return "scale-115 text-yellow-300 drop-shadow-[0_0_16px_rgba(250,204,21,1)] z-10";
                  }
                }
                if (isPast) {
                  return "text-white opacity-90";
                }
                // Inactive words in the visible window
                return "text-white/85";
              };

              return (
                <div
                  key={`${activeCaption.id}-${activeCaption.text}`}
                  className="flex justify-center transition-all duration-150 animate-caption-pop"
                >
                  <span
                    data-testid={`active-caption-rendered-${template.id}`}
                    className={cn(template.renderClass, "inline-block max-w-[92%]")}
                    style={template.textStyle}
                  >
                    {rawTokens.map((tok, i) => {
                      const wIdx = tokenWordIndices[i];
                      if (wIdx === null) {
                        const prevWIdx = i > 0 ? tokenWordIndices[i - 1] : null;
                        const nextWIdx = i < tokenWordIndices.length - 1 ? tokenWordIndices[i + 1] : null;
                        const isVisibleSpace =
                          prevWIdx !== null &&
                          nextWIdx !== null &&
                          prevWIdx >= windowStart &&
                          prevWIdx < windowEnd &&
                          nextWIdx >= windowStart &&
                          nextWIdx < windowEnd;
                        if (isVisibleSpace) {
                          return <span key={i}>{" "}</span>;
                        }
                        return <span key={i} className="hidden">{tok}</span>;
                      }

                      const isVisibleWord = wIdx >= windowStart && wIdx < windowEnd;
                      if (!isVisibleWord) {
                        return <span key={i} className="hidden">{tok}</span>;
                      }

                      const isActive = wIdx === activeWordIdx;
                      const isPast = wIdx < activeWordIdx;
                      return (
                        <span
                          key={i}
                          className={cn(
                            "inline-block mx-0.5 sm:mx-1 transition-all duration-100 ease-out origin-center",
                            getActiveWordClasses(template.id, isActive, isPast)
                          )}
                        >
                          {tok}
                        </span>
                      );
                    })}
                  </span>
                </div>
              );
            })()}
          </TransformableOverlay>
        )}

        {/* Visual Video Effect Overlay Layer (Full-screen, non-interfering) */}
        {activeEffect && (
          <div
            data-testid={`active-effect-layer-${activeEffect.id}`}
            className={cn(
              "absolute inset-0 w-full h-full pointer-events-none z-20 overflow-hidden",
              selectedItem?.id === activeEffect.id &&
                "ring-2 ring-emerald-400 ring-inset shadow-[inset_0_0_24px_rgba(52,211,153,0.35)]"
            )}
          >
            <GraphicCanvasRenderer graphic={activeEffect} playheadTime={playheadTime} />
          </div>
        )}

        {/* Standard Motion Graphics Layer (Draggable cards, shapes, counters, lower thirds) */}
        {activeMotionGraphics.map((graphic) => (
          <TransformableOverlay
            key={graphic.id}
            id={graphic.id}
            type="graphic"
            clip={graphic}
            positionX={graphic.positionX ?? graphic.position?.x ?? 50}
            positionY={graphic.positionY ?? graphic.position?.y ?? 50}
            scale={graphic.scale ?? 1.0}
            rotation={graphic.rotation ?? 0}
            isSelected={selectedItem?.id === graphic.id}
          >
            <GraphicCanvasRenderer graphic={graphic} playheadTime={playheadTime} />
          </TransformableOverlay>
        ))}

        {/* Dynamic Safe Zone Overlay */}
        {safeZoneVisible && (() => {
          const zone = getSafeZoneForAspectRatio(project.aspectRatio);
          return (
            <div
              data-testid="safe-zone-overlay"
              className="absolute pointer-events-none z-30 border-2 border-dashed border-red-500/60 rounded-lg flex flex-col justify-between p-2 text-[9px] text-red-400 font-mono transition-all duration-200"
              style={{
                left: `${zone.minX}%`,
                top: `${zone.minY}%`,
                width: `${zone.maxX - zone.minX}%`,
                height: `${zone.maxY - zone.minY}%`,
              }}
            >
              <div className="flex justify-between items-center opacity-85">
                <span className="bg-red-950/80 px-1 py-0.5 rounded border border-red-500/40">
                  TOP ({zone.minY}%)
                </span>
                <span className="bg-red-950/80 px-1 py-0.5 rounded border border-red-500/40 font-bold">
                  {zone.label}
                </span>
              </div>
              {project.aspectRatio === "9:16" && (
                <div className="self-end space-y-1 text-right opacity-85">
                  <div className="p-1 bg-red-950/80 rounded border border-red-500/40 text-[8px]">
                    ACTIONS RAIL (18%)
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center opacity-85">
                <span className="bg-red-950/80 px-1 py-0.5 rounded border border-red-500/40">
                  BOTTOM ({100 - zone.maxY}%)
                </span>
                <span className="text-[8px] text-red-300/80">
                  MAX {zone.maxCharsPerCaptionLine} CHR/LINE
                </span>
              </div>
            </div>
          );
        })()}

        {/* Subject Safe Zone Overlay (MediaPipe presenter avoidance boundaries) */}
        <SubjectOverlay />

        {/* Snap Guides Overlay (Magnetic alignment lines & center crosshair) */}
        <SnapGuidesOverlay />
      </div>

      {/* Playback Controls Bar */}
      <div className="mt-3 flex items-center justify-between w-full max-w-md px-4 py-1.5 bg-neutral-950/90 backdrop-blur-md rounded-xl border border-neutral-900 text-neutral-400 shadow-lg">
        {/* Timestamp */}
        <div className="font-mono text-xs text-neutral-500 tabular-nums">
          <span className="text-white font-semibold">{formatTime(playheadTime)}</span>
          <span className="mx-1 text-neutral-500">/</span>
          <span>{formatTime(project.duration)}</span>
        </div>

        {/* Center transport buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPlayheadTime(Math.max(0, playheadTime - 1))}
            title="Step backward 1s (Left Arrow)"
            className="p-1.5 text-neutral-500 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={togglePlay}
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            className="h-8 w-8 rounded-full bg-white hover:bg-neutral-200 hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-md shadow-white/10 transition-transform"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            onClick={() => setPlayheadTime(Math.min(project.duration, playheadTime + 1))}
            title="Step forward 1s (Right Arrow)"
            className="p-1.5 text-neutral-500 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Subject Overlay, Volume & Keyframes */}
        <div className="flex items-center gap-1 text-neutral-500">
          <button
            onClick={toggleSubjectOverlay}
            data-testid="toggle-subject-overlay-btn"
            title={subjectOverlayVisible ? "Hide Presenter Safe Zones" : "Show Presenter Safe Zones"}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              subjectOverlayVisible
                ? "text-emerald-400 bg-emerald-950/60 border border-emerald-500/40"
                : "hover:text-white hover:bg-neutral-900"
            )}
          >
            <UserCheck className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-[1px] bg-neutral-800 mx-0.5" />

          <button
            onClick={toggleGlobalKeyframe}
            disabled={!activeSelectedClip || isSelectedOutOfBounds}
            title={hasTransformKeyframe ? "Remove Transform Keyframe" : "Add Transform Keyframe"}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              (!activeSelectedClip || isSelectedOutOfBounds) ? "opacity-30 cursor-not-allowed" : "hover:bg-neutral-900",
              hasTransformKeyframe ? "text-white" : "hover:text-white"
            )}
          >
            <Diamond className={cn("w-3.5 h-3.5", hasTransformKeyframe && "fill-white")} />
          </button>
          
          <div className="h-3 w-[1px] bg-neutral-800 mx-0.5" />
          
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Unmute" : "Mute"}
            className="p-1.5 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
