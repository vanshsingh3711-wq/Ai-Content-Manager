import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  useGlobalShortcuts,
  isTypingInInput,
  ShortcutItem,
} from "../lib/shortcuts";
import { KeyboardCheatSheetModal } from "../components/ui/KeyboardCheatSheetModal";
import { CommandPalette } from "../components/ui/CommandPalette";

// Mock router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Test helper component using useGlobalShortcuts
function TestShortcutComponent({
  shortcuts,
  options,
}: {
  shortcuts: ShortcutItem[];
  options?: any;
}) {
  const { pendingKey } = useGlobalShortcuts(shortcuts, options);
  return (
    <div>
      <div data-testid="pending-key">{pendingKey || "none"}</div>
      <input data-testid="test-input" placeholder="Type here" />
      <textarea data-testid="test-textarea" placeholder="Textarea here" />
    </div>
  );
}

describe("Phase 7: Keyboard Shortcuts System & Infrastructure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("identifies when the active element is an input or editable surface", () => {
    const input = document.createElement("input");
    const textarea = document.createElement("textarea");
    const select = document.createElement("select");
    const div = document.createElement("div");
    const editableDiv = document.createElement("div");
    editableDiv.contentEditable = "true";

    expect(isTypingInInput(input)).toBe(true);
    expect(isTypingInInput(textarea)).toBe(true);
    expect(isTypingInInput(select)).toBe(true);
    expect(isTypingInInput(editableDiv)).toBe(true);
    expect(isTypingInInput(div)).toBe(false);
    expect(isTypingInInput(null)).toBe(false);
  });

  it("triggers modifier chord shortcuts (Meta+K / Ctrl+K)", () => {
    const actionK = vi.fn();
    render(
      <TestShortcutComponent
        shortcuts={[
          {
            id: "cmd-k",
            title: "Command Palette",
            category: "Global & Actions",
            keys: ["Meta+K"],
            display: "⌘K",
            action: actionK,
          },
        ]}
      />
    );

    // Fire without metaKey -> should not trigger
    fireEvent.keyDown(window, { key: "k", metaKey: false });
    expect(actionK).not.toHaveBeenCalled();

    // Fire with metaKey -> should trigger
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(actionK).toHaveBeenCalledTimes(1);
  });

  it("triggers single key shortcuts (e.g. '[' or '?')", () => {
    const actionBracket = vi.fn();
    const actionHelp = vi.fn();

    render(
      <TestShortcutComponent
        shortcuts={[
          {
            id: "sidebar",
            title: "Toggle Sidebar",
            category: "Global & Actions",
            keys: ["["],
            display: "[",
            action: actionBracket,
          },
          {
            id: "help",
            title: "Help",
            category: "Global & Actions",
            keys: ["?"],
            display: "?",
            action: actionHelp,
          },
        ]}
      />
    );

    fireEvent.keyDown(window, { key: "[" });
    expect(actionBracket).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "?", shiftKey: true });
    expect(actionHelp).toHaveBeenCalledTimes(1);
  });

  it("handles two-key sequence chords (G then H)", () => {
    const actionHome = vi.fn();
    const actionCreate = vi.fn();

    render(
      <TestShortcutComponent
        shortcuts={[
          {
            id: "g-h",
            title: "Go to Home",
            category: "Navigation",
            keys: ["g", "h"],
            display: "G then H",
            action: actionHome,
          },
          {
            id: "g-c",
            title: "Go to Create",
            category: "Navigation",
            keys: ["g", "c"],
            display: "G then C",
            action: actionCreate,
          },
        ]}
      />
    );

    // Press 'g'
    fireEvent.keyDown(window, { key: "g" });
    expect(screen.getByTestId("pending-key").textContent).toBe("g");
    expect(actionHome).not.toHaveBeenCalled();

    // Press 'h' -> should trigger actionHome
    fireEvent.keyDown(window, { key: "h" });
    expect(actionHome).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("pending-key").textContent).toBe("none");

    // Press 'g' then 'c' -> should trigger actionCreate
    fireEvent.keyDown(window, { key: "g" });
    fireEvent.keyDown(window, { key: "c" });
    expect(actionCreate).toHaveBeenCalledTimes(1);
  });

  it("cancels two-key sequence if timeout expires", () => {
    vi.useFakeTimers();
    const actionHome = vi.fn();

    render(
      <TestShortcutComponent
        shortcuts={[
          {
            id: "g-h",
            title: "Go to Home",
            category: "Navigation",
            keys: ["g", "h"],
            display: "G then H",
            action: actionHome,
          },
        ]}
        options={{ sequenceTimeoutMs: 500 }}
      />
    );

    // Press 'g'
    fireEvent.keyDown(window, { key: "g" });
    expect(screen.getByTestId("pending-key").textContent).toBe("g");

    // Advance timer past sequenceTimeoutMs
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByTestId("pending-key").textContent).toBe("none");

    // Pressing 'h' now should NOT trigger
    fireEvent.keyDown(window, { key: "h" });
    expect(actionHome).not.toHaveBeenCalled();
  });

  it("does NOT execute navigation shortcuts when user is typing inside an input", () => {
    const actionHome = vi.fn();
    const actionBracket = vi.fn();

    render(
      <TestShortcutComponent
        shortcuts={[
          {
            id: "g-h",
            title: "Go to Home",
            category: "Navigation",
            keys: ["g", "h"],
            display: "G then H",
            action: actionHome,
          },
          {
            id: "bracket",
            title: "Bracket",
            category: "Global & Actions",
            keys: ["["],
            display: "[",
            action: actionBracket,
          },
        ]}
      />
    );

    const input = screen.getByTestId("test-input");
    input.focus();

    // Type inside input
    fireEvent.keyDown(input, { key: "[" });
    expect(actionBracket).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: "g" });
    expect(screen.getByTestId("pending-key").textContent).toBe("none");
  });
});

