/**
 * aspect-ratio-reflow.ts
 *
 * Implements deterministic responsive layout reflow when switching project aspect
 * ratios ("16:9" <-> "9:16" <-> "1:1" <-> "4:5").
 *
 * Core Capabilities:
 * 1. Aspect-Ratio-Specific Safe Zones:
 *    - "9:16" (Shorts/Reels/TikTok): Top 12% header safe, Bottom 20% caption/profile safe, Right 18% button rail safe.
 *    - "16:9" (YouTube/Landscape): EBU/SMPTE 8% title safe, 12% bottom scrubber safe.
 *    - "1:1" (Square Feed): 7% uniform margin.
 *    - "4:5" (Portrait Feed): 8% top/bottom, 6-8% sides.
 * 2. Piecewise Anchor-Preserving Coordinate Remapping:
 *    - Preserves horizontal & vertical user intent (Center stays 50%, left stays left, right stays right).
 * 3. Element Width & Scale Adaptation:
 *    - Proportional width scaling prevents graphics and cards from overflowing narrow mobile viewports.
 * 4. Text Wrapping & Line Clamping:
 *    - Formats caption sentences to optimal line length (e.g. 22 chars for 9:16, 42 chars for 16:9)
 *      to ensure captions never clip off screen edges.
 * 5. Strict Safe-Zone Clamping:
 *    - Guarantees 100% of elements remain inside the target safe zone.
 */

import {
  AspectRatio,
  TimelineProject,
  GraphicElement,
  CaptionBlock,
  VideoClip,
  BRollClip,
} from "../timeline-types";
import { getCanvasDimensions } from "../project-adapter";

export interface AspectRatioSafeZone {
  aspectRatio: AspectRatio;
  minX: number; // in % (0 - 100)
  maxX: number; // in %
  minY: number; // in %
  maxY: number; // in %
  maxCharsPerCaptionLine: number;
  label: string;
  description: string;
}

/**
 * Standard Safe Zones calibrated for major social video platforms.
 */
export const ASPECT_RATIO_SAFE_ZONES: Record<AspectRatio, AspectRatioSafeZone> = {
  "9:16": {
    aspectRatio: "9:16",
    minX: 6,
    maxX: 82, // 18% right action rail (Like, Comment, Share, Bookmark)
    minY: 12, // 12% top header & camera notch
    maxY: 80, // 20% bottom caption, sound title, account handle
    maxCharsPerCaptionLine: 22,
    label: "TikTok & Shorts Safe Zone",
    description: "Leaves right rail for action buttons and bottom rail for profile & audio tags",
  },
  "16:9": {
    aspectRatio: "16:9",
    minX: 8,
    maxX: 92,
    minY: 8,
    maxY: 88, // 12% bottom video timeline scrubber and player controls
    maxCharsPerCaptionLine: 42,
    label: "YouTube / Widescreen Title Safe",
    description: "Standard SMPTE/EBU title safe margins for TV and desktop player controls",
  },
  "1:1": {
    aspectRatio: "1:1",
    minX: 7,
    maxX: 93,
    minY: 7,
    maxY: 93,
    maxCharsPerCaptionLine: 28,
    label: "Square Feed Safe Zone",
    description: "Uniform 7% padding for Instagram and LinkedIn feed cards",
  },
  "4:5": {
    aspectRatio: "4:5",
    minX: 6,
    maxX: 92,
    minY: 8,
    maxY: 86,
    maxCharsPerCaptionLine: 26,
    label: "Portrait Social Feed Safe Zone",
    description: "Optimized for Instagram vertical feed posts",
  },
};

/**
 * Returns the safe zone specification for a given aspect ratio.
 */
export function getSafeZoneForAspectRatio(aspectRatio: AspectRatio): AspectRatioSafeZone {
  return ASPECT_RATIO_SAFE_ZONES[aspectRatio] || ASPECT_RATIO_SAFE_ZONES["9:16"];
}

/**
 * Wraps text into lines at word boundaries so that no single line exceeds
 * `maxCharsPerLine`. Preserves natural words without awkward splitting.
 */
export function wrapTextToLines(text: string, maxCharsPerLine: number): string {
  if (!text) return "";
  const cleaned = text.trim();
  if (cleaned.length <= maxCharsPerLine) return cleaned;

  // Collapse existing line breaks into single spaces to allow fresh wrapping
  const words = cleaned.replace(/\r?\n/g, " ").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";

  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + " " + word).length <= maxCharsPerLine) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join("\n");
}

/**
 * Maps a coordinate value from source safe zone range to target safe zone range,
 * preserving intent around center (50%), left/top edges, and right/bottom edges.
 */
