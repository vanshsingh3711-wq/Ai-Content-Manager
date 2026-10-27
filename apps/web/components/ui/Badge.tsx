"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "done"
  | "success"
  | "rendering"
  | "processing"
  | "queued"
  | "failed"
  | "error"
  | "draft"
  | "info"
  | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({
  className,
  variant = "neutral",
  size = "sm",
  dot = true,
  pulse,
  children,
  ...props
}: BadgeProps) {
  const isPulse =
    pulse ??
    (variant === "rendering" ||
      variant === "processing" ||
      variant === "queued");

  const variantStyles: Record<
    BadgeVariant,
    { badge: string; dot: string }
  > = {
    done: {
      badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
      dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
    },
    success: {
      badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
      dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
    },
    rendering: {
      badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
      dot: "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]",
    },
    processing: {
      badge: "bg-violet-500/10 text-violet-300 border-violet-500/30",
      dot: "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]",
    },
    queued: {
      badge: "bg-amber-500/10 text-amber-300 border-amber-500/25",
      dot: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]",
    },
    failed: {
      badge: "bg-rose-500/10 text-rose-300 border-rose-500/25",
      dot: "bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.6)]",
    },
    error: {
      badge: "bg-rose-500/10 text-rose-300 border-rose-500/25",
      dot: "bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.6)]",
    },
    draft: {
      badge: "bg-slate-500/15 text-slate-300 border-slate-500/25",
      dot: "bg-slate-400",
    },
    info: {
      badge: "bg-blue-500/10 text-blue-300 border-blue-500/25",
      dot: "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]",
    },
    neutral: {
      badge: "bg-white/[0.05] text-white/70 border-white/[0.08]",
      dot: "bg-white/40",
    },
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] gap-1.5",
    md: "px-2.5 py-1 text-xs gap-2",
  };

  const current = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border transition-colors select-none tracking-tight",
        current.badge,
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            current.dot,
            isPulse && "animate-pulse"
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
