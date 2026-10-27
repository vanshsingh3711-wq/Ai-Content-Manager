import React from "react";

/**
 * Route-level Suspense skeleton for the Create Wizard page.
 */
export default function CreateLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8 animate-pulse">
      {/* Step indicator */}
      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full bg-white/[0.08] ${i === 0 ? "w-16" : "w-8"}`}
          />
        ))}
      </div>

      {/* Wizard card */}
      <div className="w-full max-w-2xl rounded-2xl bg-white/[0.04] border border-white/[0.06] p-8 flex flex-col gap-6">
        <div className="h-7 w-56 rounded-lg bg-white/[0.08]" />
        <div className="h-4 w-80 rounded bg-white/[0.05]" />

        {/* Option tiles */}
        <div className="grid grid-cols-2 gap-4 mt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-white/[0.06]" />
          ))}
        </div>

        <div className="flex justify-between mt-4">
          <div className="h-9 w-24 rounded-lg bg-white/[0.05]" />
          <div className="h-9 w-28 rounded-lg bg-white/[0.08]" />
        </div>
      </div>

      {/* Preview pane */}
      <div className="w-[120px] h-[213px] rounded-xl bg-white/[0.05]" />
    </div>
  );
}