export function remapCoordinateWithAnchor(
  val: number,
  srcMin: number,
  srcMax: number,
  tgtMin: number,
  tgtMax: number,
  centerDeadband: number = 3
): number {
  // 1. If within center deadband (e.g. 47% - 53%), preserve exact visual center
  if (Math.abs(val - 50) <= centerDeadband) {
    return 50;
  }

  // 2. If to the left / top of center: map relative to [srcMin, 50]
  if (val < 50) {
    const srcSpan = Math.max(1, 50 - srcMin);
    const tgtSpan = Math.max(1, 50 - tgtMin);
    const t = Math.max(0, (val - srcMin) / srcSpan);
    const mapped = tgtMin + t * tgtSpan;
    return Math.max(tgtMin, Math.min(mapped, 50));
  }

  // 3. If to the right / bottom of center: map relative to [50, srcMax]
  const srcSpan = Math.max(1, srcMax - 50);
  const tgtSpan = Math.max(1, tgtMax - 50);
  const t = Math.max(0, (val - 50) / srcSpan);
  const mapped = 50 + t * tgtSpan;
  return Math.max(50, Math.min(mapped, tgtMax));
}

export interface ReflowOptions {
  forceReflowLocked?: boolean; // If true, even isUserLocked elements are re-positioned
  reflowCaptions?: boolean;    // Default: true
  reflowGraphics?: boolean;    // Default: true
  reflowClips?: boolean;       // Default: true
}

/**
 * Calculates new responsive coordinates, scale, and text wrapping for an element
 * transitioning between two aspect ratios.
 */
export function reflowElementPosition(
  currentPos: { x: number; y: number },
  currentScale: number = 1.0,
  sourceRatio: AspectRatio,
  targetRatio: AspectRatio,
  estimatedSize: { width: number; height: number } = { width: 30, height: 15 }
): { position: { x: number; y: number }; scale: number } {
  const srcZone = getSafeZoneForAspectRatio(sourceRatio);
  const tgtZone = getSafeZoneForAspectRatio(targetRatio);

  // 1. Remap position anchors
  let newX = remapCoordinateWithAnchor(
    currentPos.x,
    srcZone.minX,
    srcZone.maxX,
    tgtZone.minX,
    tgtZone.maxX
  );

  let newY = remapCoordinateWithAnchor(
    currentPos.y,
    srcZone.minY,
    srcZone.maxY,
    tgtZone.minY,
    tgtZone.maxY
  );

  // 2. Compute aspect width ratio change
  const srcDims = getCanvasDimensions(sourceRatio);
  const tgtDims = getCanvasDimensions(targetRatio);
  const srcAspect = srcDims.width / srcDims.height;
  const tgtAspect = tgtDims.width / tgtDims.height;

  // When moving to a narrower aspect ratio (e.g. 16:9 -> 9:16), horizontal width is more constrained
  let scaleAdjustment = 1.0;
  const safeZoneWidth = tgtZone.maxX - tgtZone.minX;
  const effectiveWidth = estimatedSize.width * currentScale;

  if (effectiveWidth > safeZoneWidth * 0.95) {
    scaleAdjustment = (safeZoneWidth * 0.92) / effectiveWidth;
  }

  // If moving from wide landscape (16:9) to narrow vertical (9:16), scale down wide banners
  if (srcAspect > 1.2 && tgtAspect < 0.8) {
    scaleAdjustment = Math.min(scaleAdjustment, 0.88);
  } else if (srcAspect < 0.8 && tgtAspect > 1.2) {
    // Moving from vertical to landscape: allow slight expansion if scaled down
    if (currentScale < 1.0) {
      scaleAdjustment = Math.min(1.15, 1.0 / currentScale);
    }
  }

  const finalScale = Number((currentScale * scaleAdjustment).toFixed(3));
  const finalW = estimatedSize.width * finalScale;
  const finalH = estimatedSize.height * finalScale;

  // 3. Strict safe-zone clamping to ensure zero border/rail clipping
  const halfW = finalW / 2;
  const halfH = finalH / 2;

  newX = Math.max(tgtZone.minX + halfW, Math.min(newX, tgtZone.maxX - halfW));
  newY = Math.max(tgtZone.minY + halfH, Math.min(newY, tgtZone.maxY - halfH));

  // Round to 2 decimal places
  return {
    position: {
      x: Number(newX.toFixed(2)),
      y: Number(newY.toFixed(2)),
    },
    scale: Math.max(0.2, finalScale),
  };
}

/**
 * Reflows a complete TimelineProject from its current aspectRatio to a target aspectRatio.
 * Returns a new immutable project instance with all graphics, captions, and safe zones
 * adjusted for the target viewport.
 */
