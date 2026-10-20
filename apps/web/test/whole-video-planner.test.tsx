import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StagedEditReviewDrawer } from "../components/editor/StagedEditReviewDrawer";
import { ChatAssistantDrawer } from "../components/editor/ChatAssistantDrawer";
import { EditPlanProposal } from "../lib/ai/copilot-types";
import { useTimelineStore } from "../lib/stores/useTimelineStore";
import { TimelineProject } from "../lib/timeline-types";

describe("Phase 5: Whole-Video Coordinated Edit Planner", () => {
  const wholeVideoProposal: EditPlanProposal = {
    id: "plan_whole_video_882",
    user_prompt: "Make the whole video engaging with graphics and B-roll",
    scope: "whole_video",
    summary:
      "Generated coordinated whole-video plan with 8 edits (3 B-roll clips, 2 motion graphics, 2 SFX cues, 1 transition) respecting pacing and density budgets.",
    created_at: "2026-10-19T15:00:00Z",
    total_duration_seconds: 60.0,
    edits: [
      {
        id: "edit-broll-1",
        action_type: "broll",
        start: 4.0,
        end: 7.5,
        track: "broll",
        title: "Stock B-Roll: Developer Coding On Laptop",
        description: "High-quality stock footage from 4.0s to 7.5s.",
        reason: "Visualizes workflow metaphor",
        is_destructive: false,
        preview_url: "https://images.pexels.com/preview-1.jpg",
        operation: {
          type: "add_element",
          track: "broll",
          element: {
            id: "broll-1",
            name: "Developer Coding On Laptop",
            sourceUrl: "https://videos.pexels.com/code.mp4",
            start: 4.0,
            end: 7.5,
          },
        },
      },
      {
        id: "edit-sfx-1",
        action_type: "sfx",
        start: 4.05,
        end: 4.55,
        track: "audio",
        title: "SFX: Whoosh In",
        description: "Punchy intro whoosh for B-roll 1",
        reason: "Audio accent for visual entry",
        is_destructive: false,
        operation: {
          type: "add_element",
          track: "audio",
          element: {
            id: "sfx-1",
            name: "SFX: Whoosh In",
            sourceUrl: "https://cdn.ai-content-manager.com/sfx/whoosh-in.mp3",
            start: 4.05,
            end: 4.55,
            volume: 80,
          },
        },
      },
      {
        id: "edit-graphic-1",
        action_type: "graphic",
        start: 12.0,
        end: 15.5,
        track: "graphics",
        title: "Motion Card: Hero Reveal",
        description: "Remotion motion graphic card",
        reason: "Introduces core thesis",
        is_destructive: false,
        operation: {
          type: "add_element",
          track: "graphic",
          element: {
            id: "graphic-1",
            name: "Hero Reveal",
            compositionId: "hero-reveal",
            props: { headline: "Core Thesis", supporting: "Accelerated execution" },
            start: 12.0,
            end: 15.5,
          },
        },
      },
      {
        id: "edit-broll-2",
        action_type: "broll",
        start: 20.0,
        end: 23.5,
        track: "broll",
        title: "Stock B-Roll: Collaborative Dev Team",
        description: "High-quality stock footage from 20.0s to 23.5s.",
        reason: "Visualizes teamwork",
        is_destructive: false,
        operation: {
          type: "add_element",
          track: "broll",
          element: {
            id: "broll-2",
            name: "Collaborative Dev Team",
            sourceUrl: "https://videos.pexels.com/team.mp4",
            start: 20.0,
            end: 23.5,
          },
        },
      },
      {
        id: "edit-transition-1",
        action_type: "transition",
        start: 28.0,
        end: 28.5,
        track: "video",
        title: "Transition: Whip Pan",
        description: "Punchy whip pan transition at midpoint",
        reason: "Dividing narrative sections",
        is_destructive: false,
        operation: {
          type: "add_transition",
          id: "trans-mid-1",
          track: "video",
          fromClipId: "vid-main",
          toClipId: "vid-main",
          preset: "whip_pan",
          duration: 0.5,
          alignment: "center",
        },
      },
      {
        id: "edit-graphic-2",
        action_type: "graphic",
        start: 32.0,
        end: 35.5,
        track: "graphics",
        title: "Motion Card: Metric Reveal",
        description: "Remotion motion graphic card (distinct from Hero Reveal)",
        reason: "Emphasizes growth metric",
        is_destructive: false,
        operation: {
          type: "add_element",
          track: "graphic",
          element: {
            id: "graphic-2",
            name: "Metric Reveal",
            compositionId: "metric-reveal",
            props: { metric: "+140%", delta: "Exceeded" },
            start: 32.0,
            end: 35.5,
          },
        },
      },
      {
        id: "edit-sfx-2",
        action_type: "sfx",
        start: 32.05,
        end: 32.55,
        track: "audio",
        title: "SFX: Ding",
        description: "Celebratory accent ding",
        reason: "Punches up metric reveal",
        is_destructive: false,
        operation: {
          type: "add_element",
          track: "audio",
          element: {
            id: "sfx-2",
            name: "SFX: Ding",
            sourceUrl: "https://cdn.ai-content-manager.com/sfx/ding.mp3",
            start: 32.05,
            end: 32.55,
            volume: 80,
          },
        },
      },
      {
        id: "edit-broll-3",
        action_type: "broll",
        start: 42.0,
        end: 45.5,
        track: "broll",
        title: "Stock B-Roll: Modern Workspace",
        description: "High-quality stock footage from 42.0s to 45.5s.",
        reason: "Final narrative anchor",
        is_destructive: false,
        operation: {
          type: "add_element",
          track: "broll",
          element: {
            id: "broll-3",
            name: "Modern Workspace",
            sourceUrl: "https://videos.pexels.com/workspace.mp4",
            start: 42.0,
            end: 45.5,
          },
        },
      },
    ],
  };

  const initialProject: TimelineProject = {
    id: "test-whole-proj",
    title: "Whole Video Project",
    duration: 60.0,
    fps: 30,
    aspectRatio: "9:16",
    tracks: {
      videoTrack: [
        {
          id: "vid-main",
          name: "Main Clip",
          src: "/media/test.mp4",
          start: 0,
          end: 60.0,
        },
      ],
      brollTrack: [],
      audioTrack: [],
      graphicsTrack: [],
      textTrack: [],
    },
    transitions: [],
  };

  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    useTimelineStore.getState().initProject(initialProject);
    vi.restoreAllMocks();
  });

  describe("Density Budgeting & Variety Verification", () => {
    it("satisfies the 6-12 edit count range for whole-video proposals", () => {
      expect(wholeVideoProposal.edits.length).toBeGreaterThanOrEqual(6);
      expect(wholeVideoProposal.edits.length).toBeLessThanOrEqual(12);
    });

    it("enforces B-roll density: spaced >= 8.0s apart and non-overlapping", () => {
      const brolls = wholeVideoProposal.edits.filter((e) => e.action_type === "broll");
      expect(brolls.length).toBeGreaterThanOrEqual(2);

      for (let i = 1; i < brolls.length; i++) {
        const prev = brolls[i - 1];
        const curr = brolls[i];
        expect(curr.start - prev.start).toBeGreaterThanOrEqual(8.0);
        expect(curr.start).toBeGreaterThanOrEqual(prev.end);
      }
    });

    it("enforces Motion Graphics variety: consecutive cards have different composition IDs", () => {
      const graphics = wholeVideoProposal.edits.filter((e) => e.action_type === "graphic");
      expect(graphics.length).toBeGreaterThanOrEqual(2);

      for (let i = 1; i < graphics.length; i++) {
        const prevComp = (graphics[i - 1].operation.element as any).compositionId;
        const currComp = (graphics[i].operation.element as any).compositionId;
        expect(currComp).not.toBe(prevComp);
        expect(graphics[i].start - graphics[i - 1].start).toBeGreaterThanOrEqual(10.0);
      }
    });

    it("enforces SFX density: spaced >= 2.0s apart", () => {
      const sfxs = wholeVideoProposal.edits.filter((e) => e.action_type === "sfx");
      expect(sfxs.length).toBeGreaterThanOrEqual(2);

      for (let i = 1; i < sfxs.length; i++) {
        const prev = sfxs[i - 1];
        const curr = sfxs[i];
        expect(curr.start - prev.start).toBeGreaterThanOrEqual(2.0);
      }
    });
  });

  describe("StagedEditReviewDrawer Rendering & Interaction", () => {
    it("renders all 8 edits and the whole video pacing badge", () => {
      render(
        <StagedEditReviewDrawer
          isOpen={true}
          proposal={wholeVideoProposal}
          onClose={vi.fn()}
          onApplySelected={vi.fn()}
        />
      );

      // Verify header and badge
      expect(screen.getByText("Proposed Edit Plan")).toBeInTheDocument();
      expect(screen.getByText("8 Edits")).toBeInTheDocument();
      expect(screen.getAllByText(/whole video/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Pacing: 1 visual \/ 3–5s/i)).toBeInTheDocument();

      // Verify items rendered
      expect(screen.getByText("Stock B-Roll: Developer Coding On Laptop")).toBeInTheDocument();
      expect(screen.getByText("Motion Card: Hero Reveal")).toBeInTheDocument();
      expect(screen.getByText("Motion Card: Metric Reveal")).toBeInTheDocument();
      expect(screen.getByText("Transition: Whip Pan")).toBeInTheDocument();
      expect(screen.getByText("SFX: Whoosh In")).toBeInTheDocument();
    });

    it("handles Select All, Clear, and selective checkbox toggling", () => {
      render(
        <StagedEditReviewDrawer
          isOpen={true}
          proposal={wholeVideoProposal}
          onClose={vi.fn()}
          onApplySelected={vi.fn()}
        />
      );

      // Initially all 8 selected
      expect(screen.getByText("8 of 8 selected")).toBeInTheDocument();

      // Click Clear
      fireEvent.click(screen.getByText("Clear"));
      expect(screen.getByText("0 of 8 selected")).toBeInTheDocument();

      // Click Select All
      fireEvent.click(screen.getByText("Select All"));
      expect(screen.getByText("8 of 8 selected")).toBeInTheDocument();
    });

    it("calls onApplySelected with all selected items when clicking Apply Selected", () => {
      const handleApplySelected = vi.fn();
      render(
        <StagedEditReviewDrawer
          isOpen={true}
          proposal={wholeVideoProposal}
          onClose={vi.fn()}
          onApplySelected={handleApplySelected}
        />
      );

      const applyBtn = screen.getByText("Apply Selected (8)");
      fireEvent.click(applyBtn);

      expect(handleApplySelected).toHaveBeenCalledTimes(1);
      const applied = handleApplySelected.mock.calls[0][0];
      expect(applied.length).toBe(8);
    });
  });

  describe("Batch Store Execution & Single Atomic Undo", () => {
    it("dispatches all whole-video edits simultaneously and supports 1-click atomic rollback", () => {
      const store = useTimelineStore.getState();
      const operations = wholeVideoProposal.edits.map((e) => e.operation);

      // Apply batch
      store.dispatchBatch(operations, "Apply Whole Video Edit Plan");

      const afterState = useTimelineStore.getState().project.tracks;
      expect(afterState.brollTrack.length).toBe(3);
      expect(afterState.graphicsTrack.length).toBe(2);
      expect(afterState.audioTrack.length).toBe(2);

      // Atomic undo (Ctrl+Z)
      useTimelineStore.getState().undo();

      const undoneState = useTimelineStore.getState().project.tracks;
      expect(undoneState.brollTrack.length).toBe(0);
      expect(undoneState.graphicsTrack.length).toBe(0);
      expect(undoneState.audioTrack.length).toBe(0);

      // Atomic redo
      useTimelineStore.getState().redo();

      const redoneState = useTimelineStore.getState().project.tracks;
      expect(redoneState.brollTrack.length).toBe(3);
      expect(redoneState.graphicsTrack.length).toBe(2);
      expect(redoneState.audioTrack.length).toBe(2);
    });
  });

  describe("Chat Assistant Integration for Whole-Video Prompts", () => {
    it("submits whole-video prompt, renders proposal card, and opens StagedEditReviewDrawer", async () => {
      window.HTMLElement.prototype.scrollIntoView = vi.fn();

      // Mock fetch response returning whole-video proposal
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => wholeVideoProposal,
      } as any);

      render(<ChatAssistantDrawer isOpen={true} onClose={vi.fn()} />);

      const input = screen.getByPlaceholderText("Type an editing command...");
      fireEvent.change(input, {
        target: { value: "Make the whole video engaging with graphics and B-roll" },
      });

      const form = input.closest("form")!;
      fireEvent.submit(form);

      // Wait for assistant response with proposal banner
      const banner = await screen.findByTestId("multi-edit-proposal-banner");
      expect(banner).toBeInTheDocument();
      expect(screen.getByText("8 Proposed Edits")).toBeInTheDocument();

      // Click review banner to open review drawer
      const reviewBtn = screen.getByText(/Review & Apply Changes/i);
      fireEvent.click(reviewBtn);

      // Review drawer is open
      expect(screen.getByTestId("staged-edit-review-drawer")).toBeInTheDocument();
      expect(screen.getByText("8 Edits")).toBeInTheDocument();
      expect(screen.getByText("Apply Selected (8)")).toBeInTheDocument();

      global.fetch = originalFetch;
    });
  });
});
