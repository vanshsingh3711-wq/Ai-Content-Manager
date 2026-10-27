"use client";

import React, { useRef, useId } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  size?: "sm" | "md";
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className,
  size = "md",
}: TabsProps) {
  const tabListRef = useRef<HTMLDivElement>(null);
  const baseId = useId();

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === "ArrowRight") {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    onChange(tabs[nextIndex].id);
    const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>(
      '[role="tab"]'
    );
    buttons?.[nextIndex]?.focus();
  };

  const sizeStyles = {
    sm: "h-8 px-2.5 text-xs gap-1.5",
    md: "h-9 px-3.5 text-[13px] gap-2",
  };

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-label="Tabs"
      className={cn(
        "inline-flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md",
        className
      )}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            id={`${baseId}-tab-${tab.id}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${baseId}-panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              "relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
              sizeStyles[size],
              isActive
                ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]"
                : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            <span>{tab.label}</span>
            {tab.badge && <span className="ml-1 shrink-0">{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  id,
  activeTab,
  children,
  className,
}: {
  id: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (id !== activeTab) return null;

  return (
    <div
      role="tabpanel"
      tabIndex={0}
      className={cn("outline-none animate-in fade-in duration-150", className)}
    >
      {children}
    </div>
  );
}
