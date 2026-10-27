"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  shortcut?: string;
}

export function Kbd({ className, shortcut, children, ...props }: KbdProps) {
  if (shortcut) {
    const keys = shortcut.split("+").map((k) => k.trim());
    return (
      <span className="inline-flex items-center gap-1">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className={cn(
              "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-mono font-medium text-white/50 bg-white/[0.06] border border-white/[0.12] rounded shadow-xs select-none",
              className
            )}
            {...props}
          >
            {k === "Cmd" || k === "Meta" ? "⌘" : k === "Shift" ? "⇧" : k === "Alt" ? "⌥" : k === "Ctrl" ? "⌃" : k}
          </kbd>
        ))}
      </span>
    );
  }

  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-mono font-medium text-white/50 bg-white/[0.06] border border-white/[0.12] rounded shadow-xs select-none",
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}
