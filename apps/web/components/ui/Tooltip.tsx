"use client";

import React, { useState, useRef, useId, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  side?: "top" | "bottom" | "left" | "right";
  delayMs?: number;
  className?: string;
}

export function Tooltip({
  content,
  children,
  side = "top",
  delayMs = 200,
  className,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, delayMs);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        hideTooltip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen]);

  const sideStyles = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const trigger = React.cloneElement(children, {
    "aria-describedby": isOpen ? id : undefined,
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      children.props.onMouseEnter?.(e);
      showTooltip();
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      children.props.onMouseLeave?.(e);
      hideTooltip();
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      children.props.onFocus?.(e);
      showTooltip();
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      children.props.onBlur?.(e);
      hideTooltip();
    },
  });

  return (
    <div className="relative inline-flex items-center">
      {trigger}
      {isOpen && (
        <div
          id={id}
          role="tooltip"
          className={cn(
            "absolute z-50 pointer-events-none px-2.5 py-1 text-[11px] font-medium text-white/90 bg-[#161b26] border border-white/[0.12] rounded-md shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-100",
            sideStyles[side],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
