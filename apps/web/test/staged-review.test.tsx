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

    describe("Phase 5: Interactive Parameter Customizer", () => {
      it("expands and collapses the parameter customizer on clicking Customize / Hide Controls", () => {
        render(
          <StagedEditReviewDrawer
            isOpen={true}
            onClose={vi.fn()}
            proposal={sampleProposal}
            onApplySelected={vi.fn()}
          />
        );

        expect(screen.queryByTestId("customizer-panel-edit-1")).toBeNull();

        const customizeBtn = screen.getByTestId("customize-edit-btn-edit-1");
        expect(customizeBtn).toHaveTextContent("Customize");

        // Expand
        fireEvent.click(customizeBtn);
        expect(screen.getByTestId("customizer-panel-edit-1")).toBeInTheDocument();
        expect(customizeBtn).toHaveTextContent("Hide Controls");

        // Collapse
        fireEvent.click(customizeBtn);
        expect(screen.queryByTestId("customizer-panel-edit-1")).toBeNull();
        expect(customizeBtn).toHaveTextContent("Customize");
      });

      it("allows adjusting timing range (start/end) and propagates timestamps on accept", () => {
        const handleApplySingle = vi.fn();
        render(
          <StagedEditReviewDrawer
            isOpen={true}
            onClose={vi.fn()}
            proposal={sampleProposal}
            onApplySelected={vi.fn()}
            onApplySingle={handleApplySingle}
          />
        );

        fireEvent.click(screen.getByTestId("customize-edit-btn-edit-1"));

        const startInput = screen.getByTestId("timing-start-input-edit-1");
        const endInput = screen.getByTestId("timing-end-input-edit-1");

        // Modify start to 3.0 and end to 7.5
        fireEvent.change(startInput, { target: { value: "3.0" } });
        fireEvent.change(endInput, { target: { value: "7.5" } });

        // Check updated display text in the card
        expect(screen.getByText(/3.0s – 7.5s \(4.5s\)/)).toBeInTheDocument();

        // Accept single
        const edit1Card = screen.getByTestId("proposed-edit-card-edit-1");
        const acceptBtn = edit1Card.querySelector("button:has(svg.lucide-check)")!;
        fireEvent.click(acceptBtn);

        expect(handleApplySingle).toHaveBeenCalledTimes(1);
        const applied = handleApplySingle.mock.calls[0][0];
        expect(applied.start).toBe(3.0);
        expect(applied.end).toBe(7.5);
        expect(applied.operation.element.start).toBe(3.0);
        expect(applied.operation.element.end).toBe(7.5);
      });

      it("switches template between Stock B-Roll and App Screen Upload", () => {
        const handleApplySingle = vi.fn();
        render(
          <StagedEditReviewDrawer
            isOpen={true}
            onClose={vi.fn()}
            proposal={sampleProposal}
            onApplySelected={vi.fn()}
            onApplySingle={handleApplySingle}
          />
        );

        // edit-1 is initially a B-Roll edit
        fireEvent.click(screen.getByTestId("customize-edit-btn-edit-1"));
        expect(screen.getByTestId("customizer-panel-edit-1")).toBeInTheDocument();

        // Click App Upload template button
        const appUploadBtn = screen.getByTestId("template-btn-app-upload-edit-1");
        fireEvent.click(appUploadBtn);

        // Prop editor for App Screen Upload should now appear
        expect(screen.getByTestId("prop-app-name-edit-1")).toBeInTheDocument();
        expect(screen.getByTestId("prop-file-name-edit-1")).toBeInTheDocument();

        // Accept and verify applied item structure
        const edit1Card = screen.getByTestId("proposed-edit-card-edit-1");
        const acceptBtn = edit1Card.querySelector("button:has(svg.lucide-check)")!;
        fireEvent.click(acceptBtn);

        expect(handleApplySingle).toHaveBeenCalledTimes(1);
        const applied = handleApplySingle.mock.calls[0][0];
        expect(applied.action_type).toBe("graphic");
        expect(applied.track).toBe("graphic");
        expect(applied.operation.element.compositionId).toBe("app-screen-upload");
        expect(applied.operation.element.props.appName).toBe("Video Studio App");
      });

      it("allows inline prop editing of App Screen Upload and dispatches custom values", () => {
        const handleApplySingle = vi.fn();
        const appUploadProposal: EditPlanProposal = {
          ...sampleProposal,
          edits: [
            {
              id: "edit-app-1",
              action_type: "graphic",
              title: "App Screen Upload",
              track: "graphic",
              start: 1.0,
              end: 5.0,
              description: "Shows user uploading file",
              operation: {
                type: "add_element",
                track: "graphic",
                element: {
                  id: "elem-app-1",
                  name: "App Screen Upload",
                  compositionId: "app-screen-upload",
                  props: {
                    appName: "Default App",
                    fileName: "test.mp4",
                    progress: 50,
                    status: "Uploading...",
                  },
                  start: 1.0,
                  end: 5.0,
                },
              },
            },
          ],
        };

        render(
          <StagedEditReviewDrawer
            isOpen={true}
            onClose={vi.fn()}
            proposal={appUploadProposal}
            onApplySelected={vi.fn()}
            onApplySingle={handleApplySingle}
          />
        );

        fireEvent.click(screen.getByTestId("customize-edit-btn-edit-app-1"));

        // Edit appName
        const appNameInput = screen.getByTestId("prop-app-name-edit-app-1");
        fireEvent.change(appNameInput, { target: { value: "Super Studio Pro" } });

        // Edit fileName
        const fileNameInput = screen.getByTestId("prop-file-name-edit-app-1");
        fireEvent.change(fileNameInput, { target: { value: "final_presentation.mov" } });

        // Edit progress
        const progressSlider = screen.getByTestId("prop-progress-slider-edit-app-1");
        fireEvent.change(progressSlider, { target: { value: "95" } });

        // Edit status
        const statusInput = screen.getByTestId("prop-status-edit-app-1");
        fireEvent.change(statusInput, { target: { value: "Almost Ready!" } });

        // Accept
        const card = screen.getByTestId("proposed-edit-card-edit-app-1");
        const acceptBtn = card.querySelector("button:has(svg.lucide-check)")!;
        fireEvent.click(acceptBtn);

        expect(handleApplySingle).toHaveBeenCalledTimes(1);
        const applied = handleApplySingle.mock.calls[0][0];
        expect(applied.operation.element.props.appName).toBe("Super Studio Pro");
        expect(applied.operation.element.props.fileName).toBe("final_presentation.mov");
        expect(applied.operation.element.props.progress).toBe(95);
        expect(applied.operation.element.props.status).toBe("Almost Ready!");
      });

      it("switches to Web Capture and edits web evidence parameters", () => {
        const handleApplySingle = vi.fn();
        render(
          <StagedEditReviewDrawer
            isOpen={true}
            onClose={vi.fn()}
            proposal={sampleProposal}
            onApplySelected={vi.fn()}
            onApplySingle={handleApplySingle}
          />
        );

        fireEvent.click(screen.getByTestId("customize-edit-btn-edit-1"));

        // Switch to Web Capture
        fireEvent.click(screen.getByTestId("template-btn-browser-edit-1"));

        // Edit web inputs
        const urlInput = screen.getByTestId("prop-web-url-edit-1");
        fireEvent.change(urlInput, { target: { value: "https://github.com/trending" } });

        const tabInput = screen.getByTestId("prop-web-tab-edit-1");
        fireEvent.change(tabInput, { target: { value: "GitHub Trending" } });

        const highlightInput = screen.getByTestId("prop-web-highlight-edit-1");
        fireEvent.change(highlightInput, { target: { value: "Top Repository" } });

        // Select Phone (9:16) format
        const phoneFormatBtn = screen.getByTestId("prop-web-format-9-16-edit-1");
        fireEvent.click(phoneFormatBtn);

        // Accept
        const card = screen.getByTestId("proposed-edit-card-edit-1");
        const acceptBtn = card.querySelector("button:has(svg.lucide-check)")!;
        fireEvent.click(acceptBtn);

        expect(handleApplySingle).toHaveBeenCalledTimes(1);
        const applied = handleApplySingle.mock.calls[0][0];
        expect(applied.operation.element.compositionId).toBe("browser-walkthrough");
        expect(applied.operation.element.props.url).toBe("https://github.com/trending");
        expect(applied.operation.element.props.tabTitle).toBe("GitHub Trending");
        expect(applied.operation.element.props.highlightText).toBe("Top Repository");
        expect(applied.operation.element.props.format).toBe("9:16");
        expect(applied.operation.element.props.aspectRatio).toBe("9:16");
      });

      it("preserves customized parameters across batch Apply Selected", () => {
        const handleApplySelected = vi.fn();
        render(
          <StagedEditReviewDrawer
            isOpen={true}
            onClose={vi.fn()}
            proposal={sampleProposal}
            onApplySelected={handleApplySelected}
          />
        );

        // Customize edit-1: change start to 3.5, switch to app-screen-upload
        fireEvent.click(screen.getByTestId("customize-edit-btn-edit-1"));
        fireEvent.change(screen.getByTestId("timing-start-input-edit-1"), {
          target: { value: "3.5" },
        });
        fireEvent.click(screen.getByTestId("template-btn-app-upload-edit-1"));
        fireEvent.change(screen.getByTestId("prop-app-name-edit-1"), {
          target: { value: "Batch App" },
        });

        // Customize edit-2: change end to 8.0
        fireEvent.click(screen.getByTestId("customize-edit-btn-edit-2"));
        fireEvent.change(screen.getByTestId("timing-end-input-edit-2"), {
          target: { value: "8.0" },
        });

        // Deselect edit-3 so only edit-1 and edit-2 are applied
        const edit3Card = screen.getByTestId("proposed-edit-card-edit-3");
        fireEvent.click(edit3Card.querySelector("button[title='Deselect edit']")!);

        // Click Apply Selected (2)
        fireEvent.click(screen.getByText("Apply Selected (2)"));

        expect(handleApplySelected).toHaveBeenCalledTimes(1);
        const appliedBatch: ProposedEditItem[] = handleApplySelected.mock.calls[0][0];
        expect(appliedBatch).toHaveLength(2);

        // Verify edit-1 customized values
        const batchEdit1 = appliedBatch.find((e) => e.id === "edit-1")!;
        expect(batchEdit1.start).toBe(3.5);
        expect(batchEdit1.operation.element.compositionId).toBe("app-screen-upload");
        expect(batchEdit1.operation.element.props.appName).toBe("Batch App");

        // Verify edit-2 customized values
        const batchEdit2 = appliedBatch.find((e) => e.id === "edit-2")!;
        expect(batchEdit2.end).toBe(8.0);
        expect(batchEdit2.operation.element.end).toBe(8.0);
      });
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

    it("renders suggested_actions quick-action chips on conversational fallback and allows user selection", async () => {
      window.HTMLElement.prototype.scrollIntoView = vi.fn();

      const fallbackProposal: EditPlanProposal = {
        id: "prop-fallback-1",
        user_prompt: "can you make this look much more aesthetic and vibrant",
        summary: "Could not determine exact edit type for 'can you make this look much more aesthetic and vibrant'. Please select a visual action below.",
        scope: "time_range",
        total_duration_seconds: 60.0,
        edits: [],
        suggested_actions: ["Add stock video footage", "Add animated motion card", "Add subtitle caption"],
      };

      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => fallbackProposal,
      } as any);

      render(<ChatAssistantDrawer isOpen={true} onClose={vi.fn()} />);

      const input = screen.getByPlaceholderText("Type an editing command...");
      fireEvent.change(input, {
        target: { value: "can you make this look much more aesthetic and vibrant" },
      });
      const form = input.closest("form")!;
      fireEvent.submit(form);

      const actionGroup = await screen.findByTestId("copilot-suggested-actions");
      expect(actionGroup).toBeInTheDocument();
      expect(screen.getByText("Add stock video footage")).toBeInTheDocument();
      expect(screen.getByText("Add animated motion card")).toBeInTheDocument();
      expect(screen.getByText("Add subtitle caption")).toBeInTheDocument();

      // Click one of the suggested action chips
      fireEvent.click(screen.getByText("Add stock video footage"));

      // Verify fetch was dispatched again with the clicked action
      expect(global.fetch).toHaveBeenCalledTimes(2);

      global.fetch = originalFetch;
    });
  });
});
