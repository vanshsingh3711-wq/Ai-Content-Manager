"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Activity,
  Clock,
  RefreshCw,
  Play,
  RotateCcw,
  Terminal,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface QueueJob {
  id: string;
  title: string;
  status: "QUEUED" | "DOWNLOADING" | "TRANSCRIBING" | "AI_DIRECTING" | "RENDERING" | "PUBLISHING" | "COMPLETED" | "FAILED";
  source_url: string;
  rendered_url?: string | null;
  edit_decision_list?: string | null;
  error_log?: string | null;
  created_at: string;
  updated_at: string;
}

export default function QueuePage() {
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchQueueJobs() {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${apiUrl}/api/v1/jobs`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error("Failed to fetch queue:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDispatch(jobId: string) {
    setActionLoading(jobId);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${apiUrl}/api/v1/jobs/${jobId}/dispatch`, { method: "POST" });
      if (res.ok) fetchQueueJobs();
    } catch (err) {
      console.error("Dispatch error:", err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRetry(jobId: string) {
    setActionLoading(jobId);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${apiUrl}/api/v1/jobs/${jobId}/retry`, { method: "POST" });
      if (res.ok) fetchQueueJobs();
    } catch (err) {
      console.error("Retry error:", err);
    } finally {
      setActionLoading(null);
    }
  }

  useEffect(() => {
    fetchQueueJobs();
    const interval = setInterval(fetchQueueJobs, 8000);
    return () => clearInterval(interval);
  }, []);

  const pendingCount = jobs.filter(j => j.status === "QUEUED").length;
  const inProgressCount = jobs.filter(j =>
    ["DOWNLOADING", "TRANSCRIBING", "AI_DIRECTING", "RENDERING", "PUBLISHING"].includes(j.status)
  ).length;
  const completedCount = jobs.filter(j => j.status === "COMPLETED").length;
  const failedCount = jobs.filter(j => j.status === "FAILED").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-2">Pipeline</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Queue & Jobs</h1>
        </div>
        <button
          onClick={fetchQueueJobs}
          className="px-4 py-2.5 rounded-lg text-sm font-medium bg-neutral-950 hover:bg-neutral-900 text-neutral-400 border border-neutral-800 inline-flex items-center gap-2 transition-all"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-950 space-y-2">
          <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Queued</span>
          <div className="text-3xl font-semibold text-white tabular-nums">{pendingCount}</div>
        </div>
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-950 space-y-2">
          <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">In Progress</span>
          <div className="text-3xl font-semibold text-white tabular-nums">{inProgressCount}</div>
        </div>
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-950 space-y-2">
          <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Completed</span>
          <div className="text-3xl font-semibold text-white tabular-nums">{completedCount}</div>
        </div>
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-950 space-y-2">
          <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Failed</span>
          <div className="text-3xl font-semibold text-white tabular-nums">{failedCount}</div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="rounded-xl border border-neutral-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
          <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Execution Stream</span>
          <span className="text-[10px] text-neutral-600 font-mono">export-jobs</span>
        </div>

        {loading && jobs.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
            <span className="text-xs text-neutral-600">Loading queue...</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <Layers className="w-7 h-7 text-neutral-700" />
            <h4 className="text-sm font-medium text-white">Queue is empty</h4>
            <p className="text-xs text-neutral-600">Upload a video to dispatch your first pipeline job.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {jobs.map(job => {
              const isExpanded = expandedLogId === job.id;
              const isActionRunning = actionLoading === job.id;
              return (
                <div key={job.id} className="p-5 space-y-3 hover:bg-neutral-900/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-white">{job.title}</span>
                        <span className={cn(
                          "inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider",
                          job.status === "COMPLETED" ? "text-white" :
                          job.status === "FAILED" ? "text-neutral-600" :
                          "text-neutral-400"
                        )}>
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            job.status === "COMPLETED" ? "bg-white" :
                            job.status === "FAILED" ? "bg-neutral-700" :
                            job.status === "QUEUED" ? "bg-neutral-500" :
                            "bg-neutral-400 animate-pulse"
                          )} />
                          {job.status.toLowerCase().replace("_", " ")}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-600 font-mono">
                        {job.id} · {formatDate(job.created_at)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {job.status === "QUEUED" && (
                        <button
                          onClick={() => handleDispatch(job.id)}
                          disabled={isActionRunning}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-black hover:bg-neutral-200 inline-flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          {isActionRunning ? "Dispatching..." : "Dispatch"}
                        </button>
                      )}

                      {job.status === "FAILED" && (
                        <button
                          onClick={() => handleRetry(job.id)}
                          disabled={isActionRunning}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 text-white hover:bg-neutral-700 inline-flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          <RotateCcw className="w-3 h-3" />
                          {isActionRunning ? "Retrying..." : "Retry"}
                        </button>
                      )}

                      {job.error_log && (
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : job.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 inline-flex items-center gap-1 transition-colors"
                        >
                          <Terminal className="w-3 h-3" />
                          Log
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && job.error_log && (
                    <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed">
                      {job.error_log}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
