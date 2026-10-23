"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Volume2,
  Sparkles,
  Layers,
  TrendingUp,
  Flame,
  Terminal,
  Activity,
  Film,
  Zap,
  Bell,
  Star,
  Heart,
  CheckCircle2,
  CloudUpload,
  Quote,
  Clock,
  Radio,
  Share2,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { LibraryResource } from "@/lib/library/resource-types";
import { cn } from "@/lib/utils";

// Lightweight, zero-latency Web Audio SFX Audition synthesizer
function playSfxSynthesis(resourceId: string) {
  try {
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (resourceId.includes("whoosh")) {
      osc.type = "sine";
      osc.frequency.setValueAtTime(500, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.3);
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      osc.start(t);
      osc.stop(t + 0.33);
    } else if (resourceId.includes("pop")) {
      osc.type = "sine";
      osc.frequency.setValueAtTime(700, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.1);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
      osc.start(t);
      osc.stop(t + 0.12);
    } else if (resourceId.includes("bell") || resourceId.includes("chime")) {
      osc.type = "sine";
      osc.frequency.setValueAtTime(1046.5, t); // C6 tone
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.52);
    } else if (resourceId.includes("impact") || resourceId.includes("hit")) {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.38);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.39);
      osc.start(t);
      osc.stop(t + 0.4);
    } else if (resourceId.includes("click")) {
      osc.type = "square";
      osc.frequency.setValueAtTime(1200, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.start(t);
      osc.stop(t + 0.05);
    } else if (resourceId.includes("riser")) {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.55);
      gain.gain.setValueAtTime(0.02, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.48);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.58);
      osc.start(t);
      osc.stop(t + 0.59);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  } catch {
    // Gracefully ignore if audio context isn't allowed without user click
  }
}

interface ResourceVisualPreviewProps {
  resource: LibraryResource;
  customProps?: Record<string, any>;
  isHovered?: boolean;
}

