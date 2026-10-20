import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TransformableOverlay } from "../components/editor/TransformableOverlay";
import { SnapGuidesOverlay } from "../components/editor/SnapGuidesOverlay";
import { useTimelineStore } from "../lib/stores/useTimelineStore";
import { TimelineProject, GraphicElement } from "../lib/timeline-types";

describe("Phase 7: Direct Manipulation (8-Point Bounding Box, Snapping, and User Lock)", () => {
  const sampleGraphic: GraphicElement = {
    id: "graphic-hero-1",
    name: "Hero Title",
    compositionId: "hero_reveal",
    props: { title: "Test Title" },
    start: 0,
    end: 10,
    position: { x: 30, y: 30 },
    positionX: 30,
    positionY: 30,
    scale: 1.0,
    rotation: 0,
    isUserLocked: false,
  };

  const initialProject: TimelineProject = {
    id: "project-phase7",
    title: "Phase 7 Project",
    aspectRatio: "9:16",
    duration: 30,
    fps: 30,
    tracks: {
      videoTrack: [],
      brollTrack: [],
      textTrack: [],
      audioTrack: [],
      graphicsTrack: [sampleGraphic],
    },
  };

  beforeEach(() => {
    useTimelineStore.getState().initProject(initialProject);
    useTimelineStore.getState().setActiveSnapGuides([]);
  });

  describe("8-Point Bounding Box and Rotation Knob Handles", () => {
    it("renders all 8 resize handles and rotation knob when isSelected is true", () => {
      render(
        <TransformableOverlay
          id={sampleGraphic.id}
          type="graphic"
          clip={sampleGraphic}
          positionX={sampleGraphic.positionX}
          positionY={sampleGraphic.positionY}
          scale={sampleGraphic.scale}
          rotation={sampleGraphic.rotation}
          isSelected={true}
        >
          <div>Graphic Content</div>
        </TransformableOverlay>
      );

      // Verify all 4 corner handles
      expect(document.querySelector('[data-handle="nw"]')).toBeInTheDocument();
      expect(document.querySelector('[data-handle="ne"]')).toBeInTheDocument();
      expect(document.querySelector('[data-handle="se"]')).toBeInTheDocument();
      expect(document.querySelector('[data-handle="sw"]')).toBeInTheDocument();

      // Verify all 4 edge handles
      expect(document.querySelector('[data-handle="n"]')).toBeInTheDocument();
      expect(document.querySelector('[data-handle="s"]')).toBeInTheDocument();
      expect(document.querySelector('[data-handle="e"]')).toBeInTheDocument();
      expect(document.querySelector('[data-handle="w"]')).toBeInTheDocument();

      // Verify rotation knob
      expect(document.querySelector('[data-handle="rotation"]')).toBeInTheDocument();
    });

    it("does not render handles or rotation knob when isSelected is false", () => {
      render(
        <TransformableOverlay
          id={sampleGraphic.id}
          type="graphic"
          clip={sampleGraphic}
          positionX={sampleGraphic.positionX}
          positionY={sampleGraphic.positionY}
          scale={sampleGraphic.scale}
          rotation={sampleGraphic.rotation}
          isSelected={false}
        >
          <div>Graphic Content</div>
        </TransformableOverlay>
      );

      expect(document.querySelector('[data-handle="nw"]')).not.toBeInTheDocument();
      expect(document.querySelector('[data-handle="se"]')).not.toBeInTheDocument();
      expect(document.querySelector('[data-handle="e"]')).not.toBeInTheDocument();
      expect(document.querySelector('[data-handle="rotation"]')).not.toBeInTheDocument();
    });
  });

  describe("Resizing via Handles and isUserLocked Enforcement", () => {
    const handleTestCases: Array<{
      handle: "nw" | "ne" | "se" | "sw" | "n" | "s" | "e" | "w";
      moveDelta: { x: number; y: number };
      expectedScaleComparison: "greater" | "less";
    }> = [
      { handle: "se", moveDelta: { x: 50, y: 50 }, expectedScaleComparison: "greater" },
      { handle: "nw", moveDelta: { x: -50, y: -50 }, expectedScaleComparison: "greater" },
      { handle: "ne", moveDelta: { x: 50, y: -50 }, expectedScaleComparison: "greater" },
      { handle: "sw", moveDelta: { x: -50, y: 50 }, expectedScaleComparison: "greater" },
      { handle: "e", moveDelta: { x: 50, y: 0 }, expectedScaleComparison: "greater" },
      { handle: "w", moveDelta: { x: -50, y: 0 }, expectedScaleComparison: "greater" },
      { handle: "s", moveDelta: { x: 0, y: 50 }, expectedScaleComparison: "greater" },
      { handle: "n", moveDelta: { x: 0, y: -50 }, expectedScaleComparison: "greater" },
      // Scale-down test
      { handle: "se", moveDelta: { x: -40, y: -40 }, expectedScaleComparison: "less" },
    ];

    handleTestCases.forEach(({ handle, moveDelta, expectedScaleComparison }) => {
      it(`resizes from handle (${handle.toUpperCase()}) with delta (${moveDelta.x}, ${moveDelta.y}) and marks isUserLocked: true`, () => {
        render(
          <TransformableOverlay
            id={sampleGraphic.id}
            type="graphic"
            clip={sampleGraphic}
            positionX={sampleGraphic.positionX}
            positionY={sampleGraphic.positionY}
            scale={sampleGraphic.scale}
            rotation={sampleGraphic.rotation}
            isSelected={true}
          >
            <div>Graphic Content</div>
          </TransformableOverlay>
        );

        const handleElement = document.querySelector(`[data-handle="${handle}"]`)!;
        expect(handleElement).toBeInTheDocument();

        // Start drag at (100, 100)
        fireEvent.pointerDown(handleElement, { clientX: 100, clientY: 100 });

        // Move by specified delta
        fireEvent.pointerMove(window, {
          clientX: 100 + moveDelta.x,
          clientY: 100 + moveDelta.y,
        });

        // Release drag
        fireEvent.pointerUp(window);

        const updatedGraphic = useTimelineStore
          .getState()
          .project.tracks.graphicsTrack.find((g) => g.id === sampleGraphic.id)!;

        if (expectedScaleComparison === "greater") {
          expect(updatedGraphic.scale).toBeGreaterThan(1.0);
        } else {
          expect(updatedGraphic.scale).toBeLessThan(1.0);
        }
        expect(updatedGraphic.isUserLocked).toBe(true);
      });
    });
  });

  describe("Rotation Knob Interaction", () => {
    it("rotates element and marks isUserLocked: true", () => {
      render(
        <div style={{ width: 500, height: 500, position: "relative" }}>
          <TransformableOverlay
            id={sampleGraphic.id}
            type="graphic"
            clip={sampleGraphic}
            positionX={sampleGraphic.positionX}
            positionY={sampleGraphic.positionY}
            scale={sampleGraphic.scale}
            rotation={sampleGraphic.rotation}
            isSelected={true}
          >
            <div>Graphic Content</div>
          </TransformableOverlay>
        </div>
      );

      const rotHandle = document.querySelector('[data-handle="rotation"]')!;
      expect(rotHandle).toBeInTheDocument();

      // Mock getBoundingClientRect on container element to provide center at (250, 250)
      const overlayElem = screen.getByTestId(`transformable-overlay-${sampleGraphic.id}`);
      overlayElem.getBoundingClientRect = () => ({
        x: 200,
        y: 200,
        left: 200,
        top: 200,
        width: 100,
        height: 100,
        right: 300,
        bottom: 300,
        toJSON: () => {},
      });

      // Pointer down on rotation handle
      fireEvent.pointerDown(rotHandle, { clientX: 250, clientY: 180 });

      // Move pointer directly to the right of center: (350, 250) -> angle = 0 rad -> +90 deg offset = 90 deg (snapped to 90)
      fireEvent.pointerMove(window, { clientX: 350, clientY: 250 });
      fireEvent.pointerUp(window);

      const updatedGraphic = useTimelineStore
        .getState()
        .project.tracks.graphicsTrack.find((g) => g.id === sampleGraphic.id)!;

      expect(updatedGraphic.rotation).toBe(90);
      expect(updatedGraphic.isUserLocked).toBe(true);
    });
  });

  describe("Body Dragging with 1.5% Magnetic Snapping", () => {
    it("snaps to 50% Center X/Y and activates magnetic guides when dragged within 1.5%", () => {
      render(
        <div style={{ width: 500, height: 500, position: "relative" }}>
          <TransformableOverlay
            id={sampleGraphic.id}
            type="graphic"
            clip={sampleGraphic}
            positionX={sampleGraphic.positionX}
            positionY={sampleGraphic.positionY}
            scale={sampleGraphic.scale}
            rotation={sampleGraphic.rotation}
            isSelected={true}
          >
            <div>Graphic Content</div>
          </TransformableOverlay>
          <SnapGuidesOverlay />
        </div>
      );

      const overlay = screen.getByTestId(`transformable-overlay-${sampleGraphic.id}`);

      // Start drag at (0, 0) where initial position is (30%, 30%)
      fireEvent.pointerDown(overlay, { clientX: 0, clientY: 0 });

      // Move by deltaX = +104px, deltaY = +104px in a 500px width container -> raw position = 30 + (104 / 500 * 100) = 50.8%
      // 50.8% is within 1.5% of 50.0% center -> MUST SNAP TO 50%
      fireEvent.pointerMove(window, { clientX: 104, clientY: 104 });

      // Verify activeSnapGuides in store during drag
      const currentGuides = useTimelineStore.getState().activeSnapGuides;
      expect(currentGuides.length).toBe(2);
      expect(currentGuides.some((g) => g.orientation === "vertical" && g.position === 50)).toBe(true);
      expect(currentGuides.some((g) => g.orientation === "horizontal" && g.position === 50)).toBe(true);

      // Verify SnapGuidesOverlay renders the center guides
      expect(screen.getAllByText("Center").length).toBeGreaterThan(0);

      // End drag
      fireEvent.pointerUp(window);

      // Verify guides are cleared on release
      expect(useTimelineStore.getState().activeSnapGuides.length).toBe(0);

      // Verify the element position snapped to 50% and isUserLocked is true
      const updatedGraphic = useTimelineStore
        .getState()
        .project.tracks.graphicsTrack.find((g) => g.id === sampleGraphic.id)!;

      expect(updatedGraphic.position?.x).toBe(50);
      expect(updatedGraphic.position?.y).toBe(50);
      expect(updatedGraphic.isUserLocked).toBe(true);
    });

    it("does not snap when dragged outside the 1.5% magnetic threshold", () => {
      render(
        <div style={{ width: 500, height: 500, position: "relative" }}>
          <TransformableOverlay
            id={sampleGraphic.id}
            type="graphic"
            clip={sampleGraphic}
            positionX={sampleGraphic.positionX}
            positionY={sampleGraphic.positionY}
            scale={sampleGraphic.scale}
            rotation={sampleGraphic.rotation}
            isSelected={true}
          >
            <div>Graphic Content</div>
          </TransformableOverlay>
          <SnapGuidesOverlay />
        </div>
      );

      const overlay = screen.getByTestId(`transformable-overlay-${sampleGraphic.id}`);

      // Start drag
      fireEvent.pointerDown(overlay, { clientX: 0, clientY: 0 });

      // Move by deltaX = +120px, deltaY = +120px -> raw position = 30 + (120 / 500 * 100) = 54%
      // 54% is 4.0% away from 50% (> 1.5% threshold) -> NO SNAP
      fireEvent.pointerMove(window, { clientX: 120, clientY: 120 });

      // Verify no active guides
      expect(useTimelineStore.getState().activeSnapGuides.length).toBe(0);

      fireEvent.pointerUp(window);

      const updatedGraphic = useTimelineStore
        .getState()
        .project.tracks.graphicsTrack.find((g) => g.id === sampleGraphic.id)!;

      expect(updatedGraphic.position?.x).toBe(54);
      expect(updatedGraphic.position?.y).toBe(54);
      expect(updatedGraphic.isUserLocked).toBe(true);
    });
  });
});
