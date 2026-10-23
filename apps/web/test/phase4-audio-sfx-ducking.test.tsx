import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { parseLocalCommand } from "../lib/ai/local-command-parser";
import { assembleEditorContext } from "../lib/ai/editor-context";
import {
  executeOperation,
  createInverseOperation,
} from "../lib/operations/operation-executor";
import { TimelineProject } from "../lib/timeline-types";
import { StagedEditReviewDrawer } from "../components/editor/StagedEditReviewDrawer";
import { EditPlanProposal, ProposedEditItem } from "../lib/ai/copilot-types";

describe("Phase 4: Audio Engineering, SFX Placement, & Narration Ducking", () => {
  const initialProject: TimelineProject = {
    id: "proj-phase4-test",
    title: "Phase 4 Audio Test Reel",
    aspectRatio: "9:16",
    duration: 30.0,
    fps: 30,
    tracks: {
      videoTrack: [
        {
          id: "vid-main",
          name: "Main Talking Head",
          sourceUrl: "https://example.com/talking_head.mp4",
          start: 0,
          end: 30.0,
          sourceStart: 0,
          sourceEnd: 30.0,
          speed: 1,
          volume: 100,
          zoomFactor: 1,
        },
      ],
      brollTrack: [],
      textTrack: [],
      audioTrack: [],
      graphicsTrack: [
        {
          id: "headline-1",
          name: "Breaking News Headline",
          compositionId: "hero_reveal",
          start: 12.0,
          end: 16.0,
          props: { headline: "AI Video Editing" },
          position: { x: 50, y: 75 },
          scale: 1.0,
        },
      ],
    },
  };

  describe("1. Acceptance Test D.1: SFX Prompt Parsing & Execution", () => {
    it("parses 'Add a subtle whoosh sound when the headline enters between 00:12 and 00:13'", () => {
      const context = assembleEditorContext(initialProject, 0.0, null);
      const res = parseLocalCommand(
        "Add a subtle whoosh sound when the headline enters between 00:12 and 00:13",
        context
      );

      expect(res.matched).toBe(true);
      expect(res.operation?.type).toBe("add_element");
      const op = res.operation as any;
      expect(op.track).toBe("audio");
      expect(op.element.start).toBe(12.0);
      expect(op.element.end).toBe(13.0);
      expect(op.element.sourceUrl).toBe("/assets/audio/whoosh.mp3");
      expect(op.element.isBgm).toBe(false);
      expect(op.element.volume).toBe(65); // subtle volume
    });

    it("parses 'Add a subtle whoosh when the headline enters between 00:12 and 00:13' without explicit 'sound' word", () => {
      const context = assembleEditorContext(initialProject, 0.0, null);
      const res = parseLocalCommand(
        "Add a subtle whoosh when the headline enters between 00:12 and 00:13",
        context
      );

      expect(res.matched).toBe(true);
      expect(res.operation?.type).toBe("add_element");
      const op = res.operation as any;
      expect(op.track).toBe("audio");
      expect(op.element.start).toBe(12.0);
      expect(op.element.end).toBe(13.0);
      expect(op.element.sourceUrl).toBe("/assets/audio/whoosh.mp3");
    });

    it("executes add_element for SFX and produces exact delete_element inverse", () => {
      const context = assembleEditorContext(initialProject, 0.0, null);
      const parseRes = parseLocalCommand(
        "Add a subtle whoosh sound when the headline enters between 00:12 and 00:13",
        context
      );

      const { nextProject, inverse } = executeOperation(initialProject, parseRes.operation!);

      expect(nextProject.tracks.audioTrack).toHaveLength(1);
      const sfxClip = nextProject.tracks.audioTrack[0];
      expect(sfxClip.start).toBe(12.0);
      expect(sfxClip.end).toBe(13.0);
      expect(sfxClip.sourceUrl).toBe("/assets/audio/whoosh.mp3");

      // Verify exact inverse operation
      expect(inverse.type).toBe("delete_element");
      expect((inverse as any).targetId).toBe(sfxClip.id);
      expect((inverse as any).targetType).toBe("audio");

      // Applying inverse restores project cleanly to 0 audio clips
      const restored = executeOperation(nextProject, inverse).nextProject;
      expect(restored.tracks.audioTrack).toHaveLength(0);
    });
  });

  describe("2. Acceptance Test D.2: BGM with Speech Ducking", () => {
    it("parses 'Add chill background music and duck it whenever I speak'", () => {
      const context = assembleEditorContext(initialProject, 0.0, null);
      const res = parseLocalCommand(
        "Add chill background music and duck it whenever I speak",
        context
      );

      expect(res.matched).toBe(true);
      expect(res.operation?.type).toBe("add_element");
      const op = res.operation as any;
      expect(op.track).toBe("audio");
      expect(op.element.start).toBe(0.0);
      expect(op.element.end).toBe(30.0);
      expect(op.element.sourceUrl).toBe("/assets/audio/chill-bgm.mp3");
      expect(op.element.isBgm).toBe(true);
      expect(op.element.ducking).toBe(true);
      expect(op.element.duckingDb).toBe(-14.0);
      expect(op.element.volume).toBe(35);
      expect(op.element.fadeIn).toBe(1.0);
      expect(op.element.fadeOut).toBe(1.5);
    });

    it("executes BGM addition and cleanly inverts back to empty audioTrack", () => {
      const context = assembleEditorContext(initialProject, 0.0, null);
      const parseRes = parseLocalCommand(
        "Add chill background music and duck it whenever I speak",
        context
      );

      const { nextProject, inverse } = executeOperation(initialProject, parseRes.operation!);

      expect(nextProject.tracks.audioTrack).toHaveLength(1);
      const bgmClip = nextProject.tracks.audioTrack[0];
      expect(bgmClip.isBgm).toBe(true);
      expect(bgmClip.ducking).toBe(true);
      expect(bgmClip.duckingDb).toBe(-14.0);

      // Verify inverse deletes the BGM
      const restored = executeOperation(nextProject, inverse).nextProject;
      expect(restored.tracks.audioTrack).toHaveLength(0);
    });
  });

  describe("3. StagedEditReviewDrawer Inline Audio Customizer", () => {
    it("renders audio customizer controls and allows adjusting volume and ducking", () => {
      const stagedEdit: ProposedEditItem = {
        id: "edit-bgm-1",
        action_type: "audio",
        start: 0.0,
        end: 30.0,
        track: "audio",
        title: "Chill Background Music (Ducked)",
        description: "Background music with speech ducking.",
        reason: "User requested chill background music.",
        status: "pending",
        operation: {
          type: "add_element",
          track: "audio",
          element: {
            id: "audio-bgm-1",
            name: "Chill Background Music",
            start: 0.0,
            end: 30.0,
            sourceUrl: "/assets/audio/chill-bgm.mp3",
            volume: 35,
            isBgm: true,
            ducking: true,
            duckingDb: -14.0,
          },
        },
      };

      const proposal: EditPlanProposal = {
        plan_id: "plan-phase4-audio",
        user_prompt: "Add chill background music and duck it whenever I speak",
        scope: "whole_video",
        summary: "Prepared chill background music with -14dB narration ducking.",
        edits: [stagedEdit],
      };

      const onUpdateEdit = vi.fn();

      render(
        <StagedEditReviewDrawer
          isOpen={true}
          onClose={vi.fn()}
          proposal={proposal}
          onApplySelected={vi.fn()}
          onUpdateEdit={onUpdateEdit}
        />
      );

      // Expand parameter customizer
      const customizeBtn = screen.getByTestId("customize-edit-btn-edit-bgm-1");
      fireEvent.click(customizeBtn);

      // Verify audio customizer is rendered
      expect(screen.getByTestId("audio-customizer-edit-bgm-1")).toBeInTheDocument();
      expect(screen.getByTestId("audio-volume-display-edit-bgm-1")).toHaveTextContent("35%");

      // Toggle ducking
      const duckingBtn = screen.getByTestId("ducking-toggle-edit-bgm-1");
      expect(duckingBtn).toHaveTextContent("ENABLED (-14dB)");

      fireEvent.click(duckingBtn);
      expect(onUpdateEdit).toHaveBeenCalled();
    });

    it("renders SFX preset picker and allows switching sound effect presets", () => {
      const stagedSfx: ProposedEditItem = {
        id: "edit-sfx-1",
        action_type: "sfx",
        start: 12.0,
        end: 13.0,
        track: "audio",
        title: "Whoosh SFX",
        description: "Whoosh accent.",
        reason: "User requested whoosh sound.",
        status: "pending",
        operation: {
          type: "add_element",
          track: "audio",
          element: {
            id: "audio-sfx-1",
            name: "Whoosh SFX",
            start: 12.0,
            end: 13.0,
            sourceUrl: "/assets/audio/whoosh.mp3",
            volume: 80,
            isBgm: false,
          },
        },
      };

      const proposal: EditPlanProposal = {
        plan_id: "plan-phase4-sfx",
        user_prompt: "Add subtle whoosh between 00:12 and 00:13",
        scope: "time_range",
        summary: "Prepared whoosh SFX.",
        edits: [stagedSfx],
      };

      const onUpdateEdit = vi.fn();

      render(
        <StagedEditReviewDrawer
          isOpen={true}
          onClose={vi.fn()}
          proposal={proposal}
          onApplySelected={vi.fn()}
          onUpdateEdit={onUpdateEdit}
        />
      );

      // Expand parameter customizer
      const customizeBtn = screen.getByTestId("customize-edit-btn-edit-sfx-1");
      fireEvent.click(customizeBtn);

      // Verify SFX presets are rendered
      expect(screen.getByTestId("sfx-preset-whoosh-edit-sfx-1")).toBeInTheDocument();
      expect(screen.getByTestId("sfx-preset-pop-edit-sfx-1")).toBeInTheDocument();
      expect(screen.getByTestId("sfx-preset-chime-edit-sfx-1")).toBeInTheDocument();

      // Click on chime preset
      fireEvent.click(screen.getByTestId("sfx-preset-chime-edit-sfx-1"));
      expect(onUpdateEdit).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: expect.objectContaining({
            element: expect.objectContaining({
              sourceUrl: "/assets/audio/chime.mp3",
              name: "Chime SFX",
            }),
          }),
        })
      );
    });
  });
});
