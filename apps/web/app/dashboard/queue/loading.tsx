import React from "react";

/**
 * Route-level Suspense skeleton for the Render Queue page.
 */
export default function QueueLoading() {
  return (
    <div className="flex-1 flex flex-col gap-6 p-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded-lg bg-white/[0.06]" />
        <div className="h-4 w-24 rounded-md bg-white/[0.04]" />
      </div>

      {/* Stats banner */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-white/[0.05]" />
        ))}
      </div>

      {/* Job cards */}
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-white/[0.05]" />
        ))}
      </div>
    </div>
  );
}
