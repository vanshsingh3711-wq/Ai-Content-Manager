import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RenderExportModal } from "../components/editor/RenderExportModal";
import { TimelineProject } from "../lib/timeline-types";
import {
  timelineProjectToSceneDefinition,
  sceneDefinitionToTimelineProject,
  timelineProjectToMasterBlueprint,
  getCanvasDimensions,
} from "../lib/project-adapter";

describe("Phase 12: Production Render Bridge & Final Hardening", () => {
  const createMockProject = (): TimelineProject => ({
    id: "proj-render-test",
    title: "Master Production Video",
    aspectRatio: "9:16",
    duration: 12.0,
    fps: 30,
    tracks: {
      videoTrack: [
        {
          id: "v1",
          sourceUrl: "https://example.com/raw.mp4",
          name: "Main Talking Head",
          start: 0,
          end: 6.0,
          sourceStart: 0,
          sourceEnd: 6.0,
          speed: 1.0,
          volume: 100,
          zoomFactor: 1.0,
          position: { x: 50, y: 50 },
          scale: 1.0,
        },
        {
          id: "v2",
          sourceUrl: "https://example.com/raw.mp4",
          name: "Talking Head Part 2",
          start: 6.0,
          end: 12.0,
          sourceStart: 8.0,
          sourceEnd: 14.0,
          speed: 1.0,
          volume: 100,
          zoomFactor: 1.1,
          position: { x: 50, y: 50 },
          scale: 1.1,
        },
      ],
      brollTrack: [
        {
          id: "b1",
          sourceUrl: "https://example.com/broll.mp4",
          name: "Product Demo B-Roll",
          start: 2.0,
          end: 5.0,
          opacity: 90,
          fitMode: "cover",
          position: { x: 50, y: 50 },
        },
      ],
      textTrack: [
        {
          id: "cap-1",
          text: "Welcome to AI Video Editing",
          start: 0.5,
          end: 3.5,
          stylePreset: "tiktok_yellow",
          position: { x: 50, y: 75 },
          scale: 1.0,
        },
        {
          id: "cap-2",
          text: "Automated Render Pipeline Active",
          start: 4.0,
          end: 8.0,
          stylePreset: "hormozi_bold",
          position: { x: 50, y: 75 },
          scale: 1.0,
        },
      ],
      audioTrack: [
        {
          id: "a1",
          sourceUrl: "https://example.com/bgm.mp3",
          name: "Upbeat Lo-Fi",
          start: 0,
          end: 12.0,
          volume: 25,
          fadeIn: 1.0,
          fadeOut: 2.0,
          isBgm: true,
        },
      ],
      graphicsTrack: [
        {
          id: "g1",
          name: "HERO REVEAL",
          compositionId: "hero_reveal",
          props: {
            headline: "REVOLUTIONIZE WORKFLOWS",
            label: "AI SUITE",
          },
          start: 1.0,
          end: 4.0,
          position: { x: 50, y: 35 },
          scale: 1.0,
        },
      ],
    },
  });

  describe("1. Timeline Project Compilation into Render Scene", () => {
    it("compiles TimelineProject into a valid Remotion SceneDefinition", () => {
      const project = createMockProject();
      const scene = timelineProjectToSceneDefinition(project);

      expect(scene.id).toBe("proj-render-test");
      expect(scene.durationInFrames).toBe(360); // 12.0s * 30fps

      // Check element layers
      const videoElements = scene.elements.filter((e) => e.type === "video");
      expect(videoElements.length).toBe(3); // 2 video cuts + 1 broll clip

      const captionElements = scene.elements.filter((e) => e.type === "caption");
      expect(captionElements.length).toBe(2);
      expect(captionElements[0].textContent).toBe("Welcome to AI Video Editing");

      const graphicElements = scene.elements.filter((e) => e.type === "asset");
      expect(graphicElements.length).toBe(1);
      expect(graphicElements[0].assetId).toBe("hero_reveal");
    });

    it("compiles TimelineProject into a valid MasterBlueprint for Python worker", () => {
      const project = createMockProject();
      const blueprint = timelineProjectToMasterBlueprint(project);

      expect(blueprint.id).toBe("proj-render-test");
      expect(blueprint.aspectRatio).toBe("9:16");
      expect(blueprint.totalDuration).toBe(12.0);
      expect(blueprint.layers.length).toBeGreaterThan(0);
      expect(blueprint.cuts.length).toBe(2);
    });

    it("correctly evaluates dimensions for different aspect ratios", () => {
      expect(getCanvasDimensions("9:16")).toEqual({ width: 1080, height: 1920 });
      expect(getCanvasDimensions("16:9")).toEqual({ width: 1920, height: 1080 });
      expect(getCanvasDimensions("1:1")).toEqual({ width: 1080, height: 1080 });
      expect(getCanvasDimensions("4:5")).toEqual({ width: 1080, height: 1350 });
    });
  });

  describe("2. Render Export Modal Lifecycle & Downloads", () => {
    beforeEach(() => {
      // Mock global clipboard
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockImplementation(() => Promise.resolve()),
        },
      });
    });

    it("renders modal with initial compiling state and progress bar", () => {
      const project = createMockProject();
      const onClose = vi.fn();

      render(<RenderExportModal isOpen={true} onClose={onClose} project={project} />);

      expect(screen.getByText("Master Production Video")).toBeDefined();
      expect(screen.getByText("9:16")).toBeDefined();
      expect(screen.getByText("Production Export & NLE Bridge")).toBeDefined();
    });

    it("displays correct timeline statistics (cuts, captions, graphics, duration)", () => {
      const project = createMockProject();
      render(<RenderExportModal isOpen={true} onClose={vi.fn()} project={project} />);

      expect(screen.getByText("Cuts")).toBeDefined();
      expect(screen.getByText("Captions")).toBeDefined();
      expect(screen.getByText("Graphics")).toBeDefined();
      expect(screen.getByText("Duration")).toBeDefined();
      expect(screen.getByText("12.0s")).toBeDefined();
    });

    it("advances to completed stage and renders MP4 download and NLE links", async () => {
      const project = createMockProject();
      render(<RenderExportModal isOpen={true} onClose={vi.fn()} project={project} />);

      // Wait for mock render pipeline to finish (simulates backend rendering)
      await waitFor(
        () => {
          expect(screen.getByText("Download Master Video (1080p MP4)")).toBeDefined();
        },
        { timeout: 3500 }
      );

      // Verify NLE links
      expect(screen.getByText("Final Cut / DaVinci")).toBeDefined();
      expect(screen.getByText("Premiere Pro (XML)")).toBeDefined();
      expect(screen.getByText("SubRip Subtitles (.srt)")).toBeDefined();
      expect(screen.getByText("Full NLE Bundle (.zip)")).toBeDefined();
    });

    it("handles Copy Video Link button click", async () => {
      const project = createMockProject();
      render(<RenderExportModal isOpen={true} onClose={vi.fn()} project={project} />);

      await waitFor(
        () => {
          expect(screen.getByText("Copy Video Link")).toBeDefined();
        },
        { timeout: 3500 }
      );

      const copyBtn = screen.getByText("Copy Video Link");
      fireEvent.click(copyBtn);

      await waitFor(() => {
        expect(screen.getByText("Link Copied!")).toBeDefined();
      });
    });

    it("triggers onClose when Done or close button is clicked", async () => {
      const project = createMockProject();
      const onClose = vi.fn();

      render(<RenderExportModal isOpen={true} onClose={onClose} project={project} />);

      await waitFor(
        () => {
          expect(screen.getByText("Done")).toBeDefined();
        },
        { timeout: 3500 }
      );

      fireEvent.click(screen.getByText("Done"));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("3. Phase 6: Finance Motion Graphics Render Bridge & Timeline Project Serialization", () => {
    const createFinanceMockProject = (): TimelineProject => ({
      id: "proj-finance-pipeline-test",
      title: "Finance Pipeline Master Reel",
      aspectRatio: "9:16",
      duration: 50.0,
      fps: 30,
      tracks: {
        videoTrack: [
          {
            id: "vid-1",
            sourceUrl: "https://example.com/finance-reel.mp4",
            name: "Finance Creator A-Roll",
            start: 0,
            end: 50.0,
            sourceStart: 0,
            sourceEnd: 50.0,
            speed: 1.0,
            volume: 100,
            zoomFactor: 1.0,
          },
        ],
        brollTrack: [],
        textTrack: [
          {
            id: "cap-f1",
            text: "Here is how compound growth builds real wealth",
            start: 0.5,
            end: 4.5,
            stylePreset: "hormozi_bold",
          },
        ],
        audioTrack: [
          {
            id: "bgm-f1",
            sourceUrl: "/assets/audio/chill-bgm.mp3",
            name: "Finance Chill BGM",
            start: 0,
            end: 50.0,
            volume: 35,
            isBgm: true,
            ducking: true,
            duckingDb: -14.0,
          },
        ],
        graphicsTrack: [
          {
            id: "fg-1",
            name: "Candlestick Breakout",
            compositionId: "candlestick-hud",
            props: { ticker: "BTC/USD", currentPrice: 94500, changePercent: "+12.4%" },
            start: 1.0,
            end: 5.5,
            position: { x: 50, y: 35 },
            scale: 1.0,
          },
          {
            id: "fg-2",
            name: "Compound Growth Curve",
            compositionId: "compound-growth-curve",
            props: { initialDeposit: 10000, monthlyContribution: 500, years: 25 },
            start: 6.0,
            end: 10.5,
            position: { x: 50, y: 50 },
            scale: 1.0,
          },
          {
            id: "fg-3",
            name: "Asset Allocation Donut",
            compositionId: "portfolio-donut",
            props: { totalValue: 250000, currency: "$" },
            start: 11.0,
            end: 15.0,
            position: { x: 50, y: 50 },
            scale: 1.0,
          },
          {
            id: "fg-4",
            name: "Purchasing Power Cash Burn",
            compositionId: "inflation-cash-burn",
            props: { initialAmount: 100000, purchasingPowerLoss: 42, years: 10 },
            start: 15.5,
            end: 19.5,
            position: { x: 50, y: 50 },
            scale: 1.0,
          },
          {
            id: "fg-5",
            name: "Chase Wire Transfer",
            compositionId: "banking-notification",
            props: { bankName: "CHASE", amount: "$12,450.00", notificationType: "Deposit" },
            start: 20.0,
            end: 24.0,
            position: { x: 50, y: 20 },
            scale: 1.0,
          },
          {
            id: "fg-6",
            name: "Income Budget Waterfall",
            compositionId: "budget-waterfall",
            props: { income: 8500, savings: 2500 },
            start: 24.5,
            end: 28.5,
            position: { x: 50, y: 50 },
            scale: 1.0,
          },
          {
            id: "fg-7",
            name: "Snowball Debt Payoff Tracker",
            compositionId: "debt-payoff-tracker",
            props: { initialDebt: 28000, paidAmount: 28000, currentBalance: 0 },
            start: 29.0,
            end: 33.5,
            position: { x: 50, y: 50 },
            scale: 1.0,
          },
          {
            id: "fg-8",
            name: "Real Estate ROI Scale",
            compositionId: "roi-balance-scale",
            props: { cost: 50000, returns: 175000, roiMultiple: "3.5x" },
            start: 34.0,
            end: 38.5,
            position: { x: 50, y: 50 },
            scale: 1.0,
          },
          {
            id: "fg-9",
            name: "Compounding Flywheel",
            compositionId: "wealth-flywheel",
            props: { activeStage: 3, centerLabel: "PASSIVE CASH FLOW" },
            start: 39.0,
            end: 43.5,
            position: { x: 50, y: 50 },
            scale: 1.0,
          },
          {
            id: "fg-10",
            name: "Index vs Active Battle Chart",
            compositionId: "battle-chart",
            props: { sp500Return: "+312%", hedgeReturn: "+148%", deltaLabel: "+164%" },
            start: 44.0,
            end: 49.0,
            position: { x: 50, y: 50 },
            scale: 1.0,
          },
        ],
      },
    });

    it("compiles all 10 finance motion graphics into Remotion scene asset layers", () => {
      const project = createFinanceMockProject();
      const scene = timelineProjectToSceneDefinition(project);

      expect(scene.id).toBe("proj-finance-pipeline-test");
      expect(scene.durationInFrames).toBe(1500); // 50s * 30fps

      const graphicLayers = scene.elements.filter((e) => e.type === "asset");
      expect(graphicLayers).toHaveLength(10);

      // Verify each of the 10 finance compositions is compiled with correct assetId & props
      const expectedCompositions = [
        "candlestick-hud",
        "compound-growth-curve",
        "portfolio-donut",
        "inflation-cash-burn",
        "banking-notification",
        "budget-waterfall",
        "debt-payoff-tracker",
        "roi-balance-scale",
        "wealth-flywheel",
        "battle-chart",
      ];

      expectedCompositions.forEach((compId) => {
        const layer = graphicLayers.find((l) => l.assetId === compId);
        expect(layer).toBeDefined();
        expect(layer?.timing.startFrame).toBeGreaterThanOrEqual(0);
        expect(layer?.timing.durationInFrames).toBeGreaterThan(0);
        expect((layer?.animation as any)?.props).toBeDefined();
      });

      // Specific prop checks
      const candleLayer = graphicLayers.find((l) => l.assetId === "candlestick-hud");
      expect((candleLayer?.animation as any).props.ticker).toBe("BTC/USD");

      const bankLayer = graphicLayers.find((l) => l.assetId === "banking-notification");
      expect((bankLayer?.animation as any).props.bankName).toBe("CHASE");
      expect((bankLayer?.animation as any).props.amount).toBe("$12,450.00");

      const debtLayer = graphicLayers.find((l) => l.assetId === "debt-payoff-tracker");
      expect((debtLayer?.animation as any).props.paidAmount).toBe(28000);
    });

    it("performs bidirectional lossless round-trip serialization for all finance graphics", () => {
      const project = createFinanceMockProject();
      const scene = timelineProjectToSceneDefinition(project);
      const restored = sceneDefinitionToTimelineProject(scene, {
        fps: project.fps,
        aspectRatio: project.aspectRatio,
      });

      expect(restored.tracks.graphicsTrack).toHaveLength(10);

      project.tracks.graphicsTrack.forEach((original) => {
        const matching = restored.tracks.graphicsTrack.find(
          (g) => g.compositionId === original.compositionId
        );
        expect(matching).toBeDefined();
        expect(matching?.start).toBeCloseTo(original.start, 2);
        expect(matching?.end).toBeCloseTo(original.end, 2);
        expect(matching?.props).toEqual(original.props);
      });
    });

    it("compiles all 10 finance graphics into worker-compatible MasterBlueprint", () => {
      const project = createFinanceMockProject();
      const blueprint = timelineProjectToMasterBlueprint(project);

      expect(blueprint.id).toBe("proj-finance-pipeline-test");
      expect(blueprint.totalDuration).toBe(50.0);

      const mgEdits = blueprint.edits.filter((e) => e.action === "motion_graphics");
      expect(mgEdits).toHaveLength(10);

      // Verify each edit has valid template, props, start, and end
      mgEdits.forEach((edit) => {
        expect(edit.compositionId).toBeDefined();
        expect(edit.motion_graphics_type).toBe(edit.compositionId);
        expect(edit.props).toBeDefined();
        expect(edit.start).toBeLessThan(edit.end);
      });
    });

    it("RenderExportModal displays accurate statistics including all 10 finance graphics", () => {
      const project = createFinanceMockProject();
      render(<RenderExportModal isOpen={true} onClose={vi.fn()} project={project} />);

      expect(screen.getByText("Finance Pipeline Master Reel")).toBeDefined();
      expect(screen.getByText("50.0s")).toBeDefined();
      expect(screen.getByText("10")).toBeDefined(); // 10 graphics
    });
  });
});

