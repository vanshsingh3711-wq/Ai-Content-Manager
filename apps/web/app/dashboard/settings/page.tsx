"use client";

import React, { useState } from "react";
import {
  Key,
  Shield,
  Server,
  Database,
  Cpu,
  HardDrive,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SettingsTab = "general" | "credentials" | "ai" | "storage";

interface EnvVar {
  name: string;
  category: "Auth" | "Storage" | "Queue" | "AI" | "Assets" | "TTS";
  status: "configured" | "pending";
  description: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("credentials");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const envVars: EnvVar[] = [
    {
      name: "CLERK_SECRET_KEY",
      category: "Auth",
      status: "configured",
      description: "User authentication, JWT verification, and session persistence",
    },
    {
      name: "CLOUDFLARE_R2_CREDENTIALS",
      category: "Storage",
      status: "configured",
      description: "S3-compatible raw video upload bucket and presigned URL minting",
    },
    {
      name: "UPSTASH_REDIS_URL",
      category: "Queue",
      status: "configured",
      description: "Fast async task queue broker and Celery job distributor",
    },
    {
      name: "UPSTASH_REDIS_TOKEN",
      category: "Queue",
      status: "configured",
      description: "Authentication token for Redis pub/sub queue",
    },
    {
      name: "DEEPSEEK_API_KEY",
      category: "AI",
      status: "configured",
      description: "DeepSeek R1 reasoning and V3 script generation engine",
    },
    {
      name: "GEMINI_API_KEY",
      category: "AI",
      status: "configured",
      description: "Multimodal video analysis and visual grounding prompts",
    },
    {
      name: "ELEVENLABS_API_KEY",
      category: "TTS",
      status: "configured",
      description: "Ultra-realistic text-to-speech voice generation with character clones",
    },
    {
      name: "PEXELS_API_KEY",
      category: "Assets",
      status: "pending",
      description: "Contextual B-roll footage lookup and high-res media clips",
    },
  ];

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div className="space-y-8 max-w-5xl animate-in fade-in duration-300">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">System Settings</h1>
            <span className="tag border-violet-500/30 text-violet-300">ENVIRONMENT & ENGINE</span>
          </div>
          <p className="text-xs text-white/40 mt-1">
            Configure backend endpoints, API provider credentials, AI director models, and storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="tag border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
            <span className="status-dot status-dot-online" />
            All Core Services Healthy
          </span>
        </div>
      </div>

      {/* ── Tabbed Navigation ── */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-1">
        {[
          { id: "credentials", label: "Credentials & Keys", icon: Key },
          { id: "general", label: "System & Architecture", icon: Server },
          { id: "ai", label: "AI Director Engine", icon: Sparkles },
          { id: "storage", label: "Storage & Rendering", icon: HardDrive },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-medium inline-flex items-center gap-2 transition-all",
                isActive
                  ? "bg-violet-600/15 text-violet-300 border border-violet-500/40 shadow-[0_0_12px_rgba(124,58,237,0.15)]"
                  : "text-white/40 hover:text-white hover:bg-white/[0.02]"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: CREDENTIALS & KEYS ── */}
      {activeTab === "credentials" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Environment API Keys</h2>
              <p className="text-xs text-white/40 mt-0.5">
                Managed securely via <code className="text-white/60 font-mono">.env.local</code> and worker secrets.
              </p>
            </div>
            <span className="tag border-white/[0.08] text-white/50">
              {envVars.filter((v) => v.status === "configured").length} of {envVars.length} Configured
            </span>
          </div>

          <div className="glass-card rounded-xl overflow-hidden divide-y divide-white/[0.04] border-white/[0.06]">
            {envVars.map((v) => (
              <div
                key={v.name}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="space-y-1 max-w-lg">
                  <div className="flex items-center gap-2.5">
                    <code className="text-xs font-mono font-semibold text-white">{v.name}</code>
                    <span className="tag text-[9px] border-white/[0.08] text-white/40">
                      {v.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/35 leading-relaxed">{v.description}</p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {v.status === "configured" ? (
                    <span className="status-pill status-pill-done">
                      <span className="status-dot status-dot-online" />
                      Configured
                    </span>
                  ) : (
                    <span className="status-pill status-pill-failed">
                      <span className="status-dot status-dot-failed" />
                      Missing
                    </span>
                  )}

                  <button
                    onClick={() => handleCopy(v.name, v.name)}
                    className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors"
                    title="Copy environment variable name"
                  >
                    {copiedKey === v.name ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: SYSTEM & ARCHITECTURE ── */}
      {activeTab === "general" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-white">System Architecture Endpoints</h2>
            <p className="text-xs text-white/40 mt-0.5">
              Live server routes, distributed queue brokers, and SQL relational state.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="glass-card p-5 space-y-2 border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-label text-white/50">FastAPI Backend</span>
                <Server className="w-4 h-4 text-violet-400" />
              </div>
              <div className="font-mono text-sm text-white font-semibold">http://localhost:8000</div>
              <p className="text-[11px] text-white/35">Uvicorn ASGI runner with async worker endpoints</p>
            </div>

            <div className="glass-card p-5 space-y-2 border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-label text-white/50">PostgreSQL Database</span>
                <Database className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="font-mono text-sm text-white font-semibold">Neon Serverless SQL</div>
              <p className="text-[11px] text-white/35">SQLModel ORM with auto-pooling and migrations</p>
            </div>

            <div className="glass-card p-5 space-y-2 border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-label text-white/50">Queue Broker</span>
                <Cpu className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="font-mono text-sm text-white font-semibold">Upstash Redis</div>
              <p className="text-[11px] text-white/35">Low-latency task publishing and event stream</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: AI DIRECTOR ENGINE ── */}
      {activeTab === "ai" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-white">AI Reasoning & Model Dispatch</h2>
            <p className="text-xs text-white/40 mt-0.5">
              Control the intelligent orchestration pipeline and model temperature.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="gradient-border gradient-border-violet p-6 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">DeepSeek Auto-Hybrid</span>
                <span className="tag border-violet-500/30 text-violet-300">ACTIVE DEFAULT</span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed">
                Automatically routes narrative scripts and structural planning through DeepSeek R1 for
                deep chain-of-thought, then switches to V3 for high-throughput footage metadata alignment.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <span className="text-[10px] font-mono text-white/30">Latency: ~2.4s</span>
                <span className="text-[10px] font-mono text-white/30">·</span>
                <span className="text-[10px] font-mono text-emerald-400">99.8% Success Rate</span>
              </div>
            </div>

            <div className="glass-card p-6 rounded-xl space-y-3 border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">WhisperX Transcription</span>
                <span className="tag border-white/[0.08] text-white/40">AUDIO PIPELINE</span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed">
                Phoneme-level forced audio alignment with VAD (Voice Activity Detection). Eliminates
                filler words and detects exact milliseconds for kinetic word-by-word subtitles.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <span className="text-[10px] font-mono text-white/30">Accuracy: 98.4%</span>
                <span className="text-[10px] font-mono text-white/30">·</span>
                <span className="text-[10px] font-mono text-cyan-400">Word-Level Timestamps</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: STORAGE & RENDERING ── */}
      {activeTab === "storage" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-white">Storage Buckets & Remotion Engine</h2>
            <p className="text-xs text-white/40 mt-0.5">
              Asset delivery network, media caching, and headless Chrome rendering cluster.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-5 space-y-3 border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-label text-white/50">Cloudflare R2 Bucket</span>
                <HardDrive className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="font-mono text-xs text-white font-medium">
                ai-content-manager-media
              </div>
              <p className="text-xs text-white/40">
                Zero-egress object storage for input videos, cut pieces, and rendered MP4 outputs.
              </p>
            </div>

            <div className="glass-card p-5 space-y-3 border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-label text-white/50">Remotion 4K Renderer</span>
                <Cpu className="w-4 h-4 text-violet-400" />
              </div>
              <div className="font-mono text-xs text-white font-medium">Chromium Headless GPU</div>
              <p className="text-xs text-white/40">
                Frame-by-frame canvas compositing supporting 60 FPS WebGL 3D avatars and Lottie.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Security Note ── */}
      <div className="glass-card p-4 rounded-xl border-white/[0.06] flex items-center gap-3 text-xs text-white/40">
        <Shield className="w-4 h-4 text-white/40 shrink-0" />
        <span>
          Secrets and keys are read exclusively server-side. No client bundle includes sensitive API tokens.
        </span>
      </div>
    </div>
  );
}
