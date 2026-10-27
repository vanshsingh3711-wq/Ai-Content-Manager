"use client";

import React from "react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4 max-w-lg mx-auto",
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-violet-400 shadow-[0_0_20px_rgba(124,58,237,0.15)]">
        <Icon className="w-6 h-6" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-base font-semibold text-white tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-white/40 leading-relaxed">
          {description}
        </p>
      </div>

      {(actionText || secondaryActionText) && (
        <div className="flex items-center gap-3 pt-2">
          {secondaryActionText && (
            <Button variant="ghost" size="sm" onClick={onSecondaryAction}>
              {secondaryActionText}
            </Button>
          )}
          {actionText && (
            <Button variant="primary" size="sm" onClick={onAction}>
              {actionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
