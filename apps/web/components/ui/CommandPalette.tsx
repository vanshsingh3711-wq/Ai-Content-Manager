"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  PlusCircle,
  Film,
  Layers,
  Scissors,
  Share2,
  Settings,
  Sparkles,
  Upload,
  ArrowRight,
  Keyboard,
  PanelLeft,
  Clock,
  RefreshCw,
  Compass,
} from "lucide-react";
import { Kbd } from "./Kbd";
import { cn } from "@/lib/utils";

export type CommandCategory = "All" | "Navigation" | "Actions" | "Templates";

export interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Actions" | "Templates";
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  description?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShortcuts?: () => void;
  onToggleSidebar?: () => void;
  onOpenTour?: () => void;
}

const RECENT_COMMANDS_KEY = "ai-director-recent-commands";

export function CommandPalette({
  isOpen,
  onClose,
  onOpenShortcuts,
  onToggleSidebar,
  onOpenTour,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CommandCategory>("All");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent command IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_COMMANDS_KEY);
      if (stored) {
        setRecentIds(JSON.parse(stored));
      }
    } catch {}
  }, [isOpen]);

  const recordRecentCommand = (id: string) => {
    try {
      const updated = [id, ...recentIds.filter((item) => item !== id)].slice(0, 5);
      setRecentIds(updated);
      localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(updated));
    } catch {}
  };

  const commands: CommandItem[] = [
    // Actions
    {
      id: "act-create",
      title: "Create New Video (Wizard)",
      description: "Start full 3-step creation flow",
      category: "Actions",
      icon: PlusCircle,
      shortcut: "Cmd+N",
      action: () => {
        recordRecentCommand("act-create");
        router.push("/dashboard/create");
        onClose();
      },
    },
    {
      id: "act-upload",
      title: "Upload & Enhance Footage",
      description: "Ingest talking head video with AI B-roll",
      category: "Actions",
      icon: Upload,
      action: () => {
        recordRecentCommand("act-upload");
        router.push("/dashboard/create?mode=upload");
        onClose();
      },
    },
    {
      id: "act-studio",
      title: "Launch Studio NLE Workspace",
      description: "Open professional multi-track timeline",
      category: "Actions",
      icon: Scissors,
      shortcut: "G+S",
      action: () => {
        recordRecentCommand("act-studio");
        router.push("/dashboard/editor");
        onClose();
      },
    },
    {
      id: "act-cheatsheet",
      title: "Keyboard Shortcuts Cheat Sheet",
      description: "Show complete list of system hotkeys",
      category: "Actions",
      icon: Keyboard,
      shortcut: "?",
      action: () => {
        recordRecentCommand("act-cheatsheet");
        onClose();
        if (onOpenShortcuts) onOpenShortcuts();
      },
    },
    {
      id: "act-sidebar",
      title: "Toggle Sidebar Navigation",
      description: "Pin or collapse left navigation panel",
      category: "Actions",
      icon: PanelLeft,
      shortcut: "[",
      action: () => {
        recordRecentCommand("act-sidebar");
        onClose();
        if (onToggleSidebar) onToggleSidebar();
      },
    },
    {
      id: "act-refresh",
      title: "Refresh Application State",
      description: "Reload active video jobs and status",
      category: "Actions",
      icon: RefreshCw,
      action: () => {
        recordRecentCommand("act-refresh");
        window.location.reload();
      },
    },
    {
      id: "act-tour",
      title: "Take Interactive Product Tour",
      description: "5-step walkthrough of Create, Library, Queue, and Studio",
      category: "Actions",
      icon: Compass,
      action: () => {
        recordRecentCommand("act-tour");
        onClose();
        if (onOpenTour) {
          onOpenTour();
        } else {
          router.push("/dashboard");
        }
      },
    },

    // Navigation
    {
      id: "nav-home",
      title: "Go to Command Center (Home)",
      description: "Main workspace metrics and activity",
      category: "Navigation",
      icon: LayoutDashboard,
      shortcut: "G+H",
      action: () => {
        recordRecentCommand("nav-home");
        router.push("/dashboard");
        onClose();
      },
    },
    {
      id: "nav-library",
      title: "Go to Video Library",
      description: "Explore all generated and exported videos",
      category: "Navigation",
      icon: Film,
      shortcut: "G+L",
      action: () => {
        recordRecentCommand("nav-library");
        router.push("/dashboard/videos");
        onClose();
      },
    },
    {
      id: "nav-queue",
      title: "Go to Rendering Queue",
      description: "Track WhisperX, AI Directing, Remotion jobs",
      category: "Navigation",
      icon: Layers,
      shortcut: "G+Q",
      action: () => {
        recordRecentCommand("nav-queue");
        router.push("/dashboard/queue");
        onClose();
      },
    },
    {
      id: "nav-socials",
      title: "Socials & Multi-Platform Publishing",
      description: "Manage YouTube, TikTok, and Instagram accounts",
      category: "Navigation",
      icon: Share2,
      action: () => {
        recordRecentCommand("nav-socials");
        router.push("/dashboard/socials");
        onClose();
      },
    },
    {
      id: "nav-settings",
      title: "Settings & AI Models",
      description: "Configure Gemini, Whisper, and ElevenLabs API keys",
      category: "Navigation",
      icon: Settings,
      action: () => {
        recordRecentCommand("nav-settings");
        router.push("/dashboard/settings");
        onClose();
      },
    },

    // Templates
    {
      id: "tpl-feynman",
      title: "Template: Educational Feynman Short (9:16)",
      description: "High-retention Feynman breakdown style",
      category: "Templates",
      icon: Sparkles,
      action: () => {
        recordRecentCommand("tpl-feynman");
        router.push("/dashboard/create?template=feynman");
        onClose();
      },
    },
    {
      id: "tpl-finance",
      title: "Template: Finance Faceless Video (16:9)",
      description: "Market graphics, data charts, and cashflow beats",
      category: "Templates",
      icon: Sparkles,
      action: () => {
        recordRecentCommand("tpl-finance");
        router.push("/dashboard/create?template=finance");
        onClose();
      },
    },
    {
      id: "tpl-tech",
      title: "Template: Fast Tech Reel (9:16)",
      description: "Cyberpunk visuals, rapid hook, glitch overlays",
      category: "Templates",
      icon: Sparkles,
      action: () => {
        recordRecentCommand("tpl-tech");
        router.push("/dashboard/create?template=tech");
        onClose();
      },
    },
  ];

  // Filter commands by category and query
  const filteredCommands = commands.filter((cmd) => {
    const matchesCategory =
      activeCategory === "All" || cmd.category === activeCategory;
    const q = query.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchesQuery =
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.description && cmd.description.toLowerCase().includes(q));

    return matchesCategory && matchesQuery;
  });

  // Recent commands subset
  const recentCommands = query.trim() === "" && activeCategory === "All"
    ? recentIds
        .map((id) => commands.find((c) => c.id === id))
        .filter((c): c is CommandItem => Boolean(c))
    : [];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setActiveCategory("All");
    }
  }, [isOpen]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredCommands.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredCommands.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = filteredCommands[selectedIndex];
      if (current) current.action();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  const categories: CommandCategory[] = [
    "All",
    "Actions",
    "Navigation",
    "Templates",
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative z-50 w-full max-w-xl bg-[#0e121a] border border-white/[0.12] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
          <Search className="w-4 h-4 text-white/40 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search actions..."
            className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
          />
          <Kbd shortcut="Esc" />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.06] bg-black/20 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors shrink-0",
                activeCategory === cat
                  ? "bg-violet-600/25 text-cyan-300 border border-violet-500/40"
                  : "text-white/40 hover:text-white hover:bg-white/[0.04] border border-transparent"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div
          id="command-list"
          role="listbox"
          className="max-h-[380px] overflow-y-auto p-2 space-y-1"
        >
          {recentCommands.length > 0 && query.trim() === "" && (
            <div className="px-3 pt-1 pb-1.5 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-white/30">
              <Clock className="w-3 h-3" />
              <span>Recent</span>
            </div>
          )}

          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-white/30">
              No matching commands found.
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-colors duration-100",
                    isSelected
                      ? "bg-violet-600/20 text-white border border-violet-500/30"
                      : "text-white/70 hover:bg-white/[0.04] border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-3">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
                        isSelected
                          ? "bg-violet-500/20 text-violet-300"
                          : "bg-white/[0.04] text-white/40"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="truncate font-medium block">
                        {cmd.title}
                      </span>
                      {cmd.description && (
                        <span className="text-[10px] text-white/35 truncate block">
                          {cmd.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-white/25 uppercase font-mono tracking-wider hidden sm:inline">
                      {cmd.category}
                    </span>
                    {cmd.shortcut && <Kbd shortcut={cmd.shortcut} />}
                    <ArrowRight
                      className={cn(
                        "w-3 h-3 text-white/20 transition-transform",
                        isSelected && "translate-x-0.5 text-violet-400"
                      )}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06] bg-black/20 text-[11px] text-white/30">
          <div className="flex items-center gap-3">
            <span>
              Use <Kbd>↑</Kbd> <Kbd>↓</Kbd> to navigate
            </span>
            <span>
              <Kbd>↵</Kbd> to select
            </span>
          </div>
          <span>
            <Kbd>Cmd</Kbd> + <Kbd>K</Kbd> toggle
          </span>
        </div>
      </div>
    </div>
  );
}
