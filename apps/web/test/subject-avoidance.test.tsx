import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import {
  checkSubjectOverlap,
  findNonOverlappingPlacement,
  filterActiveSafeZones,
  convertVisualTimelineToSafeZones,
  UnifiedVisualTimelineResponse,
} from "../lib/layout/subject-avoidance";
import { SubjectSafeZone, TimelineProject } from "../lib/timeline-types";
import { parseLocalCommand } from "../lib/ai/local-command-parser";
import { assembleEditorContext } from "../lib/ai/editor-context";
import { useTimelineStore } from "../lib/stores/useTimelineStore";
import { SubjectOverlay } from "../components/editor/SubjectOverlay";

describe("Phase 9: Pre-Computed Subject Avoidance & Safe Zones", () => {
  beforeEach(() => {
    // Reset store state
    const defaultProj: TimelineProject = {
      id: "test-subject-proj",
      title: "Presenter Test Project",
      aspectRatio: "9:16",
      duration: 10.0,
      fps: 30,
      tracks: {
        videoTrack: [],
        brollTrack: [],
        textTrack: [],
        audioTrack: [],
        graphicsTrack: [],
      },
      safeZones: [],
    };
    useTimelineStore.getState().initProject(defaultProj);
    useTimelineStore.getState().setSubjectOverlayVisible(false);
  });

  describe("1. Overlap Detection (checkSubjectOverlap)", () => {
    const presenterSafeZone: SubjectSafeZone = {
      id: "sz-center",
      timestamp: 0,
      duration: 10.0,
      x: 25, // 25% to 75% horizontally
      y: 35, // 35% to 85% vertically
      width: 50,
      height: 50,
      confidence: 0.95,
      type: "subject",
    };

    it("detects direct overlap when element is placed on top of presenter", () => {
      // Element at bottom center: { x: 50, y: 70 }, size: 50x15
      // Element bounds: x: [25, 75], y: [62.5, 77.5]
      // Presenter bounds: x: [25, 75], y: [35, 85]
      const overlap = checkSubjectOverlap(
        { x: 50, y: 70 },
        { width: 50, height: 15 },
        presenterSafeZone
      );

      expect(overlap.overlaps).toBe(true);
      expect(overlap.overlapArea).toBeGreaterThan(0);
      expect(overlap.overlapPercentage).toBeGreaterThan(50);
    });

    it("returns 0 overlap when element is in unoccupied region (top-center)", () => {
      // Element at top-center: { x: 50, y: 15 }, size: 50x15
      // Element bounds: y: [7.5, 22.5]
      // Presenter bounds: y: [35, 85]
      const overlap = checkSubjectOverlap(
        { x: 50, y: 15 },
        { width: 50, height: 15 },
        presenterSafeZone
      );

      expect(overlap.overlaps).toBe(false);
      expect(overlap.overlapArea).toBe(0);
      expect(overlap.overlapPercentage).toBe(0);
    });

    it("factors in avoidance padding", () => {
      // Element positioned just touching edge: y: [20, 35]
      // Presenter starts at y: 35
      // With padding=3, bounding box expands and overlap is detected
      const withoutPadding = checkSubjectOverlap(
        { x: 50, y: 25 },
        { width: 30, height: 16 }, // y: [17, 33] -> no overlap
        presenterSafeZone,
        0
      );
      expect(withoutPadding.overlaps).toBe(false);

      const withPadding = checkSubjectOverlap(
        { x: 50, y: 25 },
        { width: 30, height: 16 },
        presenterSafeZone,
        5 // Expands element by 5% in each direction -> y: [12, 38] -> overlaps with presenter at 35
      );
      expect(withPadding.overlaps).toBe(true);
    });
  });

  describe("2. Intelligent Quadrant Placement (findNonOverlappingPlacement)", () => {
    it("returns default position when no safe zones exist", () => {
      const result = findNonOverlappingPlacement({
        safeZones: [],
        defaultPosition: { x: 50, y: 78 },
      });

      expect(result.position).toEqual({ x: 50, y: 78 });
      expect(result.isAvoided).toBe(false);
      expect(result.overlapArea).toBe(0);
    });

    it("steers placement away from presenter in bottom-center to top-center", () => {
      const bottomCenterPresenter: SubjectSafeZone = {
        id: "sz-presenter-bottom",
        timestamp: 0,
        duration: 10,
        x: 20,
        y: 40,
        width: 60,
        height: 55, // Covers 40% - 95% vertically
        confidence: 0.98,
        type: "subject",
      };

      const result = findNonOverlappingPlacement({
        elementSize: { width: 50, height: 14 },
        safeZones: [bottomCenterPresenter],
        defaultPosition: { x: 50, y: 78 },
      });

      expect(result.isAvoided).toBe(true);
      expect(result.region).toBe("top-center");
      expect(result.position.y).toBeLessThan(30);
      expect(result.overlapArea).toBe(0);
    });

    it("steers placement away from presenter on right side to left side", () => {
      const rightSidePresenter: SubjectSafeZone = {
        id: "sz-presenter-right",
        timestamp: 0,
        duration: 10,
        x: 50,
        y: 15,
        width: 48,
        height: 75, // Covers right half of screen
        confidence: 0.92,
        type: "subject",
      };

      const result = findNonOverlappingPlacement({
        elementSize: { width: 35, height: 14 },
        safeZones: [rightSidePresenter],
        defaultPosition: { x: 50, y: 78 },
      });

      expect(result.isAvoided).toBe(true);
      // Selected candidate should be on the left (x < 40)
      expect(result.position.x).toBeLessThan(40);
      expect(result.overlapArea).toBe(0);
    });

    it("respects time-based safe zones (ignores inactive zones)", () => {
      const temporaryPresenter: SubjectSafeZone = {
        id: "sz-temp",
        timestamp: 0,
        duration: 3.0, // only present from 0s to 3s
        x: 20,
        y: 60,
        width: 60,
        height: 35,
        confidence: 0.99,
        type: "subject",
      };

      // At playhead=1.0s (active): avoids bottom-center
      const activeResult = findNonOverlappingPlacement({
        elementSize: { width: 50, height: 14 },
        safeZones: [temporaryPresenter],
        playheadTime: 1.0,
        defaultPosition: { x: 50, y: 78 },
      });
      expect(activeResult.isAvoided).toBe(true);
      expect(activeResult.region).toBe("top-center");

      // At playhead=5.0s (inactive): safe to use default bottom-center
      const inactiveResult = findNonOverlappingPlacement({
        elementSize: { width: 50, height: 14 },
        safeZones: [temporaryPresenter],
        playheadTime: 5.0,
        defaultPosition: { x: 50, y: 78 },
      });
      expect(inactiveResult.isAvoided).toBe(false);
      expect(inactiveResult.position).toEqual({ x: 50, y: 78 });
    });
  });

  describe("3. Visual Timeline Data Adapter (convertVisualTimelineToSafeZones)", () => {
    it("converts 0..1 normalized bounding box from worker to 0..100 percentages", () => {
      const mockVisualTimeline: UnifiedVisualTimelineResponse = {
        video_id: "job-1234",
        subjects: [
          {
            start: 0.5,
            end: 8.5,
            confidence: 0.94,
            bounding_box: {
              x: 0.22,
              y: 0.35,
              width: 0.55,
              height: 0.6,
            },
          },
        ],
      };

      const zones = convertVisualTimelineToSafeZones(mockVisualTimeline, 10.0);
      expect(zones).toHaveLength(1);

      const zone = zones[0];
      expect(zone.id).toBe("subject-sz-1");
      expect(zone.timestamp).toBe(0.5);
      expect(zone.duration).toBe(8.0);
      expect(zone.x).toBe(22);
      expect(zone.y).toBe(35);
      expect(zone.width).toBe(55);
      expect(zone.height).toBe(60);
      expect(zone.confidence).toBe(0.94);
      expect(zone.type).toBe("subject");
    });

    it("handles empty or missing subject data gracefully", () => {
      const emptyTimeline: UnifiedVisualTimelineResponse = {
        video_id: "empty-job",
        scenes: [],
        subjects: [],
      };

      expect(convertVisualTimelineToSafeZones(emptyTimeline)).toEqual([]);
      expect(convertVisualTimelineToSafeZones(null as any)).toEqual([]);
    });
  });

  describe("4. AI Title Command Steering (Prompt 'Add a title Welcome')", () => {
    it("automatically places title away from presenter face when prompt is 'Add a title Welcome'", () => {
      const projectWithPresenter: TimelineProject = {
        id: "proj-talking-head",
        title: "Talking Head",
        aspectRatio: "9:16",
        duration: 10.0,
        fps: 30,
        tracks: {
          videoTrack: [],
          brollTrack: [],
          textTrack: [],
          audioTrack: [],
        },
        safeZones: [
          {
            id: "sz-presenter",
            timestamp: 0,
            duration: 10.0,
            x: 20,
            y: 45,
            width: 60,
            height: 50, // Presenter occupying lower center
            confidence: 0.97,
            type: "subject",
          },
        ],
      };

      const context = assembleEditorContext(projectWithPresenter, 1.0, null);
      const result = parseLocalCommand("Add a title Welcome", context);

      expect(result.matched).toBe(true);
      expect(result.operation?.type).toBe("add_element");

      const op = result.operation as any;
      expect(op.track).toBe("caption");
      expect(op.element.text).toBe("Welcome");

      // Key acceptance criteria: Placed in top-center safe region, NOT on presenter's face/chest (y: 75)
      expect(op.element.position.y).toBeLessThan(30);
      expect(op.element.position.x).toBe(50);
      expect(result.description).toContain("top-center safe zone");
    });

    it("uses standard default position when no presenter is detected", () => {
      const projectWithoutPresenter: TimelineProject = {
        id: "proj-faceless",
        title: "Faceless Video",
        aspectRatio: "9:16",
        duration: 10.0,
        fps: 30,
        tracks: {
          videoTrack: [],
          brollTrack: [],
          textTrack: [],
          audioTrack: [],
        },
        safeZones: [],
      };

      const context = assembleEditorContext(projectWithoutPresenter, 0, null);
      const result = parseLocalCommand("Add a title Welcome", context);

      expect(result.matched).toBe(true);
      const op = result.operation as any;
      expect(op.element.position).toEqual({ x: 50, y: 75 });
    });
  });

  describe("5. Subject Boundary Visibility Toggle & Rendering (SubjectOverlay.tsx)", () => {
    it("toggles subject boundary visibility in useTimelineStore", () => {
      const store = useTimelineStore.getState();
      expect(store.subjectOverlayVisible).toBe(false);

      store.toggleSubjectOverlay();
      expect(useTimelineStore.getState().subjectOverlayVisible).toBe(true);

      store.toggleSubjectOverlay();
      expect(useTimelineStore.getState().subjectOverlayVisible).toBe(false);

      store.setSubjectOverlayVisible(true);
      expect(useTimelineStore.getState().subjectOverlayVisible).toBe(true);
    });

    it("renders nothing when subjectOverlayVisible is false", () => {
      useTimelineStore.getState().setSubjectOverlayVisible(false);
      const { container } = render(<SubjectOverlay />);
      expect(container.firstChild).toBeNull();
    });

    it("renders subject safe zone bounding box with targeting accents when visible", () => {
      const store = useTimelineStore.getState();
      store.initProject({
        id: "test-render-proj",
        title: "Render Test",
        aspectRatio: "9:16",
        duration: 10.0,
        fps: 30,
        tracks: {
          videoTrack: [],
          brollTrack: [],
          textTrack: [],
          audioTrack: [],
        },
        safeZones: [
          {
            id: "presenter-box-1",
            timestamp: 0,
            duration: 10.0,
            x: 25,
            y: 35,
            width: 50,
            height: 55,
            confidence: 0.98,
            type: "subject",
          },
        ],
      });
      store.setSubjectOverlayVisible(true);

      render(<SubjectOverlay />);

      const overlay = screen.getByTestId("subject-overlay-container");
      expect(overlay).toBeInTheDocument();

      const box = screen.getByTestId("subject-safe-zone-presenter-box-1");
      expect(box).toBeInTheDocument();
      expect(box).toHaveStyle({ left: "25%", top: "35%", width: "50%", height: "55%" });
      expect(screen.getByText(/AVOIDANCE AREA \(98%\)/i)).toBeInTheDocument();
      expect(screen.getByText(/DO NOT OCCUPY/i)).toBeInTheDocument();
    });
  });
});
