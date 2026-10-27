import React from "react";

/**
 * Route-level Suspense skeleton for the Video Library page.
 */
export default function VideosLoading() {
  return (
    <div className="flex-1 flex flex-col gap-6 p-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded-lg bg-white/[0.06]" />
        <div className="h-9 w-32 rounded-lg bg-white/[0.08]" />
      </div>

      {/* Filter bar */}
      <div className="flex gap-3">
        <div className="h-9 flex-1 max-w-xs rounded-lg bg-white/[0.05]" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-lg bg-white/[0.05]" />
        ))}
      </div>

      {/* Grid of video cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="aspect-[9/16] rounded-xl bg-white/[0.06]" />
            <div className="h-4 w-3/4 rounded bg-white/[0.05]" />
            <div className="h-3 w-1/2 rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}
