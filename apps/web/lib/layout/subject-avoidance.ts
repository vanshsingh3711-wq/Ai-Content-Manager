/**
 * subject-avoidance.ts
 *
 * Pre-computed MediaPipe subject avoidance and safe-zone placement engine.
 * Computes spatial overlap between proposed elements (titles, graphics, cards)
 * and detected presenter boundaries, automatically steering placement to unoccupied quadrants.
 */

import { SubjectSafeZone } from "../timeline-types";

export interface ElementSize {
  width: number;  // In canvas percentage (0 - 100)
  height: number; // In canvas percentage (0 - 100)
}

export interface Position {
  x: number; // In canvas percentage (0 - 100), center anchor
  y: number; // In canvas percentage (0 - 100), center anchor
}

export type CandidateRegion =
  | "top-center"
  | "top-left"
  | "top-right"
  | "center-left"
  | "center-right"
  | "bottom-center"
  | "bottom-left"
  | "bottom-right";

export interface CandidatePlacement {
  region: CandidateRegion;
  position: Position;
  priority: number;
}

export interface OverlapResult {
  overlaps: boolean;
  overlapArea: number;
  overlapPercentage: number;
}

export interface PlacementResult {
  position: Position;
  region: CandidateRegion | "custom" | "default";
  overlapArea: number;
  isAvoided: boolean;
  safeZoneId?: string;
}

export interface AvoidanceOptions {
  elementSize?: ElementSize;
  safeZones?: SubjectSafeZone[];
  playheadTime?: number;
  padding?: number;
  defaultPosition?: Position;
  preferredRegions?: CandidateRegion[];
}

