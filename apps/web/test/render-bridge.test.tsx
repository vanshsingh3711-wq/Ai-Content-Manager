import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RenderExportModal } from "../components/editor/RenderExportModal";
import { TimelineProject } from "../lib/timeline-types";
import {
  timelineProjectToSceneDefinition,
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
});
