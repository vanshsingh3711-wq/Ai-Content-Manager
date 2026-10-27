/**
 * lib/perf.ts
 * ──────────────────────────────────────────────────────────
 * Lightweight Web Vitals + performance utilities for AI Director.
 *
 * Features:
 *  - reportWebVitals() — captures CLS, FCP, FID, INP, LCP, TTFB
 *  - useWebVitals()    — React hook that subscribes to live metrics
 *  - measureAsync()    — wraps async work in a PerformanceMark pair
 *  - getMemoryUsage()  — safe JS heap snapshot (Chrome-only)
 *  - prefetchRoute()   — declarative Next.js route prefetch helper
 */

"use client";

import { useEffect } from "react";

// ── Types ──────────────────────────────────────────────────

export type VitalName = "CLS" | "FCP" | "FID" | "INP" | "LCP" | "TTFB";

export interface WebVital {
  name: VitalName;
  /** Raw value (ms for time-based; unitless for CLS) */
  value: number;
  /** "good" | "needs-improvement" | "poor" based on Google thresholds */
  rating: "good" | "needs-improvement" | "poor";
  id: string;
  navigationType?: string;
}

export type VitalReporter = (vital: WebVital) => void;

// ── Thresholds (Google Core Web Vitals 2024) ───────────────

const THRESHOLDS: Record<VitalName, [number, number]> = {
  CLS:  [0.1,  0.25],
  FCP:  [1800, 3000],
  FID:  [100,  300],
  INP:  [200,  500],
  LCP:  [2500, 4000],
  TTFB: [800,  1800],
};

function getRating(name: VitalName, value: number): WebVital["rating"] {
  const [good, poor] = THRESHOLDS[name];
  if (value <= good) return "good";
  if (value <= poor) return "needs-improvement";
  return "poor";
}

// ── Core reporter ─────────────────────────────────────────

/**
 * Dynamically imports `web-vitals` (only in browser) and registers
 * a callback for all six core metrics.
 *
 * Usage in app/layout.tsx:
 *   import { reportWebVitals } from "@/lib/perf";
 *   reportWebVitals(console.log);
 */
export async function reportWebVitals(onReport: VitalReporter): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    // Use an indirect specifier so Vite's static analysis skips this import.
    // web-vitals is an optional peer dep — the app degrades gracefully without it.
    const webVitalsId = "web-vitals";
    const {
      onCLS,
      onFCP,
      onFID,
      onINP,
      onLCP,
      onTTFB,
    } = await import(/* @vite-ignore */ webVitalsId);

    const wrap =
      (name: VitalName) =>
      (metric: { value: number; id: string; navigationType?: string }) => {
        onReport({
          name,
          value: metric.value,
          rating: getRating(name, metric.value),
          id: metric.id,
          navigationType: metric.navigationType,
        });
      };

    onCLS(wrap("CLS"));
    onFCP(wrap("FCP"));
    onFID(wrap("FID"));
    onINP(wrap("INP"));
    onLCP(wrap("LCP"));
    onTTFB(wrap("TTFB"));
  } catch {
    // web-vitals not installed — degrade gracefully
    if (process.env.NODE_ENV === "development") {
      console.debug("[perf] web-vitals not available; skipping CWV monitoring.");
    }
  }
}

// ── React hook ────────────────────────────────────────────

/**
 * Subscribe to live Web Vitals in any client component.
 *
 * @example
 *   useWebVitals((vital) => {
 *     analytics.track("web_vital", vital);
 *   });
 */
export function useWebVitals(onReport: VitalReporter): void {
  useEffect(() => {
    reportWebVitals(onReport);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

// ── measureAsync ──────────────────────────────────────────

/**
 * Wraps an async function in PerformanceMark / PerformanceMeasure entries.
 * Visible in the DevTools Performance panel as a named measure.
 *
 * @example
 *   const data = await measureAsync("fetch-project", () => fetchProject(id));
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startMark = `${name}:start`;
  const endMark = `${name}:end`;

  if (typeof performance !== "undefined" && performance.mark) {
    performance.mark(startMark);
  }

  try {
    return await fn();
  } finally {
    if (typeof performance !== "undefined" && performance.mark) {
      performance.mark(endMark);
      try {
        performance.measure(name, startMark, endMark);
      } catch {
        // Some browsers restrict measure across navigation
      }
    }
  }
}

// ── Memory snapshot ───────────────────────────────────────

export interface MemorySnapshot {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  /** Heap usage as a percentage (0–100) */
  usagePercent: number;
}

/**
 * Returns a JS heap snapshot when running in Chrome/Chromium.
 * Returns `null` in Firefox/Safari (no `performance.memory` API).
 */
export function getMemoryUsage(): MemorySnapshot | null {
  if (typeof performance === "undefined") return null;

  // performance.memory is a Chrome-only non-standard API
  const mem = (performance as { memory?: MemorySnapshot }).memory;
  if (!mem) return null;

  return {
    usedJSHeapSize: mem.usedJSHeapSize,
    totalJSHeapSize: mem.totalJSHeapSize,
    jsHeapSizeLimit: mem.jsHeapSizeLimit,
    usagePercent: Math.round((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100),
  };
}

// ── Route prefetch helper ─────────────────────────────────

/**
 * Imperatively prefetch a Next.js route when the browser is idle.
 * Call on hover / focus of navigation links for instant transitions.
 *
 * @example
 *   onMouseEnter={() => prefetchRoute("/dashboard/videos")}
 */
export function prefetchRoute(href: string): void {
  if (typeof window === "undefined") return;

  const prefetch = () => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = href;
    link.as = "document";
    document.head.appendChild(link);
  };

  if ("requestIdleCallback" in window) {
    (window as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(prefetch);
  } else {
    setTimeout(prefetch, 100);
  }
}
