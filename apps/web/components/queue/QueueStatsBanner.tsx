"use client";

import React from "react";
import { Loader2, CheckCircle2, AlertCircle, Clock, Cpu } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface QueueStatsBannerProps {
  activeCount: number;
  completedCount: number;
  failedCount: number;
  avgDurationSec?: number;
  className?: string;
}

export function QueueStatsBanner({
  activeCount,
  completedCount,
  failedCount,
  avgDurationSec = 34,
  className,
}: QueueStatsBannerProps) {
  const metrics = [
    {
      label: "Active Jobs",
      value: activeCount,
      icon: Loader2,
      color: "#67e8f9",
      spinning: activeCount > 0,
      glow: activeCount > 0 ? "gradient-border-cyan" : "",
    },
    {
      label: "Completed Renders",
      value: completedCount,
      icon: CheckCircle2,
      color: "#34d399",
      glow: "",
    },
    {
      label: "Failed Jobs",
      value: failedCount,
      icon: AlertCircle,
      color: failedCount > 0 ? "#f87171" : "#94a3b8",
      glow: failedCount > 0 ? "gradient-border-white" : "",
    },
    {
      label: "Average Render Speed",
      value: `~${avgDurationSec}s`,
      icon: Clock,
      color: "#a78bfa",
      glow: "",
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-3.5", className)}>
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <Card
            key={m.label}
            className={cn("p-4 space-y-2", m.glow)}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-caption text-white/50">{m.label}</span>
              <Icon
                className={cn(
                  "w-4 h-4 origin-center shrink-0",
                  m.spinning && "animate-spin"
                )}
                style={{ color: m.color }}
              />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
              {m.value}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
