"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type ShortcutCategory =
  | "Navigation"
  | "Global & Actions"
  | "Studio Editor"
  | "General";

export interface ShortcutItem {
  id: string;
  title: string;
  description?: string;
  category: ShortcutCategory;
  keys: string[]; // e.g. ["Meta+K"] or ["G", "H"]
  display: string; // e.g. "⌘K" or "G then H"
  action: () => void;
  allowInInputs?: boolean;
}

/** Check if current event target is an interactive text input */
export function isTypingInInput(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  const isInput = tag === "input" || tag === "textarea" || tag === "select";
  const isEditable =
    target.isContentEditable ||
    target.contentEditable === "true" ||
    target.getAttribute("contenteditable") === "true";
  return isInput || isEditable;
}

/**
 * Standard registry of shortcuts used for display in the cheat sheet and command palette
 */
export const SYSTEM_SHORTCUTS: Omit<ShortcutItem, "action">[] = [
  // Global & Actions
  {
    id: "cmd-k",
    title: "Command Palette",
    description: "Search actions, navigate pages, and trigger templates",
    category: "Global & Actions",
    keys: ["Meta+K", "Control+K"],
    display: "⌘K",
  },
  {
    id: "cmd-n",
    title: "New AI Video",
    description: "Open the 3-step creation wizard",
    category: "Global & Actions",
    keys: ["Meta+N", "Control+N"],
    display: "⌘N",
  },
  {
    id: "toggle-sidebar",
    title: "Toggle Sidebar",
    description: "Collapse or expand the left navigation bar",
    category: "Global & Actions",
    keys: ["["],
    display: "[",
  },
  {
    id: "open-cheatsheet",
    title: "Keyboard Shortcuts",
    description: "Display this cheat sheet modal",
    category: "Global & Actions",
    keys: ["?"],
    display: "?",
  },
  {
    id: "close-dialog",
    title: "Close Modal / Drawer",
    description: "Dismiss current overlay or active slide-over panel",
    category: "Global & Actions",
    keys: ["Escape"],
    display: "Esc",
  },

  // Navigation (Sequence chords)
  {
    id: "nav-home",
    title: "Go to Home",
    description: "Navigate to the Command Center overview",
    category: "Navigation",
    keys: ["G", "H"],
    display: "G then H",
  },
  {
    id: "nav-create",
    title: "Go to Create Wizard",
    description: "Open the video creation flow",
    category: "Navigation",
    keys: ["G", "C"],
    display: "G then C",
  },
  {
    id: "nav-library",
    title: "Go to Video Library",
    description: "Browse created videos, view details and export",
    category: "Navigation",
    keys: ["G", "L"],
    display: "G then L",
  },
  {
    id: "nav-queue",
    title: "Go to Queue",
    description: "Monitor real-time pipeline render jobs",
    category: "Navigation",
    keys: ["G", "Q"],
    display: "G then Q",
  },
  {
    id: "nav-studio",
    title: "Go to Studio Editor",
    description: "Open the multi-track NLE timeline workspace",
    category: "Navigation",
    keys: ["G", "S"],
    display: "G then S",
  },

  // Studio Editor
  {
    id: "studio-play",
    title: "Play / Pause",
    description: "Toggle video playback in the timeline preview",
    category: "Studio Editor",
    keys: ["Space"],
    display: "Space",
  },
  {
    id: "studio-split",
    title: "Split Clip",
    description: "Cut active clip at current playhead position",
    category: "Studio Editor",
    keys: ["S"],
    display: "S",
  },
  {
    id: "studio-delete",
    title: "Delete Clip",
    description: "Remove the selected clip from timeline track",
    category: "Studio Editor",
    keys: ["Backspace", "Delete"],
    display: "Del",
  },
  {
    id: "studio-undo",
    title: "Undo Action",
    description: "Revert the last editor operation",
    category: "Studio Editor",
    keys: ["Meta+Z", "Control+Z"],
    display: "⌘Z",
  },
  {
    id: "studio-redo",
    title: "Redo Action",
    description: "Re-apply the previously undone operation",
    category: "Studio Editor",
    keys: ["Meta+Shift+Z", "Control+Shift+Z"],
    display: "⌘⇧Z",
  },
  {
    id: "studio-mute",
    title: "Mute / Unmute Track",
    description: "Toggle audio output on selected track",
    category: "Studio Editor",
    keys: ["M"],
    display: "M",
  },
];

