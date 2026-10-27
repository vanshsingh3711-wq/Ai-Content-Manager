"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "violet" | "cyan" | "white" | "none";
  interactive?: boolean;
  elevated?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      glow = "none",
      interactive = false,
      elevated = false,
      padding = "md",
      children,
      ...props
    },
    ref
  ) => {
    const glowClasses = {
      none: "",
      violet: "gradient-border-violet hover:shadow-[0_0_24px_rgba(124,58,237,0.22)]",
      cyan: "gradient-border-cyan hover:shadow-[0_0_24px_rgba(6,182,212,0.20)]",
      white: "gradient-border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]",
    };

    const paddingClasses = {
      none: "p-0",
      sm: "p-3.5",
      md: "p-5",
      lg: "p-6",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl transition-all duration-200 border",
          elevated
            ? "bg-[#141821]/90 backdrop-blur-md border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            : "glass-card",
          glow !== "none" ? cn("gradient-border", glowClasses[glow]) : "",
          interactive &&
            "cursor-pointer hover:border-white/[0.14] hover:-translate-y-0.5 active:translate-y-0",
          paddingClasses[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function CardHeader({
  className,
  title,
  description,
  action,
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn("flex items-start justify-between gap-4 mb-4", className)}
      {...props}
    >
      <div>
        {title && (
          <h3 className="text-sm font-semibold text-white tracking-tight">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-xs text-white/40 mt-1 leading-relaxed">
            {description}
          </p>
        )}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between pt-4 mt-4 border-t border-white/[0.05]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
