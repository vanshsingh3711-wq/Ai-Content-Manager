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
});
