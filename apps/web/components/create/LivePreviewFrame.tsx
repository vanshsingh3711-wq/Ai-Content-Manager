"use client";

import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Monitor,
  Volume2,
  Sparkles,
  Clock,
  Coins,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface LivePreviewFrameProps {
  aspectRatio: "9:16" | "16:9" | "1:1";
  videoStyle: "viral" | "educational" | "cinematic" | "minimal";
  captionPreset: "tiktok_yellow" | "neon_cyber" | "modern_clean" | "boxed_pill";
  estimatedSeconds: number;
  sampleCaption?: string;
  className?: string;
}

export function LivePreviewFrame({
  aspectRatio,
  videoStyle,
  captionPreset,
  estimatedSeconds,
  sampleCaption = "EVERY 12-YEAR-OLD CAN MASTER THIS CONCEPT",
  className,
}: LivePreviewFrameProps) {
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const words = sampleCaption.split(" ");

  // Simulate active karaoke word highlight cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWordIndex((prev) => (prev + 1) % words.length);
    }, 450);
    return () => clearInterval(interval);
  }, [words.length]);

  const estimatedCost = (estimatedSeconds * 0.0035 + 0.05).toFixed(2);

  const styleGradients = {
    viral: "from-purple-900/60 via-indigo-950/80 to-slate-950",
    educational: "from-blue-950/70 via-slate-900/80 to-neutral-950",
    cinematic: "from-amber-950/40 via-neutral-950 to-black",
    minimal: "from-zinc-900/80 to-neutral-950",
  };

  const captionStyles = {
    tiktok_yellow: {
      container: "font-black tracking-wider text-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] uppercase",
      activeWord: "text-[#ffe600] scale-110 -rotate-1 inline-block transition-transform duration-150 drop-shadow-[0_0_12px_rgba(255,230,0,0.6)]",
      inactiveWord: "text-white opacity-90 inline-block",
    },
    neon_cyber: {
      container: "font-mono font-bold tracking-tight text-center drop-shadow-[0_0_16px_rgba(6,182,212,0.8)] uppercase",
      activeWord: "text-[#22d3ee] scale-105 inline-block text-cyan-300 drop-shadow-[0_0_14px_rgba(34,211,238,0.9)]",
      inactiveWord: "text-white/80 inline-block",
    },
    modern_clean: {
      container: "font-sans font-bold tracking-normal text-center drop-shadow-md",
      activeWord: "text-white underline decoration-violet-500 decoration-4 underline-offset-4 inline-block",
      inactiveWord: "text-white/70 inline-block",
    },
    boxed_pill: {
      container: "font-bold text-center inline-flex flex-wrap justify-center gap-1.5 p-2 bg-black/60 rounded-xl backdrop-blur-md border border-white/10",
      activeWord: "bg-violet-600 text-white px-2 py-0.5 rounded-md text-xs",
      inactiveWord: "text-white/80 px-1 text-xs",
    },
  };

  const currentCaptionStyle = captionStyles[captionPreset] || captionStyles.tiktok_yellow;

  return (
    <div
      className={cn(
        "glass-card p-5 rounded-2xl flex flex-col items-center justify-between space-y-4 border border-white/[0.08]",
        className
      )}
    >
      {/* Top Preview Header */}
      <div className="w-full flex items-center justify-between text-xs pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold text-white tracking-tight">
            Live Safe-Zone Preview
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="sm">
            {aspectRatio}
          </Badge>
          <Badge variant="info" size="sm">
            {videoStyle}
          </Badge>
        </div>
      </div>

      {/* Frame Container */}
      <div className="relative w-full flex items-center justify-center py-2">
        {aspectRatio === "9:16" ? (
          /* Phone Bezel Frame */
          <div className="relative w-[240px] h-[440px] rounded-[36px] p-2.5 bg-[#1a1d26] border-2 border-white/[0.15] shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden">
            {/* Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white/20 ml-6" />
            </div>

            {/* Screen Canvas */}
            <div
              className={cn(
                "relative w-full h-full rounded-[26px] bg-gradient-to-b overflow-hidden flex flex-col justify-between p-4",
                styleGradients[videoStyle]
              )}
            >
              {/* Safe zone boundary guide (subtle dashed line) */}
              <div className="absolute inset-x-3 top-10 bottom-14 border border-dashed border-white/10 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                <span className="text-[9px] font-mono text-white/20 self-end">SAFE DOCK</span>
              </div>

              {/* Top Motion Graphic Card / Subject Placeholder */}
              <div className="relative z-10 mt-8 w-full h-36 rounded-xl bg-white/[0.06] border border-white/[0.1] backdrop-blur-md flex flex-col items-center justify-center p-3 text-center shadow-lg animate-pulse">
                <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center mb-1.5 text-violet-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-white tracking-tight">
                  AI MOTION GRAPHICS
                </span>
                <span className="text-[9px] font-mono text-cyan-300 mt-0.5">
                  Dynamic 3D Cards & B-Roll
                </span>
              </div>

              {/* Docked Subtitles Preview (y=1440 standard dock) */}
              <div className="relative z-10 mb-4 px-2">
                <div className={currentCaptionStyle.container}>
                  {words.map((word, idx) => (
                    <React.Fragment key={idx}>
                      <span
                        className={
                          idx === activeWordIndex
                            ? currentCaptionStyle.activeWord
                            : currentCaptionStyle.inactiveWord
                        }
                      >
                        {word}
                      </span>{" "}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Landscape 16:9 Monitor Frame */
          <div className="relative w-full max-w-[380px] aspect-[16/9] rounded-2xl p-2 bg-[#1a1d26] border-2 border-white/[0.15] shadow-2xl flex flex-col overflow-hidden">
            <div
              className={cn(
                "relative w-full h-full rounded-xl bg-gradient-to-b overflow-hidden flex flex-col justify-between p-4",
                styleGradients[videoStyle]
              )}
            >
              <div className="w-full flex items-center justify-between text-[10px] text-white/30 font-mono">
                <span>16:9 DESKTOP</span>
                <span>YOUTUBE SAFE</span>
              </div>

              {/* Subtitles */}
              <div className="text-center px-4">
                <div className={currentCaptionStyle.container}>
                  {words.map((word, idx) => (
                    <React.Fragment key={idx}>
                      <span
                        className={
                          idx === activeWordIndex
                            ? currentCaptionStyle.activeWord
                            : currentCaptionStyle.inactiveWord
                        }
                      >
                        {word}
                      </span>{" "}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Frame Metrics & Guarantees */}
      <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-white/[0.06] text-xs">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
          <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <div>
            <div className="text-[10px] text-white/40">Duration</div>
            <div className="font-semibold text-white">~{estimatedSeconds}s</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
          <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div>
            <div className="text-[10px] text-white/40">Est. Render Cost</div>
            <div className="font-semibold text-white">${estimatedCost}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
