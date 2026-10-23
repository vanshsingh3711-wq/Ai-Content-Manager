import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VideoDetailModal } from "../components/VideoDetailModal";
import { InspectorPanel } from "../components/editor/InspectorPanel";
import { GraphicCanvasRenderer } from "../components/editor/GraphicCanvasRenderer";
import { useTimelineStore } from "../lib/stores/useTimelineStore";
import { TimelineProject, GraphicElement } from "../lib/timeline-types";

describe("AI Automatic Video Editing -> Studio Editor Workflow", () => {
  beforeEach(() => {
    useTimelineStore.setState({
      selectedItem: null,
      playheadTime: 0,
    });
  });

  const mockAiCompletedVideo = {
    id: "ai-video-99",
    user_id: "user_123",
    title: "Why Compound Interest Grows Fast",
    source_url: "https://example.com/source.mp4",
    rendered_url: "https://example.com/final_ai_render.mp4",
    video_type: "faceless_short" as const,
    status: "COMPLETED" as const,
    edit_decision_list: JSON.stringify({
      settings: {
        aspect_ratio: "9:16",
        video_style: "viral",
        caption_preset: "tiktok_yellow",
        duration: 15.0,
      },
      validated_edits: [
        {
          id: "cut-1",
          action: "cut",
          start: 0,
          end: 15,
          sourceUrl: "https://example.com/final_ai_render.mp4",
        },
        {
          id: "broll-1",
          action: "b_roll",
          search_query: "Stock Market Growth Chart",
          start: 3,
          end: 7,
          sourceUrl: "https://example.com/broll_stocks.mp4",
          opacity: 100,
        },
        {
          id: "mg-1",
          action: "motion_graphics",
          motion_graphics_type: "chart-reveal",
          name: "Rising Growth Chart",
          start: 4,
          end: 9,
          props: {
            title: "COMPOUND INTEREST",
            badgeText: "EXPONENTIAL",
            dataPoint1: "Year 1: $10,000",
            val1: "1.0x",
            dataPoint2: "Year 10: $25,937",
            val2: "2.6x",
            dataPoint3: "Year 30: $174,494",
            val3: "17.4x",
            accentColor: "#10b981",
          },
        },
        {
          id: "sfx-1",
          action: "sfx",
          sound_effect: "whoosh",
          start: 4.0,
          end: 4.8,
        },
      ],
      timestamp_map: {
        "1": {
          start: 0.5,
          end: 3.2,
          text: "Compound interest is the eighth wonder of the world.",
        },
        "2": {
          start: 3.5,
          end: 7.8,
          text: "He who understands it, earns it; he who doesn't, pays it.",
        },
        "3": {
          start: 8.0,
          end: 14.5,
          text: "Start investing early and let your money multiply automatically.",
        },
      },
    }),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  describe("1. VideoDetailModal Edit Actions", () => {
    it("renders 'Edit in Studio' button in modal header linking to editor", () => {
      render(
        <VideoDetailModal
          video={mockAiCompletedVideo}
          isOpen={true}
          onClose={() => {}}
        />
      );

      // Header button
      const editHeaderBtn = screen.getByRole("link", { name: /Edit in Studio/i });
      expect(editHeaderBtn).toBeInTheDocument();
      expect(editHeaderBtn).toHaveAttribute("href", "/dashboard/editor/ai-video-99");
    });

    it("renders 'Edit Video in Studio' in modal footer linking to editor", () => {
      render(
        <VideoDetailModal
          video={mockAiCompletedVideo}
          isOpen={true}
          onClose={() => {}}
        />
      );

      // Footer button
      const editFooterBtn = screen.getByRole("link", { name: /Edit Video in Studio/i });
      expect(editFooterBtn).toBeInTheDocument();
      expect(editFooterBtn).toHaveAttribute("href", "/dashboard/editor/ai-video-99");
    });

    it("renders interactive studio editor CTA banner in Video Player tab", () => {
      render(
        <VideoDetailModal
          video={mockAiCompletedVideo}
          isOpen={true}
          onClose={() => {}}
        />
      );

      // Switch to Player tab
      const playerTabBtn = screen.getByRole("button", { name: /Video Player & Stream/i });
      fireEvent.click(playerTabBtn);

      expect(screen.getByText("Interactive Studio Multi-Track Editor")).toBeInTheDocument();
      const studioCtaBtn = screen.getByRole("link", { name: /Open in Studio Editor →/i });
      expect(studioCtaBtn).toBeInTheDocument();
      expect(studioCtaBtn).toHaveAttribute("href", "/dashboard/editor/ai-video-99");
    });
  });

  describe("2. Studio Editor Multi-Track Customization of AI Video Elements", () => {
    const aiTimelineProject: TimelineProject = {
      id: "ai-video-99",
      videoId: "ai-video-99",
      title: "Why Compound Interest Grows Fast",
      aspectRatio: "9:16",
      duration: 15.0,
      fps: 30,
      tracks: {
        videoTrack: [
          {
            id: "cut-1",
            name: "AI Generated Video",
            sourceUrl: "https://example.com/final_ai_render.mp4",
            start: 0,
            end: 15.0,
            sourceStart: 0,
            sourceEnd: 15.0,
            speed: 1,
            volume: 100,
            zoomFactor: 1.0,
          },
        ],
        brollTrack: [
          {
            id: "broll-1",
            name: "Stock Market Growth Chart",
            sourceUrl: "https://example.com/broll_stocks.mp4",
            start: 3.0,
            end: 7.0,
            opacity: 100,
            fitMode: "cover",
          },
        ],
        textTrack: [
          {
            id: "cap-1",
            text: "Compound interest is the eighth wonder of the world.",
            start: 0.5,
            end: 3.2,
            stylePreset: "tiktok_yellow",
            positionY: 75,
          },
          {
            id: "cap-2",
            text: "He who understands it, earns it; he who doesn't, pays it.",
            start: 3.5,
            end: 7.8,
            stylePreset: "tiktok_yellow",
            positionY: 75,
          },
        ],
        graphicsTrack: [
          {
            id: "mg-1",
            name: "Rising Growth Chart",
            compositionId: "chart-reveal",
            start: 4.0,
            end: 9.0,
            position: { x: 50, y: 50 },
            scale: 1,
            rotation: 0,
            props: {
              title: "COMPOUND INTEREST",
              badgeText: "EXPONENTIAL",
              dataPoint1: "Year 1: $10,000",
              val1: "1.0x",
              dataPoint2: "Year 10: $25,937",
              val2: "2.6x",
              dataPoint3: "Year 30: $174,494",
              val3: "17.4x",
              accentColor: "#10b981",
            },
          },
        ],
        audioTrack: [
          {
            id: "sfx-1",
            name: "whoosh",
            sourceUrl: "/assets/audio/whoosh.mp3",
            start: 4.0,
            end: 4.8,
            volume: 80,
            fadeIn: 0,
            fadeOut: 0,
            isBgm: false,
          },
        ],
      },
    };

    it("allows user to customize AI-generated subtitles in the InspectorPanel", () => {
      useTimelineStore.getState().initProject(aiTimelineProject);
      useTimelineStore.getState().setSelectedItem({ type: "caption", id: "cap-1" });

      render(<InspectorPanel />);

      expect(screen.getByText("Caption Settings")).toBeInTheDocument();
      const textarea = screen.getByDisplayValue("Compound interest is the eighth wonder of the world.");
      expect(textarea).toBeInTheDocument();

      // Edit caption text
      fireEvent.change(textarea, {
        target: { value: "Understanding compound interest changes everything." },
      });

      const updatedCaption = useTimelineStore
        .getState()
        .project.tracks.textTrack.find((t) => t.id === "cap-1");

      expect(updatedCaption?.text).toBe("Understanding compound interest changes everything.");
    });

    it("allows user to customize AI-generated motion graphics text and color in InspectorPanel", () => {
      useTimelineStore.getState().initProject(aiTimelineProject);
      useTimelineStore.getState().setSelectedItem({ type: "graphic", id: "mg-1" });

      render(<InspectorPanel />);

      expect(screen.getByText("Growth Milestones & Multipliers")).toBeInTheDocument();
      expect(screen.getByDisplayValue("COMPOUND INTEREST")).toBeInTheDocument();
      expect(screen.getByDisplayValue("EXPONENTIAL")).toBeInTheDocument();

      // User changes title and milestone value
      fireEvent.change(screen.getByDisplayValue("COMPOUND INTEREST"), {
        target: { value: "WEALTH MULTIPLIER" },
      });
      fireEvent.change(screen.getByDisplayValue("EXPONENTIAL"), {
        target: { value: "+1,700% RETURN" },
      });

      // Change accent color to Rose (#f43f5e)
      const roseChip = screen.getByTitle("Rose");
      fireEvent.click(roseChip);

      const updatedGraphic = (useTimelineStore.getState().project.tracks.graphicsTrack || []).find(
        (g) => g.id === "mg-1"
      );

      expect(updatedGraphic?.props?.title).toBe("WEALTH MULTIPLIER");
      expect(updatedGraphic?.props?.badgeText).toBe("+1,700% RETURN");
      expect(updatedGraphic?.props?.accentColor).toBe("#f43f5e");
    });

    it("renders updated graphic live on canvas with the user's modifications", () => {
      const modifiedGraphic: GraphicElement = {
        id: "mg-1",
        name: "Rising Growth Chart",
        compositionId: "chart-reveal",
        start: 4.0,
        end: 9.0,
        props: {
          title: "WEALTH MULTIPLIER",
          badgeText: "+1,700% RETURN",
          dataPoint1: "Year 1: $10,000",
          val1: "1.0x",
          dataPoint2: "Year 10: $25,937",
          val2: "2.6x",
          dataPoint3: "Year 30: $174,494",
          val3: "17.4x",
          accentColor: "#f43f5e",
        },
      };

      render(<GraphicCanvasRenderer graphic={modifiedGraphic} playheadTime={6.0} />);

      expect(screen.getByText("WEALTH MULTIPLIER")).toBeInTheDocument();
      expect(screen.getByText("+1,700% RETURN")).toBeInTheDocument();
    });

    it("allows user to trim or move AI-generated B-Roll in timeline store", () => {
      useTimelineStore.getState().initProject(aiTimelineProject);

      const initialBRoll = useTimelineStore.getState().project.tracks.brollTrack[0];
      expect(initialBRoll.start).toBe(3.0);
      expect(initialBRoll.end).toBe(7.0);

      // User trims start to 4.0s
      useTimelineStore.getState().updateBRollClip("broll-1", { start: 4.0, end: 7.5 });

      const updatedBRoll = useTimelineStore.getState().project.tracks.brollTrack[0];
      expect(updatedBRoll.start).toBe(4.0);
      expect(updatedBRoll.end).toBe(7.5);
    });
  });
});
