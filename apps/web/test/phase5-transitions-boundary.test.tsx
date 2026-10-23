import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  AddTransitionOperationSchema,
  TransitionPresetSchema,
  EditOperation,
} from "../lib/operations/operation-types";
import {
  executeOperation,
  validateTransitionHandles,
  OperationExecutionError,
} from "../lib/operations/operation-executor";
import { TimelineProject, VideoClip } from "../lib/timeline-types";
import { PlayerMonitor } from "../components/editor/PlayerMonitor";
import { useTimelineStore } from "../lib/stores/useTimelineStore";

describe("Phase 5: First-Class Transitions & Boundary Handling", () => {
  const sampleProject: TimelineProject = {
    id: "proj-phase5-trans",
    title: "Phase 5 Transition Test Project",
    aspectRatio: "9:16",
    duration: 30,
    fps: 30,
    tracks: {
      videoTrack: [
        {
          id: "vid-a",
          name: "Speaker Hook",
          sourceUrl: "https://videos.sample.com/hook.mp4",
          start: 0,
          end: 5.0,
          sourceStart: 0,
          sourceEnd: 8.0, // 3.0s tail handle available (sourceEnd 8.0 - end 5.0)
          speed: 1,
          volume: 100,
          zoomFactor: 1,
        },
        {
          id: "vid-b",
          name: "Speaker Explanation",
          sourceUrl: "https://videos.sample.com/explanation.mp4",
          start: 5.0,
          end: 15.0,
          sourceStart: 3.0, // 2.0s head handle available (start 5.0 - sourceStart 3.0)
          sourceEnd: 15.0,
          speed: 1,
          volume: 100,
          zoomFactor: 1,
        },
      ],
      brollTrack: [],
      textTrack: [],
      audioTrack: [],
      graphicsTrack: [],
    },
    transitions: [],
  };

  beforeEach(() => {
    useTimelineStore.getState().initProject(sampleProject);
    useTimelineStore.getState().setPlayheadTime(0);
  });

  describe("1. Transition Handle Math & Validation Rules", () => {
    const clipA: VideoClip = {
      id: "vid-a",
      name: "Clip A",
      sourceUrl: "https://sample.com/a.mp4",
      start: 0,
      end: 5.0,
      sourceStart: 0,
      sourceEnd: 8.0, // tail handle = 3.0s
      speed: 1,
      volume: 100,
      zoomFactor: 1,
    };

    const clipB: VideoClip = {
      id: "vid-b",
      name: "Clip B",
      sourceUrl: "https://sample.com/b.mp4",
      start: 5.0,
      end: 12.0,
      sourceStart: 3.0, // head handle = 2.0s (start 5.0 - sourceStart 3.0)
      sourceEnd: 12.0,
      speed: 1,
      volume: 100,
      zoomFactor: 1,
    };

    it("correctly identifies sufficient handles for centered transition", () => {
      // D = 1.0s, needs 0.5s tail handle on A and 0.5s head handle on B
      const report = validateTransitionHandles(clipA, clipB, 1.0, "center");
      expect(report.handleA).toBe(3.0);
      expect(report.handleB).toBe(2.0);
      expect(report.requiredHandleA).toBe(0.5);
      expect(report.requiredHandleB).toBe(0.5);
      expect(report.hasSufficientHandles).toBe(true);
      expect(report.maxDuration).toBe(4.0); // 2 * min(3.0, 2.0)
    });

    it("detects insufficient handles when requested duration exceeds available media", () => {
      // D = 6.0s, needs 3.0s on each side, but clipB only has 2.0s
      const report = validateTransitionHandles(clipA, clipB, 6.0, "center");
      expect(report.hasSufficientHandles).toBe(false);
      expect(report.requiredHandleB).toBe(3.0);
      expect(report.handleB).toBe(2.0);
      expect(report.maxDuration).toBe(4.0);
      expect(report.clampedDuration).toBe(4.0);
    });

    it("throws OperationExecutionError when validateHandles is true and handles are insufficient", () => {
      const op: EditOperation = {
        type: "add_transition",
        id: "tr-fail-1",
        track: "video",
        fromClipId: "vid-a",
        toClipId: "vid-b",
        preset: "crossfade",
        duration: 5.0, // Exceeds clipB's 2.0s head handle (needs 2.5s)
        alignment: "center",
        validateHandles: true,
      };

      expect(() => executeOperation(sampleProject, op)).toThrow(OperationExecutionError);
    });

    it("auto-clamps transition duration to maximum supported handles when autoClamp is enabled", () => {
      const op: EditOperation = {
        type: "add_transition",
        id: "tr-clamp-1",
        track: "video",
        fromClipId: "vid-a",
        toClipId: "vid-b",
        preset: "crossfade",
        duration: 5.0,
        alignment: "center",
        autoClamp: true,
      };

      const { nextProject } = executeOperation(sampleProject, op);
      expect(nextProject.transitions).toHaveLength(1);
      // Auto-clamped to 2 * min(3.0, 2.0) = 4.0s
      expect(nextProject.transitions![0].duration).toBe(4.0);
      expect(nextProject.transitions![0].preset).toBe("crossfade");
    });

    it("falls back to fade_to_black when 0 handles exist on cut boundaries", () => {
      const zeroHandleProject: TimelineProject = {
        ...sampleProject,
        tracks: {
          ...sampleProject.tracks,
          videoTrack: [
            { ...clipA, sourceEnd: 5.0, end: 5.0 }, // 0 tail handle
            { ...clipB, sourceStart: 0, start: 5.0 }, // 0 head handle (sourceStart = 0)
          ],
        },
      };

      const op: EditOperation = {
        type: "add_transition",
        id: "tr-fallback-1",
        track: "video",
        fromClipId: "vid-a",
        toClipId: "vid-b",
        preset: "crossfade",
        duration: 0.6,
        alignment: "center",
        autoClamp: true, // Should fall back to fade_to_black because maxDuration <= 0
      };

      const { nextProject } = executeOperation(zeroHandleProject, op);
      expect(nextProject.transitions).toHaveLength(1);
      expect(nextProject.transitions![0].preset).toBe("fade_to_black");
    });
  });

  describe("2. Operation Reversibility & Inverse Generation", () => {
    it("produces deterministic delete_element inverse and completely restores state", () => {
      const op: EditOperation = {
        type: "add_transition",
        id: "tr-inv-test",
        track: "video",
        fromClipId: "vid-a",
        toClipId: "vid-b",
        preset: "wipe_left",
        duration: 0.8,
        alignment: "center",
      };

      const { nextProject, inverse } = executeOperation(sampleProject, op);
      expect(nextProject.transitions).toHaveLength(1);
      expect(nextProject.transitions![0].preset).toBe("wipe_left");

      expect(inverse).toEqual({
        type: "delete_element",
        targetId: "tr-inv-test",
        targetType: "transition",
      });

      const restored = executeOperation(nextProject, inverse).nextProject;
      expect(restored.transitions).toHaveLength(0);
    });
  });

  describe("3. Dual-Stream Canvas Transition Rendering in PlayerMonitor", () => {
    it("renders dual streams with crossfade opacity blend across transition window", () => {
      const projectWithTransition: TimelineProject = {
        ...sampleProject,
        transitions: [
          {
            id: "tr-crossfade-demo",
            track: "video",
            fromClipId: "vid-a",
            toClipId: "vid-b",
            preset: "crossfade",
            duration: 1.0, // Cut at 5.0s, window is [4.5s to 5.5s]
            alignment: "center",
          },
        ],
      };

      useTimelineStore.getState().initProject(projectWithTransition);

      // 1. Playhead at start of transition (4.5s): progress = 0.0
      useTimelineStore.getState().setPlayheadTime(4.5);
      const { rerender } = render(<PlayerMonitor />);

      const container = screen.getByTestId("transition-dual-stream-container");
      expect(container).toBeInTheDocument();

      const outgoing = screen.getByTestId("transition-outgoing-stream");
      const incoming = screen.getByTestId("transition-incoming-stream");
      expect(outgoing).toHaveStyle({ opacity: "1" });
      expect(incoming).toHaveStyle({ opacity: "0" });

      // 2. Playhead at midpoint of transition (5.0s): progress = 0.5
      useTimelineStore.getState().setPlayheadTime(5.0);
      rerender(<PlayerMonitor />);
      expect(outgoing).toHaveStyle({ opacity: "0.5" });
      expect(incoming).toHaveStyle({ opacity: "0.5" });

      // 3. Playhead at end of transition (5.5s): progress = 1.0
      useTimelineStore.getState().setPlayheadTime(5.5);
      rerender(<PlayerMonitor />);
      expect(outgoing).toHaveStyle({ opacity: "0" });
      expect(incoming).toHaveStyle({ opacity: "1" });

      // 4. Outside transition window (2.0s): dual-stream unmounts
      useTimelineStore.getState().setPlayheadTime(2.0);
      rerender(<PlayerMonitor />);
      expect(screen.queryByTestId("transition-dual-stream-container")).toBeNull();
    });

    it("renders fade_to_black dip across dual streams without media overlap", () => {
      const projectWithFadeToBlack: TimelineProject = {
        ...sampleProject,
        transitions: [
          {
            id: "tr-f2b-demo",
            track: "video",
            fromClipId: "vid-a",
            toClipId: "vid-b",
            preset: "fade_to_black",
            duration: 1.0, // Window [4.5s, 5.5s]
            alignment: "center",
          },
        ],
      };

      useTimelineStore.getState().initProject(projectWithFadeToBlack);

      // At 4.75s (progress = 0.25): outgoing opacity = 1 - 2*0.25 = 0.5, incoming = 0
      useTimelineStore.getState().setPlayheadTime(4.75);
      const { rerender } = render(<PlayerMonitor />);

      const outgoing = screen.getByTestId("transition-outgoing-stream");
      const incoming = screen.getByTestId("transition-incoming-stream");
      expect(outgoing).toHaveStyle({ opacity: "0.5" });
      expect(incoming).toHaveStyle({ opacity: "0" });

      // At 5.0s (progress = 0.5, cut boundary): both black (opacity 0)
      useTimelineStore.getState().setPlayheadTime(5.0);
      rerender(<PlayerMonitor />);
      expect(outgoing).toHaveStyle({ opacity: "0" });
      expect(incoming).toHaveStyle({ opacity: "0" });

      // At 5.25s (progress = 0.75): outgoing = 0, incoming opacity = (0.75 - 0.5)*2 = 0.5
      useTimelineStore.getState().setPlayheadTime(5.25);
      rerender(<PlayerMonitor />);
      expect(outgoing).toHaveStyle({ opacity: "0" });
      expect(incoming).toHaveStyle({ opacity: "0.5" });
    });

    it("renders wipe_left clipPath on incoming stream", () => {
      const projectWithWipe: TimelineProject = {
        ...sampleProject,
        transitions: [
          {
            id: "tr-wipe-demo",
            track: "video",
            fromClipId: "vid-a",
            toClipId: "vid-b",
            preset: "wipe_left",
            duration: 1.0, // Window [4.5s, 5.5s]
            alignment: "center",
          },
        ],
      };

      useTimelineStore.getState().initProject(projectWithWipe);

      // At midpoint (5.0s, progress = 0.5): incoming clipPath should inset 50%
      useTimelineStore.getState().setPlayheadTime(5.0);
      render(<PlayerMonitor />);

      const incoming = screen.getByTestId("transition-incoming-stream");
      expect(incoming).toHaveStyle({ clipPath: "inset(0 0 0 50%)" });
    });

    it("renders slide_up transform on incoming stream", () => {
      const projectWithSlide: TimelineProject = {
        ...sampleProject,
        transitions: [
          {
            id: "tr-slide-demo",
            track: "video",
            fromClipId: "vid-a",
            toClipId: "vid-b",
            preset: "slide_up",
            duration: 1.0,
            alignment: "center",
          },
        ],
      };

      useTimelineStore.getState().initProject(projectWithSlide);

      // At midpoint (5.0s, progress = 0.5): incoming translateY should be 50%
      useTimelineStore.getState().setPlayheadTime(5.0);
      render(<PlayerMonitor />);

      const incoming = screen.getByTestId("transition-incoming-stream");
      expect(incoming).toHaveStyle({ transform: "translateY(50%)" });
    });
  });
});
