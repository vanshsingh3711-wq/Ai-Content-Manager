import React from "react";

/**
 * Route-level Suspense skeleton for the Command Center dashboard.
 * Shown by Next.js App Router while the page segment is loading.
 */
export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col gap-6 p-6 animate-pulse">
      {/* Greeting skeleton */}
      <div className="h-8 w-64 rounded-lg bg-white/[0.06]" />
      <div className="h-4 w-48 rounded-md bg-white/[0.04]" />

      {/* Quick-action cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-white/[0.05]" />
        ))}
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Wide left column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="h-6 w-40 rounded bg-white/[0.06]" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-white/[0.05]" />
          ))}
        </div>
        {/* Narrow right column */}
        <div className="flex flex-col gap-4">
          <div className="h-6 w-32 rounded bg-white/[0.06]" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-white/[0.05]" />
          ))}
        </div>
      </div>
    </div>
  );
}