export interface VisualTimelineSubjectEvent {
  timestamp?: number;
  start?: number;
  end?: number;
  confidence?: number;
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface UnifiedVisualTimelineResponse {
  video_id: string;
  scenes?: any[];
  subjects?: VisualTimelineSubjectEvent[];
  composition_segments?: Array<{
    start?: number;
    end?: number;
    primary_subject_position?: "left" | "center" | "right" | "unknown";
    safe_regions?: string[];
    bottom_region_occupied?: boolean;
  }>;
  safe_regions?: string[];
  observations?: any[];
}

/**
 * Standard candidates for title/graphic placement in mobile/vertical & widescreen formats.
 * Coordinated to stay within mobile safe margins (15-20% from top, 15-22% from bottom).
 */
export const DEFAULT_CANDIDATE_PLACEMENTS: CandidatePlacement[] = [
  { region: "bottom-center", position: { x: 50, y: 78 }, priority: 1 },
  { region: "top-center", position: { x: 50, y: 22 }, priority: 2 },
  { region: "top-left", position: { x: 25, y: 22 }, priority: 3 },
  { region: "top-right", position: { x: 75, y: 22 }, priority: 4 },
  { region: "center-left", position: { x: 25, y: 50 }, priority: 5 },
  { region: "center-right", position: { x: 75, y: 50 }, priority: 6 },
  { region: "bottom-left", position: { x: 25, y: 78 }, priority: 7 },
  { region: "bottom-right", position: { x: 75, y: 78 }, priority: 8 },
];

/**
 * Filters safe zones that are active at the specified playhead time.
 */
export function filterActiveSafeZones(
  safeZones: SubjectSafeZone[] = [],
  playheadTime?: number
): SubjectSafeZone[] {
  if (playheadTime === undefined || safeZones.length === 0) {
    return safeZones;
  }

  return safeZones.filter((sz) => {
    // If no start timestamp specified or duration spans entire video (0 or undefined duration)
    if (sz.timestamp === undefined || sz.duration === undefined || sz.duration <= 0) {
      return true;
    }
    const end = sz.timestamp + sz.duration;
    return playheadTime >= sz.timestamp && playheadTime <= end;
  });
}

/**
 * Computes axis-aligned bounding box intersection between an element and a subject safe zone.
 * Assumes element coordinates are centered at candidatePos, and safeZone coords are top-left based.
 */
export function checkSubjectOverlap(
  candidatePos: Position,
  elementSize: ElementSize,
  safeZone: SubjectSafeZone,
  padding: number = 2
): OverlapResult {
  // Element rectangle bounds (centered at candidatePos)
  const elemLeft = candidatePos.x - elementSize.width / 2 - padding;
  const elemRight = candidatePos.x + elementSize.width / 2 + padding;
  const elemTop = candidatePos.y - elementSize.height / 2 - padding;
  const elemBottom = candidatePos.y + elementSize.height / 2 + padding;

  // Subject bounding box bounds (top-left based normalized 0-100)
  const subjLeft = safeZone.x;
  const subjRight = safeZone.x + safeZone.width;
  const subjTop = safeZone.y;
  const subjBottom = safeZone.y + safeZone.height;

  // Intersection span
  const overlapX = Math.max(0, Math.min(elemRight, subjRight) - Math.max(elemLeft, subjLeft));
  const overlapY = Math.max(0, Math.min(elemBottom, subjBottom) - Math.max(elemTop, subjTop));

  const overlapArea = overlapX * overlapY;
  const elemArea = (elementSize.width + padding * 2) * (elementSize.height + padding * 2);
  const overlapPercentage = elemArea > 0 ? (overlapArea / elemArea) * 100 : 0;

  return {
    overlaps: overlapArea > 0,
    overlapArea,
    overlapPercentage: Math.min(100, Number(overlapPercentage.toFixed(2))),
  };
}

/**
 * Automatically calculates the best non-overlapping coordinate for a title or graphic element,
 * testing candidate positions and picking an unoccupied region away from detected subjects.
 */
export function findNonOverlappingPlacement(options: AvoidanceOptions = {}): PlacementResult {
  const {
    elementSize = { width: 50, height: 14 },
    safeZones = [],
    playheadTime,
    padding = 2,
    defaultPosition = { x: 50, y: 78 },
    preferredRegions,
  } = options;

  // Filter active safe zones at the given timestamp
  const activeSafeZones = filterActiveSafeZones(safeZones, playheadTime);

  // If no safe zones active, return the default position with 0 overlap
  if (activeSafeZones.length === 0) {
    return {
      position: defaultPosition,
      region: "default",
      overlapArea: 0,
      isAvoided: false,
    };
  }

  // Build candidate placements list based on preferred regions or default list
  let candidates: CandidatePlacement[] = [...DEFAULT_CANDIDATE_PLACEMENTS];

  if (preferredRegions && preferredRegions.length > 0) {
    // Sort preferred regions to the top
    candidates.sort((a, b) => {
      const aIndex = preferredRegions.indexOf(a.region);
      const bIndex = preferredRegions.indexOf(b.region);
      if (aIndex !== -1 && bIndex === -1) return -1;
      if (aIndex === -1 && bIndex !== -1) return 1;
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      return a.priority - b.priority;
    });
  }

  // First test default position directly
  let defaultTotalOverlap = 0;
  for (const sz of activeSafeZones) {
    const res = checkSubjectOverlap(defaultPosition, elementSize, sz, padding);
    defaultTotalOverlap += res.overlapArea;
  }

  if (defaultTotalOverlap === 0) {
    return {
      position: defaultPosition,
      region: "default",
      overlapArea: 0,
      isAvoided: false,
    };
  }

  // Search candidate placements for 0 overlap
  let bestCandidate: CandidatePlacement | null = null;
  let minOverlapArea = Infinity;

  for (const candidate of candidates) {
    let candidateTotalOverlap = 0;
    for (const sz of activeSafeZones) {
      const res = checkSubjectOverlap(candidate.position, elementSize, sz, padding);
      candidateTotalOverlap += res.overlapArea;
    }

    if (candidateTotalOverlap === 0) {
      // Found perfect non-overlapping quadrant
      return {
        position: candidate.position,
        region: candidate.region,
        overlapArea: 0,
        isAvoided: true,
      };
    }

    if (candidateTotalOverlap < minOverlapArea) {
      minOverlapArea = candidateTotalOverlap;
      bestCandidate = candidate;
    }
  }

  // If all candidates have some overlap, pick candidate with minimum overlap
  if (bestCandidate) {
    return {
      position: bestCandidate.position,
      region: bestCandidate.region,
      overlapArea: minOverlapArea,
      isAvoided: true,
    };
  }

  return {
    position: defaultPosition,
    region: "default",
    overlapArea: defaultTotalOverlap,
    isAvoided: false,
  };
}

/**
 * Converts pre-computed backend UnifiedVisualTimeline response into frontend SubjectSafeZone array.
 * Normalizes coordinates from 0..1 scale (if needed) to 0..100 percentage scale.
 */
export function convertVisualTimelineToSafeZones(
  visualTimeline: UnifiedVisualTimelineResponse,
  fallbackDuration: number = 10.0
): SubjectSafeZone[] {
  if (!visualTimeline || !Array.isArray(visualTimeline.subjects)) {
    return [];
  }

  return visualTimeline.subjects.map((subj, index) => {
    const rawBox = subj.bounding_box || { x: 0, y: 0, width: 0, height: 0 };

    // Detect if worker returned 0..1 normalized coords or already 0..100
    const isNormalizedUnit = rawBox.x <= 1.0 && rawBox.y <= 1.0 && rawBox.width <= 1.0 && rawBox.height <= 1.0;
    const factor = isNormalizedUnit ? 100 : 1;

    const start = subj.start ?? subj.timestamp ?? 0;
    const end = subj.end ?? (start + fallbackDuration);
    const duration = Math.max(0.1, end - start);

    return {
      id: `subject-sz-${index + 1}`,
      timestamp: Number(start.toFixed(2)),
      duration: Number(duration.toFixed(2)),
      x: Number((rawBox.x * factor).toFixed(2)),
      y: Number((rawBox.y * factor).toFixed(2)),
      width: Number((rawBox.width * factor).toFixed(2)),
      height: Number((rawBox.height * factor).toFixed(2)),
      confidence: subj.confidence ?? 1.0,
      type: "subject",
    };
  });
}
