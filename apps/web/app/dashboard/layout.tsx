"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  Layers,
  Share2,
  Settings as SettingsIcon,
  Plus,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Scissors,
  Zap,
  Sparkles,
  Search,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  Keyboard as KeyboardIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Button,
  Badge,
  CommandPalette,
  Tooltip,
  Kbd,
  KeyboardCheatSheetModal,
  useToast,
} from "@/components/ui";
import { useGlobalShortcuts } from "@/lib/shortcuts";
import { useJobStream } from "@/lib/realtime";
import { VideoUploadModal } from "@/components/VideoUploadModal";
import { OnboardingTourModal } from "@/components/dashboard";

/* ── Navigation items ───────────────────────────────── */
const navigation = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "Create Video",
    href: "/dashboard/create",
    icon: Sparkles,
    exact: false,
    highlight: true,
    badge: "New",
  },
  {
    name: "Studio Editor",
    href: "/dashboard/editor",
    icon: Scissors,
    exact: false,
  },
  {
    name: "Videos Library",
    href: "/dashboard/videos",
    icon: Film,
    exact: false,
  },
  {
    name: "Queue & Jobs",
    href: "/dashboard/queue",
    icon: Layers,
    exact: false,
    showJobCount: true,
  },
  {
    name: "Publish & Socials",
    href: "/dashboard/socials",
    icon: Share2,
    exact: false,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: SettingsIcon,
    exact: false,
  },
];