export function ResourceVisualPreview({
  resource,
  customProps = {},
  isHovered = false,
}: ResourceVisualPreviewProps) {
  const merged = { ...resource.defaultProps, ...customProps };
  const resId = resource.id;
  const resType = resource.type;

  // Video ref for B-Roll hover playback
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoError, setVideoError] = useState(false);

  // Counter loop state for Animated Counter
  const [tickerCount, setTickerCount] = useState(0);

  // Transition animation progress (0 to 100%)
  const [transitionProgress, setTransitionProgress] = useState(0);

  // Typing effect for Terminal
  const [typedChars, setTypedChars] = useState(0);
  const codeSnippet = "const virality = await editor.render();";

  // Audio waveform oscillation index
  const [waveSeed, setWaveSeed] = useState(0);

  // Caption word karaoke highlight index (0 -> 1 -> 2)
  const [captionWordIndex, setCaptionWordIndex] = useState(0);

  // Audio audition synthesizer on hover
  useEffect(() => {
    if (isHovered && resType === "sfx") {
      playSfxSynthesis(resId);
    }
  }, [isHovered, resType, resId]);

  useEffect(() => {
    if (!isHovered) {
      setTickerCount(0);
      setTransitionProgress(0);
      setTypedChars(0);
      setCaptionWordIndex(0);
      return;
    }

    // 1. Ticker animation loop on hover
    const tickerInterval = setInterval(() => {
      setTickerCount((prev) => (prev >= 128450 ? 0 : prev + 12845));
    }, 120);

    // 2. Transition progress loop on hover
    const transInterval = setInterval(() => {
      setTransitionProgress((prev) => (prev >= 100 ? 0 : prev + 5));
    }, 80);

    // 3. Terminal typing loop on hover
    const typeInterval = setInterval(() => {
      setTypedChars((prev) => (prev >= codeSnippet.length ? 0 : prev + 1));
    }, 70);

    // 4. Audio waveform oscillation on hover
    const waveInterval = setInterval(() => {
      setWaveSeed((prev) => (prev + 1) % 10);
    }, 100);

    // 5. Caption word karaoke cycle on hover
    const captionInterval = setInterval(() => {
      setCaptionWordIndex((prev) => (prev + 1) % 3);
    }, 320);

    return () => {
      clearInterval(tickerInterval);
      clearInterval(transInterval);
      clearInterval(typeInterval);
      clearInterval(waveInterval);
      clearInterval(captionInterval);
    };
  }, [isHovered]);

  // When hovering B-Roll, ensure video plays
  useEffect(() => {
    if (videoRef.current) {
      if (isHovered && !videoError) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {
          // Autoplay policy or fetch error handled gracefully
          setVideoError(true);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isHovered, videoError]);

  // ==========================================
  // 1. PACK A: VECTOR SHAPES & STICKERS
  // ==========================================
  if (resType === "shape") {
    const shapeType = merged.shapeType || "rectangle";
    const fillColor = merged.fillColor || "#0284c7";
    const strokeColor = merged.strokeColor || "#38bdf8";
    const strokeWidth = merged.strokeWidth ?? 2;

    return (
      <div className="w-full h-full flex items-center justify-center p-3 relative overflow-hidden bg-neutral-950/80 select-none">
        {/* Subtle background guide grid */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0, 8px 8px",
          }}
        />

        {shapeType === "rectangle" && (
          <div
            className="w-24 h-14 rounded-sm transition-all duration-300 relative shadow-lg flex items-center justify-center"
            style={{
              backgroundColor: fillColor,
              border: `${strokeWidth}px solid ${strokeColor}`,
              boxShadow: isHovered
                ? `0 0 28px ${strokeColor}aa, inset 0 0 16px ${strokeColor}66`
                : `0 0 12px ${strokeColor}44`,
              transform: isHovered ? "scale(1.08)" : "scale(1)",
            }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-white/50" />
          </div>
        )}

        {shapeType === "rounded_rect" && (
          <div
            className="w-26 h-12 rounded-2xl transition-all duration-300 relative shadow-lg flex items-center justify-center px-3"
            style={{
              backgroundColor: fillColor,
              border: `${strokeWidth}px solid ${strokeColor}`,
              boxShadow: isHovered
                ? `0 0 28px ${strokeColor}aa, inset 0 0 16px ${strokeColor}66`
                : `0 0 12px ${strokeColor}44`,
              transform: isHovered ? "scale(1.08)" : "scale(1)",
            }}
          >
            <div className="h-1.5 w-12 rounded-full bg-white/50" />
          </div>
        )}

        {shapeType === "circle" && (
          <div
            className="w-16 h-16 rounded-full transition-all duration-300 relative shadow-lg flex items-center justify-center"
            style={{
              backgroundColor: fillColor,
              border: `${strokeWidth}px solid ${strokeColor}`,
              boxShadow: isHovered
                ? `0 0 30px ${strokeColor}aa, inset 0 0 18px ${strokeColor}66`
                : `0 0 12px ${strokeColor}44`,
              transform: isHovered ? "scale(1.12)" : "scale(1)",
            }}
          >
            <div className="w-4 h-4 rounded-full border border-white/50" />
          </div>
        )}

        {shapeType === "line" && (
          <div className="w-full px-4 flex flex-col items-center gap-1.5">
            <div
              className="w-full transition-all duration-300"
              style={{
                borderTop: `${strokeWidth}px ${merged.lineStyle || "solid"} ${strokeColor}`,
                boxShadow: isHovered ? `0 0 20px ${strokeColor}` : `0 0 10px ${strokeColor}`,
                transform: isHovered ? "scaleX(1.08)" : "scaleX(1)",
              }}
            />
            <div className="flex justify-between w-full text-[8px] font-mono text-neutral-500">
              <span style={{ color: strokeColor }}>●</span>
              <span style={{ color: strokeColor }}>●</span>
            </div>
          </div>
        )}

        {shapeType === "arrow" && (
          <div
            className="flex items-center gap-1.5 transition-all duration-200"
            style={{
              transform: isHovered
                ? `translateX(${((waveSeed % 4) * 3)}px) scale(1.1)`
                : "scale(1)",
            }}
          >
            {merged.label && (
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded shadow"
                style={{
                  backgroundColor: fillColor,
                  border: `${strokeWidth}px solid ${strokeColor}`,
                  color: "#ffffff",
                }}
              >
                {merged.label}
              </span>
            )}
            <svg
              width="46"
              height="36"
              viewBox="0 0 24 24"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              className="filter drop-shadow-[0_0_12px_rgba(56,189,248,0.8)]"
            >
              <path d="M4 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {shapeType === "speech_bubble" && (
          <div
            className="relative rounded-xl px-3 py-2 text-[10px] font-bold shadow-xl max-w-[125px] text-center transition-all duration-200"
            style={{
              backgroundColor: fillColor,
              color: merged.textColor || "#ffffff",
              border: `${strokeWidth}px solid ${strokeColor}`,
              boxShadow: isHovered ? `0 0 24px ${strokeColor}88` : `0 0 12px ${strokeColor}44`,
              transform: isHovered ? "scale(1.08) rotate(-1deg)" : "scale(1)",
            }}
          >
            <span>{merged.text || "Hello!"}</span>
            <div
              className="absolute -bottom-2 left-4 w-0 h-0 border-x-4 border-x-transparent border-t-8"
              style={{ borderTopColor: strokeColor }}
            />
          </div>
        )}

        {shapeType === "divider" && (
          <div className="w-full px-4 flex flex-col items-center gap-1">
            <div
              className="w-full h-1.5 rounded-full transition-all duration-300"
              style={{
                background: `linear-gradient(90deg, transparent, ${merged.accentColor || "#a855f7"}, transparent)`,
                boxShadow: isHovered
                  ? `0 0 24px ${merged.accentColor || "#a855f7"}`
                  : `0 0 12px ${merged.accentColor || "#a855f7"}`,
                transform: isHovered ? "scaleY(1.8) scaleX(1.05)" : "scaleY(1)",
              }}
            />
            <span className="text-[8px] font-mono tracking-widest text-neutral-400">
              DIVIDER
            </span>
          </div>
        )}

        {shapeType === "star" && (
          <div
            className="transition-transform duration-300"
            style={{
              transform: isHovered
                ? `rotate(${waveSeed * 36}deg) scale(1.18)`
                : "scale(1)",
            }}
          >
            <svg
              width="50"
              height="50"
              viewBox="0 0 24 24"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              className="filter drop-shadow-[0_0_16px_rgba(251,191,36,0.9)]"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
        )}

        {shapeType === "badge" && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold text-white shadow-lg transition-transform duration-300"
            style={{
              backgroundColor: fillColor,
              border: `${strokeWidth}px solid ${strokeColor}`,
              boxShadow: isHovered ? `0 0 28px ${strokeColor}` : `0 0 14px ${strokeColor}66`,
              transform: isHovered ? "scale(1.1)" : "scale(1)",
            }}
          >
            <Zap className={cn("w-3 h-3 text-amber-300 fill-amber-300", isHovered && "animate-bounce")} />
            <span>{merged.text || "ALERT"}</span>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // 2. PACK B: MOTION GRAPHICS & CARDS
  // ==========================================
  if (resType === "motion_graphic") {
    // 2a. Rising Growth Chart
    if (resId.includes("growth-chart") || resId.includes("chart") || resId.includes("graph")) {
      const h1 = isHovered ? 25 + ((waveSeed * 7) % 35) : 30;
      const h2 = isHovered ? 45 + ((waveSeed * 6) % 30) : 48;
      const h3 = isHovered ? 70 + ((waveSeed * 5) % 22) : 68;
      const h4 = isHovered ? 88 + ((waveSeed * 4) % 10) : 86;
      const h5 = isHovered ? 95 + ((waveSeed * 3) % 5) : 96;

      return (
        <div className="w-full h-full p-3 flex flex-col justify-end bg-gradient-to-br from-neutral-950 via-neutral-900 to-emerald-950/40 relative overflow-hidden select-none">
          {/* Subtle grid backdrop */}
          <div className="absolute inset-0 opacity-15 pointer-events-none flex flex-col justify-between p-3">
            <div className="w-full border-b border-dashed border-emerald-400" />
            <div className="w-full border-b border-dashed border-emerald-400" />
            <div className="w-full border-b border-dashed border-emerald-400" />
          </div>

          {/* SVG Connecting Neon Trend Line */}
          <svg className="absolute inset-x-3 bottom-5 h-16 w-[calc(100%-24px)] pointer-events-none overflow-visible">
            <path
              d={`M 10 ${64 - (h1 * 0.55)} Q 35 ${64 - (h2 * 0.55)} 60 ${64 - (h3 * 0.55)} T 110 ${64 - (h5 * 0.55)}`}
              fill="none"
              stroke="#34d399"
              strokeWidth={isHovered ? "2.5" : "1.8"}
              strokeLinecap="round"
              className={cn("transition-all duration-200", isHovered && "filter drop-shadow-[0_0_8px_#34d399]")}
            />
            <circle cx="10" cy={64 - (h1 * 0.55)} r="2.5" fill="#34d399" />
            <circle cx="60" cy={64 - (h3 * 0.55)} r="2.5" fill="#38bdf8" />
            <circle cx="110" cy={64 - (h5 * 0.55)} r="3" fill="#22d3ee" className="animate-pulse" />
          </svg>

          {/* 5 Equalizer Bar Columns with Rounded Neon Caps */}
          <div className="flex items-end justify-between gap-1.5 h-16 w-full z-10 px-1">
            <div
              className="w-1/5 rounded-t-sm bg-gradient-to-t from-emerald-950/60 via-emerald-600/50 to-emerald-400 transition-all duration-200 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
              style={{ height: `${h1}%` }}
            />
            <div
              className="w-1/5 rounded-t-sm bg-gradient-to-t from-emerald-950/60 via-emerald-500/60 to-emerald-300 transition-all duration-200 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
              style={{ height: `${h2}%` }}
            />
            <div
              className="w-1/5 rounded-t-sm bg-gradient-to-t from-emerald-950/60 via-teal-500/70 to-teal-300 transition-all duration-200 shadow-[0_0_12px_rgba(45,212,191,0.5)]"
              style={{ height: `${h3}%` }}
            />
            <div
              className="w-1/5 rounded-t-sm bg-gradient-to-t from-teal-950/60 via-cyan-500/80 to-cyan-300 transition-all duration-200 shadow-[0_0_14px_rgba(6,182,212,0.6)]"
              style={{ height: `${h4}%` }}
            />
            <div
              className="w-1/5 rounded-t-sm bg-gradient-to-t from-cyan-950/60 via-sky-400 to-white transition-all duration-200 shadow-[0_0_20px_rgba(56,189,248,0.9)]"
              style={{ height: `${h5}%` }}
            />
          </div>
        </div>
      );
    }

    // 2b. Animated Counter / Speedometer Radial Gauge
    if (resId.includes("counter")) {
      const angle = isHovered ? 210 : 90;
      const strokeVal = isHovered ? 80 : 35;

      return (
        <div className="w-full h-full p-2 flex items-center justify-center bg-gradient-to-br from-neutral-950 to-neutral-900 relative overflow-hidden select-none">
          {/* Circular Speedometer Arc */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 80 80">
              {/* Background Track */}
              <circle
                cx="40"
                cy="40"
                r="30"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="5"
                strokeDasharray="188"
                strokeDashoffset="45"
                strokeLinecap="round"
              />
              {/* Animated Progress Neon Arc */}
              <circle
                cx="40"
                cy="40"
                r="30"
                fill="none"
                stroke="url(#counterGrad)"
                strokeWidth="6"
                strokeDasharray="188"
                strokeDashoffset={188 - strokeVal * 1.5}
                strokeLinecap="round"
                className="transition-all duration-300 filter drop-shadow-[0_0_8px_#34d399]"
              />
              <defs>
                <linearGradient id="counterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>

            {/* Pulsing Concentric Center HUD */}
            <div
              className={cn(
                "absolute inset-3 rounded-full border border-emerald-500/20 flex items-center justify-center transition-all duration-300",
                isHovered && "border-emerald-400/50 bg-emerald-500/10 shadow-[0_0_16px_rgba(52,211,153,0.3)]"
              )}
            >
              {/* Center Needle / Tracer */}
              <div
                className="w-1 h-7 bg-gradient-to-t from-transparent via-emerald-400 to-white rounded-full transition-transform duration-300 origin-bottom"
                style={{ transform: `rotate(${angle}deg)` }}
              />
            </div>
          </div>
        </div>
      );
    }

    // 2c. Animated KPI / Oscilloscope Waveform
    if (resId.includes("kpi")) {
      const yOffset = (waveSeed % 4) * 3;

      return (
        <div className="w-full h-full p-2.5 flex items-center justify-center bg-neutral-950 relative overflow-hidden select-none">
          {/* Grid lines */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />

          {/* Oscilloscope Waveform */}
          <div className="w-full h-14 relative flex items-center">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 120 40" fill="none">
              <path
                d={`M 0 20 Q 20 ${10 - yOffset}, 35 ${25 + yOffset} T 65 ${8 - yOffset} T 95 ${28 + yOffset} L 120 20`}
                stroke="#38bdf8"
                strokeWidth={isHovered ? "2.5" : "1.8"}
                strokeLinecap="round"
                className={cn("transition-all duration-150", isHovered && "filter drop-shadow-[0_0_10px_#38bdf8]")}
              />
              <circle
                cx={isHovered ? "65" : "35"}
                cy={isHovered ? 8 - yOffset : 25 + yOffset}
                r="3.5"
                fill="#38bdf8"
                className="animate-pulse filter drop-shadow-[0_0_8px_#38bdf8]"
              />
            </svg>
          </div>
        </div>
      );
    }

    // 2d. Hero Reveal / Cinematic Intro Aperture
    if (resId.includes("hero")) {
      return (
        <div className="w-full h-full p-2 flex items-center justify-center bg-gradient-to-br from-violet-950/40 via-neutral-950 to-indigo-950/40 relative overflow-hidden select-none">
          {/* Rotating Diamond Aperture Brackets */}
          <div
            className="w-14 h-14 border border-violet-500/40 rounded-lg transition-all duration-300 flex items-center justify-center relative shadow-[0_0_20px_rgba(168,85,247,0.2)]"
            style={{
              transform: isHovered ? "rotate(45deg) scale(1.15)" : "rotate(0deg) scale(1)",
              borderColor: isHovered ? "#a855f7" : "rgba(168,85,247,0.4)",
            }}
          >
            {/* Inner Glowing Crosshair Ring */}
            <div className="w-8 h-8 rounded-full border border-cyan-400/50 flex items-center justify-center relative">
              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-cyan-400 to-violet-400 animate-pulse shadow-[0_0_12px_#38bdf8]" />
            </div>

            {/* Anamorphic Horizontal Flare Beam */}
            <div
              className={cn(
                "absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent transition-all duration-300",
                isHovered ? "w-28 -left-7 opacity-100 shadow-[0_0_12px_#38bdf8]" : "w-14 left-0 opacity-40"
              )}
            />
          </div>
        </div>
      );
    }

    // 2e. Terminal Code Visualizer
    if (resId.includes("terminal") || resId.includes("code") || resId.includes("vscode")) {
      const activeLineWidth = isHovered ? 30 + ((typedChars * 6) % 55) : 40;

      return (
        <div className="w-full h-full p-2.5 bg-neutral-950 border border-neutral-800 rounded flex flex-col justify-between relative overflow-hidden select-none">
          {/* macOS Titlebar Dots */}
          <div className="flex items-center gap-1 pb-1.5 border-b border-white/10">
            <span className="w-2 h-2 rounded-full bg-red-500/80" />
            <span className="w-2 h-2 rounded-full bg-amber-500/80" />
            <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
          </div>

          {/* Animated Syntax Highlight Lines */}
          <div className="space-y-1.5 py-1">
            <div className="flex items-center gap-1.5">
              <div className="h-2 rounded-sm bg-violet-500/60 w-10" />
              <div className="h-2 rounded-sm bg-cyan-400/80 w-16" />
            </div>
            <div className="flex items-center gap-1.5 pl-3">
              <div className="h-2 rounded-sm bg-emerald-400/70 w-8" />
              <div
                className="h-2 rounded-sm bg-amber-400/80 transition-all duration-75 relative"
                style={{ width: `${activeLineWidth}px` }}
              >
                {/* Blinking Cursor Bar */}
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white animate-pulse shadow-[0_0_6px_#ffffff]" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 pl-3">
              <div className="h-2 rounded-sm bg-rose-500/60 w-12" />
              <div className="h-2 rounded-sm bg-sky-400/50 w-6" />
            </div>
            <div className="h-2 rounded-sm bg-white/20 w-4" />
          </div>
        </div>
      );
    }

    // 2f. Modern Lower Third Banner
    if (resId.includes("lower-third") || resId.includes("third") || resId.includes("banner")) {
      return (
        <div className="w-full h-full p-2.5 flex flex-col justify-end bg-gradient-to-t from-neutral-950 via-neutral-900 to-transparent relative overflow-hidden select-none">
          {/* Sleek Lower Third Floating Capsule */}
          <div
            className={cn(
              "w-full h-9 rounded-lg bg-neutral-900/90 border border-sky-500/30 flex items-center px-2.5 transition-all duration-300 relative overflow-hidden",
              isHovered && "border-sky-400/70 shadow-[0_0_18px_rgba(56,189,248,0.3)]"
            )}
          >
            {/* Vertical Accent Pillar */}
            <div className="w-1 h-5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8] mr-2 shrink-0 animate-pulse" />

            {/* Abstract Graphic Bars */}
            <div className="space-y-1 flex-1">
              <div className="h-2 w-20 rounded bg-gradient-to-r from-sky-400 to-violet-400 opacity-90" />
              <div className="h-1.5 w-12 rounded bg-neutral-600" />
            </div>

            {/* Light Sweep Effect */}
            <div
              className={cn(
                "absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transition-all duration-700",
                isHovered ? "left-full" : "-left-12"
              )}
            />
          </div>
        </div>
      );
    }

    // 2g. Subscribe & Bell Callout
    if (resId.includes("subscribe") || resId.includes("bell")) {
      return (
        <div className="w-full h-full p-2 flex items-center justify-center bg-neutral-950 relative overflow-hidden select-none">
          {/* Crimson Rounded CTA Button with Ringing Bell */}
          <div
            className={cn(
              "px-3.5 py-2 rounded-full bg-gradient-to-r from-red-600 to-rose-600 flex items-center gap-2 shadow-lg transition-transform duration-300 relative",
              isHovered && "scale-110 shadow-[0_0_24px_rgba(225,29,72,0.6)]"
            )}
          >
            {/* Swinging 3D Golden Bell */}
            <div
              className={cn(
                "text-amber-300 transition-transform origin-top",
                isHovered && "animate-bounce"
              )}
            >
              <Bell className="w-4 h-4 fill-amber-300 filter drop-shadow-[0_0_6px_#f59e0b]" />
            </div>

            {/* Visual Indicator Bars */}
            <div className="w-6 h-1.5 rounded-full bg-white/80" />

            {/* Ripple Shockwaves */}
            {isHovered && (
              <span className="absolute inset-0 rounded-full border border-red-400 animate-ping opacity-60 pointer-events-none" />
            )}
          </div>
        </div>
      );
    }

    // 2h. Before & After Split Scanner
    if (resId.includes("before-after") || resId.includes("comparison")) {
      const sweepPercent = isHovered ? 40 + ((waveSeed * 6) % 35) : 50;

      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-neutral-950 flex items-stretch">
          {/* Left Dim Side */}
          <div
            className="h-full bg-neutral-900 border-r border-white/20 transition-all duration-150 relative overflow-hidden flex items-center justify-center"
            style={{ width: `${sweepPercent}%` }}
          >
            <div className="w-6 h-6 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center opacity-40">
              <Film className="w-3.5 h-3.5 text-neutral-500" />
            </div>
          </div>

          {/* Right Vibrant Neon Side */}
          <div className="flex-1 h-full bg-gradient-to-br from-emerald-950/60 to-cyan-950/60 relative overflow-hidden flex items-center justify-center shadow-[inset_0_0_20px_rgba(16,185,129,0.3)]">
            <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center shadow-[0_0_16px_rgba(16,185,129,0.7)] animate-pulse">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Glowing Vertical Laser Divider */}
          <div
            className="absolute inset-y-0 w-1 bg-white shadow-[0_0_12px_#38bdf8] pointer-events-none transition-all duration-150"
            style={{ left: `${sweepPercent}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-4 h-4 rounded-full bg-white shadow-[0_0_8px_#38bdf8] border border-cyan-400" />
          </div>
        </div>
      );
    }

    // 2i. Countdown Timer Widget
    if (resId.includes("countdown") || resId.includes("timer")) {
      const rot = isHovered ? (waveSeed * 45) % 360 : 45;

      return (
        <div className="w-full h-full p-2 flex items-center justify-center bg-neutral-950 relative overflow-hidden select-none">
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* Outer Perimeter Ring */}
            <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke="rgba(245, 158, 11, 0.2)"
                strokeWidth="3.5"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="4"
                strokeDasharray="163"
                strokeDashoffset={isHovered ? (waveSeed * 16) % 163 : 60}
                strokeLinecap="round"
                className="transition-all duration-150 filter drop-shadow-[0_0_8px_#f59e0b]"
              />
            </svg>

            {/* Rotating Center Clock Hand */}
            <div
              className="absolute w-1 h-6 bg-gradient-to-t from-transparent to-amber-300 rounded-full origin-bottom transition-transform duration-100 shadow-[0_0_6px_#f59e0b]"
              style={{ transform: `rotate(${rot}deg)` }}
            />
            <div className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_6px_#f59e0b]" />
          </div>
        </div>
      );
    }

    // 2j. 5-Star Review Sparkle
    if (resId.includes("review") || resId.includes("rating") || resId.includes("stars")) {
      return (
        <div className="w-full h-full p-2 flex items-center justify-center bg-gradient-to-br from-neutral-950 to-amber-950/20 relative overflow-hidden select-none">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((starIdx) => {
              const isActive = !isHovered || waveSeed >= starIdx;
              return (
                <div
                  key={starIdx}
                  className={cn(
                    "transition-all duration-200",
                    isActive
                      ? "scale-110 text-amber-400 filter drop-shadow-[0_0_10px_#fbbf24]"
                      : "scale-90 text-neutral-700"
                  )}
                >
                  <Star className={cn("w-4 h-4", isActive ? "fill-amber-400" : "fill-neutral-800")} />
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // 2k. Social Handles / Creator Badge
    if (resId.includes("handles") || resId.includes("social-handles")) {
      return (
        <div className="w-full h-full p-2 flex items-center justify-center bg-neutral-950 relative overflow-hidden select-none">
          {/* Holographic Rotating Ring Badge */}
          <div
            className={cn(
              "w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-purple-500 via-pink-500 to-cyan-400 transition-transform duration-500 relative flex items-center justify-center",
              isHovered && "rotate-180 shadow-[0_0_24px_rgba(168,85,247,0.5)]"
            )}
          >
            <div className="w-full h-full rounded-full bg-neutral-950 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-purple-300 animate-pulse" />
            </div>
            {/* Orbiting particle */}
            <div className="absolute -top-1 w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]" />
          </div>
        </div>
      );
    }

    // 2l. Completion Progress Bar
    if (resId.includes("progress")) {
      const pct = isHovered ? 20 + ((waveSeed * 9) % 80) : 75;

      return (
        <div className="w-full h-full p-3 flex flex-col justify-center bg-neutral-950 relative overflow-hidden select-none">
          <div className="w-full bg-neutral-900 rounded-full h-3 overflow-hidden border border-white/10 relative p-0.5">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-200 relative shadow-[0_0_14px_rgba(56,189,248,0.7)]"
              style={{ width: `${pct}%` }}
            >
              {/* Plasma Head Orb */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
            </div>
          </div>
        </div>
      );
    }

    // 2m. Viral Social Card
    if (resId.includes("social-post") || resId.includes("tweet") || resId.includes("social")) {
      return (
        <div className="w-full h-full p-2 flex items-center justify-center bg-neutral-950 relative overflow-hidden select-none">
          {/* Floating Glassmorphic Heart Card */}
          <div
            className={cn(
              "w-14 h-14 rounded-2xl bg-neutral-900/80 border border-rose-500/30 flex items-center justify-center transition-all duration-300 relative shadow-lg",
              isHovered && "border-rose-400 scale-110 shadow-[0_0_24px_rgba(244,63,94,0.5)]"
            )}
          >
            <Heart
              className={cn(
                "w-7 h-7 text-rose-500 fill-rose-500 transition-transform duration-200",
                isHovered ? "scale-125 filter drop-shadow-[0_0_12px_#f43f5e]" : "scale-100"
              )}
            />
            {/* Floating reaction particles */}
            {isHovered && (
              <>
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                <span className="absolute -bottom-1 -left-1 w-1.5 h-1.5 rounded-full bg-pink-300 animate-pulse" />
              </>
            )}
          </div>
        </div>
      );
    }

    // 2n. Cinematic Quote Reveal
    if (resId.includes("quote")) {
      return (
        <div className="w-full h-full p-2 flex items-center justify-center bg-gradient-to-br from-amber-950/30 via-neutral-950 to-neutral-900 relative overflow-hidden select-none">
          {/* Sculptural Glowing Quotation Marks */}
          <div
            className={cn(
              "transition-all duration-300 flex items-center gap-1",
              isHovered && "scale-125 filter drop-shadow-[0_0_16px_#fbbf24]"
            )}
          >
            <Quote className="w-8 h-8 text-amber-400 fill-amber-400/40 rotate-180" />
            <Quote className="w-8 h-8 text-amber-400 fill-amber-400/40" />
          </div>
        </div>
      );
    }

    // 2o. Action Items Checklist
    if (resId.includes("notes") || resId.includes("checklist")) {
      return (
        <div className="w-full h-full p-2.5 flex flex-col justify-center gap-1.5 bg-neutral-950 relative overflow-hidden select-none">
          {[1, 2, 3].map((rowIdx) => {
            const isRowChecked = !isHovered || waveSeed >= rowIdx * 2;
            return (
              <div
                key={rowIdx}
                className={cn(
                  "h-4 rounded-md border flex items-center px-2 transition-all duration-200",
                  isRowChecked
                    ? "bg-emerald-950/40 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                    : "bg-neutral-900/60 border-neutral-800"
                )}
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full mr-2 transition-colors",
                    isRowChecked ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-neutral-700"
                  )}
                />
                <div
                  className={cn(
                    "h-1.5 rounded transition-all",
                    isRowChecked ? "bg-emerald-300/80 w-16" : "bg-neutral-700 w-12"
                  )}
                />
              </div>
            );
          })}
        </div>
      );
    }

    // 2p. App Screen Video Upload / Software Motion
    if (resId.includes("upload") || resId.includes("app-screen-upload") || resId.includes("screen")) {
      const upProgress = isHovered ? 20 + ((waveSeed * 9) % 85) : 80;
      const isDone = upProgress >= 80;

      return (
        <div className="w-full h-full p-2.5 bg-neutral-950 border border-neutral-800 rounded flex flex-col justify-between relative overflow-hidden select-none">
          {/* Header dots */}
          <div className="flex items-center gap-1 border-b border-white/10 pb-1">
            <span className="w-2 h-2 rounded-full bg-red-500/80" />
            <span className="w-2 h-2 rounded-full bg-amber-500/80" />
            <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
          </div>

          {/* Central Cloud Sync Icon & Progress */}
          <div className="flex flex-col items-center justify-center my-auto">
            <div className={cn("transition-all duration-300 mb-1.5", isHovered && "scale-110")}>
              {isDone ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 filter drop-shadow-[0_0_8px_#34d399]" />
              ) : (
                <CloudUpload className="w-6 h-6 text-sky-400 animate-pulse filter drop-shadow-[0_0_8px_#38bdf8]" />
              )}
            </div>

            {/* Upload Bar */}
            <div className="w-24 h-2 bg-neutral-900 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-150"
                style={{ width: `${upProgress}%` }}
              />
            </div>
          </div>
        </div>
      );
    }

    // 2q. Directional Attention Arrow
    if (resId.includes("arrow")) {
      return (
        <div className="w-full h-full p-2 flex items-center justify-center bg-neutral-950 relative overflow-hidden select-none">
          <div
            className={cn(
              "w-12 h-12 rounded-2xl bg-neutral-900/80 border border-sky-500/40 flex items-center justify-center transition-all duration-300 relative shadow-lg",
              isHovered && "scale-110 border-sky-400 translate-x-1 shadow-[0_0_24px_rgba(56,189,248,0.5)]"
            )}
          >
            <ArrowRight
              className={cn(
                "w-6 h-6 text-sky-400 transition-transform duration-200",
                isHovered ? "translate-x-1 scale-110 filter drop-shadow-[0_0_8px_#38bdf8]" : ""
              )}
            />
            {isHovered && (
              <span className="absolute -inset-1 rounded-2xl border border-sky-400/40 animate-ping pointer-events-none" />
            )}
          </div>
        </div>
      );
    }

    // 2r. Callout Pill Badge
    if (resId.includes("badge") || resId.includes("pill")) {
      return (
        <div className="w-full h-full p-2 flex items-center justify-center bg-neutral-950 relative overflow-hidden select-none">
          <div
            className={cn(
              "px-3 py-1.5 rounded-full bg-neutral-900/90 border border-amber-400/40 flex items-center gap-2 transition-all duration-300 shadow-lg",
              isHovered && "scale-105 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]"
            )}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
              FEATURE
            </span>
          </div>
        </div>
      );
    }

    // 2s. Kinetic Headline Punch
    if (resId.includes("kinetic")) {
      return (
        <div className="w-full h-full p-2 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-indigo-950/40 relative overflow-hidden select-none font-black tracking-tighter">
          <div className="flex flex-col items-center gap-0.5">
            <span className={cn("text-[10px] text-neutral-400 uppercase tracking-widest transition-all", isHovered && "text-white")}>
              MAKE IT
            </span>
            <span
              className={cn(
                "text-sm font-black bg-gradient-to-r from-amber-400 via-rose-500 to-purple-500 bg-clip-text text-transparent transition-all duration-300",
                isHovered && "scale-110 filter drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]"
              )}
            >
              IMPACTFUL
            </span>
          </div>
        </div>
      );
    }

    // 2t. Glowing Concept Icon Reveal
    if (resId.includes("icon")) {
      return (
        <div className="w-full h-full p-2 flex items-center justify-center bg-neutral-950 relative overflow-hidden select-none">
          <div
            className={cn(
              "w-13 h-13 rounded-2xl bg-neutral-900/90 border border-violet-500/40 flex items-center justify-center transition-all duration-300 relative shadow-lg p-2.5",
              isHovered && "scale-110 border-violet-400 shadow-[0_0_24px_rgba(168,85,247,0.5)]"
            )}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.8)]">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            {isHovered && (
              <span className="absolute inset-0 rounded-2xl border border-violet-400/50 animate-pulse pointer-events-none" />
            )}
          </div>
        </div>
      );
    }

    // 2u. Direct Message Dialogue
    if (resId.includes("chat") || resId.includes("dialogue")) {
      return (
        <div className="w-full h-full p-2 flex flex-col justify-center gap-1.5 bg-neutral-950 relative overflow-hidden select-none">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-neutral-800 border border-neutral-700 shrink-0" />
            <div className="h-3.5 px-2 rounded-full bg-neutral-800/90 border border-neutral-700/80 flex items-center">
              <div className="h-1.5 w-8 rounded-full bg-neutral-400" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <div
              className={cn(
                "h-3.5 px-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 flex items-center transition-all duration-300 shadow",
                isHovered && "scale-105 shadow-[0_0_12px_rgba(56,189,248,0.5)]"
              )}
            >
              <div className="h-1.5 w-10 rounded-full bg-white/90" />
            </div>
            <div className="w-3.5 h-3.5 rounded-full bg-sky-500 shrink-0 flex items-center justify-center text-[7px] font-bold text-white">
              ✓
            </div>
          </div>
        </div>
      );
    }

    // 2v. Connected Step Sequence / Pipeline
    if (resId.includes("flow") || resId.includes("step")) {
      return (
        <div className="w-full h-full p-2 flex items-center justify-center bg-neutral-950 relative overflow-hidden select-none">
          <div className="flex items-center gap-1.5 relative">
            <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-0.5 bg-neutral-800" />
            <div
              className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-400 transition-all duration-300",
                isHovered ? "w-14" : "w-6"
              )}
            />
            {[1, 2, 3].map((step) => {
              const active = step <= (isHovered ? 3 : 2);
              return (
                <div
                  key={step}
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black z-10 transition-all duration-200 border",
                    active
                      ? "bg-emerald-500 text-neutral-950 border-emerald-400 shadow-[0_0_8px_#34d399]"
                      : "bg-neutral-900 text-neutral-500 border-neutral-800"
                  )}
                >
                  {step}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Universal Motion Graphic Fallback: Hypnotic Kinetic Gyroscope
    return (
      <div className="w-full h-full p-2 flex items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-indigo-950/40 relative overflow-hidden select-none">
        <div
          className={cn(
            "w-14 h-14 rounded-full border-2 border-indigo-500/40 flex items-center justify-center transition-all duration-500 relative",
            isHovered && "scale-110 rotate-180 border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.5)]"
          )}
        >
          <div className="w-9 h-9 rounded-full border border-violet-400/60 flex items-center justify-center animate-spin">
            <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. PACK C: STOCK B-ROLL & VIDEO
  // ==========================================
  if (resType === "broll") {
    const hasLiveVideo = !!merged.sourceUrl && !videoError;
    const aspectRatio = resource.aspectRatio;
    const thumbnailUrl = resource.thumbnailUrl;

    return (
      <div className="w-full h-full relative overflow-hidden select-none bg-neutral-950 group flex items-center justify-center">
        {/* Real Live Video on Hover */}
        {isHovered && hasLiveVideo ? (
          <video
            ref={videoRef}
            src={merged.sourceUrl}
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover absolute inset-0 z-0 animate-in fade-in duration-300"
          />
        ) : thumbnailUrl ? (
          /* Real Pexels Thumbnail Poster Backdrop */
          <div className="w-full h-full absolute inset-0 overflow-hidden">
            <img
              src={thumbnailUrl}
              alt={resource.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20" />
          </div>
        ) : (
          /* High-Fidelity Poster Backdrop when not hovered */
          <div
            className="w-full h-full absolute inset-0 bg-cover bg-center transition-transform duration-500"
            style={{
              backgroundImage: resId.includes("city")
                ? "linear-gradient(180deg, rgba(15, 23, 42, 0.4) 0%, rgba(13, 14, 25, 0.95) 100%), radial-gradient(circle at 50% 20%, #7e22ce 0%, #0f172a 70%)"
                : resId.includes("coding")
                ? "linear-gradient(135deg, rgba(6, 78, 59, 0.4) 0%, rgba(2, 6, 23, 0.95) 100%)"
                : "linear-gradient(180deg, #f97316 0%, #6366f1 45%, #0f172a 100%)",
            }}
          >
            {/* SVG Silhouettes */}
            {resId.includes("city") && (
              <svg className="w-full h-full absolute inset-0 opacity-40" preserveAspectRatio="none" viewBox="0 0 100 100">
                <rect x="5" y="40" width="12" height="60" fill="#1e1b4b" />
                <rect x="20" y="25" width="16" height="75" fill="#312e81" />
                <rect x="40" y="15" width="20" height="85" fill="#1e1b4b" />
                <rect x="65" y="30" width="14" height="70" fill="#312e81" />
                <rect x="82" y="45" width="14" height="55" fill="#1e1b4b" />
                <line x1="0" y1="92" x2="100" y2="92" stroke="#06b6d4" strokeWidth="2" strokeDasharray="6,4" />
                <line x1="0" y1="96" x2="100" y2="96" stroke="#f43f5e" strokeWidth="2" strokeDasharray="8,6" />
              </svg>
            )}
            {resId.includes("coding") && (
              <div className="p-3 space-y-1 font-mono text-[9px] text-emerald-400/90">
                <p className="text-cyan-400">$ npm run dev</p>
                <p className="text-emerald-400">const video = await render();</p>
                <p className="text-amber-300">timeline.splice(clip);</p>
              </div>
            )}
            {resId.includes("mountain") && (
              <svg className="w-full h-full absolute inset-0 opacity-80" preserveAspectRatio="none" viewBox="0 0 100 100">
                <polygon points="0,100 25,45 50,85 75,35 100,100" fill="#0f172a" />
                <polygon points="15,100 40,60 65,95 85,55 100,100" fill="#1e1b4b" opacity="0.6" />
              </svg>
            )}
          </div>
        )}

        {/* Aspect Ratio Badge & SubCategory Badge */}
        <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1">
          {aspectRatio && (
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[9px] font-bold tracking-tight shadow-sm backdrop-blur-md",
                aspectRatio === "9:16"
                  ? "bg-violet-600/90 text-violet-100 border border-violet-400/40"
                  : "bg-sky-600/90 text-sky-100 border border-sky-400/40"
              )}
            >
              {aspectRatio}
            </span>
          )}
          {resource.subCategory && (
            <span className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-black/60 text-neutral-300 backdrop-blur-md border border-white/10">
              {resource.subCategory}
            </span>
          )}
        </div>

        {/* Play indicator overlay when not hovered */}
        {!isHovered && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-7 h-7 rounded-full bg-black/55 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90 shadow-lg">
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </div>
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute bottom-1.5 right-1.5 z-10">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-black/70 text-neutral-300 backdrop-blur-md border border-white/10">
            {resource.duration ?? resource.defaultDuration}s
          </span>
        </div>
      </div>
    );
  }

  // ==========================================
  // 4. PACK D: VISUAL EFFECTS & COLOR FILTERS
  // ==========================================
  if (resType === "effect") {
    // RGB Glitch
    if (resId.includes("glitch")) {
      const offsetX = isHovered ? (waveSeed % 2 === 0 ? 4 : -4) : 2;
      const offsetY = isHovered ? (waveSeed % 3 === 0 ? 2 : -2) : 0;

      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-neutral-950 flex items-center justify-center">
          <div className="relative font-black text-lg tracking-wider">
            {/* Chromatic shift layers */}
            <span
              className="absolute inset-0 text-cyan-400 opacity-90 transition-transform duration-100"
              style={{ transform: `translate(${-offsetX}px, ${-offsetY}px)` }}
            >
              GLITCH
            </span>
            <span
              className="absolute inset-0 text-rose-500 opacity-90 transition-transform duration-100"
              style={{ transform: `translate(${offsetX}px, ${offsetY}px)` }}
            >
              GLITCH
            </span>
            <span className="relative text-white">GLITCH</span>
          </div>

          {/* Scanline lines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)",
            }}
          />
        </div>
      );
    }

    // Cinematic Teal & Orange
    if (resId.includes("teal") || resId.includes("cinematic")) {
      const splitPos = isHovered ? 20 + ((transitionProgress * 0.6) % 60) : 50;

      return (
        <div className="w-full h-full relative overflow-hidden select-none flex">
          {/* Split before / after swatch */}
          <div
            className="h-full bg-gradient-to-br from-amber-600 via-orange-500 to-yellow-600 flex items-center justify-center p-1 transition-all duration-100"
            style={{ width: `${splitPos}%` }}
          />
          <div
            className="h-full bg-gradient-to-br from-teal-800 via-cyan-900 to-slate-950 flex items-center justify-center p-1 border-l-2 border-white transition-all duration-100"
            style={{ width: `${100 - splitPos}%` }}
          />
        </div>
      );
    }

    // VHS Retro Scanlines
    if (resId.includes("vhs")) {
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-neutral-950 flex flex-col justify-between p-2 font-mono">
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, #fff 0, #fff 1px, transparent 1px, transparent 3px)",
              backgroundPositionY: isHovered ? `${waveSeed * 4}px` : "0px",
            }}
          />
        </div>
      );
    }

    // Cyberpunk Neon Glow
    if (resId.includes("neon") || resId.includes("cyberpunk")) {
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-neutral-950 flex items-center justify-center">
          <div
            className="w-20 h-10 rounded-xl border border-pink-500/90 flex items-center justify-center text-[10px] font-black text-pink-300 transition-all duration-300"
            style={{
              boxShadow: isHovered
                ? "0 0 32px #ec4899, inset 0 0 20px #ec4899"
                : "0 0 14px #ec489988",
              transform: isHovered ? "scale(1.1)" : "scale(1)",
            }}
          >
            NEON
          </div>
        </div>
      );
    }

    // Film Grain / Black & White Noir
    if (resId.includes("bw") || resId.includes("noir")) {
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-black flex items-center justify-center border border-neutral-700">
          <span className="text-xs font-black text-white tracking-widest uppercase">
            B&amp;W NOIR
          </span>
        </div>
      );
    }

    // 1. Cinematic Vignette
    if (resId.includes("vignette")) {
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-neutral-900 flex items-center justify-center">
          <div
            className="w-full h-full absolute inset-0 transition-all duration-300 pointer-events-none"
            style={{
              background: isHovered
                ? "radial-gradient(circle at center, transparent 25%, rgba(0,0,0,0.85) 75%, rgba(0,0,0,0.98) 100%)"
                : "radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.7) 80%, rgba(0,0,0,0.95) 100%)",
            }}
          />
          <div
            className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-[9px] font-bold tracking-wider text-neutral-300 transition-all duration-300"
            style={{
              transform: isHovered ? "scale(1.15)" : "scale(1)",
              boxShadow: isHovered ? "0 0 20px rgba(255,255,255,0.2)" : "none",
            }}
          >
            FOCUS
          </div>
        </div>
      );
    }

    // 2. Golden Hour Glow
    if (resId.includes("golden") || resId.includes("sunset")) {
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-gradient-to-br from-amber-900/60 via-orange-950/70 to-neutral-950 flex items-center justify-center">
          {/* Sun flare burst */}
          <div
            className="absolute -top-4 -left-4 w-24 h-24 rounded-full transition-all duration-500 pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(251,191,36,0.85) 0%, rgba(245,158,11,0.5) 40%, rgba(234,88,12,0.2) 70%, transparent 100%)",
              transform: isHovered ? "scale(1.35)" : "scale(1)",
              filter: "blur(4px)",
            }}
          />
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-[10px] font-black tracking-widest text-amber-200 uppercase drop-shadow-md">
              GOLDEN HOUR
            </span>
            <span className="text-[8px] font-medium text-amber-400/80">3200K WARMTH</span>
          </div>
        </div>
      );
    }

    // 3. Anamorphic Lens Flare
    if (resId.includes("flare") || resId.includes("anamorphic")) {
      const streakShift = isHovered ? (waveSeed % 2 === 0 ? 6 : -6) : 0;
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-neutral-950 flex items-center justify-center">
          {/* Optical Center Core */}
          <div
            className="w-4 h-4 rounded-full bg-cyan-200 transition-transform duration-200 shadow-[0_0_24px_#38bdf8]"
            style={{
              transform: `translateX(${streakShift}px) scale(${isHovered ? 1.3 : 1})`,
            }}
          />
          {/* Horizontal Anamorphic Flare Streak */}
          <div
            className="absolute w-full h-[2px] transition-all duration-200"
            style={{
              background: "linear-gradient(90deg, transparent 0%, #38bdf8 30%, #ffffff 50%, #38bdf8 70%, transparent 100%)",
              boxShadow: "0 0 14px #0284c7, 0 0 28px #38bdf8",
              transform: `translateX(${streakShift * 2}px) scaleY(${isHovered ? 2 : 1})`,
            }}
          />
          <span className="absolute bottom-2 text-[8px] font-mono tracking-widest text-cyan-400 uppercase">
            2.39:1 STREAK
          </span>
        </div>
      );
    }

    // 4. 8mm Vintage Film Burn
    if (resId.includes("vintage") || resId.includes("8mm") || resId.includes("film")) {
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-amber-950/80 flex items-center justify-center border-x-4 border-dashed border-amber-900/60 p-2 font-mono">
          {/* Vintage grain line */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
            style={{
              backgroundImage: "repeating-linear-gradient(90deg, transparent 0, transparent 18px, rgba(0,0,0,0.5) 19px, transparent 20px)",
              transform: isHovered ? `translateX(${((waveSeed % 4) - 2)}px)` : "none",
            }}
          />
          <div className="relative z-10 px-2 py-0.5 rounded bg-black/60 border border-amber-500/40 text-center">
            <span className="text-[9px] font-black tracking-widest text-amber-300">
              KODAK 8MM
            </span>
          </div>
        </div>
      );
    }

    // 5. Strobe Flash Burst
    if (resId.includes("flash") || resId.includes("strobe")) {
      const flashActive = isHovered && waveSeed % 2 === 0;
      return (
        <div
          className={cn(
            "w-full h-full relative overflow-hidden select-none flex items-center justify-center transition-colors duration-100",
            flashActive ? "bg-white text-neutral-950" : "bg-neutral-950 text-white"
          )}
        >
          <div className="flex items-center gap-1.5 font-black text-[11px] tracking-wider">
            <Zap className={cn("w-3.5 h-3.5", flashActive ? "text-amber-500 fill-amber-500" : "text-amber-400")} />
            <span>FLASH BURST</span>
          </div>
        </div>
      );
    }

    // 6. Radial Zoom Blur
    if (resId.includes("zoom") || resId.includes("blur")) {
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-neutral-950 flex items-center justify-center">
          {/* Speedlines radiating */}
          <div
            className="absolute inset-0 pointer-events-none transition-transform duration-300"
            style={{
              backgroundImage: "radial-gradient(circle, transparent 20%, rgba(255,255,255,0.12) 60%, rgba(255,255,255,0.3) 100%)",
              transform: isHovered ? "scale(1.2)" : "scale(1)",
            }}
          />
          <div className="relative z-10 flex flex-col items-center">
            <span
              className="text-xs font-black tracking-widest text-white uppercase italic transition-transform duration-200"
              style={{ transform: isHovered ? "scale(1.25)" : "scale(1)" }}
            >
              WARP SPEED
            </span>
          </div>
        </div>
      );
    }

    // 7. CRT Arcade Phosphor
    if (resId.includes("crt") || resId.includes("arcade")) {
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-black flex flex-col items-center justify-center border border-emerald-900/60 p-2 font-mono">
          {/* Scanline grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, #10b981 0, #10b981 1px, transparent 1px, transparent 3px)",
              backgroundPositionY: isHovered ? `${waveSeed * 3}px` : "0px",
            }}
          />
          <span className="relative z-10 text-[10px] font-black text-emerald-400 tracking-wider shadow-[0_0_12px_#10b981]">
            CRT // 60Hz
          </span>
          <span className="relative z-10 text-[7px] text-emerald-600 mt-0.5">PHOSPHOR GRID</span>
        </div>
      );
    }

    // 8. Comic Pop Halftone
    if (resId.includes("halftone") || resId.includes("comic")) {
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-yellow-400 flex items-center justify-center">
          {/* Halftone dot pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: "radial-gradient(#000000 28%, transparent 29%)",
              backgroundSize: "8px 8px",
            }}
          />
          <div
            className="relative z-10 px-2.5 py-1 bg-rose-600 border-2 border-black rotate-[-6deg] shadow-[3px_3px_0px_#000000] transition-transform duration-200"
            style={{ transform: isHovered ? "rotate(0deg) scale(1.15)" : "rotate(-6deg)" }}
          >
            <span className="text-[11px] font-black text-white italic tracking-wider">
              POW!
            </span>
          </div>
        </div>
      );
    }

    // 9. Prismatic Rainbow Bokeh
    if (resId.includes("prism") || resId.includes("bokeh")) {
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-gradient-to-tr from-violet-950 via-slate-900 to-indigo-950 flex items-center justify-center">
          {/* Floating rainbow bokeh circles */}
          <div
            className="absolute w-8 h-8 rounded-full border border-pink-400/50 bg-pink-500/20 blur-[1px] transition-all duration-300"
            style={{
              top: isHovered ? "15%" : "25%",
              left: isHovered ? "15%" : "20%",
              transform: isHovered ? "scale(1.2)" : "scale(1)",
            }}
          />
          <div
            className="absolute w-12 h-12 rounded-full border border-cyan-400/50 bg-cyan-500/20 blur-[1px] transition-all duration-300"
            style={{
              bottom: isHovered ? "10%" : "20%",
              right: isHovered ? "15%" : "25%",
              transform: isHovered ? "scale(1.2)" : "scale(1)",
            }}
          />
          <div
            className="absolute w-6 h-6 rounded-full border border-amber-300/60 bg-amber-400/20 blur-[1px] transition-all duration-300"
            style={{
              top: isHovered ? "30%" : "40%",
              right: isHovered ? "20%" : "30%",
            }}
          />
          <span className="relative z-10 text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-amber-300 to-cyan-400 tracking-wider">
            PRISM BOKEH
          </span>
        </div>
      );
    }

    // 10. Tactical Night Vision
    if (resId.includes("night") || resId.includes("tactical")) {
      const blinkOn = waveSeed % 2 === 0;
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-emerald-950 flex flex-col items-center justify-between p-2 font-mono">
          {/* Tactical Scope Overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(circle, transparent 40%, rgba(6, 78, 59, 0.7) 70%, rgba(2, 44, 34, 0.95) 100%)",
            }}
          />
          {/* Top HUD */}
          <div className="w-full flex justify-between items-center text-[7px] text-emerald-400 z-10 font-bold">
            <span className="flex items-center gap-1">
              <span className={cn("w-1.5 h-1.5 rounded-full", blinkOn ? "bg-emerald-400" : "bg-emerald-800")} />
              IR ACTIVE
            </span>
            <span>BAT 98%</span>
          </div>
          {/* Center reticle */}
          <div className="relative z-10 text-[9px] font-black text-emerald-300 tracking-widest">
            + 0.00 MIL +
          </div>
          {/* Bottom HUD */}
          <div className="w-full flex justify-between items-center text-[6px] text-emerald-500 z-10">
            <span>NVD-GEN3</span>
            <span>[GAIN: AUTO]</span>
          </div>
        </div>
      );
    }

    // 16. 35mm Motion Film Grain
    if (resId.includes("grain")) {
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-neutral-900 flex flex-col items-center justify-center p-2">
          {/* Animated grain dots */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
            style={{
              backgroundImage:
                "radial-gradient(circle, #fff 10%, transparent 11%), radial-gradient(circle at 50% 50%, #fff 5%, transparent 6%)",
              backgroundSize: isHovered ? "4px 4px, 7px 7px" : "5px 5px, 8px 8px",
              backgroundPosition: `${waveSeed * 3}px ${waveSeed * 2}px`,
            }}
          />
          {/* Film perforations preview */}
          <div className="absolute left-1 inset-y-0 flex flex-col justify-around opacity-30">
            <div className="w-1.5 h-2 rounded-[1px] bg-white" />
            <div className="w-1.5 h-2 rounded-[1px] bg-white" />
            <div className="w-1.5 h-2 rounded-[1px] bg-white" />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-[10px] font-black text-amber-200/90 tracking-widest font-mono">
              35MM GRAIN
            </span>
            <span className="text-[7px] text-neutral-400 font-mono">KODAK 500T</span>
          </div>
        </div>
      );
    }

    // 17. Duotone Cyber Ultraviolet
    if (resId.includes("duotone")) {
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-gradient-to-br from-purple-950 via-purple-900 to-cyan-900 flex items-center justify-center p-2">
          <div className="relative z-10 flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-700 to-cyan-400 shadow-lg border border-cyan-400/40 transition-transform duration-300"
              style={{ transform: isHovered ? "scale(1.15) rotate(45deg)" : "scale(1)" }}
            />
            <span className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300 tracking-wider">
              DUOTONE
            </span>
          </div>
        </div>
      );
    }

    // 18. Infrared Thermal Heatmap
    if (resId.includes("thermal")) {
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-gradient-to-r from-blue-900 via-cyan-500 via-yellow-400 via-orange-500 to-red-600 flex flex-col items-center justify-between p-2 font-mono">
          <div className="w-full flex justify-between text-[7px] text-white/90 font-bold drop-shadow">
            <span>IR-THERMAL</span>
            <span>37.4°C</span>
          </div>
          <div
            className="w-12 h-6 rounded-full border border-white/60 bg-white/20 backdrop-blur-sm flex items-center justify-center text-[8px] font-bold text-white shadow-md transition-transform duration-300"
            style={{ transform: isHovered ? "scale(1.1)" : "scale(1)" }}
          >
            HOTSPOT
          </div>
          <div className="w-full flex justify-between text-[6px] text-white/80">
            <span>LOW: 18°C</span>
            <span>HIGH: 42°C</span>
          </div>
        </div>
      );
    }

    // 19. Dreamy Pro-Mist Bloom
    if (resId.includes("dreamy") || resId.includes("bloom")) {
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-neutral-950 flex items-center justify-center p-2">
          {/* Ethereal glowing orb */}
          <div
            className="absolute w-20 h-20 rounded-full bg-amber-200/30 blur-xl transition-all duration-300"
            style={{ transform: isHovered ? "scale(1.3)" : "scale(1)" }}
          />
          <div
            className="absolute w-10 h-10 rounded-full bg-white/60 blur-md transition-all duration-300"
            style={{ transform: isHovered ? "scale(1.2)" : "scale(1)" }}
          />
          <span className="relative z-10 text-[10px] font-black text-amber-100 tracking-widest drop-shadow-md">
            PRO-MIST
          </span>
        </div>
      );
    }

    // 20. RGB Party Color Strobe
    if (resId.includes("party") || resId.includes("color-strobe") || resId.includes("split-strobe")) {
      const activeColor =
        waveSeed % 3 === 0
          ? "from-fuchsia-600 to-pink-500"
          : waveSeed % 3 === 1
          ? "from-amber-500 to-yellow-400"
          : "from-emerald-500 to-cyan-400";

      return (
        <div
          className={cn(
            "w-full h-full relative overflow-hidden select-none flex items-center justify-center p-2 transition-colors duration-150 bg-gradient-to-tr",
            activeColor
          )}
        >
          <div className="p-1 rounded bg-black/50 backdrop-blur-sm text-center">
            <span className="text-[10px] font-black text-white tracking-widest">
              RGB STROBE
            </span>
          </div>
        </div>
      );
    }

    // 21. 90s Skate Fisheye Warp
    if (resId.includes("fisheye")) {
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-neutral-950 flex items-center justify-center p-2">
          {/* Circular barrel border */}
          <div
            className="w-20 h-20 rounded-full border-2 border-cyan-400/80 bg-neutral-900 flex items-center justify-center transition-all duration-300"
            style={{
              boxShadow: isHovered
                ? "0 0 24px rgba(6, 182, 212, 0.6), inset 0 0 16px rgba(239, 68, 68, 0.4)"
                : "0 0 12px rgba(6, 182, 212, 0.3)",
              transform: isHovered ? "scale(1.08)" : "scale(1)",
            }}
          >
            <span className="text-[9px] font-black text-white tracking-widest font-mono">
              FISHEYE
            </span>
          </div>
        </div>
      );
    }

    // 22. 2.39:1 Anamorphic Letterbox
    if (resId.includes("letterbox")) {
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-neutral-900 flex flex-col justify-between">
          <div className="w-full h-3 bg-black border-b border-amber-400/40 flex items-center px-2">
            <span className="text-[6px] font-mono text-amber-400/70">CINEMASCOPE</span>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-[10px] font-bold text-neutral-300 tracking-wider">
              2.39 : 1
            </span>
          </div>
          <div className="w-full h-3 bg-black border-t border-amber-400/40" />
        </div>
      );
    }

    // 23. Earthquake Impact Camera Shake
    if (resId.includes("shake")) {
      const shakeOffset = isHovered ? ((waveSeed % 2 === 0 ? 3 : -3)) : 0;
      return (
        <div
          className="w-full h-full relative overflow-hidden select-none bg-neutral-950 flex items-center justify-center p-2 border border-red-500/30"
          style={{ transform: `translate(${shakeOffset}px, ${-shakeOffset}px)` }}
        >
          <div className="px-2 py-1 rounded bg-red-950/60 border border-red-500/50 text-red-300 text-[10px] font-black tracking-widest">
            QUAKE
          </div>
        </div>
      );
    }

    // 24. Psychedelic Quad Mirror
    if (resId.includes("kaleidoscope")) {
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-neutral-950 grid grid-cols-2 grid-rows-2">
          <div className="bg-gradient-to-br from-purple-600/40 to-transparent border-r border-b border-white/20" />
          <div className="bg-gradient-to-bl from-cyan-600/40 to-transparent border-b border-white/20" />
          <div className="bg-gradient-to-tr from-pink-600/40 to-transparent border-r border-white/20" />
          <div className="bg-gradient-to-tl from-amber-600/40 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-5 h-5 rotate-45 border border-white/80 transition-transform duration-300"
              style={{ transform: isHovered ? "rotate(90deg) scale(1.2)" : "rotate(45deg)" }}
            />
          </div>
        </div>
      );
    }

    // 25. X-Ray Solarize Invert
    if (resId.includes("solarize") || resId.includes("xray")) {
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-slate-950 flex items-center justify-center p-2 border border-cyan-500/30">
          <div
            className="w-16 h-8 rounded-md border border-cyan-400 bg-cyan-950/80 flex items-center justify-center text-[9px] font-black text-cyan-200 tracking-wider shadow-md transition-all duration-300"
            style={{
              boxShadow: isHovered
                ? "0 0 20px rgba(34, 211, 238, 0.7), inset 0 0 10px rgba(34, 211, 238, 0.4)"
                : "0 0 10px rgba(34, 211, 238, 0.3)",
              transform: isHovered ? "scale(1.08)" : "scale(1)",
            }}
          >
            SOLARIZE
          </div>
        </div>
      );
    }

    // Generic effect fallback
    return (
      <div className="w-full h-full relative overflow-hidden select-none bg-gradient-to-tr from-purple-900 to-indigo-900 flex flex-col items-center justify-center p-2">
        <Sparkles className="w-5 h-5 text-purple-300 mb-1" />
        <span className="text-[10px] font-bold text-white">{resource.name}</span>
      </div>
    );
  }

  // ==========================================
  // 5. PACK E: CAPTION PRESETS (TEXT TEMPLATES)
  // ==========================================
  if (resType === "caption_preset") {
    const stylePreset = merged.stylePreset || "tiktok_yellow";
    const demoWords = ["THIS", "IS", "VIRAL"];

    // TikTok Yellow: Bold yellow with black stroke
    if (stylePreset === "tiktok_yellow" || resId.includes("yellow")) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-neutral-950/90 relative select-none">
          {isHovered ? (
            <div className="flex items-center gap-1.5 text-xs font-black tracking-tight">
              {demoWords.map((word, idx) => {
                const isActive = captionWordIndex === idx;
                return (
                  <span
                    key={word}
                    className={cn(
                      "transition-all duration-150 inline-block",
                      isActive
                        ? "text-[#FFE600] scale-125 z-10"
                        : "text-neutral-500 scale-95"
                    )}
                    style={{
                      textShadow: isActive
                        ? "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 0 16px rgba(254,224,71,0.8)"
                        : "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          ) : (
            <div
              className="text-sm font-black tracking-tight text-center"
              style={{
                color: "#FFE600",
                textShadow:
                  "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 4px 10px rgba(0,0,0,0.8)",
              }}
            >
              TIKTOK STYLE
            </div>
          )}
        </div>
      );
    }

    // Hormozi Bold: Red block with white bold text
    if (stylePreset === "hormozi_bold" || resId.includes("hormozi")) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-neutral-950/90 relative select-none">
          {isHovered ? (
            <div className="flex items-center gap-1 text-[11px] font-black">
              {demoWords.map((word, idx) => {
                const isActive = captionWordIndex === idx;
                return (
                  <span
                    key={word}
                    className={cn(
                      "transition-all duration-150 uppercase tracking-wide",
                      isActive
                        ? "bg-red-600 text-white px-1.5 py-0.5 rounded shadow-lg scale-110"
                        : "text-neutral-500 px-1 py-0.5"
                    )}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="bg-red-600 px-3 py-1 rounded shadow-lg">
              <span className="text-xs font-black text-white tracking-wide uppercase">
                HORMOZI
              </span>
            </div>
          )}
        </div>
      );
    }

    // Clean White: Apple minimalist style
    if (stylePreset === "clean_white" || resId.includes("clean")) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-neutral-900 relative select-none">
          {isHovered ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest">
              {demoWords.map((word, idx) => {
                const isActive = captionWordIndex === idx;
                return (
                  <span
                    key={word}
                    className={cn(
                      "transition-all duration-150",
                      isActive
                        ? "text-white scale-110 underline decoration-cyan-400 decoration-2 underline-offset-4"
                        : "text-neutral-600"
                    )}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          ) : (
            <div
              className="text-xs font-semibold text-white tracking-widest uppercase"
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
            >
              CLEAN SUBTITLE
            </div>
          )}
        </div>
      );
    }

    // Neon Glow Caption
    if (stylePreset === "neon_glow" || resId.includes("neon")) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-neutral-950 relative select-none">
          {isHovered ? (
            <div className="flex items-center gap-1.5 text-xs font-black tracking-wider">
              {demoWords.map((word, idx) => {
                const isActive = captionWordIndex === idx;
                return (
                  <span
                    key={word}
                    className={cn(
                      "transition-all duration-150",
                      isActive
                        ? "text-cyan-300 scale-120 drop-shadow-[0_0_14px_#22d3ee]"
                        : "text-neutral-600 opacity-60"
                    )}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          ) : (
            <div
              className="text-sm font-black text-cyan-300 tracking-wider"
              style={{ textShadow: "0 0 14px #22d3ee, 0 0 24px #06b6d4" }}
            >
              CYBER GLOW
            </div>
          )}
        </div>
      );
    }

    // 5. Karaoke Gradient: Violet to pink gradient text with frosted backing
    if (stylePreset === "karaoke_gradient" || resId.includes("karaoke")) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-neutral-950 relative select-none">
          {isHovered ? (
            <div className="flex items-center gap-1.5 text-xs font-black tracking-wide">
              {demoWords.map((word, idx) => {
                const isActive = captionWordIndex === idx;
                return (
                  <span
                    key={word}
                    className={cn(
                      "transition-all duration-150 inline-block",
                      isActive
                        ? "bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent scale-125 drop-shadow-[0_0_12px_rgba(217,70,239,0.8)]"
                        : "text-neutral-600 scale-95"
                    )}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-lg bg-neutral-900/80 border border-fuchsia-500/30 shadow-lg">
              <span className="text-xs font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent tracking-wide">
                KARAOKE POP
              </span>
            </div>
          )}
        </div>
      );
    }

    // 6. Boxed Pill Badge: Amber pill with bold black text
    if (stylePreset === "boxed_pill" || resId.includes("boxed-pill") || resId.includes("pill")) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-neutral-950 relative select-none">
          {isHovered ? (
            <div className="flex items-center gap-1 text-[11px] font-black uppercase">
              {demoWords.map((word, idx) => {
                const isActive = captionWordIndex === idx;
                return (
                  <span
                    key={word}
                    className={cn(
                      "transition-all duration-150",
                      isActive
                        ? "bg-amber-400 text-neutral-950 px-2 py-0.5 rounded-full font-black shadow-md scale-110"
                        : "text-neutral-500 px-1 py-0.5"
                    )}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="bg-amber-400 px-3 py-1 rounded-full shadow-lg border border-white">
              <span className="text-xs font-black text-neutral-950 tracking-wider uppercase">
                BOXED PILL
              </span>
            </div>
          )}
        </div>
      );
    }

    // 7. Comic Pop Art: Playful yellow font with 3D black shadow
    if (stylePreset === "comic_pop" || resId.includes("comic")) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-neutral-950 relative select-none">
          {isHovered ? (
            <div className="flex items-center gap-1.5 text-xs font-black tracking-wider rotate-[1deg]">
              {demoWords.map((word, idx) => {
                const isActive = captionWordIndex === idx;
                return (
                  <span
                    key={word}
                    className={cn(
                      "transition-all duration-150 uppercase",
                      isActive
                        ? "text-yellow-300 scale-125"
                        : "text-neutral-500 scale-95"
                    )}
                    style={{
                      textShadow: isActive
                        ? "2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000"
                        : "1px 1px 0 #000",
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          ) : (
            <div
              className="text-sm font-black text-yellow-300 tracking-wider rotate-[-1deg] uppercase"
              style={{
                textShadow: "2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
              }}
            >
              COMIC POP!
            </div>
          )}
        </div>
      );
    }

    // 8. Fire Blaze Gradient: Burning amber/red gradient text
    if (stylePreset === "fire_gradient" || resId.includes("fire")) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-neutral-950 relative select-none">
          {isHovered ? (
            <div className="flex items-center gap-1.5 text-xs font-black tracking-tight uppercase">
              {demoWords.map((word, idx) => {
                const isActive = captionWordIndex === idx;
                return (
                  <span
                    key={word}
                    className={cn(
                      "transition-all duration-150",
                      isActive
                        ? "bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 bg-clip-text text-transparent scale-125 drop-shadow-[0_0_12px_rgba(249,115,22,0.9)]"
                        : "text-neutral-600 scale-95"
                    )}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.3)]">
              <span className="text-xs font-black bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 bg-clip-text text-transparent uppercase tracking-tight">
                FIRE BLAZE
              </span>
            </div>
          )}
        </div>
      );
    }

    // 9. Minimal Boxed: Sleek dark card with emerald typography
    if (stylePreset === "minimal_boxed" || resId.includes("minimal-boxed")) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-neutral-950 relative select-none">
          {isHovered ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold tracking-normal">
              {demoWords.map((word, idx) => {
                const isActive = captionWordIndex === idx;
                return (
                  <span
                    key={word}
                    className={cn(
                      "transition-all duration-150",
                      isActive ? "text-emerald-300 scale-110 drop-shadow-[0_0_6px_rgba(110,231,183,0.5)]" : "text-neutral-600"
                    )}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="bg-neutral-900/90 border border-emerald-500/30 px-2.5 py-1 rounded-md shadow-md">
              <span className="text-[11px] font-bold text-emerald-300 tracking-wide">
                MINIMAL BOX
              </span>
            </div>
          )}
        </div>
      );
    }

    // Boxed Headline
    return (
      <div className="w-full h-full flex items-center justify-center p-2 bg-neutral-950 relative select-none">
        <div className="bg-neutral-900 border border-neutral-700 px-2.5 py-1 rounded">
          <span className="text-[10px] font-bold text-emerald-400 uppercase">
            {resource.name}
          </span>
        </div>
      </div>
    );
  }

  // ==========================================
  // 6. PACK F: TRANSITIONS
  // ==========================================
  if (resType === "transition") {
    const preset = merged.preset || "crossfade";
    const sweepPercent = isHovered ? transitionProgress : 50;

    return (
      <div className="w-full h-full relative overflow-hidden select-none bg-neutral-950 flex items-center justify-center">
        {/* Outgoing Scene */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-950 flex items-center justify-center transition-opacity duration-100"
          style={{
            opacity: preset === "crossfade" && isHovered ? (100 - sweepPercent) / 100 : 1,
          }}
        >
          <Film className="w-6 h-6 text-indigo-300/40" />
        </div>

        {/* Incoming Scene with Sweep Wipe or Slide */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-700 to-rose-950 flex items-center justify-center transition-all duration-100"
          style={{
            clipPath:
              preset.includes("wipe") || isHovered
                ? `polygon(0 0, ${sweepPercent}% 0, ${sweepPercent}% 100%, 0 100%)`
                : undefined,
            opacity: preset === "crossfade" && isHovered ? sweepPercent / 100 : 1,
            transform: preset === "zoom_in" && isHovered ? `scale(${0.7 + (sweepPercent / 100) * 0.4})` : "none",
          }}
        >
          <Sparkles className="w-6 h-6 text-purple-200/50" />
        </div>

        {/* Center Transition Sweep Bar */}
        {isHovered && (
          <div
            className="absolute top-0 bottom-0 w-1 bg-emerald-400 shadow-[0_0_12px_#34d399] z-10"
            style={{ left: `${sweepPercent}%` }}
          />
        )}
      </div>
    );
  }

  // ==========================================
  // 7. PACK G: AUDIO SFX
  // ==========================================
  if (resType === "sfx") {
    const heights = [20, 60, 40, 85, 100, 75, 45, 90, 65, 30];

    return (
      <div
        onClick={() => playSfxSynthesis(resId)}
        className="w-full h-full p-3 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 relative overflow-hidden select-none cursor-pointer"
        title="Click to audition sound"
      >
        <Volume2 className={cn("w-4 h-4 text-cyan-400 mb-2 transition-transform duration-200", isHovered && "scale-110 text-cyan-300")} />

        {/* Dynamic soundwave frequency bars */}
        <div className="flex items-center justify-center gap-1.5 h-12 w-full px-4">
          {heights.map((h, i) => {
            const dynamicHeight = isHovered
              ? Math.max(15, Math.min(100, (h + ((waveSeed * (i + 1) * 7) % 60))))
              : h;

            return (
              <div
                key={i}
                className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500 to-emerald-400 transition-all duration-100"
                style={{
                  height: `${dynamicHeight}%`,
                  opacity: isHovered ? 1 : 0.75,
                }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // Fallback visual
  return (
    <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-400">
      <Layers className="w-5 h-5" />
    </div>
  );
}
