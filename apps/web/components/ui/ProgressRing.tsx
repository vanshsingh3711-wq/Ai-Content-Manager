"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  variant?: "violet" | "cyan" | "emerald";
  showValue?: boolean;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 48,
  strokeWidth = 4,
  variant = "cyan",
  showValue = false,
  className,
}: ProgressRingProps) {
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (normalizedProgress / 100) * circumference;

  const gradientIds = {
    violet: "progress-grad-violet",
    cyan: "progress-grad-cyan",
    emerald: "progress-grad-emerald",
  };

  const gradientColors = {
    violet: ["#c4b5fd", "#7c3aed"],
    cyan: ["#a5f3fc", "#06b6d4"],
    emerald: ["#6ee7b7", "#10b981"],
  };

  const selectedGradient = gradientIds[variant];
  const [stopStart, stopEnd] = gradientColors[variant];

  return (
    <div
      className={cn("relative inline-flex items-center justify-center select-none", className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(normalizedProgress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={selectedGradient} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={stopStart} />
            <stop offset="100%" stopColor={stopEnd} />
          </linearGradient>
        </defs>

        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
        />

        {/* Animated Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={`url(#${selectedGradient})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-300 ease-out"
        />
      </svg>

      {showValue && (
        <span className="absolute text-[10px] font-mono font-semibold text-white">
          {Math.round(normalizedProgress)}%
        </span>
      )}
    </div>
  );
}