export interface UseGlobalShortcutsOptions {
  enabled?: boolean;
  sequenceTimeoutMs?: number;
}

/**
 * Robust keyboard shortcut manager supporting single keys, modifiers, and two-key sequences
 */
export function useGlobalShortcuts(
  shortcuts: ShortcutItem[],
  options: UseGlobalShortcutsOptions = {}
) {
  const { enabled = true, sequenceTimeoutMs = 1000 } = options;
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const pendingKeyRef = useRef<string | null>(null);
  const sequenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const clearSequence = useCallback(() => {
    pendingKeyRef.current = null;
    setPendingKey(null);
    if (sequenceTimerRef.current) {
      clearTimeout(sequenceTimerRef.current);
      sequenceTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Check if user is typing in an input
      const inInput = isTypingInInput(e.target);

      // Normalize key
      const key = e.key;
      const lowerKey = key.toLowerCase();
      const isMeta = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      // 2. Escape cancels any pending two-key sequence
      if (key === "Escape" && pendingKeyRef.current) {
        clearSequence();
        return;
      }

      // 3. Handle two-key sequences (e.g. G then H)
      if (pendingKeyRef.current && !inInput && !isMeta) {
        const fullSequence = [pendingKeyRef.current, lowerKey];
        clearSequence();

        const match = shortcutsRef.current.find((sc) => {
          if (sc.keys.length !== 2) return false;
          return (
            sc.keys[0].toLowerCase() === fullSequence[0] &&
            sc.keys[1].toLowerCase() === fullSequence[1]
          );
        });

        if (match) {
          e.preventDefault();
          match.action();
          return;
        }
      }

      // 4. Check for sequence initiator (e.g. pressing 'g')
      if (!inInput && !isMeta && lowerKey === "g") {
        const hasFollowUps = shortcutsRef.current.some(
          (sc) => sc.keys.length === 2 && sc.keys[0].toLowerCase() === "g"
        );
        if (hasFollowUps) {
          pendingKeyRef.current = "g";
          setPendingKey("g");
          if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
          sequenceTimerRef.current = setTimeout(() => {
            pendingKeyRef.current = null;
            setPendingKey(null);
          }, sequenceTimeoutMs);
          return;
        }
      }

      // 5. Single keys & Chorded keys
      for (const sc of shortcutsRef.current) {
        if (inInput && !sc.allowInInputs) continue;

        // Skip two-key sequences here
        if (sc.keys.length > 1) continue;

        const targetChord = sc.keys[0]; // e.g. "Meta+K", "Control+K", "[", "?", "Escape"
        const parts = targetChord.split("+").map((p) => p.trim().toLowerCase());

        const requiresMeta = parts.includes("meta") || parts.includes("control") || parts.includes("cmd");
        const requiresShift = parts.includes("shift");
        const baseKey = parts[parts.length - 1];

        // Check modifier requirements
        if (requiresMeta !== isMeta) continue;
        if (requiresShift && !isShift) continue;

        // Key match
        const matchesKey =
          baseKey === lowerKey ||
          (baseKey === "?" && (key === "?" || (isShift && key === "/"))) ||
          (baseKey === "escape" && key === "Escape") ||
          (baseKey === "[" && key === "[");

        if (matchesKey) {
          e.preventDefault();
          sc.action();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
    };
  }, [enabled, sequenceTimeoutMs, clearSequence]);

  return { pendingKey, clearSequence };
}
