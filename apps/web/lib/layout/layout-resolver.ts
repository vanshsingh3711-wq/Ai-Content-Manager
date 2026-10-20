/**
 * layout-resolver.ts
 *
 * Deterministic topological layout resolution engine for the Web Video Editor.
 * Resolves semantic spatial constraints (`align_relative`, `clamp_safe_zone`, `above`,
 * `below`, `left`, `right`, `align-left`, etc.) and reflows dependent elements when parents move or resize.
 *
 * Employs Kahn's algorithm for topological sorting, detects and breaks circular dependencies gracefully,
 * and executes within <5ms.
 */

import {
  TimelineProject,
  GraphicElement,
  CaptionBlock,
  VideoClip,
  BRollClip,
  SemanticConstraint,
  ConstraintRelation,
  SubjectSafeZone,
} from "../timeline-types";

export interface LayoutDiagnostic {
  severity: "info" | "warning" | "error";
  reason:
    | "circular-dependency"
    | "unresolved-target"
    | "missing-source"
    | "user-locked-preserved"
    | "safe-zone-clamped";
  message: string;
  elements?: string[];
}

export interface LayoutResolutionResult {
  project: TimelineProject;
  changedElementIds: string[];
  diagnostics: LayoutDiagnostic[];
  resolvedOrder: string[];
  executionTimeMs: number;
}

export interface LayoutResolutionOptions {
  forceUserLocked?: boolean; // If true, overrides isUserLocked flag
  customSafeZone?: { minX: number; maxX: number; minY: number; maxY: number };
}

interface GenericElementGeometry {
  id: string;
  trackKey: "graphicsTrack" | "textTrack" | "videoTrack" | "brollTrack";
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  isUserLocked: boolean;
  original: any;
}

/**
 * Extracts normalized bounding box geometry (percentages 0-100) for any project element.
 */
function extractElementGeometry(element: any, trackKey: GenericElementGeometry["trackKey"], index: number): GenericElementGeometry {
  const scale = element.scale ?? 1.0;
  const rawX = element.position?.x ?? element.positionX ?? 50;
  const rawY = element.position?.y ?? element.positionY ?? (trackKey === "textTrack" ? 75 : 50);

  // Estimate base width and height in percentage if not explicitly defined
  let baseWidth = element.width;
  let baseHeight = element.height;

  if (baseWidth === undefined) {
    if (trackKey === "graphicsTrack") baseWidth = 36;
    else if (trackKey === "textTrack") baseWidth = 50;
    else baseWidth = 100;
  }

  if (baseHeight === undefined) {
    if (trackKey === "graphicsTrack") baseHeight = 18;
    else if (trackKey === "textTrack") baseHeight = 10;
    else baseHeight = 100;
  }

  // Actual bounding box dimensions taking scale factor into account
  const width = baseWidth * scale;
  const height = baseHeight * scale;

  return {
    id: element.id,
    trackKey,
    index,
    x: rawX,
    y: rawY,
    width,
    height,
    scale,
    isUserLocked: element.isUserLocked ?? false,
    original: element,
  };
}

/**
 * Resolves all semantic spatial constraints across a TimelineProject.
 */
