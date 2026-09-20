import { BoundingBox, SafeZoneDefinition, SceneLayout } from './layout.types';
import { resolveSceneLayout } from './layout.utils';

export interface SafeZoneDiagnostic {
  valid: boolean;
  reason?: 'safe-zone-overflow' | 'restricted-zone-overlap' | 'no-valid-position';
  elementId: string;
  zoneId: string;
}

export interface SafeZoneOverlapResult {
  inside: boolean; // True if completely inside (for safe zones)
  intersecting: boolean; // True if touching at all (for restricted zones)
  intersectionArea: number;
  overflow: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Converts a SafeZoneDefinition (which might use normalized 0-1 coordinates)
 * into an absolute BoundingBox based on the canvas dimensions.
 */
export function resolveSafeZoneBounds(zone: SafeZoneDefinition, canvasWidth: number, canvasHeight: number): BoundingBox {
  const isNormalizedX = zone.x >= 0 && zone.x <= 1;
  const isNormalizedY = zone.y >= 0 && zone.y <= 1;
  const isNormalizedW = zone.width >= 0 && zone.width <= 1;
  const isNormalizedH = zone.height >= 0 && zone.height <= 1;

  return {
    id: zone.id,
    x: isNormalizedX && zone.x !== 0 && zone.x < 1 ? zone.x * canvasWidth : zone.x,
    y: isNormalizedY && zone.y !== 0 && zone.y < 1 ? zone.y * canvasHeight : zone.y,
    width: isNormalizedW && zone.width !== 0 && zone.width <= 1 ? zone.width * canvasWidth : zone.width,
    height: isNormalizedH && zone.height !== 0 && zone.height <= 1 ? zone.height * canvasHeight : zone.height,
  };
}

/**
 * Mathematically checks the relationship between an element and a zone.
 */
export function checkSafeZoneOverlap(element: BoundingBox, zone: BoundingBox): SafeZoneOverlapResult {
  const elRight = element.x + element.width;
  const elBottom = element.y + element.height;
  const zoneRight = zone.x + zone.width;
  const zoneBottom = zone.y + zone.height;

  const overflowTop = Math.max(0, zone.y - element.y);
  const overflowLeft = Math.max(0, zone.x - element.x);
  const overflowRight = Math.max(0, elRight - zoneRight);
  const overflowBottom = Math.max(0, elBottom - zoneBottom);

  const isCompletelyInside = overflowTop === 0 && overflowLeft === 0 && overflowRight === 0 && overflowBottom === 0;

  const overlapLeft = Math.max(element.x, zone.x);
  const overlapRight = Math.min(elRight, zoneRight);
  const overlapTop = Math.max(element.y, zone.y);
  const overlapBottom = Math.min(elBottom, zoneBottom);

  let intersectionArea = 0;
  if (overlapLeft < overlapRight && overlapTop < overlapBottom) {
    intersectionArea = (overlapRight - overlapLeft) * (overlapBottom - overlapTop);
  }

  return {
    inside: isCompletelyInside,
    intersecting: intersectionArea > 0,
    intersectionArea,
    overflow: {
      top: overflowTop,
      right: overflowRight,
      bottom: overflowBottom,
      left: overflowLeft
    }
  };
}

/**
 * Validates a resolved scene against its defined safe zones.
 * Returns an array of diagnostics for any violations.
 */
export function validateSceneSafeZones(layout: SceneLayout): SafeZoneDiagnostic[] {
  if (!layout.safeZones || layout.safeZones.length === 0) return [];

  const resolvedElements = resolveSceneLayout(layout);
  const resolvedZones = layout.safeZones.map(z => ({
    def: z,
    bounds: resolveSafeZoneBounds(z, layout.width, layout.height)
  }));

  const diagnostics: SafeZoneDiagnostic[] = [];

  for (const [elId, elBounds] of resolvedElements.entries()) {
    // We need the original element to check if it has a specific safeZoneId requirement
    // Since resolveSceneLayout flattens, we can search the tree
    const originalEl = findElementById(layout.elements, elId);
    
    for (const zone of resolvedZones) {
      const overlap = checkSafeZoneOverlap(elBounds, zone.bounds);

      if (zone.def.type === 'restricted' && overlap.intersecting) {
        diagnostics.push({
          valid: false,
          reason: 'restricted-zone-overlap',
          elementId: elId,
          zoneId: zone.def.id
        });
      }

      if (zone.def.type === 'safe' && originalEl?.safeZoneId === zone.def.id) {
        if (!overlap.inside) {
          diagnostics.push({
            valid: false,
            reason: 'safe-zone-overflow',
            elementId: elId,
            zoneId: zone.def.id
          });
        }
      }
    }
  }

  return diagnostics;
}

// Simple helper to find an element in the tree
function findElementById(elements: any[], id: string): any {
  for (const el of elements) {
    if (el.id === id) return el;
    if (el.children) {
      const found = findElementById(el.children, id);
      if (found) return found;
    }
  }
  return null;
}
