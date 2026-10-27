"use client";

import React from "react";
import { Search, LayoutGrid, List, RefreshCw } from "lucide-react";
import { StatusFilter, VideoTypeFilter, ViewMode } from "./types";
import { cn } from "@/lib/utils";

export interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  typeFilter: VideoTypeFilter;
  onTypeFilterChange: (type: VideoTypeFilter) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  totalCount: number;
  className?: string;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  viewMode,
  onViewModeChange,
  onRefresh,
  isRefreshing = false,
  totalCount,
  className,
}: FilterBarProps) {
  const statusOptions: Array<{ id: StatusFilter; label: string }> = [
    { id: "ALL", label: "All Videos" },
    { id: "COMPLETED", label: "Completed" },
    { id: "PROCESSING", label: "Rendering" },
    { id: "FAILED", label: "Failed" },
  ];

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]",
        className
      )}
    >
      {/* Left: Search input */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`Search ${totalCount} videos by title...`}
          className="w-full h-9 pl-9 pr-3.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 transition-all"
        />
      </div>

      {/* Middle: Status Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
        {statusOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onStatusFilterChange(opt.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all select-none",
              statusFilter === opt.id
                ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]"
                : "bg-white/[0.03] text-white/50 hover:text-white hover:bg-white/[0.06]"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Right: Grid/List Toggle & Refresh */}
      <div className="flex items-center gap-2 self-end md:self-auto">
        <div className="flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "grid"
                ? "bg-white/[0.1] text-white"
                : "text-white/40 hover:text-white"
            )}
            title="Grid view"
            aria-label="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "list"
                ? "bg-white/[0.1] text-white"
                : "text-white/40 hover:text-white"
            )}
            title="List view"
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] transition-colors disabled:opacity-40"
          title="Refresh library"
          aria-label="Refresh library"
        >
          <RefreshCw
            className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-cyan-400")}
          />
        </button>
      </div>
    </div>
  );
}