export function resolveProjectLayout(
  project: TimelineProject,
  options: LayoutResolutionOptions = {}
): LayoutResolutionResult {
  const startTime = performance.now();
  const diagnostics: LayoutDiagnostic[] = [];
  const changedElementIds = new Set<string>();

  const constraints = project.constraints || [];
  if (constraints.length === 0) {
    return {
      project,
      changedElementIds: [],
      diagnostics: [],
      resolvedOrder: [],
      executionTimeMs: Number((performance.now() - startTime).toFixed(3)),
    };
  }

  // 1. Index all visual elements in the project
  const geometryMap = new Map<string, GenericElementGeometry>();

  (project.tracks.graphicsTrack || []).forEach((el, index) => {
    geometryMap.set(el.id, extractElementGeometry(el, "graphicsTrack", index));
  });
  (project.tracks.textTrack || []).forEach((el, index) => {
    geometryMap.set(el.id, extractElementGeometry(el, "textTrack", index));
  });
  (project.tracks.videoTrack || []).forEach((el, index) => {
    geometryMap.set(el.id, extractElementGeometry(el, "videoTrack", index));
  });
  (project.tracks.brollTrack || []).forEach((el, index) => {
    geometryMap.set(el.id, extractElementGeometry(el, "brollTrack", index));
  });

  // 2. Build Dependency Graph (Target -> Source: Source must be resolved AFTER Target)
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize all elements present in the geometry map
  for (const id of geometryMap.keys()) {
    adjacency.set(id, []);
    inDegree.set(id, 0);
  }

  // Populate edges for relational constraints
  const activeRelationalConstraints: SemanticConstraint[] = [];

  for (const constraint of constraints) {
    if (!geometryMap.has(constraint.sourceElementId)) {
      diagnostics.push({
        severity: "warning",
        reason: "missing-source",
        message: `Constraint source '${constraint.sourceElementId}' not found in timeline elements.`,
        elements: [constraint.sourceElementId],
      });
      continue;
    }

    if (constraint.type === "align_relative" && constraint.targetId) {
      if (!geometryMap.has(constraint.targetId)) {
        diagnostics.push({
          severity: "warning",
          reason: "unresolved-target",
          message: `Constraint target '${constraint.targetId}' not found in timeline elements.`,
          elements: [constraint.targetId],
        });
        continue;
      }

      // Target must resolve before Source: Edge is targetId -> sourceElementId
      adjacency.get(constraint.targetId)!.push(constraint.sourceElementId);
      inDegree.set(constraint.sourceElementId, (inDegree.get(constraint.sourceElementId) || 0) + 1);
      activeRelationalConstraints.push(constraint);
    }
  }

  // 3. Topological Sort (Kahn's Algorithm)
  const queue: string[] = [];
  for (const [node, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(node);
    }
  }

  const resolvedOrder: string[] = [];

  while (queue.length > 0) {
    // Sort queue alphabetically for 100% deterministic tie-breaking
    queue.sort();
    const current = queue.shift()!;
    resolvedOrder.push(current);

    const neighbors = adjacency.get(current) || [];
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  // 4. Cycle Detection & Graceful Fallback
  if (resolvedOrder.length < geometryMap.size) {
    const cyclicNodes = Array.from(inDegree.entries())
      .filter(([_, degree]) => degree > 0)
      .map(([node]) => node);

    diagnostics.push({
      severity: "error",
      reason: "circular-dependency",
      message: `Circular constraint dependency detected involving: ${cyclicNodes.join(", ")}`,
      elements: cyclicNodes,
    });

    console.warn(`[LayoutResolver] Circular constraint dependency detected: ${cyclicNodes.join(", ")}`);

    // Append cyclic nodes to resolvedOrder to avoid skipping them entirely
    for (const cyclicNode of cyclicNodes) {
      if (!resolvedOrder.includes(cyclicNode)) {
        resolvedOrder.push(cyclicNode);
      }
    }
  }

  // 5. Index constraints by source element ID
  const constraintsBySource = new Map<string, SemanticConstraint[]>();
  for (const c of constraints) {
    if (!constraintsBySource.has(c.sourceElementId)) {
      constraintsBySource.set(c.sourceElementId, []);
    }
    constraintsBySource.get(c.sourceElementId)!.push(c);
  }

  // 6. Evaluate Constraints in Topological Order
  for (const elementId of resolvedOrder) {
    const elementConstraints = constraintsBySource.get(elementId);
    if (!elementConstraints || elementConstraints.length === 0) continue;

    const sourceGeom = geometryMap.get(elementId)!;

    for (const constraint of elementConstraints) {
      // Respect isUserLocked unless explicitly forced
      if (sourceGeom.isUserLocked && !options.forceUserLocked) {
        diagnostics.push({
          severity: "info",
          reason: "user-locked-preserved",
          message: `Element '${elementId}' is user-locked. Manual placement preserved.`,
          elements: [elementId],
        });
        continue;
      }

      // Handle align_relative constraints
      if (constraint.type === "align_relative" && constraint.targetId) {
        const targetGeom = geometryMap.get(constraint.targetId);
        if (!targetGeom) continue;

        const gap = constraint.gap ?? 2.0; // default 2% gap
        const relation = constraint.relation || "below";

        const newPos = calculateRelativeGeometry(sourceGeom, targetGeom, relation, gap);

        if (newPos.x !== sourceGeom.x || newPos.y !== sourceGeom.y) {
          sourceGeom.x = Number(newPos.x.toFixed(2));
          sourceGeom.y = Number(newPos.y.toFixed(2));
          changedElementIds.add(elementId);
        }
      }

      // Handle clamp_safe_zone constraints
      if (constraint.type === "clamp_safe_zone") {
        const safeMargins = options.customSafeZone ?? { minX: 10, maxX: 90, minY: 10, maxY: 90 };
        const padding = constraint.padding ?? 0;

        const halfW = sourceGeom.width / 2;
        const halfH = sourceGeom.height / 2;

        const clampedX = Math.max(
          safeMargins.minX + halfW + padding,
          Math.min(safeMargins.maxX - halfW - padding, sourceGeom.x)
        );
        const clampedY = Math.max(
          safeMargins.minY + halfH + padding,
          Math.min(safeMargins.maxY - halfH - padding, sourceGeom.y)
        );

        if (clampedX !== sourceGeom.x || clampedY !== sourceGeom.y) {
          sourceGeom.x = Number(clampedX.toFixed(2));
          sourceGeom.y = Number(clampedY.toFixed(2));
          changedElementIds.add(elementId);
          diagnostics.push({
            severity: "info",
            reason: "safe-zone-clamped",
            message: `Element '${elementId}' clamped inside safe zone bounds.`,
            elements: [elementId],
          });
        }
      }
    }
  }

  // 7. Apply modified geometries back to cloned project immutably
  if (changedElementIds.size === 0) {
    return {
      project,
      changedElementIds: [],
      diagnostics,
      resolvedOrder,
      executionTimeMs: Number((performance.now() - startTime).toFixed(3)),
    };
  }

  const nextProject: TimelineProject = {
    ...project,
    tracks: {
      graphicsTrack: (project.tracks.graphicsTrack || []).map((el) => {
        if (changedElementIds.has(el.id)) {
          const geom = geometryMap.get(el.id)!;
          return {
            ...el,
            position: { x: geom.x, y: geom.y },
            positionX: geom.x,
            positionY: geom.y,
          };
        }
        return el;
      }),
      textTrack: (project.tracks.textTrack || []).map((el) => {
        if (changedElementIds.has(el.id)) {
          const geom = geometryMap.get(el.id)!;
          return {
            ...el,
            position: { x: geom.x, y: geom.y },
            positionX: geom.x,
            positionY: geom.y,
          };
        }
        return el;
      }),
      videoTrack: (project.tracks.videoTrack || []).map((el) => {
        if (changedElementIds.has(el.id)) {
          const geom = geometryMap.get(el.id)!;
          return {
            ...el,
            position: { x: geom.x, y: geom.y },
            positionX: geom.x,
            positionY: geom.y,
          };
        }
        return el;
      }),
      brollTrack: (project.tracks.brollTrack || []).map((el) => {
        if (changedElementIds.has(el.id)) {
          const geom = geometryMap.get(el.id)!;
          return {
            ...el,
            position: { x: geom.x, y: geom.y },
            positionX: geom.x,
            positionY: geom.y,
          };
        }
        return el;
      }),
      audioTrack: [...(project.tracks.audioTrack || [])],
    },
  };

  const executionTimeMs = Number((performance.now() - startTime).toFixed(3));

  return {
    project: nextProject,
    changedElementIds: Array.from(changedElementIds),
    diagnostics,
    resolvedOrder,
    executionTimeMs,
  };
}

/**
 * Calculates new center (X, Y) coordinates of source relative to target.
 * Coordinates are percentages (0 - 100).
 */
export function calculateRelativeGeometry(
  source: { x: number; y: number; width: number; height: number },
  target: { x: number; y: number; width: number; height: number },
  relation: ConstraintRelation,
  gap: number = 2.0
): { x: number; y: number } {
  const targetHalfW = target.width / 2;
  const targetHalfH = target.height / 2;
  const sourceHalfW = source.width / 2;
  const sourceHalfH = source.height / 2;

  switch (relation) {
    case "below": {
      // Place source below target bottom edge, aligned horizontally with target center
      const targetBottom = target.y + targetHalfH;
      const newY = targetBottom + gap + sourceHalfH;
      return { x: target.x, y: newY };
    }

    case "above": {
      // Place source above target top edge, aligned horizontally with target center
      const targetTop = target.y - targetHalfH;
      const newY = targetTop - gap - sourceHalfH;
      return { x: target.x, y: newY };
    }

    case "left": {
      // Place source to the left of target left edge, aligned vertically with target center
      const targetLeft = target.x - targetHalfW;
      const newX = targetLeft - gap - sourceHalfW;
      return { x: newX, y: target.y };
    }

    case "right": {
      // Place source to the right of target right edge, aligned vertically with target center
      const targetRight = target.x + targetHalfW;
      const newX = targetRight + gap + sourceHalfW;
      return { x: newX, y: target.y };
    }

    case "center":
    case "inside": {
      // Center source directly on top of target center
      return { x: target.x, y: target.y };
    }

    case "align-left": {
      // Align source left edge with target left edge, preserving source Y
      const targetLeft = target.x - targetHalfW;
      const newX = targetLeft + sourceHalfW;
      return { x: newX, y: source.y };
    }

    case "align-right": {
      // Align source right edge with target right edge, preserving source Y
      const targetRight = target.x + targetHalfW;
      const newX = targetRight - sourceHalfW;
      return { x: newX, y: source.y };
    }

    case "align-top": {
      // Align source top edge with target top edge, preserving source X
      const targetTop = target.y - targetHalfH;
      const newY = targetTop + sourceHalfH;
      return { x: source.x, y: newY };
    }

    case "align-bottom": {
      // Align source bottom edge with target bottom edge, preserving source X
      const targetBottom = target.y + targetHalfH;
      const newY = targetBottom - sourceHalfH;
      return { x: source.x, y: newY };
    }

    default:
      return { x: source.x, y: source.y };
  }
}
