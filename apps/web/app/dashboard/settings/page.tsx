"use client";

import React from "react";
import { Settings as SettingsIcon, Key, Database, HardDrive, Cpu, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-400">
          Configure API endpoints, AI models, storage buckets, and credentials.
        </p>
      </div>

      <div className="space-y-4">
        {/* Environment & Backend Config */}
        <div className="p-6 rounded-2xl bg-[#0d1017] border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Backend Control Plane</h3>
              <p className="text-xs text-slate-400">FastAPI & PostgreSQL service connection</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-slate-400">API Host URL:</span>
              <div className="font-mono text-indigo-300 mt-0.5">http://localhost:8000</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-slate-400">Database Engine:</span>
              <div className="font-mono text-emerald-300 mt-0.5">PostgreSQL / SQLModel</div>
            </div>
          </div>
        </div>

        {/* AI & Storage Settings (Phases 2-4) */}
        <div className="p-6 rounded-2xl bg-[#0d1017] border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">AI Services & Storage Keys</h3>
              <p className="text-xs text-slate-400">Configured via root `.env` / environment variables</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { name: "CLERK_SECRET_KEY", phase: "Phase 2 (Auth)", status: "Pending" },
              { name: "CLOUDFLARE_R2_CREDENTIALS", phase: "Phase 2 (Storage)", status: "Pending" },
              { name: "UPSTASH_REDIS_URL", phase: "Phase 3 (Queue)", status: "Pending" },
              { name: "GEMINI_API_KEY", phase: "Phase 4 (AI Director)", status: "Pending" },
              { name: "PEXELS_API_KEY", phase: "Phase 5 (B-Roll Assembly)", status: "Pending" },
            ].map((k) => (
              <div
                key={k.name}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800/60"
              >
                <div className="font-mono text-slate-300">{k.name}</div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">{k.phase}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                    {k.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
