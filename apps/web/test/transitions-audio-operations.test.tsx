import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  AddTransitionOperationSchema,
  SetAudioMixOperationSchema,
  TransitionPresetSchema,
  EditOperation,
} from "../lib/operations/operation-types";
import {
  executeOperation,
  createInverseOperation,
} from "../lib/operations/operation-executor";
import { parseLocalCommand } from "../lib/ai/local-command-parser";
import { assembleEditorContext } from "../lib/ai/editor-context";
import { TimelineProject } from "../lib/timeline-types";
import { PlayerMonitor } from "../components/editor/PlayerMonitor";
import { useTimelineStore } from "../lib/stores/useTimelineStore";
import { TimelineContainer } from "../components/editor/TimelineContainer";
import { InspectorPanel } from "../components/editor/InspectorPanel";

describe("Phase 4: Semantic Audio Accents & First-Class Transitions", () => {
  const initialProject: TimelineProject = {
    id: "proj-trans-1",
    title: "Transitions & Audio Test",
    aspectRatio: "9:16",
    duration: 30,
    fps: 30,
    tracks: {
      videoTrack: [
        {
          id: "vid-1",
          name: "Opening Hook",
          sourceUrl: "https://videos.sample.com/1.mp4",
          start: 0,
          end: 5.0,
          sourceStart: 0,
          sourceEnd: 5.0,
          speed: 1,
          volume: 100,
          zoomFactor: 1,
        },
        {
          id: "vid-2",
          name: "Main Explanation",
          sourceUrl: "https://videos.sample.com/2.mp4",
          start: 5.0,
          end: 12.0,
          sourceStart: 0,
          sourceEnd: 7.0,
          speed: 1,
          volume: 100,
          zoomFactor: 1,
        },
      ],
      brollTrack: [],
      textTrack: [],
      audioTrack: [
        {
          id: "bgm-1",
          name: "Lo-Fi Background Music",
          sourceUrl: "https://audio.sample.com/bgm.mp3",
          start: 0,
          end: 20.0,
          volume: 80,
          fadeIn: 1.0,
          fadeOut: 1.0,
          isBgm: true,
        },
      ],
      graphicsTrack: [],
    },
    transitions: [],
  };

  beforeEach(() => {
    useTimelineStore.getState().initProject(initialProject);
    useTimelineStore.getState().setPlayheadTime(0);
  });

  describe("1. Schema & Validation Contracts", () => {
    it("validates canonical transition presets and structure", () => {
      const validPresets = [
        "crossfade",
        "fade_to_black",
        "wipe_left",
        "wipe_right",
        "slide_up",
        "zoom_in",
        "whip_pan",
      ];
      for (const preset of validPresets) {
        expect(TransitionPresetSchema.parse(preset)).toBe(preset);
      }

      const validOp = AddTransitionOperationSchema.parse({
        type: "add_transition",
        id: "tr-1",
        track: "video",
        fromClipId: "vid-1",
        toClipId: "vid-2",
        preset: "crossfade",
        duration: 0.5,
        alignment: "center",
      });
      expect(validOp.preset).toBe("crossfade");
      expect(validOp.duration).toBe(0.5);
    });

    it("validates audio mix operations and ducking parameters", () => {
      const audioOp = SetAudioMixOperationSchema.parse({
        type: "set_audio_mix",
        targetClipId: "bgm-1",
        volume: 25,
        fadeIn: 0.5,
        fadeOut: 0.5,
        ducking: {
          enabled: true,
          thresholdDb: -24,
          attenuationDb: -14,
        },
      });
      expect(audioOp.volume).toBe(25);
      expect(audioOp.ducking?.enabled).toBe(true);
    });
  });

  describe("2. Operation Executor & Atomic Inverse Reducers", () => {
    it("executes add_transition and inverts via delete_element", () => {
      const addOp: EditOperation = {
        type: "add_transition",
        id: "tr-crossfade-1",
        track: "video",
        fromClipId: "vid-1",
        toClipId: "vid-2",
        preset: "crossfade",
        duration: 0.6,
        alignment: "center",
      };

      const { nextProject, inverse } = executeOperation(initialProject, addOp);

      expect(nextProject.transitions).toHaveLength(1);
      expect(nextProject.transitions![0].preset).toBe("crossfade");
      expect(nextProject.transitions![0].id).toBe("tr-crossfade-1");

      // Verify exact inverse is delete_element with targetType 'transition'
      expect(inverse).toEqual({
        type: "delete_element",
        targetId: "tr-crossfade-1",
        targetType: "transition",
      });

      // Applying inverse returns project to original state (0 transitions)
      const restored = executeOperation(nextProject, inverse).nextProject;
      expect(restored.transitions).toHaveLength(0);
    });

    it("executes set_audio_mix and restores previous volume upon inverse", () => {
      const setMixOp: EditOperation = {
        type: "set_audio_mix",
        targetClipId: "bgm-1",
        volume: 15,
        ducking: { enabled: true, thresholdDb: -24, attenuationDb: -14 },
      };

      const { nextProject, inverse } = executeOperation(initialProject, setMixOp);
      const bgmClip = nextProject.tracks.audioTrack.find((a) => a.id === "bgm-1");
      expect(bgmClip?.volume).toBe(15);
      expect((bgmClip as any)?.ducking?.enabled).toBe(true);

      // Verify inverse has original volume 80
      expect(inverse.type).toBe("set_audio_mix");
      expect((inverse as any).volume).toBe(80);

      // Restoring returns volume to 80
      const restored = executeOperation(nextProject, inverse).nextProject;
      const restoredBgm = restored.tracks.audioTrack.find((a) => a.id === "bgm-1");
      expect(restoredBgm?.volume).toBe(80);
    });
  });

  describe("3. Local Natural Language Command Parser", () => {
    it("parses 'add crossfade transition between clips' locally", () => {
      const context = assembleEditorContext(initialProject, 5.0, null);
      const result = parseLocalCommand("add crossfade transition between clips", context);

      expect(result.matched).toBe(true);
      expect(result.operation?.type).toBe("add_transition");
      const op = result.operation as any;
      expect(op.preset).toBe("crossfade");
      expect(op.fromClipId).toBe("vid-1");
      expect(op.toClipId).toBe("vid-2");
    });

    it("parses 'add wipe left transition' and sets preset correctly", () => {
      const context = assembleEditorContext(initialProject, 5.0, null);
      const result = parseLocalCommand("add wipe left transition", context);

      expect(result.matched).toBe(true);
      expect(result.operation?.type).toBe("add_transition");
      expect((result.operation as any).preset).toBe("wipe_left");
    });

    it("parses 'set background music volume to 20%'", () => {
      const context = assembleEditorContext(initialProject, 5.0, null);
      const result = parseLocalCommand("set background music volume to 20%", context);

      expect(result.matched).toBe(true);
      expect(result.operation?.type).toBe("set_audio_mix");
      expect((result.operation as any).targetClipId).toBe("bgm-1");
      expect((result.operation as any).volume).toBe(20);
    });

    it("parses 'mute audio'", () => {
      const context = assembleEditorContext(initialProject, 5.0, null);
      const result = parseLocalCommand("mute audio", context);

      expect(result.matched).toBe(true);
      expect(result.operation?.type).toBe("set_audio_mix");
      expect((result.operation as any).volume).toBe(0);
    });
  });

  describe("4. PlayerMonitor Canvas Transition Wipes & Indicator", () => {
    it("renders active transition indicator when playhead is inside transition window", () => {
      const projectWithTransition: TimelineProject = {
        ...initialProject,
        transitions: [
          {
            id: "tr-cut-1",
            track: "video",
            fromClipId: "vid-1",
            toClipId: "vid-2",
            preset: "crossfade",
            duration: 0.6,
            alignment: "center", // Cut at 5.0s, window is [4.7s - 5.3s]
          },
        ],
      };

      useTimelineStore.getState().initProject(projectWithTransition);

      // Playhead at 4.9s (inside transition window)
      useTimelineStore.getState().setPlayheadTime(4.9);
      const { rerender } = render(<PlayerMonitor />);

      const indicator = screen.getByTestId("active-transition-indicator");
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveTextContent(/Transition: crossfade/i);

      // Playhead at 2.0s (outside transition window)
      useTimelineStore.getState().setPlayheadTime(2.0);
      rerender(<PlayerMonitor />);
      expect(screen.queryByTestId("active-transition-indicator")).toBeNull();
    });
  });

  describe("5. Boundary Replacement, Orphan Cleanup, Timeline Badges & Inspector", () => {
    it("replaces existing transition at the same cut boundary instead of creating duplicate", () => {
      const p0: TimelineProject = {
        ...initialProject,
        transitions: [
          {
            id: "tr-old",
            track: "video",
            fromClipId: "vid-1",
            toClipId: "vid-2",
            preset: "crossfade",
            duration: 0.5,
            alignment: "center",
          },
        ],
      };

      const newOp: EditOperation = {
        type: "add_transition",
        id: "tr-new",
        track: "video",
        fromClipId: "vid-1",
        toClipId: "vid-2",
        preset: "wipe_left",
        duration: 1.0,
        alignment: "center",
      };

      const result = executeOperation(p0, newOp);
      expect(result.nextProject.transitions).toHaveLength(1);
      expect(result.nextProject.transitions?.[0].preset).toBe("wipe_left");
      expect(result.nextProject.transitions?.[0].duration).toBe(1.0);
    });

    it("cleans up orphaned transitions when a video clip is deleted in executeOperation and store", () => {
      const pWithTrans: TimelineProject = {
        ...initialProject,
        transitions: [
          {
            id: "tr-test-cleanup",
            track: "video",
            fromClipId: "vid-1",
            toClipId: "vid-2",
            preset: "crossfade",
            duration: 0.5,
            alignment: "center",
          },
        ],
      };

      // In executeOperation
      const deleteOp: EditOperation = {
        type: "delete_element",
        targetId: "vid-1",
        targetType: "video",
      };
      const opResult = executeOperation(pWithTrans, deleteOp);
      expect(opResult.nextProject.transitions).toHaveLength(0);

      // In store deleteClip
      useTimelineStore.getState().initProject(pWithTrans);
      expect(useTimelineStore.getState().project.transitions).toHaveLength(1);
      useTimelineStore.getState().deleteClip("video", "vid-2");
      expect(useTimelineStore.getState().project.transitions).toHaveLength(0);
    });

    it("renders interactive transition badge on the timeline and selects it on click", () => {
      const projectWithTransition: TimelineProject = {
        ...initialProject,
        transitions: [
          {
            id: "tr-badge-1",
            track: "video",
            fromClipId: "vid-1",
            toClipId: "vid-2",
            preset: "whip_pan",
            duration: 0.8,
            alignment: "center",
          },
        ],
      };

      useTimelineStore.getState().initProject(projectWithTransition);
      useTimelineStore.getState().setSelectedItem(null);

      render(<TimelineContainer />);

      const badge = screen.getByTestId("transition-badge-tr-badge-1");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent(/whip pan/i);

      // Click to select
      fireEvent.click(badge);
      expect(useTimelineStore.getState().selectedItem).toEqual({
        type: "transition",
        id: "tr-badge-1",
      });
    });

    it("allows inspecting, changing preset/duration, and deleting transition in InspectorPanel", () => {
      const projectWithTransition: TimelineProject = {
        ...initialProject,
        transitions: [
          {
            id: "tr-insp-1",
            track: "video",
            fromClipId: "vid-1",
            toClipId: "vid-2",
            preset: "crossfade",
            duration: 0.5,
            alignment: "center",
          },
        ],
      };

      useTimelineStore.getState().initProject(projectWithTransition);
      useTimelineStore.getState().setSelectedItem({ type: "transition", id: "tr-insp-1" });

      const { rerender } = render(<InspectorPanel />);

      expect(screen.getByText("Video Transition")).toBeInTheDocument();
      expect(screen.getByText("Crossfade (Dissolve)")).toBeInTheDocument();

      // Change preset
      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "fade_to_black" } });
      expect(useTimelineStore.getState().project.transitions?.[0].preset).toBe("fade_to_black");

      // Click Delete Transition
      const deleteBtn = screen.getByText("Delete Transition");
      fireEvent.click(deleteBtn);
      expect(useTimelineStore.getState().project.transitions).toHaveLength(0);
      expect(useTimelineStore.getState().selectedItem).toBeNull();
    });
  });
});
