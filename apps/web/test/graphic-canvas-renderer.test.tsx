import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GraphicCanvasRenderer } from "../components/editor/GraphicCanvasRenderer";
import { GraphicElement } from "../lib/timeline-types";

describe("GraphicCanvasRenderer Component", () => {
  it("renders chart-reveal with rising graph bars, title, and data points", () => {
    const mockGraphic: GraphicElement = {
      id: "g-1",
      name: "RISING GRAPH",
      compositionId: "chart-reveal",
      props: {
        title: "GROWTH TREND",
        dataPoint1: "Stage 1: Baseline",
        dataPoint2: "Stage 2: +85%",
        dataPoint3: "Stage 3: +165% Surge",
        personality: "technical",
      },
      start: 2.0,
      end: 6.0,
    };

    render(<GraphicCanvasRenderer graphic={mockGraphic} playheadTime={3.5} />);

    expect(screen.getByText("GROWTH TREND")).toBeDefined();
    expect(screen.getByText("SURGE +165%")).toBeDefined();
    expect(screen.getByText("Stage 1: Baseline")).toBeDefined();
    expect(screen.getByText("Stage 2: +85%")).toBeDefined();
    expect(screen.getByText("Stage 3: +165% Surge")).toBeDefined();
    expect(screen.getByText("+165%")).toBeDefined();
  });

  it("renders metric-reveal with animated count and delta badge", () => {
    const mockGraphic: GraphicElement = {
      id: "g-2",
      name: "KPI METRIC",
      compositionId: "metric-reveal",
      props: {
        label: "MONTHLY REVENUE",
        metric: "+140%",
        delta: "Target Exceeded",
      },
      start: 0.0,
      end: 4.0,
    };

    render(<GraphicCanvasRenderer graphic={mockGraphic} playheadTime={2.0} />);

    expect(screen.getByText("MONTHLY REVENUE")).toBeDefined();
    expect(screen.getByText("Target Exceeded")).toBeDefined();
    expect(screen.getByText("+140%")).toBeDefined();
  });

  it("renders cooked-terminal with typed command and output", () => {
    const mockGraphic: GraphicElement = {
      id: "g-3",
      name: "TERMINAL",
      compositionId: "cooked-terminal",
      props: {
        command: "npm run deploy",
        output: "Server running: 100% production ready",
      },
      start: 1.0,
      end: 5.0,
    };

    render(<GraphicCanvasRenderer graphic={mockGraphic} playheadTime={3.0} />);

    expect(screen.getByText(/bash — 80×24/i)).toBeDefined();
    expect(screen.getByText("npm run deploy")).toBeDefined();
    expect(screen.getByText("Server running: 100% production ready")).toBeDefined();
  });

  it("renders hero-reveal fallback with headline and label", () => {
    const mockGraphic: GraphicElement = {
      id: "g-4",
      name: "HERO REVEAL",
      compositionId: "hero_reveal",
      props: {
        headline: "ESSENTIAL INSIGHT",
        label: "KEY TAKEAWAY",
      },
      start: 0.0,
      end: 4.0,
    };

    render(<GraphicCanvasRenderer graphic={mockGraphic} playheadTime={1.0} />);

    expect(screen.getByText("ESSENTIAL INSIGHT")).toBeDefined();
    expect(screen.getByText("KEY TAKEAWAY")).toBeDefined();
  });

  it("renders app-screen-upload with app title, filename, and progress bar", () => {
    const mockGraphic: GraphicElement = {
      id: "g-5",
      name: "APP SCREEN UPLOAD",
      compositionId: "app-screen-upload",
      props: {
        title: "VIDEO UPLOAD",
        appName: "Video Studio App",
        fileName: "production_reel.mp4",
        progress: 100,
        status: "Upload Complete",
      },
      start: 10.0,
      end: 14.0,
    };

    // At playhead 13.5 (near end of clip), progress is complete
    render(<GraphicCanvasRenderer graphic={mockGraphic} playheadTime={13.5} />);

    expect(screen.getByText("VIDEO UPLOAD")).toBeDefined();
    expect(screen.getByText("Video Studio App")).toBeDefined();
    expect(screen.getByText("production_reel.mp4")).toBeDefined();
    expect(screen.getByText("100%")).toBeDefined();
    expect(screen.getByText("Upload Complete")).toBeDefined();
    expect(screen.getByText("READY")).toBeDefined();
  });

  it("renders browser-walkthrough with url bar, tab title, and highlight pill", () => {
    const mockGraphic: GraphicElement = {
      id: "g-6",
      name: "BROWSER WALKTHROUGH",
      compositionId: "browser-walkthrough",
      props: {
        url: "https://github.com/facebook/react",
        tabTitle: "facebook/react",
        highlightText: "Key Documentation Evidence",
        screenshotUrl: "/api/v1/editor/captures/capture_123.png",
      },
      start: 5.0,
      end: 9.0,
    };

    render(<GraphicCanvasRenderer graphic={mockGraphic} playheadTime={6.0} />);

    expect(screen.getByText("facebook/react")).toBeDefined();
    expect(screen.getByText("https://github.com/facebook/react")).toBeDefined();
    expect(screen.getByText("LIVE WEB")).toBeDefined();
    expect(screen.getByText("Key Documentation Evidence")).toBeDefined();

    const img = screen.getByAltText("facebook/react") as HTMLImageElement;
    expect(img).toBeDefined();
    expect(img.src).toContain("/api/v1/editor/captures/capture_123.png");
  });

  it("renders browser-walkthrough in 9:16 mobile phone format with status bar and dynamic island", () => {
    const mockGraphic: GraphicElement = {
      id: "g-mobile",
      name: "BROWSER WALKTHROUGH MOBILE",
      compositionId: "browser-walkthrough",
      props: {
        url: "https://techcrunch.com",
        tabTitle: "techcrunch.com",
        format: "9:16",
        highlightText: "Breaking Tech News",
        screenshotUrl: "/api/v1/editor/captures/capture_techcrunch.png",
      },
      start: 0.0,
      end: 6.0,
    };

    render(<GraphicCanvasRenderer graphic={mockGraphic} playheadTime={1.5} />);

    // Mobile status bar elements
    expect(screen.getByText("9:41")).toBeDefined();
    expect(screen.getByText("LIVE WEB")).toBeDefined();
    expect(screen.getByText("https://techcrunch.com")).toBeDefined();
    expect(screen.getByText("Breaking Tech News")).toBeDefined();

    const img = screen.getByAltText("techcrunch.com") as HTMLImageElement;
    expect(img).toBeDefined();
    expect(img.src).toContain("/api/v1/editor/captures/capture_techcrunch.png");
  });

  it("renders browser-walkthrough in 1:1 square format", () => {
    const mockGraphic: GraphicElement = {
      id: "g-square",
      name: "BROWSER WALKTHROUGH SQUARE",
      compositionId: "browser-walkthrough",
      props: {
        url: "https://news.ycombinator.com",
        tabTitle: "Hacker News",
        format: "1:1",
        highlightText: "Top Post",
        screenshotUrl: "/api/v1/editor/captures/capture_hn.png",
      },
      start: 2.0,
      end: 7.0,
    };

    render(<GraphicCanvasRenderer graphic={mockGraphic} playheadTime={3.0} />);

    expect(screen.getByText("Hacker News")).toBeDefined();
    expect(screen.getByText("https://news.ycombinator.com")).toBeDefined();
    expect(screen.getByText("Top Post")).toBeDefined();
    expect(screen.getByText("LIVE WEB")).toBeDefined();
  });
});

