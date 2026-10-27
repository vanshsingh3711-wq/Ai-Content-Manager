"use client";

import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "outline"
    | "ghost"
    | "danger"
    | "subtle";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060709]";

    const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
      primary:
        "bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white shadow-[0_0_14px_rgba(124,58,237,0.35)] hover:shadow-[0_0_22px_rgba(124,58,237,0.55)] active:scale-[0.98]",
      secondary:
        "bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.16] text-white border border-white/[0.10] active:scale-[0.98]",
      accent:
        "bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-neutral-950 font-semibold shadow-[0_0_14px_rgba(6,182,212,0.35)] hover:shadow-[0_0_22px_rgba(6,182,212,0.55)] active:scale-[0.98]",
      outline:
        "border border-white/[0.14] text-white/90 hover:text-white hover:border-violet-500/50 hover:bg-violet-500/10 active:scale-[0.98]",
      ghost:
        "text-white/70 hover:text-white hover:bg-white/[0.06] active:bg-white/[0.10] active:scale-[0.98]",
      danger:
        "bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 active:bg-red-500/35 active:scale-[0.98]",
      subtle:
        "bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/20 active:scale-[0.98]",
    };

    const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
      xs: "h-7 px-2.5 text-xs gap-1.5 rounded-md",
      sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
      md: "h-9 px-4 text-[13px] gap-2 rounded-lg",
      lg: "h-11 px-5 text-sm gap-2.5 rounded-xl font-semibold",
      icon: "w-9 h-9 p-0 rounded-lg shrink-0",
    };

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-current" />
            {loadingText ? <span>{loadingText}</span> : children}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
