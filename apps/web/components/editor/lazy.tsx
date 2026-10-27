/**
 * components/editor/lazy.tsx
 * ──────────────────────────────────────────────────────────
 * Lazily-loaded entry points for the heaviest NLE editor components.
 *
 * Why: GraphicCanvasRenderer (~221 KB), InspectorPanel (~140 KB),
 * ResourceVisualPreview (~107 KB), PlayerMonitor (~48 KB), and
 * TimelineContainer (~44 KB) together total ~560 KB of JS that is
 * only needed on the /dashboard/editor/[id] route.
 *
 * Wrapping them with next/dynamic + `{ ssr: false }` means:
 *  1. They are code-split into separate async chunks.
 *  2. They are never included in the SSR/RSC payload.
 *  3. They only download when the Studio Editor page is visited.
 *
 * Consumers: import from "@/components/editor/lazy" instead of the
 * direct module paths when rendering inside the editor page.
 */

import dynamic from "next/dynamic";
import React from "react";

// ── Shared skeleton used while lazy chunks download ────────

function EditorPanelSkeleton() {
  return (
    <div className="flex-1 animate-pulse bg-[#0a0c11] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-yellow-400/40 border-t-yellow-400 rounded-full animate-spin" />
    </div>
  );
}

function InspectorSkeleton() {
  return (
    <div className="w-72 bg-[#0d0f14] border-l border-white/[0.05] animate-pulse flex flex-col gap-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 rounded-lg bg-white/[0.04]" />
      ))}
    </div>
  );
}

// ── Lazy component exports ─────────────────────────────────

/**
 * Canvas renderer: Three.js + WebGL graphics overlay.
 * Heaviest single module (~221 KB). Split here to avoid blocking
 * the dashboard layout bundle.
 */
export const LazyGraphicCanvasRenderer = dynamic(
  () =>
    import(
      /* webpackChunkName: "editor-canvas" */
      "./GraphicCanvasRenderer"
    ).then((m) => ({ default: m.GraphicCanvasRenderer })),
  {
    ssr: false,
    loading: () => <EditorPanelSkeleton />,
  }
);

/**
 * Inspector panel: property controls for selected clips/elements.
 * Second-heaviest (~140 KB).
 */
export const LazyInspectorPanel = dynamic(
  () =>
    import(
      /* webpackChunkName: "editor-inspector" */
      "./InspectorPanel"
    ).then((m) => ({ default: m.InspectorPanel })),
  {
    ssr: false,
    loading: () => <InspectorSkeleton />,
  }
);

/**
 * Resource visual preview: thumbnail + filmstrip rendering.
 * Third-heaviest (~107 KB).
 */
export const LazyResourceVisualPreview = dynamic(
  () =>
    import(
      /* webpackChunkName: "editor-resource-preview" */
      "./ResourceVisualPreview"
    ).then((m) => ({ default: m.ResourceVisualPreview })),
  {
    ssr: false,
    loading: () => <EditorPanelSkeleton />,
  }
);

/**
 * Player monitor: video preview with transport controls (~48 KB).
 */
export const LazyPlayerMonitor = dynamic(
  () =>
    import(
      /* webpackChunkName: "editor-player" */
      "./PlayerMonitor"
    ).then((m) => ({ default: m.PlayerMonitor })),
  {
    ssr: false,
    loading: () => <EditorPanelSkeleton />,
  }
);

/**
 * Timeline container: multi-track NLE canvas (~44 KB).
 */
export const LazyTimelineContainer = dynamic(
  () =>
    import(
      /* webpackChunkName: "editor-timeline" */
      "./TimelineContainer"
    ).then((m) => ({ default: m.TimelineContainer })),
  {
    ssr: false,
    loading: () => <EditorPanelSkeleton />,
  }
);

/**
 * Staged-edit review drawer: diff + approve UI (~60 KB).
 */
export const LazyStagedEditReviewDrawer = dynamic(
  () =>
    import(
      /* webpackChunkName: "editor-staged-edits" */
      "./StagedEditReviewDrawer"
    ).then((m) => ({ default: m.StagedEditReviewDrawer })),
  { ssr: false }
);

/**
 * Resource library drawer: asset browser (~32 KB).
 */
export const LazyResourceLibraryDrawer = dynamic(
  () =>
    import(
      /* webpackChunkName: "editor-resource-library" */
      "./ResourceLibraryDrawer"
    ).then((m) => ({ default: m.ResourceLibraryDrawer })),
  { ssr: false }
);

/**
 * Chat assistant drawer: AI side panel (~23 KB).
 */
export const LazyChatAssistantDrawer = dynamic(
  () =>
    import(
      /* webpackChunkName: "editor-chat" */
      "./ChatAssistantDrawer"
    ).then((m) => ({ default: m.ChatAssistantDrawer })),
  { ssr: false }
);

/**
 * Version history drawer: cloud checkpoints (~23 KB).
 */
export const LazyVersionHistoryDrawer = dynamic(
  () =>
    import(
      /* webpackChunkName: "editor-history" */
      "./VersionHistoryDrawer"
    ).then((m) => ({ default: m.VersionHistoryDrawer })),
  { ssr: false }
);

/**
 * Render / export modal (~27 KB).
 */
export const LazyRenderExportModal = dynamic(
  () =>
    import(
      /* webpackChunkName: "editor-export" */
      "./RenderExportModal"
    ).then((m) => ({ default: m.RenderExportModal })),
  { ssr: false }
);
