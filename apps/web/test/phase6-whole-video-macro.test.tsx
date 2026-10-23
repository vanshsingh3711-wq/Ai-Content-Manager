import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { StagedEditReviewDrawer } from "../components/editor/StagedEditReviewDrawer";
import { TranscriptDrawer } from "../components/editor/TranscriptDrawer";
import { parseLocalCommand } from "../lib/ai/local-command-parser";
import { assembleEditorContext } from "../lib/ai/editor-context";
import { useTimelineStore } from "../lib/stores/useTimelineStore";
import { TimelineProject, CaptionBlock } from "../lib/timeline-types";
import { EditPlanProposal } from "../lib/ai/copilot-types";

describe("Phase 6: Whole-Video Macro Editing & Transcript Intelligence", () => {
  const initialProject: TimelineProject = {
    id: "proj-phase6-test",
    title: "Phase 6 Macro Project",
    duration: 60.0,
    fps: 30,
    aspectRatio: "9:16",
    tracks: {
      videoTrack: [
        {
          id: "vid-main",
          name: "Speaker Footage",
          src: "/media/speaker.mp4",
          start: 0,
          end: 60.0,
        },
      ],
      brollTrack: [],
      audioTrack: [
        {
          id: "aud-main",
          name: "Narration Audio",
          sourceUrl: "/media/narration.mp3",
          start: 0,
          end: 60.0,
          volume: 100,
          fadeIn: 0,
          fadeOut: 0,
          isBgm: false,
        },
      ],
      graphicsTrack: [],
      textTrack: [
        {
          id: "cap-1",
          text: "Welcome to automated editing",
          start: 0.5,
          end: 4.0,
          stylePreset: "clean_white",
          position: { x: 50, y: 75 },
          scale: 1.0,
        },
        {
          id: "cap-2",
          text: "Create viral shorts fast",
          start: 4.5,
          end: 9.0,
          stylePreset: "clean_white",
          position: { x: 50, y: 75 },
          scale: 1.0,
        },
      ],
    },
    transitions: [],
    transcript: {
      words: [
        { word: "Welcome", start: 0.5, end: 1.1, probability: 0.99 },
        { word: "to", start: 1.15, end: 1.35, probability: 0.99 },
        { word: "automated", start: 1.4, end: 2.2, probability: 0.98 },
        { word: "editing", start: 2.25, end: 3.0, probability: 0.97 },
        { word: "Create", start: 4.5, end: 5.1, probability: 0.99 },
        { word: "viral", start: 5.15, end: 5.7, probability: 0.98 },
        { word: "shorts", start: 5.75, end: 6.4, probability: 0.98 },
        { word: "fast", start: 6.45, end: 7.2, probability: 0.97 },
      ],
      beatSheet: {
        beats: [
          { id: 1, start: 0.5, end: 4.0, text: "Welcome to automated editing", role: "hook", energy: "high", importance: 5 },
          { id: 2, start: 4.5, end: 9.0, text: "Create viral shorts fast", role: "story", energy: "medium", importance: 4 },
        ],
      },
    },
  };

  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    useTimelineStore.getState().initProject(initialProject);
    useTimelineStore.getState().setPlayheadTime(0.0);
    vi.restoreAllMocks();
  });

  describe("1. Kinetic Captions Styler — Local Command Parser", () => {
    it("parses 'apply tiktok caption style' and generates a batch update for all captions", () => {
      const state = useTimelineStore.getState();
      const ctx = assembleEditorContext(state.project, state.playheadTime, state.selectedItem);

      const result = parseLocalCommand("apply tiktok caption style", ctx);
      expect(result.matched).toBe(true);
      expect(result.operation?.type).toBe("batch");

      // Dispatch operation to store
      state.dispatchOperation(result.operation!);

      const updatedTextTrack = useTimelineStore.getState().project.tracks.textTrack;
      expect(updatedTextTrack[0].stylePreset).toBe("tiktok_yellow");
      expect(updatedTextTrack[1].stylePreset).toBe("tiktok_yellow");

      // Verify 1-step atomic undo restores original clean_white style
      useTimelineStore.getState().undo();
      const revertedTextTrack = useTimelineStore.getState().project.tracks.textTrack;
      expect(revertedTextTrack[0].stylePreset).toBe("clean_white");
      expect(revertedTextTrack[1].stylePreset).toBe("clean_white");
    });

    it("parses 'switch subtitles to hormozi bold'", () => {
      const state = useTimelineStore.getState();
      const ctx = assembleEditorContext(state.project, state.playheadTime, state.selectedItem);

      const result = parseLocalCommand("switch subtitles to hormozi bold", ctx);
      expect(result.matched).toBe(true);
      expect(result.operation?.type).toBe("batch");

      state.dispatchOperation(result.operation!);
      const updated = useTimelineStore.getState().project.tracks.textTrack;
      expect(updated[0].stylePreset).toBe("hormozi_bold");
      expect(updated[1].stylePreset).toBe("hormozi_bold");
    });

    it("parses 'switch captions to neon glow'", () => {
      const state = useTimelineStore.getState();
      const ctx = assembleEditorContext(state.project, state.playheadTime, state.selectedItem);

      const result = parseLocalCommand("switch captions to neon glow", ctx);
      expect(result.matched).toBe(true);
      expect(result.operation?.type).toBe("batch");

      state.dispatchOperation(result.operation!);
      const updated = useTimelineStore.getState().project.tracks.textTrack;
      expect(updated[0].stylePreset).toBe("neon_glow");
      expect(updated[1].stylePreset).toBe("neon_glow");
    });
  });

  describe("2. Kinetic Captions Styler — TranscriptDrawer UI Integration", () => {
    it("renders caption style buttons and applies TikTok Yellow style on click", () => {
      render(<TranscriptDrawer />);

      // Find and click TikTok Yellow style preset button
      const tiktokBtn = screen.getByTestId("caption-style-tiktok_yellow");
      expect(tiktokBtn).toBeDefined();

      fireEvent.click(tiktokBtn);

      const textTrack = useTimelineStore.getState().project.tracks.textTrack;
      expect(textTrack[0].stylePreset).toBe("tiktok_yellow");
      expect(textTrack[1].stylePreset).toBe("tiktok_yellow");
    });

    it("switches to Hormozi Bold when clicking Hormozi preset button", () => {
      render(<TranscriptDrawer />);

      const hormoziBtn = screen.getByTestId("caption-style-hormozi_bold");
      fireEvent.click(hormoziBtn);

      const textTrack = useTimelineStore.getState().project.tracks.textTrack;
      expect(textTrack[0].stylePreset).toBe("hormozi_bold");
      expect(textTrack[1].stylePreset).toBe("hormozi_bold");
    });

    it("generates caption blocks from transcript words if textTrack is empty", () => {
      // Clear captions track
      useTimelineStore.setState((s) => ({
        project: {
          ...s.project,
          tracks: { ...s.project.tracks, textTrack: [] },
        },
      }));

      render(<TranscriptDrawer />);

      const neonBtn = screen.getByTestId("caption-style-neon_glow");
      fireEvent.click(neonBtn);

      const textTrack = useTimelineStore.getState().project.tracks.textTrack;
      expect(textTrack.length).toBeGreaterThan(0);
      expect(textTrack[0].stylePreset).toBe("neon_glow");
    });
  });

  describe("3. Transcript Click-to-Seek & Interactive Word Editing", () => {
    it("seeks playhead when a transcript word is clicked", () => {
      render(<TranscriptDrawer />);

      const wordSpan = screen.getByTestId("transcript-word-4.5");
      expect(wordSpan).toBeDefined();

      fireEvent.click(wordSpan);

      expect(useTimelineStore.getState().playheadTime).toBe(4.5);
    });

    it("seeks playhead when clicking storytelling script beats", () => {
      render(<TranscriptDrawer />);

      const storyBeatChip = screen.getByTestId("beat-chip-story");
      expect(storyBeatChip).toBeDefined();

      fireEvent.click(storyBeatChip);

      expect(useTimelineStore.getState().playheadTime).toBe(4.5);
    });

    it("allows editing transcript word and synchronizes overlapping caption", () => {
      render(<TranscriptDrawer />);

      // Seek to first word
      act(() => {
        useTimelineStore.getState().setPlayheadTime(0.5);
      });

      // Quick edit active word
      const editBtn = screen.getByTestId("quick-edit-word-btn");
      expect(editBtn).toBeDefined();
      fireEvent.click(editBtn);

      const editInput = screen.getByTestId("edit-word-input");
      expect(editInput).toBeDefined();

      fireEvent.change(editInput, { target: { value: "Greetings" } });

      const saveBtn = screen.getByTestId("save-word-edit-btn");
      fireEvent.click(saveBtn);

      // Verify transcript words updated
      const words = useTimelineStore.getState().project.transcript?.words || [];
      expect(words[0].word).toBe("Greetings");

      // Verify overlapping caption text was synchronized
      const caption = useTimelineStore.getState().project.tracks.textTrack[0];
      expect(caption.text).toContain("Greetings");
    });
  });

  describe("4. Acceptance Test E — Whole-Video Macro Plan Execution & Atomic Undo", () => {
    const proposalProposalE: EditPlanProposal = {
      id: "plan-macro-test-e",
      user_prompt: "Add relevant B-roll and subtle graphics to the important sections throughout this video",
      scope: "whole_video",
      summary: "Generated 8 macro edits (3 B-roll, 2 graphics, 2 SFX, 1 transition)",
      created_at: "2026-10-20T12:00:00Z",
      total_duration_seconds: 60.0,
      edits: [
        {
          id: "edit-1",
          action_type: "broll",
          start: 2.0,
          end: 5.5,
          track: "broll",
          title: "B-Roll: Coding Screen",
          description: "Developer typing code",
          reason: "Illustrates software development",
          operation: {
            type: "add_element",
            track: "broll",
            element: { id: "broll-e-1", name: "Code Screen", start: 2.0, end: 5.5 },
          },
        },
        {
          id: "edit-2",
          action_type: "sfx",
          start: 2.05,
          end: 2.55,
          track: "audio",
          title: "SFX: Whoosh In",
          description: "Visual entry accent",
          reason: "Punchy audio entrance",
          operation: {
            type: "add_element",
            track: "audio",
            element: { id: "sfx-e-1", name: "Whoosh", start: 2.05, end: 2.55, volume: 80 },
          },
        },
        {
          id: "edit-3",
          action_type: "graphic",
          start: 12.0,
          end: 15.5,
          track: "graphic",
          title: "Motion Card: Hero Reveal",
          description: "Introductory thesis statement",
          reason: "Emphasizes core strategy",
          operation: {
            type: "add_element",
            track: "graphic",
            element: { id: "mg-e-1", name: "Hero Reveal", compositionId: "hero_reveal", start: 12.0, end: 15.5 },
          },
        },
        {
          id: "edit-4",
          action_type: "broll",
          start: 20.0,
          end: 23.5,
          track: "broll",
          title: "B-Roll: Collaborative Team",
          description: "Engineers collaborating",
          reason: "Shows teamwork",
          operation: {
            type: "add_element",
            track: "broll",
            element: { id: "broll-e-2", name: "Dev Team", start: 20.0, end: 23.5 },
          },
        },
        {
          id: "edit-5",
          action_type: "transition",
          start: 28.0,
          end: 28.5,
          track: "video",
          title: "Transition: Crossfade",
          description: "Midpoint section transition",
          reason: "Smooth chapter change",
          operation: {
            type: "add_transition",
            id: "trans-e-1",
            track: "video",
            fromClipId: "vid-main",
            toClipId: "vid-main",
            preset: "crossfade",
            duration: 0.5,
            alignment: "center",
          },
        },
        {
          id: "edit-6",
          action_type: "graphic",
          start: 32.0,
          end: 35.5,
          track: "graphic",
          title: "Motion Card: Metric Reveal",
          description: "Growth statistics",
          reason: "Highlights ROI impact",
          operation: {
            type: "add_element",
            track: "graphic",
            element: { id: "mg-e-2", name: "Metric Reveal", compositionId: "metric_reveal", start: 32.0, end: 35.5 },
          },
        },
        {
          id: "edit-7",
          action_type: "sfx",
          start: 32.05,
          end: 32.55,
          track: "audio",
          title: "SFX: Ding",
          description: "Celebratory chime",
          reason: "Punches up metric stat",
          operation: {
            type: "add_element",
            track: "audio",
            element: { id: "sfx-e-2", name: "Ding", start: 32.05, end: 32.55, volume: 80 },
          },
        },
        {
          id: "edit-8",
          action_type: "broll",
          start: 42.0,
          end: 45.5,
          track: "broll",
          title: "B-Roll: Modern Workspace",
          description: "Clean desk setup",
          reason: "Final narrative anchor",
          operation: {
            type: "add_element",
            track: "broll",
            element: { id: "broll-e-3", name: "Modern Desk", start: 42.0, end: 45.5 },
          },
        },
      ],
    };

    it("verifies Acceptance Test E criteria: unchecks 1 edit, applies 7, and atomically reverts with Ctrl+Z", () => {
      const onApplySelectedMock = vi.fn((selectedEdits) => {
        const ops = selectedEdits.map((e: any) => e.operation);
        useTimelineStore.getState().dispatchBatch(ops, "Apply Whole-Video Proposal");
      });

      render(
        <StagedEditReviewDrawer
          isOpen={true}
          proposal={proposalProposalE}
          onApplySelected={onApplySelectedMock}
          onClose={vi.fn()}
        />
      );

      // Verify 8 edits rendered
      expect(screen.getByText("8 Edits")).toBeDefined();

      // Acceptance Test E: Uncheck 1 edit (e.g. edit-8)
      const edit8Checkbox = screen.getByTestId("checkbox-edit-8");
      fireEvent.click(edit8Checkbox);

      // Click Apply Selected (7 edits)
      const applyBtn = screen.getByTestId("apply-selected-btn");
      expect(applyBtn.textContent).toContain("Apply Selected (7)");
      fireEvent.click(applyBtn);

      expect(onApplySelectedMock).toHaveBeenCalledTimes(1);
      const passedEdits = onApplySelectedMock.mock.calls[0][0];
      expect(passedEdits.length).toBe(7);
      expect(passedEdits.find((e: any) => e.id === "edit-8")).toBeUndefined();

      // Verify the 7 elements/transitions are dispatched to timeline
      const stateAfter = useTimelineStore.getState().project;
      expect(stateAfter.tracks.brollTrack.length).toBe(2); // broll-1 and broll-2 applied (broll-3 unchecked)
      expect(stateAfter.tracks.graphicsTrack.length).toBe(2);
      expect(stateAfter.tracks.audioTrack.length).toBe(3); // 1 narration + 2 SFX
      expect(stateAfter.transitions.length).toBe(1);

      // Acceptance Test E step 4: 1-step undo (Ctrl+Z) removes all applied edits cleanly
      useTimelineStore.getState().undo();

      const stateAfterUndo = useTimelineStore.getState().project;
      expect(stateAfterUndo.tracks.brollTrack.length).toBe(0);
      expect(stateAfterUndo.tracks.graphicsTrack.length).toBe(0);
      expect(stateAfterUndo.tracks.audioTrack.length).toBe(1); // Only original narration remains
      expect(stateAfterUndo.transitions.length).toBe(0);
    });
  });
});
