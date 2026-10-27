import React from "react";
import Link from "next/link";
import { Film, Home, Search } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found — AI Director",
  description: "The page you are looking for does not exist.",
};

/**
 * Global 404 page for the AI Director application.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-[--bg-base] p-8 text-center">
      {/* Decorative glyph */}
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/20 flex items-center justify-center">
          <Film className="w-12 h-12 text-yellow-400/70" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 text-sm font-bold">
          ?
        </div>
      </div>

      {/* Copy */}
      <div className="flex flex-col gap-3 max-w-sm">
        <h1 className="text-5xl font-black text-white tracking-tight">404</h1>
        <p className="text-lg font-semibold text-white/80">Scene not found</p>
        <p className="text-sm text-neutral-500 leading-relaxed">
          This cut ended up on the floor. The page you&apos;re looking for
          doesn&apos;t exist or has been moved.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-semibold transition-colors"
        >
          <Home className="w-4 h-4" />
          Go to Dashboard
        </Link>
        <Link
          href="/dashboard/videos"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-sm font-medium transition-colors border border-white/[0.08]"
        >
          <Search className="w-4 h-4" />
          Browse Videos
        </Link>
      </div>
    </div>
  );
}
