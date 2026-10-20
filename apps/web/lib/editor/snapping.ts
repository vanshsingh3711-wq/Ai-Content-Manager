/**
 * snapping.ts
 *
 * Direct manipulation snapping calculations and guide line definitions.
 * Provides magnetic alignment to canvas center (50%), safe-zone margins (10%, 90%),
 * and angle snapping for rotation knobs.
 */

export interface SnapGuide {
  id: string;
  orientation: "vertical" | "horizontal";
  position: number; // 0 - 100 percentage coordinate
  label?: string;
}

export interface SnapTarget {
  position: number;
  label: string;
}

export interface SnapResult {
  x: number;
  y: number;
  snappedX: boolean;
  snappedY: boolean;
  guides: SnapGuide[];
}

export interface SnapOptions {
  threshold?: number; // Magnetic snapping distance in percentage (default: 1.5%)
  enableCenterSnap?: boolean; // Snaps to 50% center (default: true)
  enableEdgeSnap?: boolean; // Snaps to safe margins 10% / 90% (default: true)
  customTargetsX?: SnapTarget[];
  customTargetsY?: SnapTarget[];
}

export const DEFAULT_SNAP_THRESHOLD = 1.5; // 1.5% magnetic attraction zone

/**
 * Calculates snapped canvas coordinates and active alignment guide lines.
 */
export function calculateSnapping(
  rawX: number,
  rawY: number,
  options: SnapOptions = {}
): SnapResult {
  const threshold = options.threshold ?? DEFAULT_SNAP_THRESHOLD;
  const enableCenterSnap = options.enableCenterSnap ?? true;
  const enableEdgeSnap = options.enableEdgeSnap ?? true;

  // Build target candidates for X (vertical guide lines)
  const targetsX: SnapTarget[] = [];
  if (enableCenterSnap) {
    targetsX.push({ position: 50, label: "Center" });
  }
  if (enableEdgeSnap) {
    targetsX.push({ position: 10, label: "Left Safe Margin" });
    targetsX.push({ position: 90, label: "Right Safe Margin" });
  }
  if (options.customTargetsX) {
    targetsX.push(...options.customTargetsX);
  }

  // Build target candidates for Y (horizontal guide lines)
  const targetsY: SnapTarget[] = [];
  if (enableCenterSnap) {
    targetsY.push({ position: 50, label: "Center" });
  }
  if (enableEdgeSnap) {
    targetsY.push({ position: 10, label: "Top Safe Margin" });
    targetsY.push({ position: 90, label: "Bottom Safe Margin" });
  }
  if (options.customTargetsY) {
    targetsY.push(...options.customTargetsY);
  }

  let snappedX = rawX;
  let hasSnappedX = false;
  let activeGuideX: SnapGuide | null = null;

  // Check X candidates - choose the closest target within threshold
  let closestDistX = Infinity;
  for (const target of targetsX) {
    const dist = Math.abs(rawX - target.position);
    if (dist <= threshold && dist < closestDistX) {
      closestDistX = dist;
      snappedX = target.position;
      hasSnappedX = true;
      activeGuideX = {
        id: `guide-v-${target.position}`,
        orientation: "vertical",
        position: target.position,
        label: target.label,
      };
    }
  }

  let snappedY = rawY;
  let hasSnappedY = false;
  let activeGuideY: SnapGuide | null = null;

  // Check Y candidates - choose the closest target within threshold
  let closestDistY = Infinity;
  for (const target of targetsY) {
    const dist = Math.abs(rawY - target.position);
    if (dist <= threshold && dist < closestDistY) {
      closestDistY = dist;
      snappedY = target.position;
      hasSnappedY = true;
      activeGuideY = {
        id: `guide-h-${target.position}`,
        orientation: "horizontal",
        position: target.position,
        label: target.label,
      };
    }
  }

  const guides: SnapGuide[] = [];
  if (activeGuideX) guides.push(activeGuideX);
  if (activeGuideY) guides.push(activeGuideY);

  return {
    x: Number(snappedX.toFixed(2)),
    y: Number(snappedY.toFixed(2)),
    snappedX: hasSnappedX,
    snappedY: hasSnappedY,
    guides,
  };
}

/**
 * Calculates snapped rotation angles (e.g. 0°, 45°, 90°, 180°).
 */
export function calculateRotationSnapping(
  rawAngle: number,
  threshold: number = 4.0
): { angle: number; snapped: boolean } {
  // Normalize angle to -180 to 180
  let normalized = rawAngle % 360;
  if (normalized > 180) normalized -= 360;
  if (normalized < -180) normalized += 360;

  const targetAngles = [-180, -135, -90, -45, 0, 45, 90, 135, 180];

  for (const target of targetAngles) {
    if (Math.abs(normalized - target) <= threshold) {
      return { angle: target, snapped: true };
    }
  }

  return { angle: Number(normalized.toFixed(1)), snapped: false };
}
