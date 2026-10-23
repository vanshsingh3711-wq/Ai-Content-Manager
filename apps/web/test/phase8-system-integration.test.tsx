import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { RenderExportModal } from "../components/editor/RenderExportModal";
import { TimelineProject } from "../lib/timeline-types";

describe("Phase 8: End-to-End System Integration & Real-Time Render Streaming", () => {
  const mockProject: TimelineProject = {
    id: "proj-phase8-integration",
    videoId: "vid-phase8-123",
    title: "Phase 8 Realtime Reel",
    aspectRatio: "9:16",
    duration: 10.0,
    fps: 30,
    tracks: {
      videoTrack: [
        {
          id: "v1",
          sourceUrl: "https://example.com/source.mp4",
          name: "Speaker Clip",
          start: 0,
          end: 10.0,
          sourceStart: 0,
          sourceEnd: 10.0,
          speed: 1.0,
          volume: 100,
          zoomFactor: 1.0,
          position: { x: 50, y: 50 },
          scale: 1.0,
        },
      ],
      brollTrack: [
        {
          id: "b1",
          sourceUrl: "https://example.com/broll.mp4",
          name: "Visual Overlay",
          start: 2.0,
          end: 5.0,
          opacity: 90,
          fitMode: "cover",
          position: { x: 50, y: 50 },
        },
      ],
      textTrack: [
        {
          id: "c1",
          text: "Real-time SSE progress streaming",
          start: 1.0,
          end: 4.0,
          stylePreset: "tiktok_yellow",
          position: { x: 50, y: 75 },
          scale: 1.0,
        },
      ],
      audioTrack: [
        {
          id: "a1",
          sourceUrl: "https://example.com/music.mp3",
          name: "Background Track",
          start: 0,
          end: 10.0,
          volume: 30,
          fadeIn: 1.0,
          fadeOut: 1.0,
          isBgm: true,
        },
      ],
      graphicsTrack: [],
    },
  };

  // Mock EventSource implementation for Vitest
  class MockEventSource {
    url: string;
    listeners: Record<string, ((evt: any) => void)[]> = {};
    onmessage: ((evt: any) => void) | null = null;
    onerror: ((evt: any) => void) | null = null;
    readyState = 1;

    constructor(url: string) {
      this.url = url;
      MockEventSource.instances.push(this);
    }

    static instances: MockEventSource[] = [];

    addEventListener(event: string, callback: (evt: any) => void) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(callback);
    }

    emit(event: string, data: any) {
      const payload = { data: JSON.stringify(data) };
      if (this.listeners[event]) {
        this.listeners[event].forEach((cb) => cb(payload));
      }
      if (this.onmessage) {
        this.onmessage(payload);
      }
    }

    close() {
      this.readyState = 2;
    }
  }

  beforeEach(() => {
    MockEventSource.instances = [];
    (global as any).EventSource = MockEventSource;
  });

  afterEach(() => {
    delete (global as any).EventSource;
    vi.restoreAllMocks();
  });

  it("1. Connects to Server-Sent Events stream and updates render progress in real time", async () => {
    // Mock successful render-timeline dispatch returning render_id
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/render-timeline")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              render_id: "render_live_888",
              video_id: "vid-phase8-123",
              status: "rendering",
              stage: "compiling",
              progress: 15,
              message: "Render enqueued",
            }),
        });
      }
      return Promise.reject(new Error("Unknown route"));
    });
    global.fetch = mockFetch;

    render(<RenderExportModal isOpen={true} onClose={vi.fn()} project={mockProject} />);

    // Wait for EventSource instantiation
    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const es = MockEventSource.instances[0];
    expect(es.url).toContain("/api/v1/videos/vid-phase8-123/render-stream/render_live_888");

    // Emit live SSE progress event: matting stage (35%)
    es.emit("progress", {
      render_id: "render_live_888",
      video_id: "vid-phase8-123",
      status: "rendering",
      stage: "matting",
      progress: 35,
      message: "Matting presenter silhouette",
    });

    await waitFor(() => {
      expect(screen.getByText("35%")).toBeDefined();
      expect(screen.getByText(/matting/i)).toBeDefined();
    });

    // Emit live SSE progress event: compositing stage (75%)
    es.emit("progress", {
      render_id: "render_live_888",
      video_id: "vid-phase8-123",
      status: "rendering",
      stage: "compositing",
      progress: 75,
      message: "Compositing multi-track layers",
    });

    await waitFor(() => {
      expect(screen.getByText("75%")).toBeDefined();
      expect(screen.getByText(/compositing/i)).toBeDefined();
    });

    // Emit completed event
    es.emit("completed", {
      render_id: "render_live_888",
      video_id: "vid-phase8-123",
      status: "completed",
      stage: "completed",
      progress: 100,
      message: "Render completed successfully",
      download_url: "/api/v1/videos/vid-phase8-123/rendered-file",
      nle_exports: {
        fcpxml: "/api/v1/videos/vid-phase8-123/export-nle?format=fcpxml",
        premiere_xml: "/api/v1/videos/vid-phase8-123/export-nle?format=premiere",
        edl: "/api/v1/videos/vid-phase8-123/export-nle?format=edl",
        srt: "/api/v1/videos/vid-phase8-123/export-nle?format=srt",
        zip: "/api/v1/videos/vid-phase8-123/export-nle?format=all",
      },
    });

    await waitFor(() => {
      expect(screen.getByText("100%")).toBeDefined();
      expect(screen.getByText(/completed/i)).toBeDefined();
      expect(screen.getByText("Download Master Video (1080p MP4)")).toBeDefined();
    });
  });

  it("2. Gracefully falls back to polling if EventSource encounters an error", async () => {
    let pollCount = 0;
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/render-timeline")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              render_id: "render_fallback_999",
              video_id: "vid-phase8-123",
              status: "rendering",
              stage: "compiling",
              progress: 20,
            }),
        });
      }
      if (url.includes("/render-status/")) {
        pollCount++;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              render_id: "render_fallback_999",
              video_id: "vid-phase8-123",
              status: "completed",
              progress: 100,
              message: "Render finished via polling",
              download_url: "/rendered.mp4",
            }),
        });
      }
      return Promise.reject(new Error("Unknown route"));
    });
    global.fetch = mockFetch;

    render(<RenderExportModal isOpen={true} onClose={vi.fn()} project={mockProject} />);

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const es = MockEventSource.instances[0];

    // Trigger error on EventSource to simulate SSE disconnection
    if (es.listeners["error"]) {
      es.listeners["error"].forEach((cb) => cb(new Event("error")));
    }

    // Modal should switch to polling fallback and finish
    await waitFor(
      () => {
        expect(pollCount).toBeGreaterThan(0);
        expect(screen.getByText("100%")).toBeDefined();
      },
      { timeout: 3000 }
    );
  });

  it("3. Displays accurate multi-track metrics before and after render", () => {
    render(<RenderExportModal isOpen={true} onClose={vi.fn()} project={mockProject} />);

    // 1 video cut, 1 caption, 0 graphics
    expect(screen.getByText("Cuts")).toBeDefined();
    expect(screen.getByText("Captions")).toBeDefined();
    expect(screen.getByText("Graphics")).toBeDefined();
    expect(screen.getByText("Duration")).toBeDefined();
    expect(screen.getByText("10.0s")).toBeDefined();
  });
});
