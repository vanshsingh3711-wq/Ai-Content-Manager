"use client";

import React, { useState, useEffect } from "react";
import {
  Keyboard,
  Search,
  X,
  Compass,
  Zap,
  Scissors,
  Layers,
} from "lucide-react";
import { Kbd } from "./Kbd";
import { Badge } from "./Badge";
import { SYSTEM_SHORTCUTS, ShortcutCategory } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

interface KeyboardCheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardCheatSheetModal({
  isOpen,
  onClose,
}: KeyboardCheatSheetModalProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"All" | ShortcutCategory>("All");

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setActiveCategory("All");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories: ("All" | ShortcutCategory)[] = [
    "All",
    "Navigation",
    "Global & Actions",
    "Studio Editor",
  ];

  const filteredShortcuts = SYSTEM_SHORTCUTS.filter((sc) => {
    const matchesCategory =
      activeCategory === "All" || sc.category === activeCategory;
    const q = query.toLowerCase();
    const matchesQuery =
      sc.title.toLowerCase().includes(q) ||
      sc.display.toLowerCase().includes(q) ||
      (sc.description && sc.description.toLowerCase().includes(q));
    return matchesCategory && matchesQuery;
  });

  const getCategoryIcon = (cat: ShortcutCategory) => {
    switch (cat) {
      case "Navigation":
        return <Compass className="w-3.5 h-3.5 text-cyan-400" />;
      case "Global & Actions":
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case "Studio Editor":
        return <Scissors className="w-3.5 h-3.5 text-violet-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-white/40" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div className="relative z-50 w-full max-w-2xl bg-[#0d1017] border border-white/[0.12] rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Keyboard Shortcuts
              </h2>
              <p className="text-[11px] text-white/40">
                Speed up your editing and navigation workflow
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            aria-label="Close shortcuts modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-white/[0.06] bg-black/20 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shortcuts (e.g. create, play, split)..."
              className="w-full pl-8 pr-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white placeholder-white/30 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0",
                  activeCategory === cat
                    ? "bg-violet-600/20 text-cyan-300 border border-violet-500/30"
                    : "text-white/40 hover:text-white hover:bg-white/[0.04] border border-transparent"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {filteredShortcuts.length === 0 ? (
            <div className="py-12 text-center text-xs text-white/30">
              No shortcuts found matching &quot;{query}&quot;.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {filteredShortcuts.map((sc) => (
                <div
                  key={sc.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.08] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <div className="shrink-0">
                      {getCategoryIcon(sc.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white truncate">
                          {sc.title}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider font-mono text-white/30">
                          {sc.category}
                        </span>
                      </div>
                      {sc.description && (
                        <p className="text-[11px] text-white/40 truncate mt-0.5">
                          {sc.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    {sc.keys.length === 2 && sc.keys[0] === "G" ? (
                      <div className="flex items-center gap-1 text-[11px] text-white/40">
                        <Kbd>G</Kbd>
                        <span>then</span>
                        <Kbd>{sc.keys[1]}</Kbd>
                      </div>
                    ) : (
                      <Kbd shortcut={sc.display} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hint Footer */}
        <div className="px-6 py-3 border-t border-white/[0.06] bg-black/30 flex items-center justify-between text-[11px] text-white/30">
          <div className="flex items-center gap-2">
            <span>Tip: Press <Kbd>?</Kbd> anywhere to open this sheet</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Press <Kbd>Esc</Kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
