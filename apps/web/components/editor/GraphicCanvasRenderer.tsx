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

  // RENDERER 0: VECTOR SHAPES PACK
  if (compKey === "shape" || compKey.startsWith("shape-") || compKey === "shape-element") {
    const shapeType = props.shapeType || "rectangle";
    const fillColor = props.fillColor || "#0284c7";
    const strokeColor = props.strokeColor || "#38bdf8";
    const strokeWidth = props.strokeWidth ?? 2;
    const width = props.width || 220;
    const height = props.height || 120;
    const radius = props.radius || 70;
    const cornerRadius = props.cornerRadius || 16;
    const lineLength = props.lineLength || 260;
    const lineStyle = props.lineStyle || "solid";
    const label = props.label;
    const direction = props.direction || "right";
    const text = props.text || "Sample Text";
    const textColor = props.textColor || "#ffffff";
    const tailPosition = props.tailPosition || "bottom-left";
    const accentColor = props.accentColor || "#a855f7";

    return (
      <div
        className="relative select-none pointer-events-none transition-all flex items-center justify-center"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
        }}
      >
        {shapeType === "rectangle" && (
          <div
            style={{
              width,
              height,
              backgroundColor: fillColor,
              border: `${strokeWidth}px solid ${strokeColor}`,
              boxShadow: `0 0 20px ${strokeColor}44`,
            }}
          />
        )}

        {shapeType === "rounded_rect" && (
          <div
            style={{
              width,
              height,
              backgroundColor: fillColor,
              border: `${strokeWidth}px solid ${strokeColor}`,
              borderRadius: cornerRadius,
              boxShadow: `0 0 20px ${strokeColor}44`,
            }}
          />
        )}

        {shapeType === "circle" && (
          <div
            style={{
              width: radius * 2,
              height: radius * 2,
              backgroundColor: fillColor,
              border: `${strokeWidth}px solid ${strokeColor}`,
              borderRadius: "50%",
              boxShadow: `0 0 20px ${strokeColor}44`,
            }}
          />
        )}

        {shapeType === "line" && (
          <div
            style={{
              width: lineLength,
              height: 0,
              borderTop: `${strokeWidth}px ${lineStyle} ${strokeColor}`,
              boxShadow: `0 0 16px ${strokeColor}88`,
            }}
          />
        )}

        {shapeType === "arrow" && (
          <div className="flex items-center gap-2">
            {label && (
              <span
                className="px-3 py-1 rounded-md text-xs font-bold text-white shadow"
                style={{
                  backgroundColor: fillColor,
                  border: `${strokeWidth}px solid ${strokeColor}`,
                }}
              >
                {label}
              </span>
            )}
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              style={{
                transform:
                  direction === "down" ? "rotate(90deg)" :
                  direction === "left" ? "rotate(180deg)" :
                  direction === "up" ? "rotate(-90deg)" : "none",
              }}
            >
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {shapeType === "speech_bubble" && (
          <div
            className="relative rounded-2xl p-4 text-xs font-bold shadow-xl max-w-[280px]"
            style={{
              backgroundColor: fillColor,
              color: textColor,
              border: `${strokeWidth}px solid ${strokeColor}`,
            }}
          >
            {text}
            <div
              className="absolute -bottom-2.5 w-0 h-0"
              style={{
                left: tailPosition === "bottom-right" ? "auto" : 20,
                right: tailPosition === "bottom-right" ? 20 : "auto",
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderTop: `10px solid ${strokeColor}`,
              }}
            />
          </div>
        )}

        {shapeType === "star" && (
          <div className="filter drop-shadow-[0_0_16px_rgba(251,191,36,0.8)]">
            <svg
              width="90"
              height="90"
              viewBox="0 0 24 24"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
        )}

        {shapeType === "badge" && (
          <div
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-base font-black text-white shadow-2xl tracking-wider uppercase"
            style={{
              backgroundColor: fillColor,
              border: `${strokeWidth}px solid ${strokeColor}`,
              boxShadow: `0 0 30px ${strokeColor}88`,
            }}
          >
            <span>⚡</span>
            <span>{props.text || "BREAKING"}</span>
          </div>
        )}

        {shapeType === "divider" && (
          <div className="flex items-center w-[240px] max-w-full sm:w-[260px] gap-2">
            <div
              className="flex-1 h-[2px]"
              style={{ background: `linear-gradient(to right, transparent, ${strokeColor})` }}
            />
            <div
              className="w-2.5 h-2.5 rotate-45"
              style={{ backgroundColor: accentColor }}
            />
            <div
              className="flex-1 h-[2px]"
              style={{ background: `linear-gradient(to left, transparent, ${strokeColor})` }}
            />
          </div>
        )}
      </div>
    );
  }

  // RENDERER: VISUAL EFFECTS OVERLAY
  if (compKey === "effect-overlay" || compKey === "effect_overlay" || compKey.startsWith("fx-")) {
    const effectType = props.effectType || "rgb_glitch";
    const intensity = props.intensity ?? 80;

    // Local timing for dynamic effects like flash decay
    const decaySpeed = props.decaySpeed || 2;
    const flashDecay = Math.max(0, 1 - localTime * decaySpeed * 1.5);
    const flareColor = props.flareColor || "#38bdf8";
    const phosphorTint = props.phosphorTint || "#22c55e";
    const dotScale = props.dotScale || 12;
    const feather = props.feather ?? 60;
    const tintColor = props.tintColor || "#000000";
    const warmth = props.warmth ?? 80;
    const angle = props.angle ?? 45;

    return (
      <div
        className="relative select-none pointer-events-none w-full h-full flex items-center justify-center overflow-hidden"
        style={{ opacity: (intensity / 100) * opacity }}
      >
        {/* 1. RGB Glitch */}
        {effectType.includes("glitch") && (
          <div
            className="w-full h-full absolute inset-0 pointer-events-none mix-blend-screen"
            style={{
              background:
                "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.08), rgba(0, 255, 0, 0.03), rgba(0, 255, 255, 0.08))",
              backgroundSize: "100% 3px, 6px 100%",
              boxShadow: "inset 0 0 80px rgba(6, 182, 212, 0.4)",
            }}
          />
        )}

        {/* 2. Teal & Orange Grade */}
        {effectType.includes("teal") && (
          <div
            className="w-full h-full absolute inset-0 pointer-events-none mix-blend-color"
            style={{
              background:
                "linear-gradient(135deg, rgba(249, 115, 22, 0.3) 0%, rgba(13, 148, 136, 0.4) 100%)",
            }}
          />
        )}

        {/* 3. Retro VHS Scanlines */}
        {effectType.includes("vhs") && (
          <div
            className="w-full h-full absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 4px)",
              boxShadow: "inset 0 0 60px rgba(0, 0, 0, 0.5)",
            }}
          />
        )}

        {/* 4. Cyberpunk Neon Glow */}
        {effectType.includes("neon") && (
          <div
            className="w-full h-full absolute inset-0 pointer-events-none"
            style={{
              boxShadow: `inset 0 0 100px ${props.accentColor || "rgba(236, 72, 153, 0.6)"}`,
            }}
          />
        )}

        {/* 5. Black & White Noir */}
        {effectType.includes("bw") && (
          <div
            className="w-full h-full absolute inset-0 pointer-events-none backdrop-grayscale"
            style={{
              boxShadow: "inset 0 0 80px rgba(0,0,0,0.8)",
            }}
          />
        )}

        {/* 6. Cinematic Vignette */}
        {effectType.includes("vignette") && (
          <div
            className="w-full h-full absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, transparent ${Math.max(10, 100 - feather)}%, ${tintColor} 100%)`,
            }}
          />
        )}

        {/* 7. Golden Hour Glow */}
        {(effectType.includes("golden") || effectType.includes("sunset")) && (
          <div
            className="w-full h-full absolute inset-0 pointer-events-none mix-blend-screen"
            style={{
              background: `linear-gradient(${angle}deg, rgba(251, 146, 60, ${0.4 * (warmth / 100)}) 0%, rgba(245, 158, 11, ${0.25 * (warmth / 100)}) 35%, transparent 75%)`,
              boxShadow: "inset 0 0 90px rgba(245, 158, 11, 0.25)",
            }}
          />
        )}

        {/* 8. Anamorphic Lens Flare */}
        {(effectType.includes("flare") || effectType.includes("anamorphic")) && (
          <div className="w-full h-full absolute inset-0 pointer-events-none mix-blend-screen flex items-center justify-center">
            {/* Horizontal streak */}
            <div
              className="w-full h-[3px]"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${flareColor} 25%, #ffffff 50%, ${flareColor} 75%, transparent 100%)`,
                boxShadow: `0 0 16px ${flareColor}, 0 0 32px ${flareColor}`,
              }}
            />
            {/* Center bloom orb */}
            <div
              className="absolute w-16 h-16 rounded-full bg-white blur-md"
              style={{
                boxShadow: `0 0 40px ${flareColor}`,
              }}
            />
          </div>
        )}

        {/* 9. 8mm Vintage Film Burn */}
        {(effectType.includes("vintage") || effectType.includes("8mm") || effectType.includes("film")) && (
          <div
            className="w-full h-full absolute inset-0 pointer-events-none"
            style={{
              background: "rgba(180, 130, 80, 0.15)",
              boxShadow: "inset 0 0 80px rgba(70, 35, 10, 0.65)",
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent 0, transparent 24px, rgba(0,0,0,0.06) 25px, transparent 26px)",
            }}
          />
        )}

        {/* 10. Strobe Flash Burst */}
        {(effectType.includes("flash") || effectType.includes("strobe")) && (
          <div
            className="w-full h-full absolute inset-0 pointer-events-none mix-blend-screen transition-opacity duration-75"
            style={{
              backgroundColor: props.flashColor || "#ffffff",
              opacity: flashDecay,
            }}
          />
        )}

        {/* 11. Radial Zoom Blur */}
        {(effectType.includes("zoom") || effectType.includes("blur")) && (
          <div
            className="w-full h-full absolute inset-0 pointer-events-none mix-blend-screen"
            style={{
              background: `radial-gradient(circle at center, transparent 30%, rgba(255,255,255,0.15) 70%, rgba(255,255,255,0.35) 100%), repeating-conic-gradient(from 0deg, rgba(255,255,255,0.08) 0deg 2deg, transparent 2deg ${360 / (props.radialLines || 24)}deg)`,
            }}
          />
        )}

        {/* 12. CRT Arcade Phosphor */}
        {(effectType.includes("crt") || effectType.includes("arcade")) && (
          <div
            className="w-full h-full absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, ${phosphorTint}22 0, ${phosphorTint}22 1px, transparent 1px, transparent 4px)`,
              boxShadow: `inset 0 0 90px ${phosphorTint}33, inset 0 0 160px rgba(0,0,0,0.8)`,
            }}
          />
        )}

        {/* 13. Comic Pop Halftone */}
        {(effectType.includes("halftone") || effectType.includes("comic")) && (
          <div
            className="w-full h-full absolute inset-0 pointer-events-none mix-blend-multiply"
            style={{
              backgroundImage: "radial-gradient(#000000 24%, transparent 25%)",
              backgroundSize: `${dotScale}px ${dotScale}px`,
              opacity: 0.35,
            }}
          />
        )}

        {/* 14. Prismatic Rainbow Bokeh */}
        {(effectType.includes("prism") || effectType.includes("bokeh")) && (
          <div className="w-full h-full absolute inset-0 pointer-events-none mix-blend-screen">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(244, 114, 182, 0.15) 0%, rgba(251, 191, 36, 0.15) 30%, rgba(56, 189, 248, 0.15) 70%, rgba(168, 85, 247, 0.15) 100%)",
              }}
            />
            {/* Prismatic orbs */}
            <div className="absolute top-[20%] left-[25%] w-32 h-32 rounded-full bg-pink-400/25 blur-xl" />
            <div className="absolute bottom-[25%] right-[20%] w-40 h-40 rounded-full bg-cyan-400/25 blur-xl" />
            <div className="absolute top-[45%] right-[35%] w-24 h-24 rounded-full bg-amber-300/25 blur-lg" />
          </div>
        )}

        {/* 15. Tactical Night Vision */}
        {(effectType.includes("night") || effectType.includes("tactical")) && (
          <div className="w-full h-full absolute inset-0 pointer-events-none flex flex-col justify-between p-6 font-mono">
            {/* Phosphor green tint and scope vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(16, 185, 129, 0.25) 30%, rgba(6, 78, 59, 0.7) 70%, rgba(2, 44, 34, 0.95) 100%)",
                mixBlendMode: "color",
              }}
            />
            {/* Tactical scope HUD */}
            <div className="w-full flex justify-between items-center text-emerald-400 text-xs font-bold z-10 drop-shadow">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                IR-NIGHT-VISION [ON]
              </span>
              <span>FOV 84° // BAT 94%</span>
            </div>
            {/* Center reticle */}
            <div className="self-center z-10 flex flex-col items-center text-emerald-400">
              <div className="w-12 h-12 rounded-full border border-emerald-400/60 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[10px] tracking-widest mt-1 text-emerald-300 font-bold">+ 0.00 MIL +</span>
            </div>
            {/* Bottom HUD */}
            <div className="w-full flex justify-between items-center text-emerald-500 text-[10px] z-10 font-bold">
              <span>GAIN: HIGH [AUTOLIGHT]</span>
              <span>NVD-MILSPEC-GEN3</span>
            </div>
          </div>
        )}

        {/* 16. 35mm Motion Film Grain */}
        {effectType.includes("grain") && (
          <div
            className="w-full h-full absolute inset-0 pointer-events-none mix-blend-overlay opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 60%), repeating-radial-gradient(circle, #fff 0, #fff 1px, transparent 1px, transparent 4px)",
              backgroundSize: "100% 100%, 6px 6px",
            }}
          />
        )}

        {/* 17. Duotone Cyber Ultraviolet */}
        {effectType.includes("duotone") && (
          <div
            className="w-full h-full absolute inset-0 pointer-events-none mix-blend-color"
            style={{
              background: `linear-gradient(135deg, ${props.shadowColor || "#3b0764"} 0%, ${props.highlightColor || "#06b6d4"} 100%)`,
            }}
          />
        )}

        {/* 18. Infrared Thermal Heatmap */}
        {effectType.includes("thermal") && (
          <div
            className="w-full h-full absolute inset-0 pointer-events-none mix-blend-color"
            style={{
              background:
                "linear-gradient(180deg, #1e1b4b 0%, #06b6d4 25%, #22c55e 45%, #eab308 65%, #ef4444 85%, #ffffff 100%)",
              opacity: 0.85,
            }}
          />
        )}

        {/* 19. Dreamy Pro-Mist Bloom */}
        {(effectType.includes("dreamy") || effectType.includes("bloom")) && (
          <div
            className="w-full h-full absolute inset-0 pointer-events-none mix-blend-screen"
            style={{
              background:
                "radial-gradient(circle at center, rgba(255, 255, 255, 0.45) 0%, rgba(254, 243, 199, 0.25) 40%, transparent 75%)",
              filter: "blur(8px)",
            }}
          />
        )}

        {/* 20. RGB Party Color Strobe */}
        {(effectType.includes("party") || effectType.includes("color_strobe")) && (
          <div
            className="w-full h-full absolute inset-0 pointer-events-none mix-blend-screen"
            style={{
              background:
                "linear-gradient(135deg, rgba(217, 70, 239, 0.35) 0%, rgba(245, 158, 11, 0.35) 50%, rgba(16, 185, 129, 0.35) 100%)",
              opacity: 0.8,
            }}
          />
        )}

        {/* 21. 90s Skate Fisheye Warp */}
        {effectType.includes("fisheye") && (
          <div
            className="w-full h-full absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at center, transparent 45%, rgba(0, 0, 0, 0.4) 70%, rgba(0, 0, 0, 0.95) 100%)",
              boxShadow: "inset 0 0 50px rgba(6, 182, 212, 0.4), inset 0 0 80px rgba(239, 68, 68, 0.3)",
            }}
          />
        )}

        {/* 22. 2.39:1 Anamorphic Letterbox */}
        {effectType.includes("letterbox") && (
          <div className="w-full h-full absolute inset-0 pointer-events-none flex flex-col justify-between">
            <div
              className="w-full bg-black relative"
              style={{ height: `${props.barHeight || 12}%` }}
            >
              {props.accentLine !== false && (
                <div className="absolute bottom-0 inset-x-0 h-[1px] bg-amber-400/40" />
              )}
            </div>
            <div
              className="w-full bg-black relative"
              style={{ height: `${props.barHeight || 12}%` }}
            >
              {props.accentLine !== false && (
                <div className="absolute top-0 inset-x-0 h-[1px] bg-amber-400/40" />
              )}
            </div>
          </div>
        )}

        {/* 23. Earthquake Impact Camera Shake */}
        {effectType.includes("shake") && (
          <div
            className="w-full h-full absolute inset-0 pointer-events-none mix-blend-difference"
            style={{
              boxShadow: "inset 0 0 40px rgba(255, 255, 255, 0.2)",
              transform: `translate(${Math.sin(localTime * 25) * 4}px, ${Math.cos(localTime * 30) * 4}px)`,
            }}
          />
        )}

        {/* 24. Psychedelic Quad Mirror */}
        {effectType.includes("kaleidoscope") && (
          <div className="w-full h-full absolute inset-0 pointer-events-none flex">
            <div className="w-1/2 h-full border-r border-white/20 bg-gradient-to-tr from-purple-500/10 to-transparent" />
            <div className="w-1/2 h-full bg-gradient-to-tl from-cyan-500/10 to-transparent" />
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/20" />
          </div>
        )}

        {/* 25. X-Ray Solarize Invert */}
        {(effectType.includes("solarize") || effectType.includes("xray")) && (
          <div
            className="w-full h-full absolute inset-0 pointer-events-none mix-blend-exclusion"
            style={{
              background: `radial-gradient(circle at center, rgba(34, 211, 238, 0.3) 0%, rgba(15, 23, 42, 0.8) 100%)`,
              boxShadow: "inset 0 0 80px rgba(34, 211, 238, 0.5)",
            }}
          />
        )}
      </div>
    );
  }

  // RENDERER 1: RISING GRAPH / CHART REVEAL
  if (
    compKey === "chart-reveal" ||
    compKey === "chart" ||
    compKey === "graph" ||
    compKey === "rising-graph"
  ) {
    const title = props.title || "GROWTH TREND";
    const badgeText = props.badgeText || props.badge || "SURGE +165%";
    const dataPoint1 = props.dataPoint1 || "Stage 1: Baseline";
    const dataPoint2 = props.dataPoint2 || "Stage 2: +85%";
    const dataPoint3 = props.dataPoint3 || "Stage 3: +165% Surge";
    const val1 = props.val1 || "1.0x";
    const val2 = props.val2 || "1.85x";
    const val3 = props.val3 || "2.65x 🔥";
    const bar1Val = props.bar1Val || "+35%";
    const bar2Val = props.bar2Val || "+65%";
    const bar3Val = props.bar3Val || "+110%";
    const bar4Val = props.bar4Val || "+165%";
    const bar1Label = props.bar1Label || "Q1";
    const bar2Label = props.bar2Label || "Q2";
    const bar3Label = props.bar3Label || "Q3";
    const bar4Label = props.bar4Label || "SURGE";
    const accentColor = props.accentColor || props.colorTheme || "#22d3ee";

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
        className="relative select-none pointer-events-none rounded-2xl bg-neutral-950/90 backdrop-blur-2xl border p-4 sm:p-5 w-[240px] max-w-full sm:w-[260px] text-white font-sans transition-all"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
          borderColor: `${accentColor}55`,
          boxShadow: `0 0 35px ${accentColor}33, inset 0 1px 1px rgba(255,255,255,0.15)`,
        }}
      >
        {/* Ambient Top Glow Line */}
        <div
          className="absolute -top-px left-8 right-8 h-[2px]"
          style={{
            background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
            boxShadow: `0 0 10px ${accentColor}`,
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: accentColor }}
              />
              <span
                className="relative inline-flex rounded-full h-2.5 w-2.5"
                style={{ backgroundColor: accentColor }}
              />
            </span>
            <span
              className="text-xs font-black tracking-widest uppercase font-mono"
              style={{ color: accentColor }}
            >
              {title}
            </span>
          </div>
          <span
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono tracking-wide shadow-sm border"
            style={{
              backgroundColor: `${accentColor}22`,
              borderColor: `${accentColor}66`,
              color: accentColor,
            }}
          >
            {badgeText}
          </span>
        </div>

        {/* Rising Chart Graphic Visualizer */}
        <div className="relative h-32 w-full bg-neutral-900/60 rounded-xl p-3 border border-white/5 flex items-end justify-between gap-3 overflow-hidden">
          {/* Subtle Grid Guidelines */}
          <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none opacity-20">
            <div className="w-full border-b border-dashed border-white/30" />
            <div className="w-full border-b border-dashed border-white/30" />
            <div className="w-full border-b border-dashed border-white/30" />
          </div>

          {/* SVG Connecting Neon Trend Line */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible px-4 py-3">
            <defs>
              <linearGradient id={`chartGrad-${graphic.id || "static"}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={accentColor} />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor={accentColor} />
              </linearGradient>
            </defs>
            <path
              d={`M 25 ${110 - height1} Q 95 ${110 - height2} 165 ${110 - height3} T 240 ${110 - height4}`}
              fill="none"
              stroke={`url(#chartGrad-${graphic.id || "static"})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 8px ${accentColor})`,
                strokeDasharray: 300,
                strokeDashoffset: 300 * (1 - Math.max(bar1, bar4)),
                transition: "stroke-dashoffset 0.1s linear",
              }}
            />
          </svg>

          {/* Bar 1 */}
          <div className="flex-1 flex flex-col items-center justify-end h-full z-10">
            <span
              className="text-[9px] font-mono font-bold mb-1 transition-opacity text-neutral-300"
              style={{ opacity: bar1 }}
            >
              {bar1Val}
            </span>
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-neutral-800 via-sky-600/60 to-sky-400 transition-all duration-75 relative shadow-sm"
              style={{ height: `${height1}%` }}
            >
              <div className="absolute top-0 inset-x-0 h-[2px] bg-white/60 rounded-t-md" />
            </div>
            <span className="text-[9px] font-mono text-neutral-400 mt-1">{bar1Label}</span>
          </div>

          {/* Bar 2 */}
          <div className="flex-1 flex flex-col items-center justify-end h-full z-10">
            <span
              className="text-[9px] font-mono font-bold mb-1 transition-opacity text-neutral-200"
              style={{ opacity: bar2 }}
            >
              {bar2Val}
            </span>
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-neutral-800 via-sky-500/70 to-sky-300 transition-all duration-75 relative shadow-sm"
              style={{ height: `${height2}%` }}
            >
              <div className="absolute top-0 inset-x-0 h-[2px] bg-sky-100 rounded-t-md" />
            </div>
            <span className="text-[9px] font-mono text-neutral-400 mt-1">{bar2Label}</span>
          </div>

          {/* Bar 3 */}
          <div className="flex-1 flex flex-col items-center justify-end h-full z-10">
            <span
              className="text-[9px] font-mono font-bold mb-1 transition-opacity text-indigo-300"
              style={{ opacity: bar3 }}
            >
              {bar3Val}
            </span>
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-neutral-800 via-indigo-500/70 to-indigo-300 transition-all duration-75 relative shadow-sm"
              style={{ height: `${height3}%` }}
            >
              <div className="absolute top-0 inset-x-0 h-[2px] bg-indigo-100 rounded-t-md" />
            </div>
            <span className="text-[9px] font-mono text-neutral-400 mt-1">{bar3Label}</span>
          </div>

          {/* Bar 4: Peak Surge */}
          <div className="flex-1 flex flex-col items-center justify-end h-full z-10">
            <span
              className="text-[9px] font-mono font-bold mb-1 transition-opacity"
              style={{ opacity: bar4, color: accentColor }}
            >
              {bar4Val}
            </span>
            <div
              className="w-full rounded-t-md transition-all duration-75 relative shadow-lg"
              style={{
                height: `${height4}%`,
                background: `linear-gradient(to top, rgba(20,20,30,0.8), #818cf8, ${accentColor})`,
                boxShadow: `0 0 16px ${accentColor}88`,
              }}
            >
              <div className="absolute top-0 inset-x-0 h-[3px] bg-white rounded-t-md shadow-[0_0_8px_#fff]" />
              <div
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-md"
                style={{ boxShadow: `0 0 8px ${accentColor}` }}
              />
            </div>
            <span
              className="text-[9px] font-mono font-bold mt-1"
              style={{ color: accentColor }}
            >
              {bar4Label}
            </span>
          </div>
        </div>

        {/* Milestone Cards / Details */}
        <div className="mt-3.5 space-y-1.5">
          <div
            className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-neutral-900/70 border border-white/5 transition-opacity"
            style={{ opacity: bar1 }}
          >
            <span className="text-neutral-400 text-[11px]">{dataPoint1}</span>
            <span className="font-mono text-neutral-200 text-[11px] font-bold">{val1}</span>
          </div>
          <div
            className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-neutral-900/70 border border-white/5 transition-opacity"
            style={{ opacity: bar2 }}
          >
            <span className="text-neutral-400 text-[11px]">{dataPoint2}</span>
            <span className="font-mono text-indigo-300 text-[11px] font-bold">{val2}</span>
          </div>
          <div
            className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg border transition-opacity shadow-sm"
            style={{
              opacity: bar4,
              borderColor: `${accentColor}55`,
              background: `linear-gradient(to right, ${accentColor}20, rgba(129,140,248,0.15))`,
            }}
          >
            <span className="text-[11px] font-medium text-white">{dataPoint3}</span>
            <span
              className="font-mono text-[11px] font-extrabold flex items-center"
              style={{ color: accentColor }}
            >
              {val3}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // RENDERER 2: METRIC REVEAL / COUNTER / KPI / STAT CARD
  if (
    compKey === "metric-reveal" ||
    compKey === "metric_reveal" ||
    compKey === "animated-counter" ||
    compKey === "animated_counter" ||
    compKey === "animated-kpi" ||
    compKey === "animated_kpi" ||
    compKey === "stat-card-highlight" ||
    compKey === "stat_card_highlight" ||
    compKey === "cooked-likes" ||
    compKey === "cooked_likes"
  ) {
    const label = props.label || props.title || "KEY PERFORMANCE METRIC";
    const delta = props.delta || props.change || "+140% Growth";
    const hasExplicitCounter =
      props.to !== undefined ||
      props.from !== undefined ||
      props.endValue !== undefined ||
      props.startValue !== undefined;

    let currentNum: number | string = 140;
    let prefix = props.prefix || "";
    let suffix = props.suffix || "";

    if (hasExplicitCounter) {
      const fromN = Number(props.from ?? props.startValue ?? 0);
      const toN = Number(props.to ?? props.endValue ?? 50000);
      const val = Math.round(fromN + introProgress * (toN - fromN));
      if (!prefix && props.prefix) prefix = props.prefix;
      if (!suffix && props.suffix) suffix = props.suffix;
      if (toN >= 1000 && (suffix.toLowerCase() === "k" || (!suffix && toN % 1000 === 0))) {
        currentNum =
          val >= 1000
            ? val >= 10000
              ? Math.round(val / 1000)
              : (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)
            : val;
        if (!suffix) suffix = "k";
      } else {
        currentNum = val;
      }
    } else {
      const metricStr = String(props.metric || props.value || props.stat || "+140%");
      const rawNum = parseInt(metricStr.replace(/[^0-9]/g, ""), 10) || 140;
      currentNum = Math.round(introProgress * rawNum);
      if (!prefix) prefix = metricStr.startsWith("+") ? "+" : metricStr.startsWith("$") ? "$" : "";
      if (!suffix) {
        suffix = metricStr.includes("%")
          ? "%"
          : metricStr.toLowerCase().includes("k")
          ? "k"
          : metricStr.toLowerCase().includes("m")
          ? "m"
          : "";
      }
    }
    const accentColor = props.accentColor || props.colorTheme || "#10b981";

    return (
      <div
        className="relative select-none pointer-events-none rounded-2xl bg-neutral-950/90 backdrop-blur-2xl border p-4 sm:p-5 w-[240px] max-w-full sm:w-[260px] text-white font-sans transition-all"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
          borderColor: `${accentColor}55`,
          boxShadow: `0 0 35px ${accentColor}33, inset 0 1px 1px rgba(255,255,255,0.15)`,
        }}
      >
        <div
          className="absolute -top-px left-8 right-8 h-[2px]"
          style={{
            background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
            boxShadow: `0 0 10px ${accentColor}`,
          }}
        />

        <div
          className="text-[10px] font-mono tracking-widest uppercase font-black mb-1"
          style={{ color: accentColor }}
        >
          {label}
        </div>

        <div className="flex items-baseline space-x-2 sm:space-x-3 my-1">
          <div
            className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono"
            style={{ filter: `drop-shadow(0 0 16px ${accentColor}88)` }}
          >
            {prefix}
            {currentNum}
            {suffix}
          </div>
          <div
            className="flex items-center text-xs font-bold px-2 py-0.5 rounded-full font-mono border"
            style={{
              backgroundColor: `${accentColor}22`,
              borderColor: `${accentColor}55`,
              color: accentColor,
            }}
          >
            <span>↗</span>
            <span className="ml-1">{delta}</span>
          </div>
        </div>

        {/* Animated Progress Gauge */}
        <div className="w-full bg-neutral-900 rounded-full h-2 mt-3 overflow-hidden border border-white/10">
          <div
            className="h-full transition-all duration-75 rounded-full"
            style={{
              width: `${Math.round(introProgress * 85)}%`,
              background: `linear-gradient(to right, ${accentColor}, #38bdf8)`,
              boxShadow: `0 0 10px ${accentColor}`,
            }}
          />
        </div>
      </div>
    );
  }

  // RENDERER 3: TERMINAL / CODE REVEAL
  // RENDERER 3: TERMINAL / CODE TYPING
  if (
    compKey === "cooked-terminal" ||
    compKey === "code-reveal" ||
    compKey === "vscode-code-typing" ||
    compKey === "terminal" ||
    compKey === "code"
  ) {
    const command = props.command || props.code || "npm run deploy";
    const output = props.output || "Server running: 100% production ready";
    const windowTitle = props.windowTitle || props.title || "bash — 80×24";
    const accentColor = props.accentColor || "#10b981";

    // Animated character typing simulation
    const typedLength = Math.round(introProgress * command.length);
    const visibleCmd = command.slice(0, typedLength);
    const showOutput = introProgress >= 0.75;

    return (
      <div
        className="relative select-none pointer-events-none rounded-xl bg-neutral-950/95 backdrop-blur-2xl border w-[240px] max-w-full sm:w-[260px] text-white font-mono transition-all overflow-hidden"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
          borderColor: `${accentColor}40`,
          boxShadow: `0 0 40px ${accentColor}25, inset 0 1px 1px rgba(255,255,255,0.1)`,
        }}
      >
        {/* macOS Style Window Titlebar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-neutral-900/90 border-b border-neutral-800">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500/90" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/90" />
            <div className="w-3 h-3 rounded-full bg-green-500/90" />
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">{windowTitle}</span>
          <div className="w-8" />
        </div>

        {/* Terminal Body */}
        <div className="p-4 space-y-2 text-xs">
          <div className="flex items-center text-neutral-300">
            <span className="mr-2 font-bold" style={{ color: accentColor }}>~ $</span>
            <span>{visibleCmd}</span>
            <span
              className="inline-block w-2 h-4 ml-0.5 animate-pulse"
              style={{ backgroundColor: accentColor }}
            />
          </div>

          {showOutput && (
            <div className="flex items-center space-x-1.5 pt-1 animate-fadeIn" style={{ color: `${accentColor}ee` }}>
              <span className="font-bold" style={{ color: accentColor }}>✓</span>
              <span>{output}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // RENDERER 4: SOCIAL POST / TWEET
  if (
    compKey === "cooked-social-post" ||
    compKey === "cooked_social_post" ||
    compKey === "social-post" ||
    compKey === "social_post" ||
    compKey === "tweet" ||
    compKey === "viral-tweet"
  ) {
    const name = props.name || props.author || "Creator Pro";
    const handle = props.handle || "@creator_pro";
    const text =
      props.text ||
      props.content ||
      props.quote ||
      props.headline ||
      "Scaling the creative workflow with dynamic motion graphics! 🚀";
    const likes = props.likes || props.likesCount || props.likeCount || "18.4K";
    const accentColor = props.accentColor || "#0ea5e9";

    return (
      <div
        className="relative select-none pointer-events-none rounded-2xl bg-neutral-950/90 backdrop-blur-2xl border p-3.5 sm:p-4 w-[240px] max-w-full sm:w-[260px] text-white font-sans transition-all"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
          borderColor: `${accentColor}44`,
          boxShadow: `0 0 35px ${accentColor}25`,
        }}
      >
        <div className="flex items-center space-x-3 mb-2.5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, #6366f1)`,
            }}
          >
            {name[0] || "C"}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm text-white">{name}</span>
              <span style={{ color: accentColor }} className="text-xs">✓</span>
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
          <span style={{ color: accentColor }}>Viral Pulse</span>
        </div>
      </div>
    );
  }

  // RENDERER 5: QUOTE REVEAL
  if (
    compKey === "quote-reveal" ||
    compKey === "quote_reveal" ||
    compKey === "quote" ||
    compKey === "cinematic-quote"
  ) {
    const quote =
      props.quote || props.text || "Consistency is what transforms average into excellence.";
    const author = props.author || props.authorName || props.attribution || "Key Takeaway";
    const accentColor = props.accentColor || "#f59e0b";

    return (
      <div
        className="relative select-none pointer-events-none rounded-2xl bg-neutral-950/90 backdrop-blur-2xl border p-4 sm:p-5 shadow-[0_0_35px_rgba(245,158,11,0.2)] w-[240px] max-w-full sm:w-[260px] text-white font-sans transition-all"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
          borderColor: `${accentColor}44`,
          boxShadow: `0 0 35px ${accentColor}25`,
        }}
      >
        <span
          className="text-4xl font-serif leading-none"
          style={{ color: `${accentColor}cc` }}
        >
          “
        </span>
        <p className="text-sm italic font-medium text-neutral-100 leading-relaxed my-2">
          {quote}
        </p>
        <div
          className="flex items-center justify-end space-x-2 pt-2 border-t"
          style={{ borderColor: `${accentColor}33` }}
        >
          <span className="text-xs font-mono font-bold" style={{ color: accentColor }}>
            — {author}
          </span>
        </div>
      </div>
    );
  }

  // RENDERER 6: PROGRESS BAR
  if (
    compKey === "cooked-progress" ||
    compKey === "cooked_progress" ||
    compKey === "progress-bar" ||
    compKey === "progress" ||
    compKey === "completion-progress" ||
    compKey === "completion-bar"
  ) {
    const label = props.label || props.title || "Completion Rate";
    const targetProgress =
      typeof props.progress === "number"
        ? props.progress
        : typeof props.to === "number"
        ? props.to
        : typeof props.value === "number"
        ? props.value
        : 85;
    const currentProgress = Math.round(introProgress * targetProgress);
    const accentColor = props.accentColor || props.barColor || "#6366f1";

    return (
      <div
        className="relative select-none pointer-events-none rounded-2xl bg-neutral-950/90 backdrop-blur-2xl border p-3.5 sm:p-4 shadow-[0_0_30px_rgba(99,102,241,0.2)] w-[240px] max-w-full sm:w-[260px] text-white font-sans transition-all"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
          borderColor: `${accentColor}40`,
          boxShadow: `0 0 30px ${accentColor}25`,
        }}
      >
        <div className="flex justify-between items-center text-xs font-mono mb-2">
          <span className="text-neutral-300 font-bold">{label}</span>
          <span className="font-extrabold" style={{ color: accentColor }}>
            {currentProgress}%
          </span>
        </div>
        <div className="w-full bg-neutral-900 rounded-full h-3 overflow-hidden border border-white/10 relative p-0.5">
          <div
            className="h-full rounded-full transition-all duration-75 relative shadow-sm"
            style={{
              width: `${currentProgress}%`,
              background: `linear-gradient(to right, ${accentColor}aa, ${accentColor})`,
              boxShadow: `0 0 12px ${accentColor}`,
            }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_6px_#ffffff]" />
          </div>
        </div>
      </div>
    );
  }

  // RENDERER 7: NOTES / CHECKLIST
  if (
    compKey === "cooked-notes" ||
    compKey === "cooked_notes" ||
    compKey === "notes-checklist" ||
    compKey === "checklist" ||
    compKey === "action-items" ||
    compKey === "notes"
  ) {
    const title = props.title || props.header || "Key Action Items";
    const customStepItems = [props.item1, props.item2, props.item3, props.item4].filter(Boolean);
    const items: string[] =
      customStepItems.length > 0
        ? (customStepItems as string[])
        : Array.isArray(props.items) && props.items.length > 0
        ? props.items
        : ["1. Hook within 2 seconds", "2. Fast-paced visual b-roll", "3. Clear CTA at the climax"];
    const accentColor = props.accentColor || "#eab308";

    return (
      <div
        className="relative select-none pointer-events-none rounded-2xl bg-neutral-950/90 backdrop-blur-2xl border p-3.5 sm:p-4 w-[240px] max-w-full sm:w-[260px] text-white font-sans transition-all"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
          borderColor: `${accentColor}44`,
          boxShadow: `0 0 30px ${accentColor}25`,
        }}
      >
        <div
          className="text-xs font-bold font-mono tracking-wider mb-2.5"
          style={{ color: accentColor }}
        >
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
                <span className="font-bold" style={{ color: accentColor }}>✓</span>
                <span>{item}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // RENDERER 8: NOTIFICATION TOAST
  if (
    compKey === "cooked-toasts" ||
    compKey === "cooked_toasts" ||
    compKey === "toast" ||
    compKey === "toasts" ||
    compKey === "notification"
  ) {
    const title = props.title || "Alert";
    const message = props.message || props.body || props.text || "Key milestone reached!";
    const accentColor = props.accentColor || "#06b6d4";
    const icon = props.icon || "🔔";

    return (
      <div
        className="relative select-none pointer-events-none rounded-xl bg-neutral-950/90 backdrop-blur-2xl border p-3 sm:p-3.5 w-[240px] max-w-full sm:w-[260px] text-white font-sans flex items-center space-x-3 transition-all"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
          borderColor: `${accentColor}60`,
          boxShadow: `0 0 30px ${accentColor}33`,
        }}
      >
        <div
          className="w-8 h-8 rounded-full border flex items-center justify-center text-sm"
          style={{
            backgroundColor: `${accentColor}20`,
            borderColor: `${accentColor}60`,
            color: accentColor,
          }}
        >
          {icon}
        </div>
        <div>
          <div className="text-xs font-bold text-white">{title}</div>
          <div className="text-[11px] text-neutral-300">{message}</div>
        </div>
      </div>
    );
  }

  // RENDERER 9: ANIMATED ARROW
  if (
    compKey === "animated-arrow" ||
    compKey === "animated_arrow" ||
    compKey === "callout-arrow" ||
    compKey === "arrow"
  ) {
    const label = props.label || props.text || "Look Here";
    const direction = props.direction || "down";
    const accentColor = props.accentColor || props.fillColor || "#facc15";

    return (
      <div
        className="relative select-none pointer-events-none flex flex-col items-center space-y-1.5 transition-all"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
        }}
      >
        <span
          className="text-xs font-bold bg-neutral-950/90 border px-3 py-1 rounded-full shadow-lg font-mono"
          style={{
            color: accentColor,
            borderColor: `${accentColor}66`,
            boxShadow: `0 0 16px ${accentColor}33`,
          }}
        >
          {label}
        </span>
        <svg
          className="w-10 h-10 animate-bounce"
          style={{
            color: accentColor,
            filter: `drop-shadow(0 0 12px ${accentColor})`,
            transform:
              direction === "right"
                ? "rotate(-90deg)"
                : direction === "left"
                ? "rotate(90deg)"
                : direction === "up"
                ? "rotate(180deg)"
                : "none",
          }}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2L4 14h6v8h4v-8h6L12 2z" />
        </svg>
      </div>
    );
  }

  // RENDERER: HERO REVEAL & COOKED CARD
  if (
    compKey === "hero-reveal" ||
    compKey === "hero_reveal" ||
    compKey === "hero" ||
    compKey === "cinematic-hero" ||
    compKey === "cooked-card" ||
    compKey === "cooked_card"
  ) {
    const headline = props.headline || props.title || graphic.name || "NEXT-GEN CREATION";
    const supporting = props.supporting || props.label || props.category || "PRO EDITION";
    const subtext = props.subtext || props.description || props.subtitle || "";
    const colorTheme = (props.colorTheme || props.color || "").toLowerCase();
    const accentColor =
      props.accentColor ||
      (colorTheme === "blue" || colorTheme === "cyan"
        ? "#38bdf8"
        : colorTheme === "emerald" || colorTheme === "green"
        ? "#34d399"
        : colorTheme === "amber" || colorTheme === "yellow"
        ? "#f59e0b"
        : colorTheme === "rose" || colorTheme === "red"
        ? "#f43f5e"
        : "#a855f7");

    return (
      <div
        className="relative select-none pointer-events-none rounded-2xl bg-neutral-950/95 backdrop-blur-2xl p-4 sm:p-6 w-[240px] max-w-full sm:w-[260px] text-white font-sans transition-all overflow-hidden"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
          border: `1px solid ${accentColor}44`,
          boxShadow: `0 0 45px ${accentColor}25, inset 0 1px 1px rgba(255,255,255,0.15)`,
        }}
      >
        {/* Radial Ambient Top Glow */}
        <div
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full blur-2xl pointer-events-none"
          style={{ backgroundColor: `${accentColor}40` }}
        />

        {/* Ambient Top Glow Line */}
        <div
          className="absolute -top-px left-8 right-8 h-[2px]"
          style={{
            background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
            boxShadow: `0 0 12px ${accentColor}`,
          }}
        />

        {/* Upper Category Badge Pill with Pulsing Beacon */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-widest border shadow-sm"
            style={{
              backgroundColor: `${accentColor}18`,
              borderColor: `${accentColor}50`,
              color: accentColor,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: accentColor }}
            />
            <span>{supporting}</span>
          </div>
        </div>

        {/* Main Punchy Display Headline */}
        <h3 className="text-2xl font-black tracking-tight text-white leading-tight drop-shadow-md">
          {headline}
        </h3>

        {/* Optional Subtitle / Supporting text */}
        {subtext && (
          <p className="text-xs text-neutral-300 font-medium leading-relaxed mt-2 line-clamp-2">
            {subtext}
          </p>
        )}

        {/* Bottom Accent Indicator Bar */}
        <div className="mt-4 flex items-center gap-2">
          <div
            className="w-8 h-1 rounded-full"
            style={{ backgroundColor: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
          />
          <div className="flex-1 h-[1px] bg-white/10" />
        </div>
      </div>
    );
  }

  // RENDERER: POP UP BADGE
  if (
    compKey === "pop-up-badge" ||
    compKey === "pop_up_badge" ||
    compKey === "badge" ||
    compKey === "highlight-badge"
  ) {
    const text = props.text || props.label || props.title || "KEY HIGHLIGHT";
    const icon = props.icon || "⚡";
    const accentColor = props.accentColor || props.color || "#06b6d4";

    return (
      <div
        className="relative select-none pointer-events-none rounded-full px-5 py-2.5 bg-neutral-950/95 backdrop-blur-2xl border text-white font-sans flex items-center gap-2.5 shadow-2xl transition-all"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
          borderColor: `${accentColor}60`,
          boxShadow: `0 0 30px ${accentColor}44`,
        }}
      >
        <span className="text-base animate-bounce">{icon}</span>
        <span
          className="text-xs font-black uppercase tracking-wider font-mono"
          style={{ color: "#ffffff" }}
        >
          {text}
        </span>
        <span
          className="w-2 h-2 rounded-full animate-ping ml-1"
          style={{ backgroundColor: accentColor }}
        />
      </div>
    );
  }

  // RENDERER: KINETIC TEXT
  if (compKey === "kinetic-text" || compKey === "kinetic_text" || compKey === "kinetic") {
    const text = props.text || props.headline || "THIS IS THE HOOK";
    const words = text.split(" ");
    const accentColor = props.accentColor || "#38bdf8";

    return (
      <div
        className="relative select-none pointer-events-none flex flex-wrap gap-x-3 gap-y-1 justify-center max-w-[480px] p-4 text-center transition-all"
        style={{ opacity }}
      >
        {words.map((word: string, i: number) => {
          const isLast = i === words.length - 1;
          const wordDelay = i * 0.12;
          const wordProg = Math.min(1, Math.max(0, (localTime - wordDelay) / 0.25));
          const wordScale = 0.6 + wordProg * 0.4;
          return (
            <span
              key={i}
              className={cn(
                "font-black tracking-tight leading-none text-2xl sm:text-3xl uppercase transition-all duration-100",
                isLast ? "font-extrabold" : "text-white"
              )}
              style={{
                opacity: wordProg,
                transform: `scale(${wordScale}) translateY(${(1 - wordProg) * 16}px)`,
                color: isLast ? accentColor : "#ffffff",
                textShadow: isLast ? `0 0 20px ${accentColor}aa` : "0 2px 8px rgba(0,0,0,0.8)",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    );
  }

  // RENDERER: ICON REVEAL
  if (compKey === "icon-reveal" || compKey === "icon_reveal") {
    const concept = props.concept || props.icon || props.emoji || "⚡";
    const label = props.label || props.title || "SPEED";
    const sublabel = props.sublabel || props.subtitle || "";
    const accentColor = props.accentColor || "#a855f7";

    return (
      <div
        className="relative select-none pointer-events-none rounded-3xl bg-neutral-950/95 backdrop-blur-2xl p-4 sm:p-6 w-[240px] max-w-full sm:w-[260px] text-white font-sans text-center transition-all border"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
          borderColor: `${accentColor}50`,
          boxShadow: `0 0 40px ${accentColor}33`,
        }}
      >
        <div className="text-5xl mb-3 animate-pulse drop-shadow-[0_0_16px_rgba(255,255,255,0.4)]">
          {concept}
        </div>
        <h4 className="text-xl font-black uppercase tracking-tight text-white mb-1">
          {label}
        </h4>
        {sublabel && (
          <p className="text-xs text-neutral-400 font-mono font-medium">
            {sublabel}
          </p>
        )}
      </div>
    );
  }

  // RENDERER: CHAT CONVERSATION
  if (
    compKey === "cooked-chat" ||
    compKey === "cooked_chat" ||
    compKey === "chat" ||
    compKey === "dialogue"
  ) {
    const sender = props.sender || "Alex";
    const accentColor = props.accentColor || "#0284c7";
    const rawMessages = props.messages || [
      { from: "them", text: props.message1 || props.question || "How does this work?" },
      { from: "me", text: props.message2 || props.answer || props.text || "It's fully automated with AI!" },
    ];
    const messages = Array.isArray(rawMessages) ? rawMessages : [];

    return (
      <div
        className="relative select-none pointer-events-none rounded-2xl bg-neutral-950/95 backdrop-blur-2xl border p-3.5 sm:p-4 w-[240px] max-w-full sm:w-[260px] text-white font-sans transition-all space-y-2.5"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
          borderColor: `${accentColor}33`,
          boxShadow: `0 0 40px ${accentColor}20`,
        }}
      >
        <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5" style={{ color: accentColor }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Direct Message</span>
            {sender && <span className="opacity-70">• {sender}</span>}
          </span>
          <span>Live Chat</span>
        </div>

        {messages.map((m: any, i: number) => {
          const isMe = m.from === "me" || m.from === "user";
          const msgProg = Math.min(1, Math.max(0, (localTime - i * 0.3) / 0.3));
          return (
            <div
              key={i}
              className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}
              style={{ opacity: msgProg }}
            >
              <div
                className={cn(
                  "rounded-2xl px-3.5 py-2 text-xs font-medium max-w-[85%] shadow-md",
                  isMe
                    ? "text-white rounded-br-xs"
                    : "bg-neutral-800 text-neutral-100 rounded-bl-xs border border-white/5"
                )}
                style={
                  isMe
                    ? {
                        background: `linear-gradient(135deg, ${accentColor}, #4f46e5)`,
                        boxShadow: `0 0 12px ${accentColor}44`,
                      }
                    : undefined
                }
              >
                {m.text}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // RENDERER: FLOW SEQUENCE / STEP SEQUENCE
  if (
    compKey === "cooked-flow" ||
    compKey === "cooked_flow" ||
    compKey === "step-sequence" ||
    compKey === "step_sequence" ||
    compKey === "flow"
  ) {
    const title = props.title || "WORKFLOW PIPELINE";
    const accentColor = props.accentColor || "#10b981";
    const rawNodes = props.nodes ||
      props.steps || [
        props.step1 || "1. Ingest Video",
        props.step2 || "2. AI Auto-Edit",
        props.step3 || "3. 4K Export",
        props.step4,
      ].filter(Boolean);
    const nodes = (Array.isArray(rawNodes) ? rawNodes : []).map((n: any) =>
      typeof n === "string" ? { label: n } : n
    );

    return (
      <div
        className="relative select-none pointer-events-none rounded-2xl bg-neutral-950/95 backdrop-blur-2xl border p-4 sm:p-5 w-[240px] max-w-full sm:w-[260px] text-white font-sans transition-all"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
          borderColor: `${accentColor}40`,
          boxShadow: `0 0 35px ${accentColor}25`,
        }}
      >
        <div
          className="text-[10px] font-mono font-black uppercase tracking-widest mb-3 flex items-center gap-2"
          style={{ color: accentColor }}
        >
          <span>⚡</span>
          <span>{title}</span>
        </div>

        <div className="space-y-2.5">
          {nodes.map((node: any, i: number) => {
            const nodeProg = Math.min(1, Math.max(0, (localTime - i * 0.25) / 0.35));
            return (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-900/70 border border-white/5 shadow-sm transition-all"
                style={{ opacity: nodeProg }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}, #4f46e5)`,
                  }}
                >
                  {i + 1}
                </div>
                <span className="text-xs font-semibold text-neutral-100 flex-1 truncate">
                  {node.label || node.text || node.title}
                </span>
                <span className="text-emerald-400 text-xs font-bold font-mono">✓</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // RENDERER 9B: LOWER THIRD BANNER
  if (
    compKey === "lower-third" ||
    compKey === "lower_third" ||
    compKey === "name-banner" ||
    compKey === "speaker-banner"
  ) {
    const name = props.name || "Alex Rivera";
    const title = props.title || "Lead Product Architect";
    const handle = props.handle || "@alexrivera";
    const accentColor = props.accentColor || "#38bdf8";

    return (
      <div
        className="relative select-none pointer-events-none rounded-xl bg-neutral-950/90 backdrop-blur-2xl border border-white/10 p-3 sm:p-4 shadow-[0_0_35px_rgba(0,0,0,0.8)] w-[240px] max-w-full sm:w-[260px] text-white font-sans flex items-center gap-3 transition-all overflow-hidden"
        style={{
          opacity,
          transform: `translateX(${(1 - easeProgress) * -40}px) scale(${scaleEntrance})`,
        }}
      >
        {/* Glowing vertical accent bar */}
        <div
          className="w-1.5 self-stretch rounded-full shadow-lg shrink-0"
          style={{
            backgroundColor: accentColor,
            boxShadow: `0 0 16px ${accentColor}`,
          }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-black tracking-tight text-white truncate drop-shadow-sm">
              {name}
            </h4>
            {handle && (
              <span
                className="text-[10px] font-mono px-2 py-0.2 rounded-full border border-white/10 bg-white/5 truncate font-semibold"
                style={{ color: accentColor }}
              >
                {handle}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 font-medium truncate mt-0.5">
            {title}
          </p>
        </div>
      </div>
    );
  }

  // RENDERER 9C: SUBSCRIBE & BELL CALLOUT
  if (
    compKey === "subscribe-badge" ||
    compKey === "subscribe_badge" ||
    compKey === "subscribe" ||
    compKey === "youtube-subscribe"
  ) {
    const channelName = props.channelName || "Creator Studio";
    const subCount = props.subCount || "1.25M";
    const buttonText = props.buttonText || "SUBSCRIBE";
    const buttonColor = props.buttonColor || props.accentColor || "#dc2626";
    const showBell = props.showBell !== false;

    // Ringing bell animation
    const isRinging = localTime % 1.6 < 0.6;
    const bellAngle = isRinging ? Math.sin(localTime * 24) * 20 : 0;

    return (
      <div
        className="relative select-none pointer-events-none rounded-full bg-neutral-950/95 backdrop-blur-2xl border border-white/15 px-3 py-2 sm:px-4 sm:py-2.5 w-[240px] max-w-full sm:w-[260px] text-white font-sans flex items-center justify-between gap-2.5 transition-all"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
          boxShadow: `0 0 35px ${buttonColor}33, 0 0 40px rgba(0,0,0,0.85)`,
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-500 via-rose-600 to-amber-500 flex items-center justify-center font-black text-xs text-white shadow-md shrink-0">
            {channelName[0] || "C"}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate leading-tight">
              {channelName}
            </div>
            <div className="text-[10px] font-mono text-neutral-400 truncate">
              {subCount} subscribers
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-white shadow-lg transition-transform"
            style={{
              backgroundColor: buttonColor,
              boxShadow: `0 0 16px ${buttonColor}88`,
            }}
          >
            {buttonText}
          </button>

          {showBell && (
            <div
              className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-amber-400 text-xs shadow-md transition-transform"
              style={{
                transform: `rotate(${bellAngle}deg)`,
              }}
            >
              🔔
            </div>
          )}
        </div>
      </div>
    );
  }

  // RENDERER 9D: BEFORE & AFTER SPLIT COMPARISON
  if (
    compKey === "before-after" ||
    compKey === "before_after" ||
    compKey === "split-comparison"
  ) {
    const beforeLabel = props.beforeLabel || "BEFORE";
    const beforeText = props.beforeText || "6 hrs manual editing";
    const afterLabel = props.afterLabel || "AFTER";
    const afterText = props.afterText || "60s AI automation";
    const accentColor = props.accentColor || "#10b981";

    return (
      <div
        className="relative select-none pointer-events-none rounded-2xl bg-neutral-950/95 backdrop-blur-2xl border border-white/10 p-3.5 sm:p-4 shadow-[0_0_35px_rgba(0,0,0,0.85)] w-[240px] max-w-full sm:w-[260px] text-white font-sans transition-all overflow-hidden"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
        }}
      >
        <div className="grid grid-cols-2 gap-3 relative">
          {/* Left: Before Side */}
          <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[10px] font-black text-rose-400 font-mono tracking-widest uppercase mb-1">
              ✕ {beforeLabel}
            </span>
            <p className="text-xs text-neutral-300 font-medium leading-snug">
              {beforeText}
            </p>
          </div>

          {/* Right: After Side */}
          <div
            className="rounded-xl p-3 flex flex-col justify-between shadow-lg"
            style={{
              backgroundColor: `${accentColor}15`,
              border: `1px solid ${accentColor}60`,
              boxShadow: `0 0 20px ${accentColor}33`,
            }}
          >
            <span
              className="text-[10px] font-black font-mono tracking-widest uppercase mb-1 flex items-center gap-1"
              style={{ color: accentColor }}
            >
              ✓ {afterLabel}
            </span>
            <p className="text-xs text-white font-bold leading-snug">
              {afterText}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // RENDERER 9E: COUNTDOWN TIMER WIDGET
  if (
    compKey === "countdown-timer" ||
    compKey === "countdown_timer" ||
    compKey === "timer"
  ) {
    const totalSec = typeof props.seconds === "number" && props.seconds > 0 ? props.seconds : 5;
    const label = props.label || "TIME REMAINING";
    const accentColor = props.accentColor || "#f59e0b";

    const remaining = Math.max(0, totalSec - localTime);
    const wholeSec = Math.floor(remaining);
    const millis = Math.floor((remaining % 1) * 100);
    const fraction = remaining / totalSec;
    const circumference = 2 * Math.PI * 34;
    const dashOffset = circumference * (1 - fraction);

    return (
      <div
        className="relative select-none pointer-events-none rounded-2xl bg-neutral-950/95 backdrop-blur-2xl border border-white/10 p-3.5 sm:p-4 shadow-[0_0_35px_rgba(0,0,0,0.85)] w-[240px] max-w-full sm:w-[260px] text-white font-sans flex items-center gap-3 transition-all"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
        }}
      >
        {/* Animated Circular SVG Ring */}
        <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="#262626"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke={accentColor}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                transition: "stroke-dashoffset 0.05s linear",
                filter: `drop-shadow(0 0 8px ${accentColor})`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-mono font-black text-lg text-white">
            0:{wholeSec < 10 ? `0${wholeSec}` : wholeSec}
          </div>
        </div>

        <div className="min-w-0">
          <span
            className="text-[9px] font-mono font-black tracking-widest uppercase block mb-1"
            style={{ color: accentColor }}
          >
            {label}
          </span>
          <div className="text-xs font-mono text-neutral-400">
            .{millis < 10 ? `0${millis}` : millis}s remaining
          </div>
        </div>
      </div>
    );
  }

  // RENDERER 9F: 5-STAR REVIEW CARD
  if (
    compKey === "review-card" ||
    compKey === "review_card" ||
    compKey === "testimonial"
  ) {
    const author = props.author || "Sarah Jenkins";
    const role = props.role || "Verified Creator";
    const rating = typeof props.rating === "number" ? Math.min(5, Math.max(1, props.rating)) : 5;
    const review = props.review || "Saved our team 20+ hours a week. Absolute game changer!";
    const accentColor = props.accentColor || "#fbbf24";

    return (
      <div
        className="relative select-none pointer-events-none rounded-2xl bg-neutral-950/95 backdrop-blur-2xl border border-white/10 p-3.5 sm:p-4 shadow-[0_0_35px_rgba(0,0,0,0.85)] w-[240px] max-w-full sm:w-[260px] text-white font-sans transition-all overflow-hidden"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
        }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center font-black text-xs text-neutral-950 shadow-md">
              {author[0] || "S"}
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                {author}
                <span className="text-emerald-400 text-[10px]">✓</span>
              </div>
              <div className="text-[10px] text-neutral-400 font-mono">
                {role}
              </div>
            </div>
          </div>

          {/* Star rating icons */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((starIdx) => {
              const isFilled = starIdx <= rating;
              return (
                <span
                  key={starIdx}
                  className="text-sm transition-transform"
                  style={{
                    color: isFilled ? accentColor : "#525252",
                    filter: isFilled ? `drop-shadow(0 0 6px ${accentColor}88)` : "none",
                  }}
                >
                  ★
                </span>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-neutral-200 italic leading-relaxed">
          &ldquo;{review}&rdquo;
        </p>
      </div>
    );
  }

  // RENDERER 9G: SOCIAL HANDLES BADGE
  if (
    compKey === "social-handles" ||
    compKey === "social_handles" ||
    compKey === "social-badge"
  ) {
    const platform = (props.platform || "youtube").toLowerCase();
    const handle = props.handle || "@contentmaster";
    const actionText = props.actionText || "Follow for daily tips";
    const accentColor = props.accentColor || "#a855f7";

    const platformIcon =
      platform === "youtube"
        ? "▶"
        : platform === "tiktok"
        ? "🎵"
        : platform === "instagram"
        ? "📸"
        : platform === "twitter" || platform === "x"
        ? "𝕏"
        : "★";

    return (
      <div
        className="relative select-none pointer-events-none rounded-xl bg-neutral-950/95 backdrop-blur-2xl border border-white/10 p-3 shadow-[0_0_35px_rgba(0,0,0,0.85)] w-[240px] max-w-full sm:w-[260px] text-white font-sans flex items-center gap-2.5 transition-all"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
        }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-black shadow-md shrink-0"
          style={{
            backgroundColor: `${accentColor}25`,
            border: `1px solid ${accentColor}60`,
            color: accentColor,
            boxShadow: `0 0 14px ${accentColor}44`,
          }}
        >
          {platformIcon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-white font-mono truncate">
            {handle}
          </div>
          <div className="text-[10px] text-neutral-400 font-medium truncate">
            {actionText}
          </div>
        </div>

        <span
          className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/10 bg-white/5 shrink-0"
          style={{ color: accentColor }}
        >
          {platform}
        </span>
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
    const accentColor = props.accentColor || "#38bdf8";
    const uploadDuration = Math.max(1.0, totalDuration * 0.7);
    const targetProgress = typeof props.progress === "number" ? Math.min(100, Math.max(0, props.progress)) : 100;
    const uploadProgress = Math.min(targetProgress, Math.round((localTime / uploadDuration) * targetProgress));
    const isComplete = uploadProgress >= 100;
    const statusText = isComplete ? (props.status || "Upload Complete") : "Uploading to cloud...";

    return (
      <div
        className="relative select-none pointer-events-none rounded-2xl bg-neutral-950/95 backdrop-blur-2xl p-4 sm:p-5 w-[240px] max-w-full sm:w-[260px] text-white font-sans transition-all overflow-hidden"
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
          border: `1px solid ${isComplete ? "#10b98166" : `${accentColor}66`}`,
          boxShadow: `0 0 35px ${isComplete ? "rgba(16,185,129,0.25)" : `${accentColor}40`}, inset 0 1px 1px rgba(255,255,255,0.15)`,
        }}
      >
        {/* Ambient Top Glow Line */}
        <div
          className="absolute -top-px left-8 right-8 h-[2px]"
          style={{
            background: `linear-gradient(to right, transparent, ${isComplete ? "#10b981" : accentColor}, transparent)`,
            boxShadow: `0 0 10px ${isComplete ? "#10b981" : accentColor}`,
          }}
        />

        {/* macOS / App Titlebar */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <span className="text-[11px] font-mono text-neutral-300 font-bold ml-1.5">{appName}</span>
          </div>
          <span
            className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
            style={{
              color: accentColor,
              backgroundColor: `${accentColor}18`,
              borderColor: `${accentColor}50`,
            }}
          >
            {title}
          </span>
        </div>

        {/* Upload File Dropzone & Card */}
        <div
          className="border border-dashed rounded-xl p-3.5 space-y-3 transition-colors"
          style={{
            borderColor: isComplete ? "rgba(16,185,129,0.4)" : `${accentColor}50`,
            backgroundColor: isComplete ? "rgba(6,78,59,0.2)" : "rgba(23,23,23,0.8)",
          }}
        >
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
              style={{
                backgroundColor: isComplete ? "rgba(16,185,129,0.2)" : `${accentColor}25`,
                color: isComplete ? "#34d399" : accentColor,
                border: `1px solid ${isComplete ? "rgba(52,211,153,0.4)" : `${accentColor}66`}`,
              }}
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
                <span style={{ color: accentColor }}>4K / 60fps</span>
              </div>
            </div>
            <span
              className="text-xs font-mono font-bold"
              style={{ color: isComplete ? "#34d399" : accentColor }}
            >
              {uploadProgress}%
            </span>
          </div>

          {/* Progress Track */}
          <div className="w-full bg-neutral-950 rounded-full h-2 overflow-hidden border border-white/5 relative">
            <div
              className="h-full transition-all duration-75 rounded-full shadow-sm"
              style={{
                width: `${uploadProgress}%`,
                background: isComplete
                  ? "linear-gradient(to right, #10b981, #2dd4bf)"
                  : `linear-gradient(to right, ${accentColor}cc, ${accentColor})`,
                boxShadow: `0 0 10px ${isComplete ? "#10b981" : accentColor}`,
              }}
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
    const accentColor = props.accentColor || "#38bdf8";

    // Live vertical scroll computation as playhead advances
    const scrollProgress = Math.min(1, Math.max(0, localTime / totalDuration));
    const scrollY = Math.round(scrollProgress * (isMobile ? 260 : 180));

    // VARIANT A: 9:16 MOBILE PHONE BROWSER
    if (isMobile) {
      return (
        <div
          className="relative select-none pointer-events-none rounded-[36px] bg-neutral-950/95 backdrop-blur-2xl border-2 border-neutral-700/80 shadow-[0_25px_60px_rgba(0,0,0,0.85)] w-[260px] sm:w-[280px] text-white font-sans transition-all overflow-hidden p-2.5"
          style={{
            opacity,
            transform: `scale(${scaleEntrance})`,
            boxShadow: `0 0 50px ${accentColor}40, 0 25px 60px rgba(0,0,0,0.85)`,
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
              <span className="text-[9px] font-bold tracking-wider" style={{ color: accentColor }}>LIVE WEB</span>
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
              <div
                className="absolute bottom-2.5 left-2.5 right-2.5 bg-neutral-900/95 backdrop-blur-md rounded-lg px-2.5 py-1.5 shadow-xl flex items-center space-x-1.5 z-20 border"
                style={{ borderColor: `${accentColor}80` }}
              >
                <span className="text-xs">👆</span>
                <span className="text-[10px] font-mono font-bold truncate" style={{ color: accentColor }}>{highlightText}</span>
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
          "relative select-none pointer-events-none rounded-2xl bg-neutral-950/95 backdrop-blur-2xl text-white font-sans transition-all overflow-hidden border",
          isSquare ? "w-[240px] max-w-full sm:w-[260px]" : "w-[240px] max-w-full sm:w-[260px]"
        )}
        style={{
          opacity,
          transform: `scale(${scaleEntrance})`,
          borderColor: `${accentColor}50`,
          boxShadow: `0 0 40px ${accentColor}35, inset 0 1px 1px rgba(255,255,255,0.15)`,
        }}
      >
        {/* Ambient Top Glow Line */}
        <div
          className="absolute -top-px left-8 right-8 h-[2px]"
          style={{
            background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
            boxShadow: `0 0 10px ${accentColor}`,
          }}
        />

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
            <div
              className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: `${accentColor}18`,
                borderColor: `${accentColor}50`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color: accentColor }}>
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
  const theme = (props.colorTheme || props.color || "").toLowerCase();

  const isBlue = theme === "blue" || theme === "cyan";
  const isEmerald = theme === "emerald" || theme === "green";
  const isAmber = theme === "amber" || theme === "yellow";

  const borderColor = isBlue
    ? "border-sky-500/40"
    : isEmerald
    ? "border-emerald-500/40"
    : isAmber
    ? "border-amber-500/40"
    : "border-purple-500/40";

  const glowShadow = isBlue
    ? "shadow-[0_0_35px_rgba(56,189,248,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)]"
    : isEmerald
    ? "shadow-[0_0_35px_rgba(16,185,129,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)]"
    : isAmber
    ? "shadow-[0_0_35px_rgba(245,158,11,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)]"
    : "shadow-[0_0_35px_rgba(168,85,247,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)]";

  const topGlow = isBlue
    ? "via-sky-400"
    : isEmerald
    ? "via-emerald-400"
    : isAmber
    ? "via-amber-400"
    : "via-purple-400";

  const badgeClass = isBlue
    ? "text-sky-300 bg-sky-500/15 border-sky-400/30"
    : isEmerald
    ? "text-emerald-300 bg-emerald-500/15 border-emerald-400/30"
    : isAmber
    ? "text-amber-300 bg-amber-500/15 border-amber-400/30"
    : "text-purple-300 bg-purple-500/15 border-purple-400/30";

  return (
    <div
      className={cn(
        "relative select-none pointer-events-none rounded-2xl bg-neutral-950/90 backdrop-blur-2xl p-4 sm:p-5 w-[240px] max-w-full sm:w-[260px] text-white font-sans transition-all border",
        borderColor,
        glowShadow
      )}
      style={{
        opacity,
        transform: `scale(${scaleEntrance})`,
      }}
    >
      <div className={cn("absolute -top-px left-8 right-8 h-[2px] bg-gradient-to-r from-transparent to-transparent", topGlow)} />
      <span className={cn("inline-block text-[10px] font-mono tracking-widest border px-2.5 py-0.5 rounded-full font-bold uppercase mb-2", badgeClass)}>
        {supporting}
      </span>
      <h3 className="text-lg font-black tracking-tight text-white leading-snug drop-shadow-sm">
        {headline}
      </h3>
    </div>
  );
}
