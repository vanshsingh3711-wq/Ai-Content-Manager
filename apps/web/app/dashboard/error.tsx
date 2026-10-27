"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

/**
 * Dashboard-level error boundary.
 * Next.js App Router renders this when an unhandled error bubbles up
 * from any dashboard page segment.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>

      {/* Message */}
      <div className="flex flex-col gap-2 max-w-md">
        <h2 className="text-xl font-semibold text-white">Something went wrong</h2>
        <p className="text-sm text-neutral-400 leading-relaxed">
          {error?.message || "An unexpected error occurred in the dashboard. Your work is safe — try refreshing this section."}
        </p>
        {error?.digest && (
          <p className="text-xs text-neutral-600 font-mono mt-1">Error ID: {error.digest}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-sm font-medium text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-sm font-medium text-yellow-400 border border-yellow-500/20 transition-colors"
        >
          <Home className="w-4 h-4" />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
