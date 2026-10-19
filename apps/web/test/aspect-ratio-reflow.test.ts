import { describe, it, expect, beforeEach } from "vitest";
import {
  ASPECT_RATIO_SAFE_ZONES,
  getSafeZoneForAspectRatio,
  wrapTextToLines,
  remapCoordinateWithAnchor,
  reflowElementPosition,
  reflowProjectToAspectRatio,
} from "../lib/layout/aspect-ratio-reflow";
import { TimelineProject, GraphicElement, CaptionBlock } from "../lib/timeline-types";
import { useTimelineStore } from "../lib/stores/useTimelineStore";
import { parseLocalCommand } from "../lib/ai/local-command-parser";
import { assembleEditorContext } from "../lib/ai/editor-context";
import { executeOperation, createInverseOperation } from "../lib/operations/operation-executor";

describe("Phase 11: Multi-Aspect-Ratio Responsive Reflow (16:9 <-> 9:16)", () => {
  const createMockProject = (aspectRatio: "9:16" | "16:9" = "9:16"): TimelineProject => ({
    id: "reflow-test-project",
    title: "Reflow Test Project",
    aspectRatio,
    duration: 15.0,
    fps: 30,
    tracks: {
      videoTrack: [
        {
          id: "v1",
          sourceUrl: "https://example.com/main.mp4",
          name: "Talking Head Main",
          start: 0,
          end: 15.0,
          sourceStart: 0,
          sourceEnd: 15.0,
          speed: 1,
          volume: 100,
          zoomFactor: 1.0,
          position: { x: 50, y: 50 },
          scale: 1.0,
          rotation: 0,
        },
      ],
      brollTrack: [],
      textTrack: [
        {
          id: "cap-1",
          text: "Mastering the ultimate video editing workflow for creators in 2026",
          start: 1.0,
          end: 5.0,
          stylePreset: "tiktok_yellow",
          position: { x: 50, y: 75 },
          positionX: 50,
          positionY: 75,
          scale: 1.0,
        },
      ],
      audioTrack: [],
      graphicsTrack: [
        {
          id: "elem-center",
          name: "CENTER TITLE",
          compositionId: "hero_reveal",
          props: { title: "WELCOME" },
          start: 0.5,
          end: 4.5,
          position: { x: 50, y: 50 },
          positionX: 50,
          positionY: 50,
          scale: 1.0,
        },
        {
          id: "elem-right",
          name: "RIGHT METRIC",
          compositionId: "pop_up_badge",
          props: { text: "10X GROWTH" },
          start: 2.0,
          end: 6.0,
          position: { x: 85, y: 30 },
          positionX: 85,
          positionY: 30,
          scale: 1.0,
        },
        {
          id: "elem-lower-third",
          name: "LOWER THIRD",
          compositionId: "cooked_card",
          props: { headline: "John Doe", subline: "Lead Engineer" },
          start: 3.0,
          end: 8.0,
          position: { x: 50, y: 85 },
          positionX: 50,
          positionY: 85,
          scale: 1.0,
        },
      ],
    },
    constraints: [],
    safeZones: [],
  });

  beforeEach(() => {
    useTimelineStore.setState({
      project: createMockProject("9:16"),
      past: [],
      future: [],
      playheadTime: 0,
      selectedItem: null,
    });
  });

  describe("1. Platform Safe Zone Specifications", () => {
    it("returns correct TikTok/Shorts vertical safe zone bounds (9:16)", () => {
      const zone = getSafeZoneForAspectRatio("9:16");
      expect(zone.minX).toBe(6);
      expect(zone.maxX).toBe(82); // Leaves 18% right action rail for TikTok buttons
      expect(zone.minY).toBe(12); // Leaves 12% top header & notch
      expect(zone.maxY).toBe(80); // Leaves 20% bottom caption/profile rail
      expect(zone.maxCharsPerCaptionLine).toBe(22);
    });

    it("returns correct YouTube/Widescreen title-safe zone bounds (16:9)", () => {
      const zone = getSafeZoneForAspectRatio("16:9");
      expect(zone.minX).toBe(8);
      expect(zone.maxX).toBe(92);
      expect(zone.minY).toBe(8);
      expect(zone.maxY).toBe(88); // Leaves 12% bottom timeline scrubber
      expect(zone.maxCharsPerCaptionLine).toBe(42);
    });

    it("returns correct square feed safe zone bounds (1:1)", () => {
      const zone = getSafeZoneForAspectRatio("1:1");
      expect(zone.minX).toBe(7);
      expect(zone.maxX).toBe(93);
      expect(zone.minY).toBe(7);
      expect(zone.maxY).toBe(93);
      expect(zone.maxCharsPerCaptionLine).toBe(28);
    });

    it("returns correct portrait feed safe zone bounds (4:5)", () => {
      const zone = getSafeZoneForAspectRatio("4:5");
      expect(zone.minX).toBe(6);
      expect(zone.maxX).toBe(92);
      expect(zone.minY).toBe(8);
      expect(zone.maxY).toBe(86);
      expect(zone.maxCharsPerCaptionLine).toBe(26);
    });
  });

  describe("2. Coordinate Mapping & Anchor Preservation", () => {
    it("preserves exact visual center (50%) when remapping between 16:9 and 9:16", () => {
      const remappedX = remapCoordinateWithAnchor(50, 8, 92, 6, 82);
      const remappedY = remapCoordinateWithAnchor(50, 8, 88, 12, 80);
      expect(remappedX).toBe(50);
      expect(remappedY).toBe(50);
    });

    it("preserves near-center elements within deadband at exact center", () => {
      const nearCenterX = remapCoordinateWithAnchor(51.5, 8, 92, 6, 82);
      expect(nearCenterX).toBe(50);
    });

    it("remaps right-side elements to strictly respect the 9:16 right button rail", () => {
      // In 16:9, an element at x = 90% is within the 16:9 safe zone (8-92)
      // When remapped to 9:16, it must never exceed the 9:16 safe max (82)
      const remapped = remapCoordinateWithAnchor(90, 8, 92, 6, 82);
      expect(remapped).toBeLessThanOrEqual(82);
      expect(remapped).toBeGreaterThan(50);
    });

    it("remaps bottom elements to strictly respect the 9:16 bottom profile safe zone", () => {
      // In 16:9, a lower-third at y = 85% is within 16:9 safe zone (8-88)
      // When remapped to 9:16, it must never exceed 9:16 safe max (80)
      const remapped = remapCoordinateWithAnchor(85, 8, 88, 12, 80);
      expect(remapped).toBeLessThanOrEqual(80);
      expect(remapped).toBeGreaterThan(50);
    });
  });

  describe("3. Text Wrapping & Line Clamping for Mobile Viewports", () => {
    it("wraps long sentences into multiple lines not exceeding target character limit", () => {
      const text = "Mastering the ultimate video editing workflow for creators in 2026";
      const wrapped = wrapTextToLines(text, 22);

      const lines = wrapped.split("\n");
      expect(lines.length).toBeGreaterThanOrEqual(3);
      for (const line of lines) {
        expect(line.length).toBeLessThanOrEqual(22);
      }
      expect(lines.join(" ")).toBe(text);
    });

    it("does not wrap short sentences that fit comfortably in a single line", () => {
      const shortText = "Welcome Back!";
      const wrapped = wrapTextToLines(shortText, 22);
      expect(wrapped).toBe("Welcome Back!");
      expect(wrapped).not.toContain("\n");
    });

    it("unwraps and formats text into wider lines when switching from 9:16 to 16:9", () => {
      const text = "Mastering the ultimate video editing workflow for creators in 2026";
      const wrappedWide = wrapTextToLines(text, 42);

      const lines = wrappedWide.split("\n");
      expect(lines.length).toBeLessThanOrEqual(2);
      for (const line of lines) {
        expect(line.length).toBeLessThanOrEqual(42);
      }
    });
  });

  describe("4. Full Project Reflow (16:9 <-> 9:16)", () => {
    it("reflows 16:9 project to 9:16 and guarantees all elements are unclipped", () => {
      const wideProject = createMockProject("16:9");
      // Author elements on 16:9 canvas
      wideProject.tracks.graphicsTrack![1].positionX = 88; // Far right in 16:9
      wideProject.tracks.graphicsTrack![2].positionY = 86; // Lower third in 16:9

      const reflowed = reflowProjectToAspectRatio(wideProject, "9:16");
      expect(reflowed.aspectRatio).toBe("9:16");

      const safeZone916 = getSafeZoneForAspectRatio("9:16");

      // Check center element
      const centerElem = reflowed.tracks.graphicsTrack!.find((e) => e.id === "elem-center")!;
      expect(centerElem.positionX).toBe(50);
      expect(centerElem.positionY).toBe(50);

      // Check right-side element: must not collide with right buttons rail (x <= 82)
      const rightElem = reflowed.tracks.graphicsTrack!.find((e) => e.id === "elem-right")!;
      expect(rightElem.positionX).toBeLessThanOrEqual(safeZone916.maxX);
      expect(rightElem.positionX).toBeGreaterThanOrEqual(safeZone916.minX);

      // Check lower third: must not collide with bottom bar (y <= 80)
      const lowerThird = reflowed.tracks.graphicsTrack!.find((e) => e.id === "elem-lower-third")!;
      expect(lowerThird.positionY).toBeLessThanOrEqual(safeZone916.maxY);
      expect(lowerThird.positionY).toBeGreaterThanOrEqual(safeZone916.minY);

      // Check caption: text is wrapped to <= 22 chars and positioned safely
      const caption = reflowed.tracks.textTrack![0];
      expect(caption.text).toContain("\n");
      expect(caption.maxCharactersPerLine).toBe(22);
      expect(caption.positionY).toBeLessThanOrEqual(safeZone916.maxY);
    });

    it("reflows 9:16 project to 16:9 and adjusts captions to wider format", () => {
      const verticalProject = createMockProject("9:16");
      const reflowed = reflowProjectToAspectRatio(verticalProject, "16:9");
      expect(reflowed.aspectRatio).toBe("16:9");

      const safeZone169 = getSafeZoneForAspectRatio("16:9");

      for (const elem of reflowed.tracks.graphicsTrack!) {
        expect(elem.positionX).toBeGreaterThanOrEqual(safeZone169.minX);
        expect(elem.positionX).toBeLessThanOrEqual(safeZone169.maxX);
        expect(elem.positionY).toBeGreaterThanOrEqual(safeZone169.minY);
        expect(elem.positionY).toBeLessThanOrEqual(safeZone169.maxY);
      }

      const caption = reflowed.tracks.textTrack![0];
      expect(caption.maxCharactersPerLine).toBe(42);
    });

    it("preserves locked elements without moving them unless they exceed screen bounds", () => {
      const project = createMockProject("16:9");
      const lockedElem = project.tracks.graphicsTrack![0];
      lockedElem.isUserLocked = true;
      lockedElem.positionX = 35;
      lockedElem.positionY = 40;

      const reflowed = reflowProjectToAspectRatio(project, "9:16", { forceReflowLocked: false });
      const reflowedLocked = reflowed.tracks.graphicsTrack!.find((e) => e.id === lockedElem.id)!;

      // Retains locked coordinates within bounds
      expect(reflowedLocked.positionX).toBe(35);
      expect(reflowedLocked.positionY).toBe(40);
    });
  });

  describe("5. Store Integration & Reversibility (Undo / Redo)", () => {
    it("updates store project and reflows elements when setAspectRatio is called", () => {
      const store = useTimelineStore.getState();
      expect(store.project.aspectRatio).toBe("9:16");

      store.setAspectRatio("16:9");
      const stateAfter = useTimelineStore.getState();
      expect(stateAfter.project.aspectRatio).toBe("16:9");
      expect(stateAfter.past.length).toBe(1);
    });

    it("fully reverses aspect ratio switch and restores prior element coordinates via undo()", () => {
      const store = useTimelineStore.getState();
      const initialProject = JSON.parse(JSON.stringify(store.project));

      // Switch to 16:9
      store.setAspectRatio("16:9");
      expect(useTimelineStore.getState().project.aspectRatio).toBe("16:9");

      // Undo aspect ratio change
      useTimelineStore.getState().undo();
      const stateRestored = useTimelineStore.getState();

      expect(stateRestored.project.aspectRatio).toBe("9:16");
      expect(stateRestored.project.tracks.graphicsTrack).toEqual(initialProject.tracks.graphicsTrack);
      expect(stateRestored.project.tracks.textTrack).toEqual(initialProject.tracks.textTrack);
    });

    it("restores reflowed state cleanly via redo()", () => {
      const store = useTimelineStore.getState();
      store.setAspectRatio("16:9");
      const state169 = JSON.parse(JSON.stringify(useTimelineStore.getState().project));

      // Undo back to 9:16
      useTimelineStore.getState().undo();
      expect(useTimelineStore.getState().project.aspectRatio).toBe("9:16");

      // Redo back to 16:9
      useTimelineStore.getState().redo();
      expect(useTimelineStore.getState().project.aspectRatio).toBe("16:9");
      expect(useTimelineStore.getState().project.tracks.graphicsTrack).toEqual(state169.tracks.graphicsTrack);
    });
  });

  describe("6. Operational Command Bus Integration", () => {
    it("executes set_aspect_ratio operation and computes exact inverse", () => {
      const project = createMockProject("9:16");
      const op = {
        type: "set_aspect_ratio" as const,
        aspectRatio: "16:9" as const,
      };

      const inverse = createInverseOperation(project, op);
      expect(inverse).toEqual({
        type: "set_aspect_ratio",
        aspectRatio: "9:16",
      });

      const { nextProject } = executeOperation(project, op);
      expect(nextProject.aspectRatio).toBe("16:9");

      // Execute inverse returns aspect ratio to 9:16
      const { nextProject: restoredProject } = executeOperation(nextProject, inverse);
      expect(restoredProject.aspectRatio).toBe("9:16");
    });
  });

  describe("7. AI Copilot Natural Language Reflow Commands", () => {
    it("parses 'Change aspect ratio to 16:9' and returns set_aspect_ratio operation", () => {
      const project = createMockProject("9:16");
      const context = assembleEditorContext(project, 0, null);

      const result = parseLocalCommand("Change aspect ratio to 16:9", context);
      expect(result.matched).toBe(true);
      expect(result.operation).toEqual({
        type: "set_aspect_ratio",
        aspectRatio: "16:9",
      });
    });

    it("parses 'Switch to TikTok' and returns set_aspect_ratio to 9:16", () => {
      const project = createMockProject("16:9");
      const context = assembleEditorContext(project, 0, null);

      const result = parseLocalCommand("Switch to TikTok", context);
      expect(result.matched).toBe(true);
      expect(result.operation).toEqual({
        type: "set_aspect_ratio",
        aspectRatio: "9:16",
      });
    });

    it("parses 'Make video landscape' and returns set_aspect_ratio to 16:9", () => {
      const project = createMockProject("9:16");
      const context = assembleEditorContext(project, 0, null);

      const result = parseLocalCommand("Make video landscape", context);
      expect(result.matched).toBe(true);
      expect(result.operation).toEqual({
        type: "set_aspect_ratio",
        aspectRatio: "16:9",
      });
    });

    it("parses 'Switch to square' and returns set_aspect_ratio to 1:1", () => {
      const project = createMockProject("9:16");
      const context = assembleEditorContext(project, 0, null);

      const result = parseLocalCommand("Switch to square", context);
      expect(result.matched).toBe(true);
      expect(result.operation).toEqual({
        type: "set_aspect_ratio",
        aspectRatio: "1:1",
      });
    });
  });
});
