import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StagedEditReviewDrawer } from "../components/editor/StagedEditReviewDrawer";
import { ChatAssistantDrawer } from "../components/editor/ChatAssistantDrawer";
import { EditPlanProposal, ProposedEditItem } from "../lib/ai/copilot-types";
import { useTimelineStore } from "../lib/stores/useTimelineStore";
import { TimelineProject } from "../lib/timeline-types";

describe("Phase 3: Staged Edit Proposal & Approval Drawer", () => {
  const sampleProposal: EditPlanProposal = {
    id: "prop-sample-1",
    user_prompt: "Cut out silence and overlay city b-roll with a title",
    summary: "Refined speech flow with a city drone b-roll shot and introductory title card.",
    scope: "full_timeline",
    total_duration_seconds: 15.0,
    edits: [
      {
        id: "edit-1",
        action_type: "broll",
        title: "Overlay City Drone Shot",
        track: "broll",
        start: 2.0,
        end: 6.0,
        description: "Adds scenic 4k drone footage of city skyline.",
        preview_url: "https://images.pexels.com/videos/12345/preview.jpg",
        reason: "Visual engagement during opening context speech.",
        is_destructive: false,
        operation: {
          type: "add_element",
          track: "broll",
          element: {
            id: "broll-city-1",
            name: "City Drone Shot",
            src: "https://videos.pexels.com/12345.mp4",
            start: 2.0,
            end: 6.0,
          },
        },
      },
      {
        id: "edit-2",
        action_type: "graphic",
        title: "Intro Lower Third Title",
        track: "graphics",
        start: 2.5,
        end: 5.5,
        description: "Graphic lower third introducing the speaker.",
        reason: "Establish presenter credentials.",
        is_destructive: false,
        operation: {
          type: "add_element",
          track: "graphic",
          element: {
            id: "graphic-lower-1",
            name: "Intro Title",
            start: 2.5,
            end: 5.5,
          },
        },
      },
      {
        id: "edit-3",
        action_type: "transition",
        title: "Trim Awkward Silence",
        track: "video",
        start: 7.0,
        end: 8.5,
        description: "Splits and trims 1.5s of dead air.",
        reason: "Pacing optimization.",
        is_destructive: true,
        operation: {
          type: "split_clip",
          targetId: "vid-main-1",
          targetType: "video",
          splitTime: 7.0,
        },
      },
    ],
  };

  const initialProject: TimelineProject = {
    id: "project-staged-test",
    title: "Staged Review Test Project",
    aspectRatio: "9:16",
    duration: 30,
    fps: 30,
    tracks: {
      videoTrack: [
        {
          id: "vid-main-1",
          name: "Main Video",
          src: "https://sample.mp4",
          start: 0,
          end: 15,
        },
      ],
      brollTrack: [],
      textTrack: [],
      audioTrack: [],
      graphicsTrack: [],
    },
  };

  beforeEach(() => {
    useTimelineStore.getState().initProject(initialProject);
  });

  describe("StagedEditReviewDrawer Component", () => {
    it("renders nothing when isOpen is false", () => {
      const { container } = render(
        <StagedEditReviewDrawer
          isOpen={false}
          onClose={vi.fn()}
          proposal={sampleProposal}
          onApplySelected={vi.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders proposal header, directives, and all proposed cards when open", () => {
      render(
        <StagedEditReviewDrawer
          isOpen={true}
          onClose={vi.fn()}
          proposal={sampleProposal}
          onApplySelected={vi.fn()}
        />
      );

      expect(screen.getByTestId("staged-edit-review-drawer")).toBeInTheDocument();
      expect(screen.getByText("Proposed Edit Plan")).toBeInTheDocument();
      expect(screen.getByText("3 Edits")).toBeInTheDocument();
      expect(
        screen.getByText(/Refined speech flow with a city drone b-roll shot/)
      ).toBeInTheDocument();
      expect(screen.getByText(/full timeline/i)).toBeInTheDocument();

      // Cards
      expect(screen.getByTestId("proposed-edit-card-edit-1")).toBeInTheDocument();
      expect(screen.getByTestId("proposed-edit-card-edit-2")).toBeInTheDocument();
      expect(screen.getByTestId("proposed-edit-card-edit-3")).toBeInTheDocument();

      // Preview thumbnail
      const previewImg = screen.getByAltText("Overlay City Drone Shot");
      expect(previewImg).toBeInTheDocument();
      expect(previewImg).toHaveAttribute(
        "src",
        "https://images.pexels.com/videos/12345/preview.jpg"
      );

      // Warning on destructive edit
      expect(
        screen.getByText("Replaces footage over this timeline span.")
      ).toBeInTheDocument();
    });

    it("allows toggling individual selection and batch controls (Select All / Clear)", () => {
      render(
        <StagedEditReviewDrawer
          isOpen={true}
          onClose={vi.fn()}
          proposal={sampleProposal}
          onApplySelected={vi.fn()}
        />
      );

      // Initially all 3 are selected
      expect(screen.getByText("3 of 3 selected")).toBeInTheDocument();
      expect(screen.getByText("Apply Selected (3)")).toBeInTheDocument();

      // Clear all
      fireEvent.click(screen.getByText("Clear"));
      expect(screen.getByText("0 of 3 selected")).toBeInTheDocument();
      expect(screen.getByText("Apply Selected (0)")).toBeDisabled();

      // Select All
      fireEvent.click(screen.getByText("Select All"));
      expect(screen.getByText("3 of 3 selected")).toBeInTheDocument();

      // Deselect first item
      const edit1Card = screen.getByTestId("proposed-edit-card-edit-1");
      const checkboxBtn = edit1Card.querySelector("button[title='Deselect edit']");
      expect(checkboxBtn).toBeTruthy();
      fireEvent.click(checkboxBtn!);

      expect(screen.getByText("2 of 3 selected")).toBeInTheDocument();
      expect(screen.getByText("Apply Selected (2)")).toBeInTheDocument();
    });

    it("calls onApplySelected with only selected edits when Apply Selected is clicked", () => {
      const handleApplySelected = vi.fn();
      render(
        <StagedEditReviewDrawer
          isOpen={true}
          onClose={vi.fn()}
          proposal={sampleProposal}
          onApplySelected={handleApplySelected}
        />
      );

      // Deselect edit 3
      const edit3Card = screen.getByTestId("proposed-edit-card-edit-3");
      const edit3Checkbox = edit3Card.querySelector("button[title='Deselect edit']");
      fireEvent.click(edit3Checkbox!);

      // Click Apply Selected (2)
      fireEvent.click(screen.getByText("Apply Selected (2)"));

      expect(handleApplySelected).toHaveBeenCalledTimes(1);
      const passedEdits: ProposedEditItem[] = handleApplySelected.mock.calls[0][0];
      expect(passedEdits).toHaveLength(2);
      expect(passedEdits.map((e) => e.id)).toEqual(["edit-1", "edit-2"]);
    });

    it("handles single card Accept and Reject controls", () => {
      const handleApplySingle = vi.fn();
      const handleRejectSingle = vi.fn();

      render(
        <StagedEditReviewDrawer
          isOpen={true}
          onClose={vi.fn()}
          proposal={sampleProposal}
          onApplySelected={vi.fn()}
          onApplySingle={handleApplySingle}
          onRejectSingle={handleRejectSingle}
        />
      );

      // Card 1: Accept
      const edit1Card = screen.getByTestId("proposed-edit-card-edit-1");
      const acceptBtn = edit1Card.querySelector("button:has(svg.lucide-check)");
      expect(acceptBtn).toBeTruthy();
      fireEvent.click(acceptBtn!);

      expect(handleApplySingle).toHaveBeenCalledTimes(1);
      expect(handleApplySingle.mock.calls[0][0].id).toBe("edit-1");
      expect(screen.getByText("Applied")).toBeInTheDocument();

      // Card 2: Reject
      const edit2Card = screen.getByTestId("proposed-edit-card-edit-2");
      const rejectBtns = screen.getAllByText("Reject");
      fireEvent.click(rejectBtns[0]); // first pending reject

      expect(handleRejectSingle).toHaveBeenCalledWith("edit-2");
      expect(screen.getByText("Skipped")).toBeInTheDocument();
    });
  });

  describe("ChatAssistantDrawer Multi-Edit & Review Integration", () => {
    it("renders multi-edit proposal banner and opens StagedEditReviewDrawer on click", async () => {
      // Mock window.scrollIntoView for JSDOM
      window.HTMLElement.prototype.scrollIntoView = vi.fn();

      // Mock fetch returning sampleProposal
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => sampleProposal,
      } as any);

      render(<ChatAssistantDrawer isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByText("AI Editing Copilot")).toBeInTheDocument();
      expect(screen.queryByTestId("staged-edit-review-drawer")).toBeNull();

      // Type a complex prompt that triggers cloud copilot
      const input = screen.getByPlaceholderText("Type an editing command...");
      fireEvent.change(input, {
        target: { value: "make an awesome dynamic edit with b-roll and lower thirds" },
      });

      const form = input.closest("form")!;
      fireEvent.submit(form);

      // Verify fetch was called with the copilot endpoint
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/editor/copilot"),
        expect.objectContaining({ method: "POST" })
      );

      // The multi-edit proposal banner should appear
      const banner = await screen.findByTestId("multi-edit-proposal-banner");
      expect(banner).toBeInTheDocument();
      expect(screen.getByText("3 Proposed Edits")).toBeInTheDocument();

      // Click "Review & Apply Changes (3)"
      const reviewBtn = screen.getByText(/Review & Apply Changes/);
      fireEvent.click(reviewBtn);

      // Now StagedEditReviewDrawer should be open and rendered in the DOM
      const drawer = screen.getByTestId("staged-edit-review-drawer");
      expect(drawer).toBeInTheDocument();
      expect(screen.getByText("Apply Selected (3)")).toBeInTheDocument();

      // Click Apply Selected (3)
      fireEvent.click(screen.getByText("Apply Selected (3)"));

      // Verify that items were dispatched to timeline tracks
      const currentTracks = useTimelineStore.getState().project.tracks;
      expect(currentTracks.brollTrack.length).toBeGreaterThan(0);
      expect(currentTracks.brollTrack[0].name).toBe("City Drone Shot");

      // Verify undo works on the entire batch atomically
      useTimelineStore.getState().undo();
      const undoneTracks = useTimelineStore.getState().project.tracks;
      expect(undoneTracks.brollTrack.length).toBe(0);

      global.fetch = originalFetch;
    });

    it("renders inline proposal card for single-edit copilot responses and applies on click", async () => {
      window.HTMLElement.prototype.scrollIntoView = vi.fn();

      const singleProposal: EditPlanProposal = {
        id: "prop-single-1",
        user_prompt: "Find and insert a tech office b-roll clip",
        summary: "Sourced high quality tech office b-roll from Pexels.",
        scope: "playhead",
        total_duration_seconds: 4.0,
        edits: [sampleProposal.edits[0]], // only the broll clip
      };

      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => singleProposal,
      } as any);

      render(<ChatAssistantDrawer isOpen={true} onClose={vi.fn()} />);

      const input = screen.getByPlaceholderText("Type an editing command...");
      fireEvent.change(input, {
        target: { value: "Find and insert a tech office b-roll clip" },
      });
      const form = input.closest("form")!;
      fireEvent.submit(form);

      // Inline card should appear
      const inlineCard = await screen.findByTestId("inline-proposal-card");
      expect(inlineCard).toBeInTheDocument();
      expect(screen.getByText("Overlay City Drone Shot")).toBeInTheDocument();
      expect(screen.getByText("Accept to Timeline")).toBeInTheDocument();

      // Click Accept to Timeline
      fireEvent.click(screen.getByText("Accept to Timeline"));

      // Check timeline has item
      const brollClips = useTimelineStore.getState().project.tracks.brollTrack;
      expect(brollClips).toHaveLength(1);
      expect(brollClips[0].name).toBe("City Drone Shot");

      expect(screen.getByText("Applied to Timeline")).toBeInTheDocument();

      global.fetch = originalFetch;
    });
  });
});
