import { describe, it, expect, beforeEach } from "vitest";
import {
  resolveProjectLayout,
  calculateRelativeGeometry,
  LayoutResolutionResult,
} from "../lib/layout/layout-resolver";
import {
  TimelineProject,
  GraphicElement,
  CaptionBlock,
  SemanticConstraint,
} from "../lib/timeline-types";
import { useTimelineStore } from "../lib/stores/useTimelineStore";

describe("Phase 8: Semantic Constraints & Topological Layout Resolution", () => {
  const baseCard: GraphicElement = {
    id: "card-parent",
    name: "Main Metric Card",
    compositionId: "cooked_card",
    props: { title: "Revenue" },
    start: 0,
    end: 10,
    position: { x: 50, y: 40 },
    positionX: 50,
    positionY: 40,
    scale: 1.0, // base width: 36%, height: 18%
    isUserLocked: false,
  };

  const baseBadge: GraphicElement = {
    id: "badge-child",
    name: "Growth Badge",
    compositionId: "metric_reveal",
    props: { value: "+142%" },
    start: 0,
    end: 10,
    position: { x: 20, y: 20 },
    positionX: 20,
    positionY: 20,
    scale: 1.0, // base width: 36%, height: 18%
    isUserLocked: false,
  };

  const createTestProject = (
    elements: GraphicElement[] = [baseCard, baseBadge],
    constraints: SemanticConstraint[] = []
  ): TimelineProject => ({
    id: "project-phase8",
    title: "Phase 8 Layout Test",
    aspectRatio: "9:16",
    duration: 30,
    fps: 30,
    tracks: {
      videoTrack: [],
      brollTrack: [],
      textTrack: [],
      audioTrack: [],
      graphicsTrack: elements,
    },
    constraints,
  });

  describe("Direct Geometry Calculation", () => {
    const target = { x: 50, y: 50, width: 40, height: 20 }; // bounds: [30, 70] x, [40, 60] y
    const source = { x: 0, y: 0, width: 20, height: 10 };

    it("calculates 'below' relation correctly with gap", () => {
      // target bottom edge is 50 + 10 = 60. With gap 4, source top edge is 64.
      // source center Y is 64 + 5 = 69.
      const pos = calculateRelativeGeometry(source, target, "below", 4.0);
      expect(pos.x).toBe(50);
      expect(pos.y).toBe(69);
    });

    it("calculates 'above' relation correctly with gap", () => {
      // target top edge is 50 - 10 = 40. With gap 4, source bottom edge is 36.
      // source center Y is 36 - 5 = 31.
      const pos = calculateRelativeGeometry(source, target, "above", 4.0);
      expect(pos.x).toBe(50);
      expect(pos.y).toBe(31);
    });

    it("calculates 'left' relation correctly with gap", () => {
      // target left edge is 50 - 20 = 30. With gap 5, source right edge is 25.
      // source center X is 25 - 10 = 15.
      const pos = calculateRelativeGeometry(source, target, "left", 5.0);
      expect(pos.x).toBe(15);
      expect(pos.y).toBe(50);
    });

    it("calculates 'right' relation correctly with gap", () => {
      // target right edge is 50 + 20 = 70. With gap 5, source left edge is 75.
      // source center X is 75 + 10 = 85.
      const pos = calculateRelativeGeometry(source, target, "right", 5.0);
      expect(pos.x).toBe(85);
      expect(pos.y).toBe(50);
    });

    it("calculates 'align-left' correctly preserving source Y", () => {
      // target left edge is 30. source halfW is 10. source center X is 30 + 10 = 40.
      const sourceAtY35 = { ...source, y: 35 };
      const pos = calculateRelativeGeometry(sourceAtY35, target, "align-left");
      expect(pos.x).toBe(40);
      expect(pos.y).toBe(35);
    });

    it("calculates 'align-right' correctly preserving source Y", () => {
      // target right edge is 70. source halfW is 10. source center X is 70 - 10 = 60.
      const sourceAtY35 = { ...source, y: 35 };
      const pos = calculateRelativeGeometry(sourceAtY35, target, "align-right");
      expect(pos.x).toBe(60);
      expect(pos.y).toBe(35);
    });

    it("calculates 'align-top' correctly preserving source X", () => {
      // target top edge is 40. source halfH is 5. source center Y is 40 + 5 = 45.
      const sourceAtX25 = { ...source, x: 25 };
      const pos = calculateRelativeGeometry(sourceAtX25, target, "align-top");
      expect(pos.x).toBe(25);
      expect(pos.y).toBe(45);
    });

    it("calculates 'align-bottom' correctly preserving source X", () => {
      // target bottom edge is 60. source halfH is 5. source center Y is 60 - 5 = 55.
      const sourceAtX25 = { ...source, x: 25 };
      const pos = calculateRelativeGeometry(sourceAtX25, target, "align-bottom");
      expect(pos.x).toBe(25);
      expect(pos.y).toBe(55);
    });

    it("centers source on target for 'center' or 'inside'", () => {
      const pos = calculateRelativeGeometry(source, target, "center");
      expect(pos.x).toBe(50);
      expect(pos.y).toBe(50);
    });
  });

  describe("Topological Sorting & Multi-Hop Dependent Reflow", () => {
    it("reflows dependent child element when parent element is positioned", () => {
      const constraint: SemanticConstraint = {
        id: "rel-badge-below-card",
        sourceElementId: "badge-child",
        targetId: "card-parent",
        type: "align_relative",
        relation: "below",
        gap: 3.0,
        strength: "required",
      };

      const project = createTestProject([baseCard, baseBadge], [constraint]);
      const result = resolveProjectLayout(project);

      expect(result.changedElementIds).toContain("badge-child");
      const updatedBadge = result.project.tracks.graphicsTrack.find((g) => g.id === "badge-child")!;

      // card-parent: center Y = 40, height = 18 -> bottom = 49
      // gap = 3 -> badge top = 52 -> badge center Y = 52 + 9 = 61
      expect(updatedBadge.position?.x).toBe(50);
      expect(updatedBadge.position?.y).toBe(61);
    });

    it("resolves multi-hop dependency chains in exact topological order (A -> B -> C)", () => {
      const elemA: GraphicElement = {
        id: "elem-A",
        name: "Anchor Card A",
        compositionId: "card_a",
        props: {},
        start: 0,
        end: 10,
        position: { x: 50, y: 20 },
        isUserLocked: true,
      };

      const elemB: GraphicElement = {
        id: "elem-B",
        name: "Child B",
        compositionId: "card_b",
        props: {},
        start: 0,
        end: 10,
        position: { x: 10, y: 10 },
        isUserLocked: false,
      };

      const elemC: GraphicElement = {
        id: "elem-C",
        name: "Grandchild C",
        compositionId: "card_c",
        props: {},
        start: 0,
        end: 10,
        position: { x: 10, y: 10 },
        isUserLocked: false,
      };

      // B is below A, C is below B
      const constraints: SemanticConstraint[] = [
        {
          id: "rel-b-below-a",
          sourceElementId: "elem-B",
          targetId: "elem-A",
          type: "align_relative",
          relation: "below",
          gap: 2.0,
          strength: "required",
        },
        {
          id: "rel-c-below-b",
          sourceElementId: "elem-C",
          targetId: "elem-B",
          type: "align_relative",
          relation: "below",
          gap: 2.0,
          strength: "required",
        },
      ];

      const project = createTestProject([elemA, elemB, elemC], constraints);
      const result = resolveProjectLayout(project);

      // Verify topological evaluation order: elem-A -> elem-B -> elem-C
      const orderA = result.resolvedOrder.indexOf("elem-A");
      const orderB = result.resolvedOrder.indexOf("elem-B");
      const orderC = result.resolvedOrder.indexOf("elem-C");

      expect(orderA).toBeLessThan(orderB);
      expect(orderB).toBeLessThan(orderC);

      const b = result.project.tracks.graphicsTrack.find((g) => g.id === "elem-B")!;
      const c = result.project.tracks.graphicsTrack.find((g) => g.id === "elem-C")!;

      // A center = 20, height = 18 -> bottom = 29 -> B top = 31 -> B center = 40
      expect(b.position?.y).toBe(40);
      // B center = 40, height = 18 -> bottom = 49 -> C top = 51 -> C center = 60
      expect(c.position?.y).toBe(60);
    });

    it("reflows dependent elements when parent element is moved or scaled", () => {
      const movedCard = {
        ...baseCard,
        position: { x: 70, y: 30 }, // Moved from (50, 40) to (70, 30)
        scale: 1.5, // Scaled from 1.0 to 1.5 -> height = 18 * 1.5 = 27
      };

      const constraint: SemanticConstraint = {
        id: "rel-badge-below-card",
        sourceElementId: "badge-child",
        targetId: "card-parent",
        type: "align_relative",
        relation: "below",
        gap: 2.0,
        strength: "required",
      };

      const project = createTestProject([movedCard, baseBadge], [constraint]);
      const result = resolveProjectLayout(project);

      const updatedBadge = result.project.tracks.graphicsTrack.find((g) => g.id === "badge-child")!;

      // Parent center X is 70 -> Badge aligns horizontally to 70
      expect(updatedBadge.position?.x).toBe(70);

      // Parent center Y is 30, height is 27 -> bottom edge is 30 + 13.5 = 43.5
      // Gap is 2.0 -> badge top edge is 45.5
      // Badge height is 18 -> halfH is 9 -> badge center Y is 45.5 + 9 = 54.5
      expect(updatedBadge.position?.y).toBe(54.5);
    });
  });

  describe("Circular Dependency Handling & Graceful Degradation", () => {
    it("detects circular constraints, logs a diagnostic error, and degrades gracefully without throwing", () => {
      // A is below B, and B is below A (Cycle)
      const cyclicConstraints: SemanticConstraint[] = [
        {
          id: "rel-card-below-badge",
          sourceElementId: "card-parent",
          targetId: "badge-child",
          type: "align_relative",
          relation: "below",
          gap: 2.0,
          strength: "required",
        },
        {
          id: "rel-badge-below-card",
          sourceElementId: "badge-child",
          targetId: "card-parent",
          type: "align_relative",
          relation: "below",
          gap: 2.0,
          strength: "required",
        },
      ];

      const project = createTestProject([baseCard, baseBadge], cyclicConstraints);

      // Must NOT throw
      expect(() => {
        const result = resolveProjectLayout(project);
        expect(result.diagnostics.some((d) => d.reason === "circular-dependency")).toBe(true);
        expect(result.diagnostics.find((d) => d.reason === "circular-dependency")?.severity).toBe("error");
      }).not.toThrow();
    });

    it("handles 3-node circular dependency (A -> B -> C -> A) gracefully", () => {
      const elemA = { ...baseCard, id: "elem-cycle-A" };
      const elemB = { ...baseCard, id: "elem-cycle-B" };
      const elemC = { ...baseCard, id: "elem-cycle-C" };

      const threeWayCycle: SemanticConstraint[] = [
        {
          id: "rel-a-b",
          sourceElementId: "elem-cycle-A",
          targetId: "elem-cycle-B",
          type: "align_relative",
          relation: "below",
          strength: "required",
        },
        {
          id: "rel-b-c",
          sourceElementId: "elem-cycle-B",
          targetId: "elem-cycle-C",
          type: "align_relative",
          relation: "below",
          strength: "required",
        },
        {
          id: "rel-c-a",
          sourceElementId: "elem-cycle-C",
          targetId: "elem-cycle-A",
          type: "align_relative",
          relation: "below",
          strength: "required",
        },
      ];

      const project = createTestProject([elemA, elemB, elemC], threeWayCycle);
      const result = resolveProjectLayout(project);

      expect(result.diagnostics.some((d) => d.reason === "circular-dependency")).toBe(true);
      expect(result.diagnostics.find((d) => d.reason === "circular-dependency")?.elements?.length).toBe(3);
    });

    it("resolves valid independent DAG branches even when another branch contains a cycle", () => {
      // Cycle: A <-> B
      const elemA = { ...baseCard, id: "elem-cycle-1" };
      const elemB = { ...baseCard, id: "elem-cycle-2" };

      // Valid branch: Parent D -> Child E
      const elemD = { ...baseCard, id: "valid-parent", position: { x: 50, y: 30 } };
      const elemE = { ...baseBadge, id: "valid-child", position: { x: 10, y: 10 } };

      const mixedConstraints: SemanticConstraint[] = [
        {
          id: "cycle-1",
          sourceElementId: "elem-cycle-1",
          targetId: "elem-cycle-2",
          type: "align_relative",
          relation: "below",
          strength: "required",
        },
        {
          id: "cycle-2",
          sourceElementId: "elem-cycle-2",
          targetId: "elem-cycle-1",
          type: "align_relative",
          relation: "below",
          strength: "required",
        },
        {
          id: "valid-rel",
          sourceElementId: "valid-child",
          targetId: "valid-parent",
          type: "align_relative",
          relation: "below",
          gap: 2.0,
          strength: "required",
        },
      ];

      const project = createTestProject([elemA, elemB, elemD, elemE], mixedConstraints);
      const result = resolveProjectLayout(project);

      // Diagnostic reports cycle
      expect(result.diagnostics.some((d) => d.reason === "circular-dependency")).toBe(true);

      // But valid-child must still be successfully resolved below valid-parent!
      const validChild = result.project.tracks.graphicsTrack.find((g) => g.id === "valid-child")!;
      expect(validChild.position?.x).toBe(50);
      expect(validChild.position?.y).toBe(50);
    });
  });

  describe("User Intent Locking (isUserLocked)", () => {
    it("preserves manual positioning when source element has isUserLocked: true", () => {
      const lockedBadge: GraphicElement = {
        ...baseBadge,
        position: { x: 80, y: 80 },
        positionX: 80,
        positionY: 80,
        isUserLocked: true, // User manually positioned it at (80, 80)
      };

      const constraint: SemanticConstraint = {
        id: "rel-badge-below-card",
        sourceElementId: "badge-child",
        targetId: "card-parent",
        type: "align_relative",
        relation: "below",
        gap: 2.0,
        strength: "required",
      };

      const project = createTestProject([baseCard, lockedBadge], [constraint]);
      const result = resolveProjectLayout(project);

      // The badge position must remain untouched at (80, 80)
      const badge = result.project.tracks.graphicsTrack.find((g) => g.id === "badge-child")!;
      expect(badge.position?.x).toBe(80);
      expect(badge.position?.y).toBe(80);

      // Should log user-locked-preserved info diagnostic
      expect(result.diagnostics.some((d) => d.reason === "user-locked-preserved")).toBe(true);
    });
  });

  describe("Safe Zone Clamping (clamp_safe_zone)", () => {
    it("clamps element overflowing outside the safe margins (10% to 90%)", () => {
      const overflowingElement: GraphicElement = {
        id: "overflow-card",
        name: "Overflow Card",
        compositionId: "card",
        props: {},
        start: 0,
        end: 10,
        position: { x: 95, y: 5 }, // Near top-right corner outside safe margins
        isUserLocked: false,
      };

      const constraint: SemanticConstraint = {
        id: "clamp-overflow-card",
        sourceElementId: "overflow-card",
        type: "clamp_safe_zone",
        strength: "required",
      };

      const project = createTestProject([overflowingElement], [constraint]);
      const result = resolveProjectLayout(project);

      const clamped = result.project.tracks.graphicsTrack.find((g) => g.id === "overflow-card")!;

      // With base width 36% (halfW = 18), maxX = 90 -> max allowed X is 90 - 18 = 72
      // With base height 18% (halfH = 9), minY = 10 -> min allowed Y is 10 + 9 = 19
      expect(clamped.position?.x).toBe(72);
      expect(clamped.position?.y).toBe(19);
      expect(result.diagnostics.some((d) => d.reason === "safe-zone-clamped")).toBe(true);
    });
  });

  describe("Performance Benchmark (<5ms)", () => {
    it("resolves complex multi-element graph with 50 chained constraints in <5ms", () => {
      const elements: GraphicElement[] = [];
      const constraints: SemanticConstraint[] = [];

      // Create 50 chained elements
      for (let i = 0; i < 50; i++) {
        elements.push({
          id: `elem-chain-50-${i}`,
          name: `Chain Element ${i}`,
          compositionId: "card",
          props: {},
          start: 0,
          end: 10,
          position: { x: 50, y: 10 + i * 1.5 },
          isUserLocked: i === 0,
        });

        if (i > 0) {
          constraints.push({
            id: `constraint-50-${i}`,
            sourceElementId: `elem-chain-50-${i}`,
            targetId: `elem-chain-50-${i - 1}`,
            type: "align_relative",
            relation: "below",
            gap: 1.0,
            strength: "required",
          });
        }
      }

      const project = createTestProject(elements, constraints);

      const startTime = performance.now();
      const result = resolveProjectLayout(project);
      const elapsed = performance.now() - startTime;

      expect(elapsed).toBeLessThan(5.0);
      expect(result.executionTimeMs).toBeLessThan(5.0);
      expect(result.resolvedOrder.length).toBe(50);
    });
  });

  describe("Zustand useTimelineStore Integration", () => {
    beforeEach(() => {
      useTimelineStore.getState().initProject(createTestProject());
    });

    it("automatically reflows dependent elements when constraint is added via addConstraint", () => {
      const constraint: SemanticConstraint = {
        id: "store-rel-badge-below-card",
        sourceElementId: "badge-child",
        targetId: "card-parent",
        type: "align_relative",
        relation: "below",
        gap: 3.0,
        strength: "required",
      };

      useTimelineStore.getState().addConstraint(constraint);

      const state = useTimelineStore.getState();
      const badge = state.project.tracks.graphicsTrack.find((g) => g.id === "badge-child")!;

      expect(badge.position?.x).toBe(50);
      expect(badge.position?.y).toBe(61);
    });

    it("automatically reflows dependent elements when parent is moved via commitHistory", () => {
      // 1. Add relative constraint
      const constraint: SemanticConstraint = {
        id: "store-rel-badge-below-card",
        sourceElementId: "badge-child",
        targetId: "card-parent",
        type: "align_relative",
        relation: "below",
        gap: 2.0,
        strength: "required",
      };
      useTimelineStore.getState().addConstraint(constraint);

      // 2. User drags parent card to (70, 30)
      useTimelineStore.getState().updateGraphicElement("card-parent", {
        position: { x: 70, y: 30 },
        positionX: 70,
        positionY: 30,
        isUserLocked: true,
      }, false);

      // 3. User releases mouse -> commitHistory() runs layout resolution
      useTimelineStore.getState().commitHistory();

      const state = useTimelineStore.getState();
      const badge = state.project.tracks.graphicsTrack.find((g) => g.id === "badge-child")!;

      // Badge must follow parent to X = 70
      expect(badge.position?.x).toBe(70);
      // Parent bottom = 30 + 9 = 39 -> gap = 2 -> badge top = 41 -> badge center Y = 41 + 9 = 50
      expect(badge.position?.y).toBe(50);
    });

    it("automatically reflows dependent elements when parent is moved via dispatchOperation", () => {
      const constraint: SemanticConstraint = {
        id: "store-rel-badge-below-card-op",
        sourceElementId: "badge-child",
        targetId: "card-parent",
        type: "align_relative",
        relation: "below",
        gap: 2.0,
        strength: "required",
      };
      useTimelineStore.getState().addConstraint(constraint);

      // Move parent card via typed operation
      useTimelineStore.getState().dispatchOperation({
        type: "move_element",
        targetId: "card-parent",
        targetType: "graphic",
        position: { x: 65, y: 35 },
        isUserLocked: true,
      });

      const state = useTimelineStore.getState();
      const badge = state.project.tracks.graphicsTrack.find((g) => g.id === "badge-child")!;

      // Parent is at (65, 35) -> bottom is 35 + 9 = 44 -> gap = 2 -> badge top = 46 -> badge center Y = 46 + 9 = 55
      expect(badge.position?.x).toBe(65);
      expect(badge.position?.y).toBe(55);
    });
  });
});