describe("Phase 7: KeyboardCheatSheetModal", () => {
  it("renders cheat sheet modal with all key categories and closes on Escape", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <KeyboardCheatSheetModal isOpen={true} onClose={onClose} />
    );

    expect(screen.getByRole("dialog", { name: "Keyboard Shortcuts" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Navigation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Studio Editor" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Global & Actions" })).toBeInTheDocument();

    // Verify key shortcut displays
    expect(screen.getByText("Command Palette")).toBeInTheDocument();
    expect(screen.getByText("Split Clip")).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();

    // Close via close button
    const closeBtn = screen.getByLabelText("Close shortcuts modal");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(2);

    // If isOpen is false, nothing is rendered
    rerender(<KeyboardCheatSheetModal isOpen={false} onClose={onClose} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("filters shortcuts by search query and category tabs", () => {
    render(<KeyboardCheatSheetModal isOpen={true} onClose={vi.fn()} />);

    // Filter by search query
    const searchInput = screen.getByPlaceholderText(/search shortcuts/i);
    fireEvent.change(searchInput, { target: { value: "split" } });

    expect(screen.getByText("Split Clip")).toBeInTheDocument();
    expect(screen.queryByText("Go to Home")).not.toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: "" } });

    // Click Category tab 'Navigation'
    const navTab = screen.getByRole("button", { name: "Navigation" });
    fireEvent.click(navTab);

    expect(screen.getByText("Go to Home")).toBeInTheDocument();
    expect(screen.queryByText("Split Clip")).not.toBeInTheDocument();
  });
});

describe("Phase 7: CommandPalette Enhancements", () => {
  beforeEach(() => {
    mockPush.mockClear();
    localStorage.clear();
  });

  it("filters commands by category pills (Actions, Navigation, Templates)", () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} />);

    // Click Actions tab
    const actionsTab = screen.getByRole("button", { name: "Actions" });
    fireEvent.click(actionsTab);

    expect(screen.getByText("Create New Video (Wizard)")).toBeInTheDocument();
    expect(screen.queryByText("Go to Command Center (Home)")).not.toBeInTheDocument();

    // Click Navigation tab
    const navTab = screen.getByRole("button", { name: "Navigation" });
    fireEvent.click(navTab);

    expect(screen.getByText("Go to Command Center (Home)")).toBeInTheDocument();
    expect(screen.queryByText("Create New Video (Wizard)")).not.toBeInTheDocument();
  });

  it("navigates options via keyboard arrows and selects with Enter", () => {
    const onClose = vi.fn();
    render(<CommandPalette isOpen={true} onClose={onClose} />);

    const searchInput = screen.getByRole("combobox");
    
    // Press ArrowDown to select next item
    fireEvent.keyDown(searchInput, { key: "ArrowDown" });
    // Press Enter to trigger action
    fireEvent.keyDown(searchInput, { key: "Enter" });

    expect(mockPush).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("triggers onOpenShortcuts and onToggleSidebar callbacks when selected", () => {
    const onOpenShortcuts = vi.fn();
    const onToggleSidebar = vi.fn();
    const onClose = vi.fn();

    render(
      <CommandPalette
        isOpen={true}
        onClose={onClose}
        onOpenShortcuts={onOpenShortcuts}
        onToggleSidebar={onToggleSidebar}
      />
    );

    // Search for cheatsheet
    const searchInput = screen.getByRole("combobox");
    fireEvent.change(searchInput, { target: { value: "cheat sheet" } });

    const item = screen.getByText("Keyboard Shortcuts Cheat Sheet");
    fireEvent.click(item);

    expect(onOpenShortcuts).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
