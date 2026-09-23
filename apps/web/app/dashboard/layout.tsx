"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  Layers,
  Share2,
  Settings as SettingsIcon,
  Activity,
  Plus,
  Menu,
  X,
  ChevronRight,
  Scissors,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoUploadModal } from "@/components/VideoUploadModal";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Studio Editor", href: "/dashboard/editor", icon: Scissors },
  { name: "Videos", href: "/dashboard/videos", icon: Film },
  { name: "Queue & Jobs", href: "/dashboard/queue", icon: Layers },
  { name: "Social Accounts", href: "/dashboard/socials", icon: Share2 },
  { name: "Settings", href: "/dashboard/settings", icon: SettingsIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    async function checkApi() {
      try {
        // Force Vercel rebuild to pick up new NEXT_PUBLIC_API_URL
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/health`, { method: "GET" });
        if (res.ok) {
          setApiStatus("online");
        } else {
          setApiStatus("offline");
        }
      } catch {
        setApiStatus("offline");
      }
    }
    checkApi();
    const interval = setInterval(checkApi, 15000);
    return () => clearInterval(interval);
  }, []);

  // Allow editor workspace to be 100% full-screen without dashboard sidebar wrapper
  const isEditorWorkspace = pathname.startsWith("/dashboard/editor/") && pathname !== "/dashboard/editor";
  if (isEditorWorkspace) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-black text-neutral-100">
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-60 border-r border-neutral-900 bg-black flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo / Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-900">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-black font-bold text-sm">AI</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-white">
                AI Director
              </span>
              <span className="text-[10px] text-neutral-600 uppercase tracking-widest">
                Content Engine
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 text-neutral-500 hover:text-white lg:hidden rounded-lg hover:bg-neutral-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-6 px-3 space-y-0.5 overflow-y-auto">
          <div className="px-3 pb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-600">
            Navigation
          </div>
          {navigation.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  isActive
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-950"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-white"
                      : "text-neutral-600 group-hover:text-neutral-300"
                  )}
                />
                <span className="flex-1">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* API Status Footer */}
        <div className="p-4 border-t border-neutral-900">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-600 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Backend
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-[11px] font-medium",
                apiStatus === "online"
                  ? "text-white"
                  : apiStatus === "offline"
                  ? "text-neutral-600"
                  : "text-neutral-500"
              )}
            >
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                apiStatus === "online" ? "bg-white" :
                apiStatus === "offline" ? "bg-neutral-700" :
                "bg-neutral-500 animate-pulse"
              )} />
              {apiStatus === "online" ? "Connected" : apiStatus === "offline" ? "Offline" : "Checking"}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-60">
        {/* Top Navbar */}
        <header className="h-14 border-b border-neutral-900 bg-black sticky top-0 z-30 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-neutral-500 hover:text-white rounded-lg hover:bg-neutral-900 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <span className="hidden sm:inline text-neutral-600">Workspace</span>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-700 hidden sm:inline" />
              <span className="font-medium text-white capitalize">
                {pathname.replace("/dashboard", "").replace("/", "") || "Overview"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-white text-black hover:bg-neutral-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Video</span>
            </button>

            <div className="h-8 w-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-semibold text-white">
              U
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Ingest Video Modal */}
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
