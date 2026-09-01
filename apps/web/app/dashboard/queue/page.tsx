"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Play,
  RotateCcw,
  Terminal,
  Cpu,
  ChevronDown,
  ChevronUp,
  Share2,
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
      console.log(`[FRONTEND: QUEUE] ⏳ Polling pipeline queue from: ${apiUrl}/api/v1/jobs...`);
      const res = await fetch(`${apiUrl}/api/v1/jobs`);
      if (res.ok) {
        const data = await res.json();
        console.log(`[FRONTEND: QUEUE] ✅ Active queue items (${data.length}):`, data);
        setJobs(data);
      }
    } catch (err) {
      console.error("[FRONTEND: QUEUE] ❌ Failed to fetch queue jobs:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDispatch(jobId: string) {
    setActionLoading(jobId);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    console.log(`[FRONTEND: QUEUE] ⚡ Manual dispatch triggered for Job: ${jobId}`);
    try {
      const res = await fetch(`${apiUrl}/api/v1/jobs/${jobId}/dispatch`, {
        method: "POST",
      });
      if (res.ok) {
        const result = await res.json();
        console.log(`[FRONTEND: QUEUE] ✅ Job dispatched to Celery worker:`, result);
        fetchQueueJobs();
      } else {
        console.warn(`[FRONTEND: QUEUE] ⚠️ Dispatch failed with status ${res.status}:`, await res.text());
      }
    } catch (err) {
      console.error("[FRONTEND: QUEUE] ❌ Failed to dispatch job:", err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRetry(jobId: string) {
    setActionLoading(jobId);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    console.log(`[FRONTEND: QUEUE] 🔁 Manual retry triggered for Job: ${jobId}`);
    try {
      const res = await fetch(`${apiUrl}/api/v1/jobs/${jobId}/retry`, {
        method: "POST",
      });
      if (res.ok) {
        const result = await res.json();
        console.log(`[FRONTEND: QUEUE] ✅ Job reset and re-dispatched:`, result);
        fetchQueueJobs();
      }
    } catch (err) {
      console.error("[FRONTEND: QUEUE] ❌ Failed to retry job:", err);
    } finally {
      setActionLoading(null);
    }
  }

  useEffect(() => {
    fetchQueueJobs();
    const interval = setInterval(fetchQueueJobs, 8000);
    return () => clearInterval(interval);
  }, []);

  const pendingCount = jobs.filter((j) => j.status === "QUEUED").length;
  const inProgressCount = jobs.filter((j) =>
    ["DOWNLOADING", "TRANSCRIBING", "AI_DIRECTING", "RENDERING", "PUBLISHING"].includes(j.status)
  ).length;
  const completedCount = jobs.filter((j) => j.status === "COMPLETED").length;
  const failedCount = jobs.filter((j) => j.status === "FAILED").length;

  const getStatusBadge = (status: QueueJob["status"]) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case "PUBLISHING":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 animate-pulse">
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            Publishing
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      case "QUEUED":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            Queued
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 animate-pulse">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Worker Queue & Jobs</h1>
          <p className="text-sm text-slate-400">
            Real-time pipeline tasks dispatched to Upstash Redis & Celery media processing nodes.
          </p>
        </div>

        <button
          onClick={fetchQueueJobs}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 inline-flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0d1017] border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Pending in Queue</div>
          <div className="text-2xl font-bold text-amber-400">{pendingCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#0d1017] border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">In Pipeline / Rendering</div>
          <div className="text-2xl font-bold text-indigo-400">{inProgressCount} Active</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#0d1017] border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Successfully Completed</div>
          <div className="text-2xl font-bold text-emerald-400">{completedCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#0d1017] border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Failed / Retriable</div>
          <div className="text-2xl font-bold text-rose-400">{failedCount}</div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="rounded-2xl bg-[#0d1017] border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Pipeline Execution Stream</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Queue: video_processing_queue
          </span>
        </div>

        {loading && jobs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
            <span className="text-xs">Loading queue state...</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Layers className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-medium text-white">Queue is empty</h4>
            <p className="text-xs text-slate-400">
              Upload a video from the Videos page to dispatch your first AI pipeline job.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {jobs.map((job) => {
              const isExpanded = expandedLogId === job.id;
              const isActionRunning = actionLoading === job.id;
              return (
                <div key={job.id} className="p-4 space-y-3 hover:bg-slate-900/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-bold text-white">{job.title}</span>
                        {getStatusBadge(job.status)}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        ID: {job.id} • Created: {formatDate(job.created_at)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {job.status === "QUEUED" && (
                        <button
                          onClick={() => handleDispatch(job.id)}
                          disabled={isActionRunning}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm inline-flex items-center gap-1.5 transition-all"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>{isActionRunning ? "Dispatching..." : "Dispatch"}</span>
                        </button>
                      )}

                      {job.status === "FAILED" && (
                        <button
                          onClick={() => handleRetry(job.id)}
                          disabled={isActionRunning}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-sm inline-flex items-center gap-1.5 transition-all"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{isActionRunning ? "Retrying..." : "Retry"}</span>
                        </button>
                      )}

                      {job.error_log && (
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : job.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300 hover:text-white border border-slate-700 inline-flex items-center gap-1"
                        >
                          <Terminal className="w-3 h-3 text-rose-400" />
                          <span>Traceback</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Traceback View */}
                  {isExpanded && job.error_log && (
                    <div className="p-3.5 rounded-xl bg-black/60 border border-rose-500/20 text-rose-300 font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed">
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
