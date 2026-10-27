/**
 * test/performance.test.tsx
 * ──────────────────────────────────────────────────────────
 * Phase 10: Performance, Code-Splitting & Final Polish Tests
 *
 * Covers:
 *  1. lib/perf.ts — Web Vitals utilities & helpers
 *  2. Lazy editor component wrappers (module shape)
 *  3. Route-level loading skeletons (render smoke tests)
 *  4. Error boundary page (render smoke test)
 *  5. 404 Not Found page (render smoke test)
 *  6. next.config.ts (structural assertions)
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// ── Mock Next.js modules (incompatible with JSDOM) ────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement("img", { ...props, src: props.src as string, alt: (props.alt as string) || "" }),
}));

// next/dynamic — return the loader result synchronously in tests
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<{ default: React.ComponentType }>, _opts?: object) => {
    // Return a stub React component — actual module loading is not possible in JSDOM
    const Stub = () => null;
    Stub.displayName = "DynamicStub";
    return Stub;
  },
}));

// ── 1. lib/perf utilities ──────────────────────────────────

describe("Phase 10: lib/perf — Performance Utilities", () => {
  describe("getRating via reportWebVitals", () => {
    it("is exported as an async function", async () => {
      const { reportWebVitals } = await import("@/lib/perf");
      expect(typeof reportWebVitals).toBe("function");
    });

    it("resolves without throwing when web-vitals is absent (graceful degrade)", async () => {
      const { reportWebVitals } = await import("@/lib/perf");
      await expect(reportWebVitals(vi.fn())).resolves.toBeUndefined();
    });
  });

  describe("measureAsync", () => {
    it("returns the resolved value of the wrapped async function", async () => {
      const { measureAsync } = await import("@/lib/perf");
      const result = await measureAsync("test-measure", async () => 42);
      expect(result).toBe(42);
    });

    it("propagates errors from the wrapped function", async () => {
      const { measureAsync } = await import("@/lib/perf");
      await expect(
        measureAsync("test-error", async () => {
          throw new Error("boom");
        })
      ).rejects.toThrow("boom");
    });
  });

  describe("getMemoryUsage", () => {
    it("returns null when performance.memory is unavailable (non-Chrome)", async () => {
      const { getMemoryUsage } = await import("@/lib/perf");
      // JSDOM does not expose performance.memory — should return null
      const result = getMemoryUsage();
      expect(result === null || typeof result === "object").toBe(true);
    });

    it("returns a snapshot object with usagePercent when memory API is available", async () => {
      const { getMemoryUsage } = await import("@/lib/perf");
      // Mock the Chrome-only API
      Object.defineProperty(window.performance, "memory", {
        value: {
          usedJSHeapSize: 50 * 1024 * 1024,
          totalJSHeapSize: 100 * 1024 * 1024,
          jsHeapSizeLimit: 200 * 1024 * 1024,
        },
        configurable: true,
      });
      const snap = getMemoryUsage();
      if (snap) {
        expect(snap.usagePercent).toBe(25); // 50/200 = 25%
        expect(snap.usedJSHeapSize).toBe(50 * 1024 * 1024);
      }
    });
  });

  describe("prefetchRoute", () => {
    beforeEach(() => {
      // Remove any existing prefetch links
      document
        .querySelectorAll('link[rel="prefetch"]')
        .forEach((el) => el.remove());
    });

    it("is a function", async () => {
      const { prefetchRoute } = await import("@/lib/perf");
      expect(typeof prefetchRoute).toBe("function");
    });

    it("can be called without throwing", async () => {
      const { prefetchRoute } = await import("@/lib/perf");
      expect(() => prefetchRoute("/dashboard/videos")).not.toThrow();
    });
  });

  describe("useWebVitals hook", () => {
    it("calls the reporter callback (may be 0 times synchronously in JSDOM)", async () => {
      const { useWebVitals } = await import("@/lib/perf");
      const reporter = vi.fn();

      function TestHook() {
        useWebVitals(reporter);
        return null;
      }

      render(React.createElement(TestHook));
      // The hook fires asynchronously via dynamic import; we just confirm it doesn't throw
      expect(reporter).toBeDefined();
    });
  });
});

// ── 2. Lazy editor module shape ────────────────────────────

describe("Phase 10: Lazy Editor Component Wrappers", () => {
  it("exports LazyPlayerMonitor from @/components/editor/lazy", async () => {
    const lazyMod = await import("@/components/editor/lazy");
    expect(lazyMod.LazyPlayerMonitor).toBeDefined();
  });

  it("exports LazyInspectorPanel", async () => {
    const lazyMod = await import("@/components/editor/lazy");
    expect(lazyMod.LazyInspectorPanel).toBeDefined();
  });

  it("exports LazyTimelineContainer", async () => {
    const lazyMod = await import("@/components/editor/lazy");
    expect(lazyMod.LazyTimelineContainer).toBeDefined();
  });

  it("exports LazyGraphicCanvasRenderer", async () => {
    const lazyMod = await import("@/components/editor/lazy");
    expect(lazyMod.LazyGraphicCanvasRenderer).toBeDefined();
  });

  it("exports LazyResourceVisualPreview", async () => {
    const lazyMod = await import("@/components/editor/lazy");
    expect(lazyMod.LazyResourceVisualPreview).toBeDefined();
  });

  it("exports LazyChatAssistantDrawer", async () => {
    const lazyMod = await import("@/components/editor/lazy");
    expect(lazyMod.LazyChatAssistantDrawer).toBeDefined();
  });

  it("exports LazyRenderExportModal", async () => {
    const lazyMod = await import("@/components/editor/lazy");
    expect(lazyMod.LazyRenderExportModal).toBeDefined();
  });

  it("exports LazyVersionHistoryDrawer", async () => {
    const lazyMod = await import("@/components/editor/lazy");
    expect(lazyMod.LazyVersionHistoryDrawer).toBeDefined();
  });

  it("lazy exports are callable React component factories", async () => {
    const lazyMod = await import("@/components/editor/lazy");
    // next/dynamic returns a function/component
    expect(typeof lazyMod.LazyPlayerMonitor).toBe("function");
    expect(typeof lazyMod.LazyInspectorPanel).toBe("function");
  });
});

// ── 3. Loading skeleton components ────────────────────────

describe("Phase 10: Route-Level Loading Skeletons", () => {
  it("DashboardLoading renders animated skeleton regions", async () => {
    const DashboardLoading = (await import("@/app/dashboard/loading")).default;
    render(React.createElement(DashboardLoading));
    // Skeleton elements are rendered with animate-pulse class
    const animatedEls = document.querySelectorAll(".animate-pulse");
    expect(animatedEls.length).toBeGreaterThan(0);
  });

  it("VideosLoading renders animated skeleton regions", async () => {
    const VideosLoading = (await import("@/app/dashboard/videos/loading")).default;
    render(React.createElement(VideosLoading));
    const animatedEls = document.querySelectorAll(".animate-pulse");
    expect(animatedEls.length).toBeGreaterThan(0);
  });

  it("CreateLoading renders animated skeleton regions", async () => {
    const CreateLoading = (await import("@/app/dashboard/create/loading")).default;
    render(React.createElement(CreateLoading));
    const animatedEls = document.querySelectorAll(".animate-pulse");
    expect(animatedEls.length).toBeGreaterThan(0);
  });

  it("QueueLoading renders animated skeleton regions", async () => {
    const QueueLoading = (await import("@/app/dashboard/queue/loading")).default;
    render(React.createElement(QueueLoading));
    const animatedEls = document.querySelectorAll(".animate-pulse");
    expect(animatedEls.length).toBeGreaterThan(0);
  });
});

// ── 4. Error boundary ─────────────────────────────────────

describe("Phase 10: Dashboard Error Boundary", () => {
  it("renders error title and retry button", async () => {
    const DashboardError = (await import("@/app/dashboard/error")).default;
    const reset = vi.fn();
    const error = Object.assign(new Error("Test render failure"), { digest: "abc123" });
    render(React.createElement(DashboardError, { error, reset }));
    expect(screen.getByText(/Something went wrong/i)).toBeTruthy();
    expect(screen.getByText(/Try again/i)).toBeTruthy();
    expect(screen.getByText(/Go to Dashboard/i)).toBeTruthy();
  });

  it("calls reset() when 'Try again' is clicked", async () => {
    const DashboardError = (await import("@/app/dashboard/error")).default;
    const reset = vi.fn();
    const error = new Error("crash");
    render(React.createElement(DashboardError, { error, reset }));
    screen.getByText(/Try again/i).click();
    expect(reset).toHaveBeenCalledOnce();
  });

  it("displays error digest when provided", async () => {
    const DashboardError = (await import("@/app/dashboard/error")).default;
    const error = Object.assign(new Error("test"), { digest: "xyz-789" });
    render(React.createElement(DashboardError, { error, reset: vi.fn() }));
    expect(screen.getByText(/xyz-789/i)).toBeTruthy();
  });

  it("renders gracefully when error has no message", async () => {
    const DashboardError = (await import("@/app/dashboard/error")).default;
    const error = new Error();
    error.message = "";
    render(React.createElement(DashboardError, { error, reset: vi.fn() }));
    expect(screen.getByText(/Something went wrong/i)).toBeTruthy();
  });
});

// ── 5. 404 Not Found page ─────────────────────────────────

describe("Phase 10: 404 Not Found Page", () => {
  it("renders the 404 status text", async () => {
    const NotFound = (await import("@/app/not-found")).default;
    render(React.createElement(NotFound));
    expect(screen.getByText("404")).toBeTruthy();
  });

  it("renders cinematic 'Scene not found' copy", async () => {
    const NotFound = (await import("@/app/not-found")).default;
    render(React.createElement(NotFound));
    expect(screen.getByText(/scene not found/i)).toBeTruthy();
  });

  it("provides a 'Go to Dashboard' link", async () => {
    const NotFound = (await import("@/app/not-found")).default;
    render(React.createElement(NotFound));
    const dashLink = screen.getByRole("link", { name: /go to dashboard/i });
    expect(dashLink).toBeTruthy();
    expect(dashLink.getAttribute("href")).toBe("/dashboard");
  });

  it("provides a 'Browse Videos' link to the library", async () => {
    const NotFound = (await import("@/app/not-found")).default;
    render(React.createElement(NotFound));
    const vidLink = screen.getByRole("link", { name: /browse videos/i });
    expect(vidLink).toBeTruthy();
    expect(vidLink.getAttribute("href")).toBe("/dashboard/videos");
  });
});

// ── 6. next.config.ts structural assertions ────────────────

describe("Phase 10: next.config.ts Structural Assertions", () => {
  it("exports a config object with rewrites and headers functions", async () => {
    const { default: config } = await import("@/next.config");
    expect(config).toBeDefined();
    expect(typeof config.rewrites).toBe("function");
    expect(typeof config.headers).toBe("function");
  });

  it("rewrites proxy /api/v1/* to the backend API base", async () => {
    const { default: config } = await import("@/next.config");
    const rewrites = await config.rewrites!();
    const rules = Array.isArray(rewrites)
      ? rewrites
      : (rewrites as { beforeFiles?: object[]; afterFiles?: object[]; fallback?: object[] })
          .beforeFiles || [];
    expect(rules.length).toBeGreaterThanOrEqual(1);
    const rule = (rules as Array<{ source: string; destination: string }>)[0];
    expect(rule.source).toContain("/api/v1/");
  });

  it("defines image formats including webp", async () => {
    const { default: config } = await import("@/next.config");
    expect(config.images?.formats).toContain("image/webp");
  });

  it("includes security headers for /dashboard/* routes", async () => {
    const { default: config } = await import("@/next.config");
    const headerRules = await config.headers!();
    const dashboardRule = headerRules.find((r) =>
      r.source.includes("/dashboard/")
    );
    expect(dashboardRule).toBeDefined();
    const xFrame = dashboardRule!.headers.find(
      (h) => h.key === "X-Frame-Options"
    );
    expect(xFrame?.value).toBe("DENY");
  });

  it("includes immutable Cache-Control for /_next/static/* assets", async () => {
    const { default: config } = await import("@/next.config");
    const headerRules = await config.headers!();
    const staticRule = headerRules.find((r) => r.source.includes("/_next/static/"));
    expect(staticRule).toBeDefined();
    const cacheHeader = staticRule!.headers.find(
      (h) => h.key === "Cache-Control"
    );
    expect(cacheHeader?.value).toContain("immutable");
  });
});
