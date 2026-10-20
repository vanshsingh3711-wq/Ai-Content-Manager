"use client";

import React, { useMemo } from "react";
import { GraphicElement } from "@/lib/timeline-types";
import { cn } from "@/lib/utils";

interface GraphicCanvasRendererProps {
  graphic: GraphicElement;
  playheadTime: number;
}

export function GraphicCanvasRenderer({ graphic, playheadTime }: GraphicCanvasRendererProps) {
  const { compositionId, props = {}, start, end } = graphic;

  // Local elapsed playback time relative to this graphic's start
  const localTime = Math.max(0, playheadTime - start);
  const totalDuration = Math.max(0.5, end - start);

  // Intro progress (0 to 1 over first 1.0s)
  const introDuration = Math.min(1.0, totalDuration * 0.4);
  const introProgress = Math.min(1, Math.max(0, localTime / introDuration));

  // Exit progress (1 to 0 over last 0.35s)
  const exitDuration = 0.35;
  const timeUntilEnd = end - playheadTime;
  const exitProgress =
    timeUntilEnd < exitDuration ? Math.min(1, Math.max(0, timeUntilEnd / exitDuration)) : 1.0;

  // Spring/Overshoot easing for entrance
  const easeProgress = useMemo(() => {
    const x = introProgress;
    const c4 = (2 * Math.PI) / 3;
    if (x === 0) return 0;
    if (x === 1) return 1;
    return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
  }, [introProgress]);

  // Overall opacity factoring exit
  const opacity = Math.min(1, introProgress * 2.5) * exitProgress;
  const scaleEntrance = 0.85 + easeProgress * 0.15;

  const compKey = (compositionId || "").toLowerCase().replace(/_/g, "-");

  // RENDERER 1: RISING GRAPH / CHART REVEAL
  if (
    compKey === "chart-reveal" ||
    compKey === "chart" ||
    compKey === "graph" ||
    compKey === "rising-graph"
  ) {
    const title = props.title || "GROWTH TREND";
    const dataPoint1 = props.dataPoint1 || "Stage 1: Baseline";
    const dataPoint2 = props.dataPoint2 || "Stage 2: +85%";
    const dataPoint3 = props.dataPoint3 || "Stage 3: +165% Surge";

    // Staggered bar animations
    const bar1 = Math.min(1, Math.max(0, (localTime - 0.1) / 0.5));
    const bar2 = Math.min(1, Math.max(0, (localTime - 0.25) / 0.5));
    const bar3 = Math.min(1, Math.max(0, (localTime - 0.4) / 0.5));
    const bar4 = Math.min(1, Math.max(0, (localTime - 0.55) / 0.5));

    const height1 = Math.round(bar1 * 32);
    const height2 = Math.round(bar2 * 54);
    const height3 = Math.round(bar3 * 78);
    const height4 = Math.round(bar4 * 96);

    return (
      <div
        className="relative select-none pointer-events-none rounded-2xl bg-neutral-950/90 backdrop-blur-2xl border border-cyan-500/40 p-5 shadow-[0_0_35px_rgba(6,182,212,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)] min-w-[340px] max-w-[420px] text-white font-sans transition-all"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
        }}
      >
        {/* Ambient Top Glow Line */}
        <div className="absolute -top-px left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#22d3ee]" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
            </span>
            <span className="text-xs font-black tracking-widest text-cyan-200 uppercase font-mono">
              {title}
            </span>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 font-mono tracking-wide shadow-sm">
            SURGE +165%
          </span>
        </div>

        {/* Rising Chart Graphic Visualizer */}
        <div className="relative h-32 w-full bg-neutral-900/60 rounded-xl p-3 border border-white/5 flex items-end justify-between gap-3 overflow-hidden">
          {/* Subtle Grid Guidelines */}
          <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none opacity-20">
            <div className="w-full border-b border-dashed border-cyan-400/50" />
            <div className="w-full border-b border-dashed border-cyan-400/50" />
            <div className="w-full border-b border-dashed border-cyan-400/50" />
          </div>

          {/* SVG Connecting Neon Trend Line */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible px-4 py-3">
            <defs>
              <linearGradient id="cyanLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <path
              d={`M 25 ${110 - height1} Q 95 ${110 - height2} 165 ${110 - height3} T 240 ${110 - height4}`}
              fill="none"
              stroke="url(#cyanLineGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
              style={{
                strokeDasharray: 300,
                strokeDashoffset: 300 * (1 - Math.max(bar1, bar4)),
                transition: "stroke-dashoffset 0.1s linear",
              }}
            />
          </svg>

          {/* Bar 1 */}
          <div className="flex-1 flex flex-col items-center justify-end h-full z-10">
            <span
              className="text-[9px] font-mono text-cyan-300 font-bold mb-1 transition-opacity"
              style={{ opacity: bar1 }}
            >
              +35%
            </span>
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-cyan-900/40 via-cyan-600/70 to-cyan-400 transition-all duration-75 relative shadow-[0_0_12px_rgba(34,211,238,0.3)]"
              style={{ height: `${height1}%` }}
            >
              <div className="absolute top-0 inset-x-0 h-[2px] bg-cyan-200 rounded-t-md" />
            </div>
            <span className="text-[9px] font-mono text-neutral-400 mt-1">Q1</span>
          </div>

          {/* Bar 2 */}
          <div className="flex-1 flex flex-col items-center justify-end h-full z-10">
            <span
              className="text-[9px] font-mono text-cyan-300 font-bold mb-1 transition-opacity"
              style={{ opacity: bar2 }}
            >
              +65%
            </span>
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-cyan-900/40 via-sky-500/70 to-sky-300 transition-all duration-75 relative shadow-[0_0_12px_rgba(56,189,248,0.3)]"
              style={{ height: `${height2}%` }}
            >
              <div className="absolute top-0 inset-x-0 h-[2px] bg-sky-100 rounded-t-md" />
            </div>
            <span className="text-[9px] font-mono text-neutral-400 mt-1">Q2</span>
          </div>

          {/* Bar 3 */}
          <div className="flex-1 flex flex-col items-center justify-end h-full z-10">
            <span
              className="text-[9px] font-mono text-indigo-300 font-bold mb-1 transition-opacity"
              style={{ opacity: bar3 }}
            >
              +110%
            </span>
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-indigo-900/40 via-indigo-500/70 to-indigo-300 transition-all duration-75 relative shadow-[0_0_14px_rgba(129,140,248,0.4)]"
              style={{ height: `${height3}%` }}
            >
              <div className="absolute top-0 inset-x-0 h-[2px] bg-indigo-100 rounded-t-md" />
            </div>
            <span className="text-[9px] font-mono text-neutral-400 mt-1">Q3</span>
          </div>

          {/* Bar 4: Peak Surge */}
          <div className="flex-1 flex flex-col items-center justify-end h-full z-10">
            <span
              className="text-[9px] font-mono text-emerald-300 font-bold mb-1 transition-opacity"
              style={{ opacity: bar4 }}
            >
              +165%
            </span>
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-cyan-600 via-indigo-500 to-emerald-400 transition-all duration-75 relative shadow-[0_0_20px_rgba(52,211,153,0.6)]"
              style={{ height: `${height4}%` }}
            >
              <div className="absolute top-0 inset-x-0 h-[3px] bg-white rounded-t-md shadow-[0_0_8px_#fff]" />
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#22d3ee]" />
            </div>
            <span className="text-[9px] font-mono text-emerald-300 font-bold mt-1">SURGE</span>
          </div>
        </div>

        {/* Milestone Cards / Details */}
        <div className="mt-3.5 space-y-1.5">
          <div
            className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-neutral-900/70 border border-white/5 transition-opacity"
            style={{ opacity: bar1 }}
          >
            <span className="text-neutral-400 text-[11px]">{dataPoint1}</span>
            <span className="font-mono text-cyan-300 text-[11px] font-bold">1.0x</span>
          </div>
          <div
            className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-neutral-900/70 border border-white/5 transition-opacity"
            style={{ opacity: bar2 }}
          >
            <span className="text-neutral-400 text-[11px]">{dataPoint2}</span>
            <span className="font-mono text-indigo-300 text-[11px] font-bold">1.85x</span>
          </div>
          <div
            className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-950/60 to-indigo-950/60 border border-cyan-500/30 transition-opacity shadow-sm"
            style={{ opacity: bar4 }}
          >
            <span className="text-cyan-200 text-[11px] font-medium">{dataPoint3}</span>
            <span className="font-mono text-emerald-400 text-[11px] font-extrabold flex items-center">
              2.65x 🔥
            </span>
          </div>
        </div>
      </div>
    );
  }

  // RENDERER 2: METRIC REVEAL / COUNTER / KPI
  if (
    compKey === "metric-reveal" ||
    compKey === "animated-counter" ||
    compKey === "animated-kpi"
  ) {
    const label = props.label || props.title || "KEY PERFORMANCE METRIC";
    const delta = props.delta || props.change || "+140% Growth";
    const metricStr = props.metric || props.value || "+140%";

    // Smooth counting calculation if numeric
    const rawNum = parseInt(metricStr.replace(/[^0-9]/g, ""), 10) || 140;
    const currentNum = Math.round(introProgress * rawNum);
    const prefix = metricStr.startsWith("+") ? "+" : metricStr.startsWith("$") ? "$" : "";
    const suffix = metricStr.includes("%") ? "%" : metricStr.includes("k") ? "k" : "";

    return (
      <div
        className="relative select-none pointer-events-none rounded-2xl bg-neutral-950/90 backdrop-blur-2xl border border-emerald-500/40 p-5 shadow-[0_0_35px_rgba(16,185,129,0.2),inset_0_1px_1px_rgba(255,255,255,0.15)] min-w-[320px] max-w-[400px] text-white font-sans transition-all"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
        }}
      >
        <div className="absolute -top-px left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

        <div className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-black mb-1">
          {label}
        </div>

        <div className="flex items-baseline space-x-3 my-1">
          <div className="text-4xl font-black tracking-tight text-white font-mono drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]">
            {prefix}
            {currentNum}
            {suffix}
          </div>
          <div className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 rounded-full font-mono">
            <span>↗</span>
            <span className="ml-1">{delta}</span>
          </div>
        </div>

        {/* Animated Progress Gauge */}
        <div className="w-full bg-neutral-900 rounded-full h-2 mt-3 overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-75 rounded-full shadow-[0_0_10px_#34d399]"
            style={{ width: `${Math.round(introProgress * 85)}%` }}
          />
        </div>
      </div>
    );
  }

  // RENDERER 3: TERMINAL / CODE REVEAL
  if (
    compKey === "cooked-terminal" ||
    compKey === "code-reveal" ||
    compKey === "vscode-code-typing"
  ) {
    const command = props.command || "npm run deploy";
    const output = props.output || "Server running: 100% production ready";

    // Animated character typing simulation
    const typedLength = Math.round(introProgress * command.length);
    const visibleCmd = command.slice(0, typedLength);
    const showOutput = introProgress >= 0.75;

    return (
      <div
        className="relative select-none pointer-events-none rounded-xl bg-neutral-950/95 backdrop-blur-2xl border border-neutral-700/80 shadow-[0_0_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] min-w-[350px] max-w-[440px] text-white font-mono transition-all overflow-hidden"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
        }}
      >
        {/* macOS Style Window Titlebar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-neutral-900/90 border-b border-neutral-800">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500/90" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/90" />
            <div className="w-3 h-3 rounded-full bg-green-500/90" />
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">bash — 80×24</span>
          <div className="w-8" />
        </div>

        {/* Terminal Body */}
        <div className="p-4 space-y-2 text-xs">
          <div className="flex items-center text-neutral-300">
            <span className="text-emerald-400 mr-2 font-bold">~ $</span>
            <span>{visibleCmd}</span>
            <span className="inline-block w-2 h-4 bg-emerald-400 ml-0.5 animate-pulse" />
          </div>

          {showOutput && (
            <div className="text-emerald-300/90 flex items-center space-x-1.5 pt-1 animate-fadeIn">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>{output}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // RENDERER 4: SOCIAL POST
  if (compKey === "cooked-social-post") {
    const name = props.name || "Creator Pro";
    const handle = props.handle || "@creator_pro";
    const text = props.text || "Scaling the creative workflow with dynamic motion graphics! 🚀";
    const likes = props.likes || "18.4K";

    return (
      <div
        className="relative select-none pointer-events-none rounded-2xl bg-neutral-950/90 backdrop-blur-2xl border border-sky-500/30 p-4 shadow-[0_0_35px_rgba(14,165,233,0.2)] min-w-[340px] max-w-[420px] text-white font-sans transition-all"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
        }}
      >
        <div className="flex items-center space-x-3 mb-2.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
            {name[0] || "C"}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm text-white">{name}</span>
              <span className="text-sky-400 text-xs">✓</span>
            </div>
            <span className="text-xs text-neutral-400 font-mono">{handle}</span>
          </div>
        </div>

        <p className="text-xs text-neutral-200 leading-relaxed mb-3">{text}</p>

        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-neutral-400 font-mono">
          <div className="flex items-center space-x-1.5 text-rose-400 font-bold">
            <span>❤️</span>
            <span>{likes}</span>
          </div>
          <span className="text-sky-400">Viral Pulse</span>
        </div>
      </div>
    );
  }

  // RENDERER 5: QUOTE REVEAL
  if (compKey === "quote-reveal") {
    const quote = props.quote || "Consistency is what transforms average into excellence.";
    const author = props.author || "Key Takeaway";

    return (
      <div
        className="relative select-none pointer-events-none rounded-2xl bg-neutral-950/90 backdrop-blur-2xl border border-amber-500/30 p-5 shadow-[0_0_35px_rgba(245,158,11,0.2)] min-w-[340px] max-w-[420px] text-white font-sans transition-all"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
        }}
      >
        <span className="text-4xl font-serif text-amber-400/80 leading-none">“</span>
        <p className="text-sm italic font-medium text-neutral-100 leading-relaxed my-2">
          {quote}
        </p>
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-amber-500/20">
          <span className="text-xs font-mono text-amber-300 font-bold">— {author}</span>
        </div>
      </div>
    );
  }

  // RENDERER 6: PROGRESS BAR
  if (compKey === "cooked-progress") {
    const label = props.label || "Completion Rate";
    const targetProgress = props.progress || 85;
    const currentProgress = Math.round(introProgress * targetProgress);

    return (
      <div
        className="relative select-none pointer-events-none rounded-2xl bg-neutral-950/90 backdrop-blur-2xl border border-indigo-500/30 p-4 shadow-[0_0_30px_rgba(99,102,241,0.2)] min-w-[320px] max-w-[380px] text-white font-sans transition-all"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
        }}
      >
        <div className="flex justify-between items-center text-xs font-mono mb-2">
          <span className="text-neutral-300 font-bold">{label}</span>
          <span className="text-indigo-400 font-extrabold">{currentProgress}%</span>
        </div>
        <div className="w-full bg-neutral-900 rounded-full h-3 overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-75 rounded-full"
            style={{ width: `${currentProgress}%` }}
          />
        </div>
      </div>
    );
  }

  // RENDERER 7: NOTES / CHECKLIST
  if (compKey === "cooked-notes") {
    const title = props.title || "Key Action Items";
    const items: string[] = Array.isArray(props.items)
      ? props.items
      : ["Point 1: Focus", "Point 2: Execute", "Point 3: Scale"];

    return (
      <div
        className="relative select-none pointer-events-none rounded-2xl bg-neutral-950/90 backdrop-blur-2xl border border-yellow-500/30 p-4 shadow-[0_0_30px_rgba(234,179,8,0.2)] min-w-[320px] max-w-[380px] text-white font-sans transition-all"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
        }}
      >
        <div className="text-xs font-bold text-yellow-300 font-mono tracking-wider mb-2.5">
          📝 {title}
        </div>
        <div className="space-y-1.5">
          {items.map((item, i) => {
            const itemProgress = Math.min(1, Math.max(0, (localTime - i * 0.2) / 0.3));
            return (
              <div
                key={i}
                className="flex items-center space-x-2 text-xs text-neutral-200 bg-neutral-900/60 px-2.5 py-1.5 rounded-lg border border-white/5 transition-opacity"
                style={{ opacity: itemProgress }}
              >
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{item}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // RENDERER 8: NOTIFICATION TOAST
  if (compKey === "cooked-toasts") {
    const title = props.title || "Alert";
    const message = props.message || "Key milestone reached!";

    return (
      <div
        className="relative select-none pointer-events-none rounded-xl bg-neutral-950/90 backdrop-blur-2xl border border-cyan-400/40 p-3.5 shadow-[0_0_30px_rgba(34,211,238,0.3)] min-w-[300px] text-white font-sans flex items-center space-x-3 transition-all"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
        }}
      >
        <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 text-sm">
          🔔
        </div>
        <div>
          <div className="text-xs font-bold text-white">{title}</div>
          <div className="text-[11px] text-neutral-300">{message}</div>
        </div>
      </div>
    );
  }

  // RENDERER 9: ANIMATED ARROW
  if (compKey === "animated-arrow") {
    const label = props.label || "Look Here";
    return (
      <div
        className="relative select-none pointer-events-none flex flex-col items-center space-y-1.5 transition-all"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
        }}
      >
        <span className="text-xs font-bold text-yellow-300 bg-neutral-950/90 border border-yellow-400/50 px-3 py-1 rounded-full shadow-lg font-mono">
          {label}
        </span>
        <svg
          className="w-10 h-10 text-yellow-400 animate-bounce drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2L4 14h6v8h4v-8h6L12 2z" />
        </svg>
      </div>
    );
  }

  // RENDERER 10: APP SCREEN UPLOAD
  if (
    compKey === "app-screen-upload" ||
    compKey === "screen-upload" ||
    compKey === "video-upload" ||
    compKey === "app-upload"
  ) {
    const title = props.title || "VIDEO UPLOAD";
    const appName = props.appName || "Video Studio App";
    const fileName = props.fileName || "upload_video.mp4";
    const fileSize = props.fileSize || "48.2 MB";
    const fileType = props.fileType || "MP4 Video";
    const uploadDuration = Math.max(1.0, totalDuration * 0.7);
    const targetProgress = typeof props.progress === "number" ? Math.min(100, Math.max(0, props.progress)) : 100;
    const uploadProgress = Math.min(targetProgress, Math.round((localTime / uploadDuration) * targetProgress));
    const isComplete = uploadProgress >= 100;
    const statusText = isComplete ? (props.status || "Upload Complete") : "Uploading to cloud...";

    return (
      <div
        className="relative select-none pointer-events-none rounded-2xl bg-neutral-950/95 backdrop-blur-2xl border border-sky-500/40 p-5 shadow-[0_0_35px_rgba(14,165,233,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)] min-w-[340px] max-w-[420px] text-white font-sans transition-all overflow-hidden"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
        }}
      >
        {/* Ambient Top Glow Line */}
        <div className={`absolute -top-px left-8 right-8 h-[2px] bg-gradient-to-r from-transparent ${isComplete ? "via-emerald-400 shadow-[0_0_10px_#10b981]" : "via-sky-400 shadow-[0_0_10px_#38bdf8]"} to-transparent`} />

        {/* macOS / App Titlebar */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <span className="text-[11px] font-mono text-neutral-300 font-bold ml-1.5">{appName}</span>
          </div>
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-sky-400 bg-sky-500/10 border border-sky-400/30 px-2 py-0.5 rounded-full">
            {title}
          </span>
        </div>

        {/* Upload File Dropzone & Card */}
        <div className={`border border-dashed ${isComplete ? "border-emerald-500/40 bg-emerald-950/20" : "border-sky-500/30 bg-neutral-900/80"} rounded-xl p-3.5 space-y-3 transition-colors`}>
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                isComplete
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-400/40"
                  : "bg-sky-500/20 text-sky-400 border border-sky-400/40 animate-pulse"
              }`}
            >
              {isComplete ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate font-mono">{fileName}</div>
              <div className="flex items-center space-x-2 text-[10px] text-neutral-400 font-mono mt-0.5">
                <span>{fileType}</span>
                <span>•</span>
                <span>{fileSize}</span>
                <span>•</span>
                <span className="text-sky-400">4K / 60fps</span>
              </div>
            </div>
            <span className={`text-xs font-mono font-bold ${isComplete ? "text-emerald-400" : "text-sky-400"}`}>
              {uploadProgress}%
            </span>
          </div>

          {/* Progress Track */}
          <div className="w-full bg-neutral-950 rounded-full h-2 overflow-hidden border border-white/5 relative">
            <div
              className={`h-full transition-all duration-75 rounded-full shadow-sm ${
                isComplete
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_#10b981]"
                  : "bg-gradient-to-r from-sky-500 via-indigo-400 to-cyan-400 shadow-[0_0_10px_#38bdf8]"
              }`}
              style={{ width: `${uploadProgress}%` }}
            />
          </div>

          {/* Status Label */}
          <div className="flex items-center justify-between text-[11px] font-mono pt-1">
            <span className={isComplete ? "text-emerald-400 font-semibold" : "text-neutral-400"}>
              {statusText}
            </span>
            {isComplete && (
              <span className="text-[10px] text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 rounded font-bold">
                READY
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // RENDERER 11: BROWSER WALKTHROUGH / LIVE WEB EVIDENCE
  if (
    compKey === "browser-walkthrough" ||
    compKey === "browser" ||
    compKey === "web-capture" ||
    compKey === "web-evidence"
  ) {
    const url = props.url || "https://example.com";
    const tabTitle = props.tabTitle || "Web Evidence";
    const highlightText =
      props.highlightText && props.highlightText !== "Featured Source" ? props.highlightText : null;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const rawScreenshotUrl = props.screenshotUrl || props.preview_url;
    const screenshotUrl = rawScreenshotUrl
      ? rawScreenshotUrl.startsWith("http") || rawScreenshotUrl.startsWith("data:")
        ? rawScreenshotUrl
        : `${apiBase}${rawScreenshotUrl.startsWith("/") ? "" : "/"}${rawScreenshotUrl}`
      : null;

    const rawVideoUrl = props.videoUrl;
    const videoUrl = rawVideoUrl
      ? rawVideoUrl.startsWith("http") || rawVideoUrl.startsWith("data:")
        ? rawVideoUrl
        : `${apiBase}${rawVideoUrl.startsWith("/") ? "" : "/"}${rawVideoUrl}`
      : null;

    const format = props.format || props.aspectRatio || "16:9";
    const isMobile = format === "9:16";
    const isSquare = format === "1:1";

    // Live vertical scroll computation as playhead advances
    const scrollProgress = Math.min(1, Math.max(0, localTime / totalDuration));
    const scrollY = Math.round(scrollProgress * (isMobile ? 260 : 180));

    // VARIANT A: 9:16 MOBILE PHONE BROWSER
    if (isMobile) {
      return (
        <div
          className="relative select-none pointer-events-none rounded-[36px] bg-neutral-950/95 backdrop-blur-2xl border-2 border-neutral-700/80 shadow-[0_0_50px_rgba(14,165,233,0.35),0_25px_60px_rgba(0,0,0,0.85)] w-[260px] sm:w-[280px] text-white font-sans transition-all overflow-hidden p-2.5"
          style={{
            opacity,
            transform: `scale(${scaleEntrance})`,
          }}
        >
          {/* Dynamic Island Notch */}
          <div className="w-20 h-4 bg-black rounded-full mx-auto mb-1.5 flex items-center justify-end px-2 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-950 border border-sky-800" />
          </div>

          {/* Mobile Status Bar */}
          <div className="flex items-center justify-between px-2 text-[10px] text-neutral-400 font-mono mb-1.5">
            <span className="font-semibold text-white">9:41</span>
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-bold text-sky-400 tracking-wider">LIVE WEB</span>
            </div>
          </div>

          {/* Compact Mobile URL Bar */}
          <div className="mb-2 bg-neutral-900/95 border border-white/10 rounded-xl px-2.5 py-1.5 flex items-center space-x-2 shadow-sm">
            <span className="text-[11px] text-emerald-400 shrink-0">🔒</span>
            <span className="text-[10px] font-mono text-neutral-300 truncate font-medium">{url}</span>
          </div>

          {/* Mobile Screen Viewport */}
          <div className="relative bg-neutral-950 h-[380px] sm:h-[420px] rounded-2xl overflow-hidden flex flex-col items-center justify-start border border-white/5">
            {videoUrl ? (
              <div className="w-full h-full overflow-hidden relative">
                <video
                  src={videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover select-none"
                />
              </div>
            ) : screenshotUrl ? (
              <div className="w-full h-full overflow-hidden relative">
                <img
                  src={screenshotUrl}
                  alt={tabTitle}
                  style={{
                    transform: `translateY(-${scrollY}px)`,
                    transition: "transform 0.1s linear",
                  }}
                  className="w-full min-h-full object-cover object-top select-none"
                />

                {/* Simulated Mobile Tap Indicator (Only if explicitly enabled) */}
                {props.showTapIndicator && (
                  <div
                    className="absolute pointer-events-none transition-all duration-300 z-10"
                    style={{
                      top: `${Math.min(78, 20 + scrollProgress * 54)}%`,
                      left: `${Math.min(80, 24 + Math.sin(scrollProgress * Math.PI) * 40)}%`,
                    }}
                  >
                    <div className="w-6 h-6 rounded-full bg-sky-400/30 border-2 border-sky-300 flex items-center justify-center animate-ping" />
                    <div className="w-3 h-3 rounded-full bg-sky-400 shadow-[0_0_12px_#38bdf8] -mt-4.5 ml-1.5" />
                  </div>
                )}

                {/* Subtle vignette */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/15 via-transparent to-black/35" />
              </div>
            ) : (
              <div className="w-full p-4 space-y-2.5">
                <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-white/5 rounded w-full" />
                <div className="h-3 bg-white/5 rounded w-5/6" />
                <div className="h-3 bg-white/5 rounded w-2/3" />
              </div>
            )}

            {/* Mobile Bottom Highlight Pill (Only if explicitly custom) */}
            {highlightText && (
              <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-neutral-900/95 backdrop-blur-md border border-purple-500/50 rounded-lg px-2.5 py-1.5 shadow-xl flex items-center space-x-1.5 z-20">
                <span className="text-xs">👆</span>
                <span className="text-[10px] font-mono font-bold text-purple-300 truncate">{highlightText}</span>
              </div>
            )}
          </div>

          {/* Bottom Home Indicator */}
          <div className="w-24 h-1 bg-white/30 rounded-full mx-auto mt-2" />
        </div>
      );
    }

    // VARIANT B: 16:9 DESKTOP & 1:1 SQUARE BROWSER WINDOW
    return (
      <div
        className={cn(
          "relative select-none pointer-events-none rounded-2xl bg-neutral-950/95 backdrop-blur-2xl border border-sky-500/40 shadow-[0_0_40px_rgba(14,165,233,0.3),inset_0_1px_1px_rgba(255,255,255,0.15)] text-white font-sans transition-all overflow-hidden",
          isSquare ? "w-[320px] max-w-[340px]" : "min-w-[340px] max-w-[480px]"
        )}
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
        }}
      >
        {/* Ambient Top Glow Line */}
        <div className="absolute -top-px left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_10px_#38bdf8]" />

        {/* Browser Chrome Header */}
        <div className="bg-neutral-900/90 px-4 py-2.5 border-b border-white/10 flex flex-col space-y-2">
          {/* Traffic lights & tab title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="text-[11px] font-mono text-neutral-300 font-bold ml-2 truncate max-w-[200px]">
                {tabTitle}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 bg-sky-500/10 border border-sky-400/30 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-sky-400">
                LIVE WEB
              </span>
            </div>
          </div>

          {/* URL address bar */}
          <div className="bg-neutral-950/80 border border-white/10 rounded-lg px-2.5 py-1 flex items-center space-x-2">
            <span className="text-emerald-400 text-xs">🔒</span>
            <span className="text-[11px] font-mono text-neutral-300 truncate">{url}</span>
          </div>
        </div>

        {/* Viewport Content */}
        <div
          className={cn(
            "relative bg-neutral-950 overflow-hidden flex flex-col items-center justify-start",
            isSquare ? "h-[250px]" : "h-[220px]"
          )}
        >
          {videoUrl ? (
            <div className="w-full h-full overflow-hidden relative">
              <video
                src={videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover select-none"
              />
            </div>
          ) : screenshotUrl ? (
            <div className="w-full h-full overflow-hidden relative">
              <img
                src={screenshotUrl}
                alt={tabTitle}
                style={{
                  transform: `translateY(-${scrollY}px)`,
                  transition: "transform 0.1s linear",
                }}
                className="w-full min-h-full object-cover object-top select-none"
              />

              {/* Simulated active cursor browsing the live page */}
              <div
                className="absolute pointer-events-none transition-all duration-300 z-10"
                style={{
                  top: `${Math.min(76, 20 + scrollProgress * 52)}%`,
                  left: `${Math.min(80, 24 + Math.sin(scrollProgress * Math.PI) * 38)}%`,
                }}
              >
                <svg
                  className="w-4 h-4 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] filter"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M3 3l7 18 3-7 7-3L3 3z" />
                </svg>
              </div>

              {/* Subtle top/bottom viewport vignette */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/15 via-transparent to-black/35" />
            </div>
          ) : (
            <div className="w-full p-4 space-y-2.5">
              <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-white/5 rounded w-full" />
              <div className="h-3 bg-white/5 rounded w-5/6" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          )}

          {/* Floating Highlight Pill */}
          {highlightText && (
            <div className="absolute bottom-3 left-4 right-4 bg-neutral-900/95 backdrop-blur-md border border-purple-500/50 rounded-lg px-3 py-1.5 shadow-xl flex items-center space-x-2 z-20">
              <span className="text-xs">👆</span>
              <span className="text-xs font-mono font-bold text-purple-300 truncate">{highlightText}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // DEFAULT FALLBACK: HERO REVEAL / COOKED CARD / STAT CARD
  const headline = props.headline || props.title || graphic.name || "ESSENTIAL INSIGHT";
  const supporting = props.supporting || props.label || "KEY TAKEAWAY";

  return (
    <div
      className="relative select-none pointer-events-none rounded-2xl bg-neutral-950/90 backdrop-blur-2xl border border-purple-500/40 p-5 shadow-[0_0_35px_rgba(168,85,247,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)] min-w-[320px] max-w-[400px] text-white font-sans transition-all"
      style={{
        opacity,
        transform: `scale(${scaleEntrance})`,
      }}
    >
      <div className="absolute -top-px left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
      <span className="inline-block text-[10px] font-mono tracking-widest text-purple-300 bg-purple-500/15 border border-purple-400/30 px-2.5 py-0.5 rounded-full font-bold uppercase mb-2">
        {supporting}
      </span>
      <h3 className="text-lg font-black tracking-tight text-white leading-snug drop-shadow-sm">
        {headline}
      </h3>
    </div>
  );
}