/* ── Breadcrumb label helper ─────────────────────────── */
function getBreadcrumb(pathname: string): string {
  const segment = pathname.replace("/dashboard", "").replace(/^\//, "");
  if (!segment) return "Overview";
  if (segment.startsWith("editor/")) return "Studio Editor";
  const map: Record<string, string> = {
    create: "Create Video",
    editor: "Studio Editor",
    videos: "Videos Library",
    queue: "Queue & Jobs",
    socials: "Publish & Socials",
    settings: "Settings",
  };
  return map[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [isPinned, setIsPinned] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [tourModalOpen, setTourModalOpen] = useState(false);
  const [activeJobsCount, setActiveJobsCount] = useState<number>(0);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">(
    "checking"
  );

  // Restore sidebar state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ai-director-sidebar-pinned");
      if (stored !== null) {
        setIsPinned(stored === "true");
      }
    } catch {}
  }, []);

  // Save sidebar state to localStorage
  const toggleSidebar = () => {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("ai-director-sidebar-pinned", String(next));
      } catch {}
      return next;
    });
  };

  // Global keyboard shortcuts (Cmd+K, Cmd+N, [, ?, G then H/C/L/Q/S)
  useGlobalShortcuts([
    {
      id: "toggle-command-palette",
      title: "Command Palette",
      category: "Global & Actions",
      keys: ["Meta+K", "Control+K"],
      display: "⌘K",
      action: () => setCommandPaletteOpen((prev) => !prev),
    },
    {
      id: "create-video",
      title: "New AI Video",
      category: "Global & Actions",
      keys: ["Meta+N", "Control+N"],
      display: "⌘N",
      action: () => router.push("/dashboard/create"),
    },
    {
      id: "toggle-sidebar",
      title: "Toggle Sidebar",
      category: "Global & Actions",
      keys: ["["],
      display: "[",
      action: toggleSidebar,
    },
    {
      id: "open-cheatsheet",
      title: "Keyboard Shortcuts",
      category: "Global & Actions",
      keys: ["?"],
      display: "?",
      action: () => setShortcutsModalOpen((prev) => !prev),
    },
    {
      id: "nav-home",
      title: "Go to Home",
      category: "Navigation",
      keys: ["g", "h"],
      display: "G then H",
      action: () => router.push("/dashboard"),
    },
    {
      id: "nav-create",
      title: "Go to Create",
      category: "Navigation",
      keys: ["g", "c"],
      display: "G then C",
      action: () => router.push("/dashboard/create"),
    },
    {
      id: "nav-library",
      title: "Go to Library",
      category: "Navigation",
      keys: ["g", "l"],
      display: "G then L",
      action: () => router.push("/dashboard/videos"),
    },
    {
      id: "nav-queue",
      title: "Go to Queue",
      category: "Navigation",
      keys: ["g", "q"],
      display: "G then Q",
      action: () => router.push("/dashboard/queue"),
    },
    {
      id: "nav-studio",
      title: "Go to Studio",
      category: "Navigation",
      keys: ["g", "s"],
      display: "G then S",
      action: () => router.push("/dashboard/editor"),
    },
  ]);

  const { success: showToastSuccess, error: showToastError } = useToast();

  // Real-time job stream via SSE (with auto-reconnect and polling fallback)
  const { activeCount: streamActiveCount, status: streamStatus } = useJobStream({
    onJobCompleted: (job) => {
      showToastSuccess(
        "Video Ready!",
        `"${job.title}" finished rendering and is ready in your Library.`
      );
    },
    onJobFailed: (job) => {
      showToastError(
        "Render Failed",
        `"${job.title}" encountered an error during pipeline execution.`
      );
    },
  });

  useEffect(() => {
    setActiveJobsCount(streamActiveCount);
  }, [streamActiveCount]);

  useEffect(() => {
    if (streamStatus === "connected") {
      setApiStatus("online");
    }
  }, [streamStatus]);

  // Initial API health check
  useEffect(() => {
    async function checkApi() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/health`, { method: "GET" });
        if (res.ok) setApiStatus("online");
      } catch {
        // Fallback is managed by useJobStream
      }
    }
    checkApi();
  }, []);

  // Full-screen editor bypass (standalone NLE timeline canvas)
  const isEditorWorkspace =
    pathname.startsWith("/dashboard/editor/") &&
    pathname !== "/dashboard/editor";
  if (isEditorWorkspace) return <>{children}</>;

  const breadcrumb = getBreadcrumb(pathname);

  return (
    <div className="min-h-screen flex bg-[--bg-base] text-[--foreground]">
      {/* ── Mobile backdrop ─────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ════════════════════════════════════════════
          SIDEBAR (Accessible, Pinned with labels)
      ════════════════════════════════════════════ */}
      <aside
        aria-label="Main Navigation"
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col",
          "border-r border-white/[0.06] glass-panel",
          "transition-[width] duration-200 ease-in-out",
          /* Desktop Width */
          isPinned ? "lg:w-[240px]" : "lg:w-[68px]",
          /* Mobile Drawer */
          mobileMenuOpen
            ? "translate-x-0 w-[260px]"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="h-[56px] flex items-center justify-between px-3 border-b border-white/[0.06] shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 group hover:bg-white/[0.04] transition-colors overflow-hidden"
          >
            <div className="shrink-0 h-[32px] w-[32px] rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-violet-600 p-[1.5px] shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              <div className="w-full h-full rounded-[10px] bg-[#07080c] flex items-center justify-center">
                <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
              </div>
            </div>

            <div
              className={cn(
                "flex flex-col transition-all duration-150 overflow-hidden",
                isPinned || mobileMenuOpen
                  ? "opacity-100 max-w-[150px]"
                  : "opacity-0 max-w-0 pointer-events-none"
              )}
            >
              <span className="text-[14px] font-bold tracking-tight text-white whitespace-nowrap">
                AI Director
              </span>
              <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/30 whitespace-nowrap">
                Content Engine
              </span>
            </div>
          </Link>

          {/* Desktop Pin / Collapse toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            title={isPinned ? "Collapse sidebar ([)" : "Pin sidebar ([)"}
            aria-label={isPinned ? "Collapse sidebar" : "Pin sidebar"}
          >
            {isPinned ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] lg:hidden transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Action: Create New Video CTA (Visible when pinned) */}
        {(isPinned || mobileMenuOpen) && (
          <div className="p-3 border-b border-white/[0.04]">
            <Link
              href="/dashboard/create"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center justify-center gap-2 w-full h-9 px-3 rounded-lg",
                "bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold text-xs",
                "shadow-[0_0_14px_rgba(124,58,237,0.35)] hover:shadow-[0_0_20px_rgba(124,58,237,0.55)]",
                "transition-all duration-150"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>New AI Video</span>
            </Link>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {navigation.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            const content = (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl transition-all duration-150 select-none group px-2.5 py-2",
                  isActive
                    ? "bg-violet-600/15 text-white border border-violet-500/30 shadow-[0_0_12px_rgba(124,58,237,0.2)]"
                    : "text-white/45 hover:text-white hover:bg-white/[0.04] border border-transparent",
                  item.highlight &&
                    !isActive &&
                    "text-cyan-300/80 hover:text-cyan-200"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    isActive
                      ? "bg-violet-600 text-white shadow-[0_0_10px_rgba(124,58,237,0.5)]"
                      : "bg-white/[0.03] text-white/50 group-hover:text-white group-hover:bg-white/[0.07]"
                  )}
                >
                  <Icon className="w-4 h-4" strokeWidth={isActive ? 2.2 : 1.8} />
                </div>

                {/* Text Label */}
                <div
                  className={cn(
                    "flex items-center justify-between flex-1 min-w-0 transition-all duration-150",
                    isPinned || mobileMenuOpen
                      ? "opacity-100"
                      : "opacity-0 w-0 pointer-events-none"
                  )}
                >
                  <span className="text-xs font-medium truncate">
                    {item.name}
                  </span>

                  {/* Badges */}
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                      {item.badge}
                    </span>
                  )}
                  {item.showJobCount && activeJobsCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 animate-pulse">
                      {activeJobsCount}
                    </span>
                  )}
                </div>
              </Link>
            );

            // In collapsed mode, wrap in accessible tooltip
            if (!isPinned && !mobileMenuOpen) {
              return (
                <Tooltip
                  key={item.href}
                  content={item.name}
                  side="right"
                  delayMs={50}
                >
                  {content}
                </Tooltip>
              );
            }

            return content;
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/[0.05] space-y-2 shrink-0">
          {/* Command Palette Trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className={cn(
              "flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors border border-white/[0.06]",
              !isPinned && !mobileMenuOpen && "justify-center px-0"
            )}
            title="Search commands (⌘K)"
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            {(isPinned || mobileMenuOpen) && (
              <div className="flex items-center justify-between flex-1">
                <span className="text-[11px]">Command Menu</span>
                <Kbd shortcut="Cmd+K" />
              </div>
            )}
          </button>

          {/* API Status */}
          <div
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-white/[0.02]",
              !isPinned && !mobileMenuOpen && "justify-center px-0"
            )}
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full shrink-0",
                apiStatus === "online"
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"
                  : apiStatus === "offline"
                  ? "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                  : "bg-amber-400 animate-pulse"
              )}
            />
            {(isPinned || mobileMenuOpen) && (
              <span className="text-[10px] font-mono text-white/40 truncate">
                API {apiStatus === "online" ? "Connected" : apiStatus}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════════════════
          MAIN CONTENT WRAPPER
      ════════════════════════════════════════════ */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 pb-16 lg:pb-0",
          /* Desktop padding matching sidebar width */
          isPinned ? "lg:pl-[240px]" : "lg:pl-[68px]",
          "transition-[padding-left] duration-200 ease-in-out"
        )}
      >
        {/* ── Top Navigation Bar ──────────────────── */}
        <header
          role="banner"
          className="sticky top-0 z-30 h-[56px] shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-white/[0.06] glass-panel"
        >
          {/* Left: Hamburger (mobile) + Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] lg:hidden transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <span className="text-white/30 font-medium hidden sm:inline">
                Workspace
              </span>
              <ChevronRight
                className="w-3.5 h-3.5 text-white/20 hidden sm:inline"
                strokeWidth={2}
              />
              <span className="font-semibold text-white tracking-tight">
                {breadcrumb}
              </span>
            </nav>
          </div>

          {/* Center: Command Palette Search Pill */}
          <div className="hidden md:flex items-center">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-white/40 hover:text-white/80 transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <Search className="w-3.5 h-3.5 text-white/40" />
              <span>Search actions, videos, or templates...</span>
              <Kbd shortcut="Cmd+K" />
            </button>
          </div>

          {/* Right: Quick Action, Notifications, User */}
          <div className="flex items-center gap-2.5">
            {/* Quick Action Button */}
            <Button
              size="sm"
              variant="primary"
              onClick={() => router.push("/dashboard/create")}
              leftIcon={<Plus className="w-3.5 h-3.5" strokeWidth={2.5} />}
              className="hidden sm:inline-flex"
            >
              Create
            </Button>

            {/* Keyboard Shortcuts Hint */}
            <Tooltip content="Keyboard shortcuts (?)" side="bottom">
              <button
                onClick={() => setShortcutsModalOpen(true)}
                className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                aria-label="Keyboard shortcuts"
              >
                <KeyboardIcon className="w-4 h-4" />
              </button>
            </Tooltip>

            {/* Notification Bell */}
            <Tooltip content="Recent notifications" side="bottom">
              <button
                onClick={() => router.push("/dashboard/queue")}
                className="relative p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {activeJobsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)] animate-pulse" />
                )}
              </button>
            </Tooltip>

            {/* User Avatar */}
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 ring-1 ring-white/10 select-none shadow-sm cursor-pointer"
              title="Vansh (Admin)"
            >
              V
            </div>
          </div>
        </header>

        {/* ── Main Landmark ────────────────────────── */}
        <main
          id="main-content"
          tabIndex={-1}
          role="main"
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto outline-none animate-in fade-in duration-200"
        >
          {children}
        </main>
      </div>

      {/* ════════════════════════════════════════════
          MOBILE BOTTOM NAVIGATION (Viewport < 1024px)
      ════════════════════════════════════════════ */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#090b10]/95 backdrop-blur-xl border-t border-white/[0.08] lg:hidden flex items-center justify-around px-2 shadow-2xl"
      >
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors",
            pathname === "/dashboard"
              ? "text-cyan-400"
              : "text-white/40 hover:text-white"
          )}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </Link>

        <Link
          href="/dashboard/videos"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors",
            pathname.startsWith("/dashboard/videos")
              ? "text-cyan-400"
              : "text-white/40 hover:text-white"
          )}
        >
          <Film className="w-4 h-4" />
          <span>Videos</span>
        </Link>

        {/* Floating elevated Create button */}
        <Link
          href="/dashboard/create"
          className="flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 to-violet-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] active:scale-95 transition-transform"
          aria-label="Create new video"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </Link>

        <Link
          href="/dashboard/queue"
          className={cn(
            "relative flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors",
            pathname.startsWith("/dashboard/queue")
              ? "text-cyan-400"
              : "text-white/40 hover:text-white"
          )}
        >
          <Layers className="w-4 h-4" />
          <span>Queue</span>
          {activeJobsCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </Link>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium text-white/40 hover:text-white transition-colors"
        >
          <Menu className="w-4 h-4" />
          <span>Menu</span>
        </button>
      </nav>

      {/* ── Command Palette (⌘K) ────────────────── */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
        onToggleSidebar={toggleSidebar}
        onOpenTour={() => setTourModalOpen(true)}
      />

      {/* ── Keyboard Shortcuts Cheat Sheet (?) ───── */}
      <KeyboardCheatSheetModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      {/* ── Onboarding Tour Modal ───────────────── */}
      <OnboardingTourModal
        isOpen={tourModalOpen}
        onClose={() => setTourModalOpen(false)}
      />

      {/* ── Global Upload Modal ─────────────────── */}
      <VideoUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          if (pathname === "/dashboard/videos" || pathname === "/dashboard") {
            window.location.reload();
          }
        }}
      />
    </div>
  );
}
