"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Film,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Scissors,
  Share2,
  ArrowRight,
} from "lucide-react";
import { Badge, Tabs } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface ActivityItem {
  id: string;
  type: "render_done" | "directing" | "draft" | "publish" | "error";
  title: string;
  subtitle: string;
  timestamp: string;
  actionUrl?: string;
}

export function ActivityFeed({
  items,
  className,
}: {
  items: ActivityItem[];
  className?: string;
}) {
  const [filter, setFilter] = useState<string>("all");

  const filterTabs = [
    { id: "all", label: "All Activity" },
    { id: "renders", label: "Renders" },
    { id: "drafts", label: "Drafts" },
  ];

  const filteredItems = items.filter((item) => {
    if (filter === "renders") {
      return item.type === "render_done" || item.type === "directing";
    }
    if (filter === "drafts") {
      return item.type === "draft";
    }
    return true;
  });

  const iconMap = {
    render_done: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    directing: <Sparkles className="w-4 h-4 text-violet-400" />,
    draft: <Scissors className="w-4 h-4 text-amber-400" />,
    publish: <Share2 className="w-4 h-4 text-cyan-400" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400" />,
  };

  const badgeMap = {
    render_done: <Badge variant="done">Completed</Badge>,
    directing: <Badge variant="processing">AI Directed</Badge>,
    draft: <Badge variant="draft">Draft Saved</Badge>,
    publish: <Badge variant="info">Published</Badge>,
    error: <Badge variant="error">Failed</Badge>,
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl p-6 sm:p-7 overflow-hidden",
        "glass-card-premium border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        className
      )}
    >
      {/* Top rim highlight */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Recent Pipeline Activity
          </h3>
          <p className="text-xs text-white/50 mt-1">
            Audit feed of video generation, edits, and automated exports
          </p>
        </div>

        <Tabs
          tabs={filterTabs}
          activeTab={filter}
          onChange={setFilter}
          size="sm"
        />
      </div>

      <div className="divide-y divide-white/[0.05]">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-white/40">
            No activities matching this filter.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="py-3.5 flex items-center justify-between gap-4 group hover:bg-white/[0.02] px-3 -mx-3 rounded-xl transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 shadow-inner group-hover:border-white/[0.16] transition-colors">
                  {iconMap[item.type]}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </div>
                  <div className="text-xs text-white/40 truncate mt-0.5">
                    {item.subtitle}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {badgeMap[item.type]}
                <span className="text-[11px] font-mono text-white/40 whitespace-nowrap hidden sm:inline">
                  {item.timestamp}
                </span>
                {item.actionUrl && (
                  <Link
                    href={item.actionUrl}
                    className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
