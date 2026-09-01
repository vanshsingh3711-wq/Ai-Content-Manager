"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Film,
  Layers,
  Share2,
  Sparkles,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Server,
  Database,
  Cpu,
  HardDrive,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState({
    totalUsers: 1,
    totalJobs: 0,
    apiStatus: "checking",
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function fetchStats() {
    setIsRefreshing(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const [healthRes, statsRes] = await Promise.allSettled([
        fetch(`${apiUrl}/health`),
        fetch(`${apiUrl}/api/v1/system/stats`),
      ]);

      let apiOnline = false;
      if (healthRes.status === "fulfilled" && healthRes.value.ok) {
        apiOnline = true;
      }

      let totalUsers = 1;
      let totalJobs = 0;
      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        const data = await statsRes.value.json();
        totalUsers = data.total_users || 1;
        totalJobs = data.total_video_jobs || 0;
      }

      setStats({
        totalUsers,
        totalJobs,
        apiStatus: apiOnline ? "online" : "offline",
      });
    } catch {
      setStats((prev) => ({ ...prev, apiStatus: "offline" }));
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-[#0e1322] to-[#090a0f] p-6 md:p-8 backdrop-blur-xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Phase 1 Architecture Active</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              AI Video Pipeline & Control Center
            </h1>
            <p className="text-sm md:text-base text-slate-400 leading-relaxed">
              Thin-client Next.js control plane connected to FastAPI asynchronous media worker backend with PostgreSQL state machine.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStats}
              disabled={isRefreshing}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 inline-flex items-center gap-2 transition-all"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
              Sync Status
            </button>
            <Link
              href="/dashboard/videos"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 inline-flex items-center gap-1.5 transition-all"
            >
              <span>Upload Video</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <div className="p-5 rounded-2xl bg-[#0d1017] border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Videos</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{stats.totalJobs}</div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <span className="text-indigo-400 font-medium">Ready for ingest</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d1017] border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active In Queue</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">0</div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Worker standby</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d1017] border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Connected Channels</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">3 Supported</div>
          <div className="text-xs text-emerald-400 font-medium">YouTube, IG, LinkedIn</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d1017] border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">System Health</span>
            <div
              className={cn(
                "p-2 rounded-xl border",
                stats.apiStatus === "online"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              )}
            >
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight capitalize">
            {stats.apiStatus}
          </div>
          <div className="text-xs text-slate-400">FastAPI Port 8000</div>
        </div>
      </div>

      {/* Architecture & Pipeline Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* State Machine Status */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0d1017] border border-slate-800/80 space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-white">Pipeline State Machine</h2>
              <p className="text-xs text-slate-400">
                Deterministic lifecycle states mapped to Celery & faster-whisper timestamps
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              7 Sequential States
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              { label: "1. QUEUED", desc: "API -> Redis queue" },
              { label: "2. DOWNLOADING", desc: "Presigned R2 ingest" },
              { label: "3. TRANSCRIBING", desc: "faster-whisper int8" },
              { label: "4. AI_DIRECTING", desc: "Gemini 2.5 Flash" },
              { label: "5. RENDERING", desc: "FFmpeg filter_complex" },
              { label: "6. COMPLETED", desc: "R2 Export & Social ping" },
              { label: "7. FAILED", desc: "Error logs & retry" },
            ].map((st, i) => (
              <div
                key={st.label}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1"
              >
                <div className="text-xs font-semibold text-indigo-300">{st.label}</div>
                <div className="text-[11px] text-slate-400 leading-tight">{st.desc}</div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>SQLModel ORM schema compiled and synced with PostgreSQL</span>
            </div>
            <Link
              href="/dashboard/queue"
              className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
            >
              <span>View Queue</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Infrastructure Nodes Card */}
        <div className="p-6 rounded-2xl bg-[#0d1017] border border-slate-800/80 space-y-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">System Architecture</h2>
            <p className="text-xs text-slate-400 mt-1">Active nodes and microservice planes</p>

            <div className="mt-5 space-y-3.5">
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800/60">
                <span className="flex items-center gap-2 text-slate-300">
                  <Server className="w-4 h-4 text-indigo-400" />
                  Frontend Web (Next.js 15)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Port 3000
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800/60">
                <span className="flex items-center gap-2 text-slate-300">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  Backend Control API (FastAPI)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Port 8000
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800/60">
                <span className="flex items-center gap-2 text-slate-300">
                  <Database className="w-4 h-4 text-cyan-400" />
                  Database (PostgreSQL / SQLModel)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Ready
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  Object Storage (Cloudflare R2)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">
                  Phase 2 Target
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200">
            Phase 1 setup complete: Workspace, Next.js, FastAPI, and Database models are wired and ready.
          </div>
        </div>
      </div>
    </div>
  );
}
