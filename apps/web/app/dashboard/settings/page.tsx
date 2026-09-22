"use client";

import React from "react";
import { Key, Shield } from "lucide-react";

export default function SettingsPage() {
  const envVars = [
    { name: "CLERK_SECRET_KEY", category: "Auth", status: "pending" },
    { name: "CLOUDFLARE_R2_CREDENTIALS", category: "Storage", status: "pending" },
    { name: "UPSTASH_REDIS_URL", category: "Queue", status: "configured" },
    { name: "UPSTASH_REDIS_TOKEN", category: "Queue", status: "configured" },
    { name: "GEMINI_API_KEY", category: "AI", status: "pending" },
    { name: "PEXELS_API_KEY", category: "Assets", status: "pending" },
    { name: "ELEVENLABS_API_KEY", category: "TTS", status: "pending" },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-2">Configuration</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-neutral-500 mt-2">
          API endpoints, AI models, storage, and credentials.
        </p>
      </div>

      {/* Backend Config */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white tracking-tight">Backend</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950">
            <span className="text-xs text-neutral-500 uppercase tracking-wider">API Host</span>
            <div className="font-mono text-sm text-white mt-1">http://localhost:8000</div>
          </div>
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950">
            <span className="text-xs text-neutral-500 uppercase tracking-wider">Database</span>
            <div className="font-mono text-sm text-white mt-1">PostgreSQL / SQLModel</div>
          </div>
        </div>
      </div>

      {/* Environment Variables */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white tracking-tight">Environment Variables</h2>
          <div className="flex items-center gap-1.5 text-xs text-neutral-600">
            <Key className="w-3.5 h-3.5" />
            Configured via .env
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 overflow-hidden divide-y divide-neutral-800">
          {envVars.map(v => (
            <div
              key={v.name}
              className="flex items-center justify-between px-5 py-3.5 bg-neutral-950 hover:bg-neutral-900/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <code className="text-sm text-white font-mono">{v.name}</code>
                <span className="text-[10px] text-neutral-600 uppercase tracking-wider">{v.category}</span>
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-medium px-2.5 py-1 rounded border ${
                v.status === "configured"
                  ? "text-white border-neutral-700 bg-neutral-800"
                  : "text-neutral-600 border-neutral-800 bg-neutral-950"
              }`}>
                {v.status === "configured" ? "Set" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Security Note */}
      <div className="p-4 rounded-lg border border-neutral-800 bg-neutral-950 flex items-center gap-3 text-xs text-neutral-500">
        <Shield className="w-4 h-4 text-neutral-600 shrink-0" />
        <span>All secrets are stored server-side only. Never exposed to the browser.</span>
      </div>
    </div>
  );
}
