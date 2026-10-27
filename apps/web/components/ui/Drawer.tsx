"use client";

import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  side?: "right" | "left" | "bottom";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  side = "right",
  size = "md",
  children,
  footer,
  className,
}: DrawerProps) {
  const titleId = useId();
  const descId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Handle ESC key and scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the drawer on mount
    drawerRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses: Record<NonNullable<DrawerProps["size"]>, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
    full: "max-w-full",
  };

  const sideClasses: Record<NonNullable<DrawerProps["side"]>, string> = {
    right: "top-0 right-0 bottom-0 h-full border-l border-white/[0.08]",
    left: "top-0 left-0 bottom-0 h-full border-r border-white/[0.08]",
    bottom: "bottom-0 left-0 right-0 max-h-[85vh] border-t border-white/[0.08] rounded-t-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} aria-describedby={description ? descId : undefined}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        tabIndex={-1}
        className={cn(
          "fixed z-50 flex flex-col bg-[#0d1017] shadow-[0_0_50px_rgba(0,0,0,0.8)] outline-none w-full transition-transform duration-300 ease-out",
          sideClasses[side],
          side !== "bottom" && sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            {title && (
              <h2 id={titleId} className="text-base font-semibold text-white tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p id={descId} className="text-xs text-white/40 mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {children}
        </div>

        {/* Optional footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-white/[0.06] bg-white/[0.01] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
