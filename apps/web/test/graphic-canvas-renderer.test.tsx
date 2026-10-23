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

  it("renders effect_overlay with tactical night vision HUD and indicators", () => {
    const mockGraphic: GraphicElement = {
      id: "fx-nv-1",
      name: "Tactical Night Vision",
      compositionId: "effect_overlay",
      props: {
        effectType: "night_vision",
        intensity: 90,
        scopeVignette: true,
      },
      start: 1.0,
      end: 6.0,
    };

    render(<GraphicCanvasRenderer graphic={mockGraphic} playheadTime={2.5} />);

    expect(screen.getByText(/IR-NIGHT-VISION \[ON\]/i)).toBeDefined();
    expect(screen.getByText(/\+ 0.00 MIL \+/i)).toBeDefined();
    expect(screen.getByText(/NVD-MILSPEC-GEN3/i)).toBeDefined();
  });

  it("renders effect_overlay with cinematic vignette", () => {
    const mockGraphic: GraphicElement = {
      id: "fx-vig-1",
      name: "Cinematic Vignette",
      compositionId: "effect-overlay",
      props: {
        effectType: "vignette",
        intensity: 85,
        feather: 60,
      },
      start: 0.0,
      end: 5.0,
    };

    const { container } = render(<GraphicCanvasRenderer graphic={mockGraphic} playheadTime={2.0} />);
    expect(container.firstChild).toBeDefined();
  });

  it("renders dedicated hero-reveal headline card with category badge and accent styling", () => {
    const mockGraphic: GraphicElement = {
      id: "hero-1",
      name: "Hero Reveal Headline",
      compositionId: "hero_reveal",
      props: {
        headline: "REVOLUTIONARY AI WORKFLOW",
        supporting: "ENTERPRISE RELEASE",
        subtext: "Create cinematic videos 10x faster with prompt-driven motion graphics.",
        accentColor: "#38bdf8",
      },
      start: 0.0,
      end: 4.0,
    };

    render(<GraphicCanvasRenderer graphic={mockGraphic} playheadTime={1.0} />);

    expect(screen.getByText("REVOLUTIONARY AI WORKFLOW")).toBeDefined();
    expect(screen.getByText("ENTERPRISE RELEASE")).toBeDefined();
    expect(screen.getByText("Create cinematic videos 10x faster with prompt-driven motion graphics.")).toBeDefined();
  });

  it("renders cooked-notes with custom step parameters item1, item2, item3", () => {
    const mockGraphic: GraphicElement = {
      id: "notes-1",
      name: "Action Items Checklist",
      compositionId: "cooked-notes",
      props: {
        title: "3 Rules for Viral Retention",
        item1: "1. Hook within 2 seconds",
        item2: "2. Fast-paced visual b-roll",
        item3: "3. Clear CTA at the climax",
      },
      start: 0.0,
      end: 4.0,
    };

    render(<GraphicCanvasRenderer graphic={mockGraphic} playheadTime={1.5} />);

    expect(screen.getByText("📝 3 Rules for Viral Retention")).toBeDefined();
    expect(screen.getByText("1. Hook within 2 seconds")).toBeDefined();
    expect(screen.getByText("2. Fast-paced visual b-roll")).toBeDefined();
    expect(screen.getByText("3. Clear CTA at the climax")).toBeDefined();
  });

  it("renders pop-up-badge with glowing icon and text", () => {
    const mockGraphic: GraphicElement = {
      id: "badge-1",
      name: "Pop Up Badge",
      compositionId: "pop_up_badge",
      props: {
        text: "TRENDING TOPIC",
        icon: "🔥",
        accentColor: "#f43f5e",
      },
      start: 0.0,
      end: 3.0,
    };

    render(<GraphicCanvasRenderer graphic={mockGraphic} playheadTime={1.0} />);

    expect(screen.getByText("TRENDING TOPIC")).toBeDefined();
    expect(screen.getByText("🔥")).toBeDefined();
  });

  it("renders kinetic-text with bold sequential words", () => {
    const mockGraphic: GraphicElement = {
      id: "kt-1",
      name: "Kinetic Text",
      compositionId: "kinetic-text",
      props: {
        text: "STOP SCROLLING RIGHT NOW",
        accentColor: "#38bdf8",
      },
      start: 0.0,
      end: 3.0,
    };

    render(<GraphicCanvasRenderer graphic={mockGraphic} playheadTime={1.5} />);

    expect(screen.getByText("STOP")).toBeDefined();
    expect(screen.getByText("SCROLLING")).toBeDefined();
    expect(screen.getByText("RIGHT")).toBeDefined();
    expect(screen.getByText("NOW")).toBeDefined();
  });

  it("renders icon-reveal with big concept emoji and title", () => {
    const mockGraphic: GraphicElement = {
      id: "ir-1",
      name: "Icon Reveal",
      compositionId: "icon-reveal",
      props: {
        concept: "🚀",
        label: "HYPER GROWTH",
        sublabel: "10X Acceleration",
        accentColor: "#10b981",
      },
      start: 0.0,
      end: 4.0,
    };

    render(<GraphicCanvasRenderer graphic={mockGraphic} playheadTime={1.0} />);

    expect(screen.getByText("🚀")).toBeDefined();
    expect(screen.getByText("HYPER GROWTH")).toBeDefined();
    expect(screen.getByText("10X Acceleration")).toBeDefined();
  });

  it("renders cooked-chat with conversation dialogue bubbles", () => {
    const mockGraphic: GraphicElement = {
      id: "chat-1",
      name: "Chat Dialogue",
      compositionId: "cooked-chat",
      props: {
        messages: [
          { from: "them", text: "How did you create this edit?" },
          { from: "me", text: "With AI Content Manager in 60 seconds!" },
        ],
      },
      start: 0.0,
      end: 4.0,
    };

    render(<GraphicCanvasRenderer graphic={mockGraphic} playheadTime={2.0} />);

    expect(screen.getByText("How did you create this edit?")).toBeDefined();
    expect(screen.getByText("With AI Content Manager in 60 seconds!")).toBeDefined();
    expect(screen.getByText("Direct Message")).toBeDefined();
  });

  it("renders cooked-flow with multi-step pipeline nodes", () => {
    const mockGraphic: GraphicElement = {
      id: "flow-1",
      name: "Workflow Flow",
      compositionId: "cooked-flow",
      props: {
        title: "AUTOMATION ENGINE",
        nodes: [
          { label: "1. Capture Video" },
          { label: "2. Generate B-Roll" },
          { label: "3. Publish to Reels" },
        ],
      },
      start: 0.0,
      end: 4.0,
    };

    render(<GraphicCanvasRenderer graphic={mockGraphic} playheadTime={2.0} />);

    expect(screen.getByText("AUTOMATION ENGINE")).toBeDefined();
    expect(screen.getByText("1. Capture Video")).toBeDefined();
    expect(screen.getByText("2. Generate B-Roll")).toBeDefined();
    expect(screen.getByText("3. Publish to Reels")).toBeDefined();
  });

  it("renders animated-counter when provided startValue and endValue from MediaDrawer", () => {
    const mockGraphic: GraphicElement = {
      id: "counter-1",
      name: "Animated Counter",
      compositionId: "animated_counter",
      props: {
        label: "COMMUNITY MEMBERS",
        startValue: 0,
        endValue: 100000,
        prefix: "",
        suffix: "k",
      },
      start: 0.0,
      end: 4.0,
    };

    render(<GraphicCanvasRenderer graphic={mockGraphic} playheadTime={2.0} />);

    expect(screen.getByText("COMMUNITY MEMBERS")).toBeDefined();
    expect(screen.getByText(/k/i)).toBeDefined();
  });
});


