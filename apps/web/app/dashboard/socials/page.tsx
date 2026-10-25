"use client";

import React, { useState } from "react";
import { Plus, Shield, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.16 1.18 2.07 2.34 2.27.61.1 1.25.04 1.83-.16.91-.32 1.63-1.07 1.92-1.98.22-.64.27-1.32.26-2-.01-4.71 0-9.42 0-14.13z" />
    </svg>
  );
}

interface Platform {
  id: string;
  name: string;
  desc: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  connected: boolean;
  handle?: string;
  color: string;
  glowClass: string;
  bgIcon: string;
}

export default function SocialsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([
    {
      id: "youtube",
      name: "YouTube",
      desc: "Auto-publish Shorts & long-form videos with custom thumbnails, tags, and category indexing.",
      icon: YoutubeIcon,
      connected: true,
      handle: "@aidirector_channel",
      color: "text-red-500",
      glowClass: "hover:border-red-500/30 hover:shadow-[0_0_24px_rgba(239,68,68,0.12)]",
      bgIcon: "bg-red-500/10 text-red-500 border-red-500/20",
    },
    {
      id: "instagram",
      name: "Instagram",
      desc: "Direct Reels publishing with automated kinetic captions, cover image, and viral hashtag sets.",
      icon: InstagramIcon,
      connected: false,
      color: "text-pink-400",
      glowClass: "hover:border-pink-500/30 hover:shadow-[0_0_24px_rgba(236,72,153,0.12)]",
      bgIcon: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    },
    {
      id: "tiktok",
      name: "TikTok",
      desc: "Instant Short-form sync for trending audio tags, hook overlays, and scheduled peak posting.",
      icon: TikTokIcon,
      connected: false,
      color: "text-cyan-400",
      glowClass: "hover:border-cyan-500/30 hover:shadow-[0_0_24px_rgba(6,182,212,0.12)]",
      bgIcon: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      desc: "Post executive talking-head video clips with generated executive summaries and takeaways.",
      icon: LinkedinIcon,
      connected: false,
      color: "text-blue-400",
      glowClass: "hover:border-blue-500/30 hover:shadow-[0_0_24px_rgba(59,130,246,0.12)]",
      bgIcon: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
  ]);

  function toggleConnection(id: string) {
    setPlatforms((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              connected: !p.connected,
              handle: !p.connected ? `@${p.name.toLowerCase()}_creator` : undefined,
            }
          : p
      )
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Social Integrations</h1>
            <span className="tag border-violet-500/30 text-violet-300">AUTO-PUBLISH ENGINE</span>
          </div>
          <p className="text-xs text-white/40 mt-1">
            Connect your distribution channels for 1-click scheduled publishing across platforms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="tag border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
            <span className="status-dot status-dot-online" />
            OAuth 2.0 Gateway Active
          </span>
        </div>
      </div>

      {/* ── Platform Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {platforms.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.id}
              className={cn(
                "glass-card p-6 flex flex-col justify-between transition-all duration-200 border-white/[0.06] relative group",
                p.glowClass,
                p.connected && "border-white/[0.12] bg-white/[0.03]"
              )}
            >
              <div className="space-y-4">
                {/* Icon & Connection Pill */}
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105",
                      p.bgIcon
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {p.connected ? (
                    <span className="status-pill status-pill-done">
                      <span className="status-dot status-dot-online" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-white/35 px-2 py-0.5 rounded border border-white/[0.06] bg-white/[0.02]">
                      Disconnected
                    </span>
                  )}
                </div>

                {/* Details */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-white">{p.name}</h3>
                    {p.connected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  {p.handle && (
                    <span className="text-xs font-mono text-violet-300 block mt-0.5">
                      {p.handle}
                    </span>
                  )}
                  <p className="text-xs text-white/40 leading-relaxed mt-2">{p.desc}</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                <button
                  onClick={() => toggleConnection(p.id)}
                  className={cn(
                    "w-full py-2.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all",
                    p.connected
                      ? "btn-ghost text-white/60 hover:text-red-400 hover:border-red-500/30"
                      : "btn-primary shadow-[0_0_16px_rgba(124,58,237,0.25)]"
                  )}
                >
                  {p.connected ? (
                    <span>Disconnect Channel</span>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Connect {p.name}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Security / Compliance Callout ── */}
      <div className="glass-card p-5 border-white/[0.06] flex items-center gap-3.5 text-xs text-white/40 rounded-xl">
        <div className="w-8 h-8 rounded-lg bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
          <Shield className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <span className="font-medium text-white">Enterprise OAuth Security</span>
          <p className="text-white/40">
            Publishing tokens are AES-256 encrypted with automatic rolling key refreshes. We never
            request channel management or read permissions for your private messages.
          </p>
        </div>
      </div>
    </div>
  );
}
