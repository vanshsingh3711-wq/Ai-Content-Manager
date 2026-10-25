"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Scissors,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoUploadModal } from "@/components/VideoUploadModal";

/* ── Navigation items ───────────────────────────────── */
const navigation = [
  { name: "Overview",       href: "/dashboard",          icon: LayoutDashboard, exact: true  },
  { name: "Studio Editor",  href: "/dashboard/editor",   icon: Scissors,        exact: false },
  { name: "Videos",         href: "/dashboard/videos",   icon: Film,            exact: false },
  { name: "Queue & Jobs",   href: "/dashboard/queue",    icon: Layers,          exact: false },
  { name: "Socials",        href: "/dashboard/socials",  icon: Share2,          exact: false },
  { name: "Settings",       href: "/dashboard/settings", icon: SettingsIcon,    exact: false },
];

/* ── Breadcrumb label helper ─────────────────────────── */
function getBreadcrumb(pathname: string): string {
  const segment = pathname.replace("/dashboard", "").replace(/^\//, "");
  if (!segment) return "Overview";
  if (segment.startsWith("editor/")) return "Studio Editor";
  const map: Record<string, string> = {
    editor:   "Studio Editor",
    videos:   "Videos",
    queue:    "Queue & Jobs",
    socials:  "Socials",
    settings: "Settings",
  };
  return map[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

/* ══════════════════════════════════════════════════════
   SIDEBAR NAV ITEM
   Works in both collapsed (icon-only) and expanded mode.
══════════════════════════════════════════════════════ */
function SidebarItem({
  item,
  isActive,
  isExpanded,
  onClick,
}: {
  item: (typeof navigation)[number];
  isActive: boolean;
  isExpanded: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={!isExpanded ? item.name : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-lg transition-all duration-150 group",
        "mx-1.5 px-[7px] py-2",
        isActive
          ? "sidebar-item-active text-white"
          : "text-white/35 hover:text-white/80"
      )}
    >
      {/* Icon */}
      <span className={cn("sidebar-icon shrink-0", isActive && "bg-violet-700/20 text-white")}>
        <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
      </span>

      {/* Label — only visible when sidebar is expanded */}
      <span
        className={cn(
          "text-sm font-medium whitespace-nowrap transition-all duration-200 overflow-hidden",
          isExpanded ? "opacity-100 max-w-[140px]" : "opacity-0 max-w-0 pointer-events-none"
        )}
      >
        {item.name}
      </span>
    </Link>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN LAYOUT
══════════════════════════════════════════════════════ */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen,  setMobileMenuOpen]  = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [sidebarHovered,  setSidebarHovered]  = useState(false);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* — API health poll ─────────────────────────────── */
  useEffect(() => {
    async function checkApi() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/health`, { method: "GET" });
        setApiStatus(res.ok ? "online" : "offline");
      } catch {
        setApiStatus("offline");
      }
    }
    checkApi();
    const interval = setInterval(checkApi, 15_000);
    return () => clearInterval(interval);
  }, []);

  /* — Sidebar hover with slight delay to prevent flicker */
  function handleSidebarEnter() {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setSidebarHovered(true);
  }
  function handleSidebarLeave() {
    hoverTimeout.current = setTimeout(() => setSidebarHovered(false), 120);
  }

  /* — Full-screen editor bypass (no sidebar wrapper) */
  const isEditorWorkspace =
    pathname.startsWith("/dashboard/editor/") && pathname !== "/dashboard/editor";
  if (isEditorWorkspace) return <>{children}</>;

  const breadcrumb = getBreadcrumb(pathname);
  const isExpanded = sidebarHovered;

  return (
    <div className="min-h-screen flex bg-[--bg-base] text-[--foreground]">

      {/* ── Mobile backdrop ─────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ════════════════════════════════════════════
          SIDEBAR
      ════════════════════════════════════════════ */}
      <aside
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
        className={cn(
          /* Base */
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col",
          "border-r border-white/[0.05]",
          "glass-panel",
          /* Desktop: collapsed by default, expands on hover */
          "lg:translate-x-0",
          isExpanded
            ? "lg:w-[var(--sidebar-expanded-width)]"
            : "lg:w-[var(--sidebar-collapsed-width)]",
          "transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden",
          /* Mobile: slide in/out */
          mobileMenuOpen ? "translate-x-0 w-[var(--sidebar-expanded-width)]" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ willChange: "width" }}
      >
        {/* ── Logo / Brand ──────────────────────────── */}
        <div className="h-[48px] flex items-center px-[6px] border-b border-white/[0.05] shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-[7px] py-2 group transition-colors hover:bg-white/[0.04] w-full"
          >
            {/* Logo mark */}
            <div className="shrink-0 h-[30px] w-[30px] rounded-lg bg-violet-600 flex items-center justify-center group-hover:bg-violet-500 transition-colors shadow-[0_0_12px_rgba(124,58,237,0.45)]">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            {/* Brand text — visible only when expanded */}
            <div
              className={cn(
                "flex flex-col transition-all duration-200 overflow-hidden",
                isExpanded || mobileMenuOpen ? "opacity-100 max-w-[160px]" : "opacity-0 max-w-0 pointer-events-none"
              )}
            >
              <span className="text-[13px] font-semibold tracking-tight text-white whitespace-nowrap">
                AI Director
              </span>
              <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/30 whitespace-nowrap">
                Content Engine
              </span>
            </div>
          </Link>

          {/* Mobile close */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="ml-auto mr-1 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] lg:hidden transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Nav links ─────────────────────────────── */}
        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
          {/* Label — only in expanded state */}
          <div
            className={cn(
              "px-3 pb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/20",
              "transition-all duration-200 overflow-hidden whitespace-nowrap",
              isExpanded || mobileMenuOpen ? "opacity-100 h-auto" : "opacity-0 h-0"
            )}
          >
            Workspace
          </div>

          <div className="space-y-0.5">
            {navigation.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <SidebarItem
                  key={item.href}
                  item={item}
                  isActive={isActive}
                  isExpanded={isExpanded || mobileMenuOpen}
                  onClick={() => setMobileMenuOpen(false)}
                />
              );
            })}
          </div>
        </nav>

        {/* ── Sidebar footer — API status ───────────── */}
        <div className="shrink-0 px-[6px] py-3 border-t border-white/[0.05]">
          {/* Condensed version (always visible) */}
          <div className="flex items-center gap-3 rounded-lg px-[7px] py-2">
            {/* Status dot */}
            <div className="shrink-0 flex items-center justify-center w-[30px] h-[30px]">
              <span
                className={cn(
                  "status-dot",
                  apiStatus === "online"   ? "status-dot-online animate-pulse" :
                  apiStatus === "offline"  ? "status-dot-offline" :
                  "status-dot-queued animate-pulse"
                )}
              />
            </div>

            {/* Status label — visible only when expanded */}
            <div
              className={cn(
                "flex flex-col transition-all duration-200 overflow-hidden",
                isExpanded || mobileMenuOpen ? "opacity-100 max-w-[160px]" : "opacity-0 max-w-0 pointer-events-none"
              )}
            >
              <span className="text-[11px] font-medium text-white/70 whitespace-nowrap">
                Backend API
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium whitespace-nowrap",
                  apiStatus === "online"  ? "text-emerald-400" :
                  apiStatus === "offline" ? "text-white/25" :
                  "text-white/40"
                )}
              >
                {apiStatus === "online" ? "Connected" : apiStatus === "offline" ? "Offline" : "Checking…"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════════════════
          MAIN CONTENT AREA
      ════════════════════════════════════════════ */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0",
          /* Push content right by collapsed sidebar width on desktop */
          "lg:pl-[var(--sidebar-collapsed-width)]",
          "transition-[padding-left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        )}
      >
        {/* ── Top navigation bar ──────────────────── */}
        <header className={cn(
          "sticky top-0 z-30 h-[48px] shrink-0",
          "flex items-center justify-between",
          "px-4 sm:px-6",
          "border-b border-white/[0.05]",
          "glass-panel",
        )}>
          {/* Left: hamburger (mobile) + breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] lg:hidden transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1.5 text-sm">
              <span className="text-white/25 font-medium hidden sm:block">Workspace</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/15 hidden sm:block" strokeWidth={2.5} />
              <span className="font-semibold text-white tracking-tight">
                {breadcrumb}
              </span>
            </nav>
          </div>

          {/* Right: Create button + avatar */}
          <div className="flex items-center gap-2.5">
            {/* "New Project" CTA */}
            <button
              onClick={() => setUploadModalOpen(true)}
              className={cn(
                "inline-flex items-center gap-1.5",
                "h-8 px-3.5",
                "text-[13px] font-semibold text-white",
                "rounded-lg",
                "bg-violet-600 hover:bg-violet-500",
                "shadow-[0_0_16px_rgba(124,58,237,0.35)] hover:shadow-[0_0_22px_rgba(124,58,237,0.55)]",
                "transition-all duration-150",
                "focus-ring"
              )}
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span className="hidden sm:inline">New Project</span>
            </button>

            {/* Divider */}
            <div className="h-5 w-px bg-white/[0.08] hidden sm:block" />

            {/* User avatar */}
            <div className={cn(
              "h-8 w-8 rounded-full",
              "flex items-center justify-center",
              "text-xs font-bold text-white",
              "bg-gradient-to-br from-violet-500 to-cyan-500",
              "ring-1 ring-white/10",
              "cursor-pointer hover:ring-violet-500/50 transition-all duration-150",
            )}>
              V
            </div>
          </div>
        </header>

        {/* ── Page content ────────────────────────── */}
        <main className="flex-1 p-5 md:p-7 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in-up">
          {children}
        </main>
      </div>

      {/* ── Global upload modal ─────────────────── */}
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