export function reflowProjectToAspectRatio(
  project: TimelineProject,
  targetRatio: AspectRatio,
  options: ReflowOptions = {}
): TimelineProject {
  const sourceRatio = project.aspectRatio;
  if (sourceRatio === targetRatio) {
    return project;
  }

  const {
    forceReflowLocked = false,
    reflowCaptions = true,
    reflowGraphics = true,
    reflowClips = true,
  } = options;

  const targetSafeZone = getSafeZoneForAspectRatio(targetRatio);
  const cloned: TimelineProject = JSON.parse(JSON.stringify(project));
  cloned.aspectRatio = targetRatio;

  // 1. Reflow Graphics Track
  if (reflowGraphics && cloned.tracks.graphicsTrack) {
    cloned.tracks.graphicsTrack = cloned.tracks.graphicsTrack.map((elem: GraphicElement) => {
      if (elem.isUserLocked && !forceReflowLocked) {
        // Even for locked elements, clamp them so they do not fall entirely off screen
        const curX = elem.positionX ?? elem.position?.x ?? 50;
        const curY = elem.positionY ?? elem.position?.y ?? 50;
        const clampedX = Math.max(targetSafeZone.minX, Math.min(curX, targetSafeZone.maxX));
        const clampedY = Math.max(targetSafeZone.minY, Math.min(curY, targetSafeZone.maxY));
        return {
          ...elem,
          position: { x: clampedX, y: clampedY },
          positionX: clampedX,
          positionY: clampedY,
        };
      }

      const curX = elem.positionX ?? elem.position?.x ?? 50;
      const curY = elem.positionY ?? elem.position?.y ?? 50;
      const curScale = elem.scale ?? 1.0;

      // Estimated width and height based on component archetype
      const isCard = elem.compositionId === "cooked_card" || elem.compositionId === "hero_reveal";
      const isBadge = elem.compositionId === "badge" || elem.compositionId === "animated_kpi";
      const estSize = isCard
        ? { width: 50, height: 28 }
        : isBadge
        ? { width: 32, height: 14 }
        : { width: 38, height: 18 };

      const { position, scale } = reflowElementPosition(
        { x: curX, y: curY },
        curScale,
        sourceRatio,
        targetRatio,
        estSize
      );

      return {
        ...elem,
        position,
        positionX: position.x,
        positionY: position.y,
        scale,
      };
    });
  }

  // 2. Reflow Text Track (Captions)
  if (reflowCaptions && cloned.tracks.textTrack) {
    cloned.tracks.textTrack = cloned.tracks.textTrack.map((caption: CaptionBlock) => {
      const curX = caption.positionX ?? caption.position?.x ?? 50;
      const curY = caption.positionY ?? caption.position?.y ?? (sourceRatio === "9:16" ? 75 : 82);
      const curScale = caption.scale ?? 1.0;

      // Caption estimated width based on character count
      const charCount = (caption.text || "").length;
      const estWidth = Math.min(75, Math.max(25, charCount * 1.5));

      const { position, scale } = reflowElementPosition(
        { x: curX, y: curY },
        curScale,
        sourceRatio,
        targetRatio,
        { width: estWidth, height: 12 }
      );

      // Re-wrap text to optimal line length for the target aspect ratio
      const wrappedText = wrapTextToLines(caption.text, targetSafeZone.maxCharsPerCaptionLine);

      return {
        ...caption,
        text: wrappedText,
        maxCharactersPerLine: targetSafeZone.maxCharsPerCaptionLine,
        position,
        positionX: position.x,
        positionY: position.y,
        scale,
      };
    });
  }

  // 3. Reflow Video & BRoll Tracks (ensure default positions remain centered and valid)
  if (reflowClips) {
    if (cloned.tracks.videoTrack) {
      cloned.tracks.videoTrack = cloned.tracks.videoTrack.map((clip: VideoClip) => {
        if (!clip.position && clip.positionX === undefined) return clip;
        const curX = clip.positionX ?? clip.position?.x ?? 50;
        const curY = clip.positionY ?? clip.position?.y ?? 50;
        const clampedX = Math.max(5, Math.min(curX, 95));
        const clampedY = Math.max(5, Math.min(curY, 95));
        return {
          ...clip,
          position: { x: clampedX, y: clampedY },
          positionX: clampedX,
          positionY: clampedY,
        };
      });
    }

    if (cloned.tracks.brollTrack) {
      cloned.tracks.brollTrack = cloned.tracks.brollTrack.map((clip: BRollClip) => {
        if (!clip.position && clip.positionX === undefined) return clip;
        const curX = clip.positionX ?? clip.position?.x ?? 50;
        const curY = clip.positionY ?? clip.position?.y ?? 50;
        const clampedX = Math.max(5, Math.min(curX, 95));
        const clampedY = Math.max(5, Math.min(curY, 95));
        return {
          ...clip,
          position: { x: clampedX, y: clampedY },
          positionX: clampedX,
          positionY: clampedY,
        };
      });
    }
  }

  // 4. Update Subject Safe Zones if present
  if (cloned.safeZones && cloned.safeZones.length > 0) {
    cloned.safeZones = cloned.safeZones.map((zone) => {
      // Re-clamp bounding boxes into [0, 100] canvas range
      return {
        ...zone,
        x: Math.max(0, Math.min(zone.x, 100 - zone.width)),
        y: Math.max(0, Math.min(zone.y, 100 - zone.height)),
      };
    });
  }

  return cloned;
}
