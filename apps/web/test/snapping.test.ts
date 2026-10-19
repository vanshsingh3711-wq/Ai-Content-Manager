import { describe, it, expect } from "vitest";
import {
  calculateSnapping,
  calculateRotationSnapping,
  DEFAULT_SNAP_THRESHOLD,
} from "../lib/editor/snapping";

describe("Phase 7: Magnetic Snapping and Alignment Guides", () => {
  describe("Position Snapping", () => {
    it("snaps to 50% Center X when within the 1.5% threshold", () => {
      // 50.8% is within 1.5% of 50.0%
      const result = calculateSnapping(50.8, 20.0);
      expect(result.snappedX).toBe(true);
      expect(result.x).toBe(50);
      expect(result.snappedY).toBe(false);
      expect(result.y).toBe(20.0);

      expect(result.guides.length).toBe(1);
      expect(result.guides[0].orientation).toBe("vertical");
      expect(result.guides[0].position).toBe(50);
      expect(result.guides[0].label).toBe("Center");
    });

    it("snaps to 50% Center Y when within the 1.5% threshold", () => {
      // 49.2% is within 1.5% of 50.0%
      const result = calculateSnapping(75.0, 49.2);
      expect(result.snappedX).toBe(false);
      expect(result.x).toBe(75.0);
      expect(result.snappedY).toBe(true);
      expect(result.y).toBe(50);

      expect(result.guides.length).toBe(1);
      expect(result.guides[0].orientation).toBe("horizontal");
      expect(result.guides[0].position).toBe(50);
    });

    it("does not snap when distance is strictly greater than 1.5% threshold", () => {
      // 51.6% is 1.6% away from 50.0% (> 1.5%)
      const result = calculateSnapping(51.6, 52.5);
      expect(result.snappedX).toBe(false);
      expect(result.x).toBe(51.6);
      expect(result.snappedY).toBe(false);
      expect(result.y).toBe(52.5);
      expect(result.guides.length).toBe(0);
    });

    it("verifies exact 1.5% mathematical boundary behavior", () => {
      // Exactly 1.5% above 50% (51.5%) -> should snap
      const atUpperBoundary = calculateSnapping(51.5, 20.0);
      expect(atUpperBoundary.snappedX).toBe(true);
      expect(atUpperBoundary.x).toBe(50);

      // 1.51% above 50% (51.51%) -> outside threshold -> should NOT snap
      const outsideUpper = calculateSnapping(51.51, 20.0);
      expect(outsideUpper.snappedX).toBe(false);
      expect(outsideUpper.x).toBe(51.51);

      // Exactly 1.5% below 50% (48.5%) -> should snap
      const atLowerBoundary = calculateSnapping(48.5, 20.0);
      expect(atLowerBoundary.snappedX).toBe(true);
      expect(atLowerBoundary.x).toBe(50);

      // 1.51% below 50% (48.49%) -> outside threshold -> should NOT snap
      const outsideLower = calculateSnapping(48.49, 20.0);
      expect(outsideLower.snappedX).toBe(false);
      expect(outsideLower.x).toBe(48.49);
    });

    it("snaps both X and Y simultaneously when both are near center (crosshair snap)", () => {
      const result = calculateSnapping(51.2, 48.9);
      expect(result.snappedX).toBe(true);
      expect(result.snappedY).toBe(true);
      expect(result.x).toBe(50);
      expect(result.y).toBe(50);
      expect(result.guides.length).toBe(2);
      expect(result.guides.some((g) => g.orientation === "vertical")).toBe(true);
      expect(result.guides.some((g) => g.orientation === "horizontal")).toBe(true);
    });

    it("snaps to safe edge margins (10% and 90%)", () => {
      // Left margin snap (10%)
      const snapLeft = calculateSnapping(10.8, 30.0);
      expect(snapLeft.snappedX).toBe(true);
      expect(snapLeft.x).toBe(10);
      expect(snapLeft.guides[0].label).toBe("Left Safe Margin");

      // Right margin snap (90%)
      const snapRight = calculateSnapping(89.5, 30.0);
      expect(snapRight.snappedX).toBe(true);
      expect(snapRight.x).toBe(90);
      expect(snapRight.guides[0].label).toBe("Right Safe Margin");

      // Bottom margin snap (90%)
      const snapBottom = calculateSnapping(50.0, 90.7);
      expect(snapBottom.snappedY).toBe(true);
      expect(snapBottom.y).toBe(90);
    });

    it("supports custom snap targets", () => {
      const result = calculateSnapping(33.2, 66.8, {
        customTargetsX: [{ position: 33.33, label: "One Third" }],
        customTargetsY: [{ position: 66.66, label: "Two Thirds" }],
      });

      expect(result.snappedX).toBe(true);
      expect(result.x).toBe(33.33);
      expect(result.snappedY).toBe(true);
      expect(result.y).toBe(66.66);
    });
  });

  describe("Rotation Angle Snapping", () => {
    it("snaps to 0° when within 4° threshold", () => {
      const result = calculateRotationSnapping(2.5);
      expect(result.snapped).toBe(true);
      expect(result.angle).toBe(0);
    });

    it("snaps to 90° and -90° when near perpendicular", () => {
      const pos90 = calculateRotationSnapping(88.5);
      expect(pos90.snapped).toBe(true);
      expect(pos90.angle).toBe(90);

      const neg90 = calculateRotationSnapping(-91.2);
      expect(neg90.snapped).toBe(true);
      expect(neg90.angle).toBe(-90);
    });

    it("snaps to 45° diagonal angle", () => {
      const diag = calculateRotationSnapping(46.0);
      expect(diag.snapped).toBe(true);
      expect(diag.angle).toBe(45);
    });

    it("preserves continuous free rotation when outside snap threshold", () => {
      const free = calculateRotationSnapping(23.7);
      expect(free.snapped).toBe(false);
      expect(free.angle).toBe(23.7);
    });
  });
});
