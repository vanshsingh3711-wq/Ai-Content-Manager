import { AssetDefinition } from '../assets/assets.types';
import { SafeZoneDefinition, AnchorPoint, BoundingBox } from '../layout/layout.types';
import { getAnchorOffset, getPointOnBox } from '../layout/layout.utils';
import { checkSafeZoneOverlap, resolveSafeZoneBounds } from '../layout/layout.safezone';
import { PlacementRequest, ResolvedPlacement, PlacementDiagnostic } from './placement.types';

export interface PlacementContext {
  assets: AssetDefinition[];
  existingPlacements: ResolvedPlacement[];
  safeZones: SafeZoneDefinition[];
  canvas: { width: number; height: number };
}

/**
 * Derives the absolute bounds of a LayoutElement (x,y is the top-left).
 */
function getAbsoluteBounds(element: ResolvedPlacement): BoundingBox {
  const offset = getAnchorOffset(element.width, element.height, element.anchor);
  return {
    id: element.id,
    x: element.x + offset.x,
    y: element.y + offset.y,
    width: element.width,
    height: element.height
  };
}

export function resolvePlacement(request: PlacementRequest, context: PlacementContext): ResolvedPlacement {
  const diagnostics: PlacementDiagnostic[] = [];
  
  // 1. Resolve Dimensions
  const asset = context.assets.find(a => a.id === request.assetId);
  const intrinsic = asset?.intrinsicSize;
  const reqSize = request.size || {};
  let finalWidth = 100;
  let finalHeight = 100;

  if (reqSize.width !== undefined && reqSize.height !== undefined) {
    finalWidth = reqSize.width;
    finalHeight = reqSize.height;
  } else if (reqSize.width !== undefined && intrinsic) {
    finalWidth = reqSize.width;
    finalHeight = (intrinsic.height / intrinsic.width) * finalWidth;
  } else if (reqSize.height !== undefined && intrinsic) {
    finalHeight = reqSize.height;
    finalWidth = (intrinsic.width / intrinsic.height) * finalHeight;
  } else if (reqSize.scale !== undefined && intrinsic) {
    finalWidth = intrinsic.width * reqSize.scale;
    finalHeight = intrinsic.height * reqSize.scale;
  } else if (intrinsic) {
    finalWidth = intrinsic.width;
    finalHeight = intrinsic.height;
  } else if (request.assetId) {
    // If we have no intrinsic size and no explicit dual dimensions, and we have an assetId, warn
    diagnostics.push({
      severity: 'warning',
      reason: 'missing-intrinsic-size',
      message: `Asset ${request.assetId} has no intrinsic size. Defaulting to 100x100.`
    });
  }

  // 2. Resolve Anchor
  let finalAnchor: AnchorPoint = request.anchor || 'top-left';

  // 3. Resolve Position
  let finalX = request.position?.x || 0;
  let finalY = request.position?.y || 0;

  if (request.relativeTo) {
    const target = context.existingPlacements.find(p => p.id === request.relativeTo);
    if (!target) {
      diagnostics.push({
        severity: 'error',
        reason: 'unresolved-relative-target',
        message: `Relative target ${request.relativeTo} not found in existing placements.`
      });
    } else {
      const targetBounds = getAbsoluteBounds(target);
      const gap = request.gap || 0;

      // When placing relative to something, it's easiest to anchor our new object properly to snap them together.
      switch (request.relation) {
        case 'below':
          finalAnchor = 'top-center';
          const belowPt = getPointOnBox(targetBounds, 'bottom-center');
          finalX = belowPt.x;
          finalY = belowPt.y + gap;
          break;
        case 'above':
          finalAnchor = 'bottom-center';
          const abovePt = getPointOnBox(targetBounds, 'top-center');
          finalX = abovePt.x;
          finalY = abovePt.y - gap;
          break;
        case 'right':
          finalAnchor = 'center-left';
          const rightPt = getPointOnBox(targetBounds, 'center-right');
          finalX = rightPt.x + gap;
          finalY = rightPt.y;
          break;
        case 'left':
          finalAnchor = 'center-right';
          const leftPt = getPointOnBox(targetBounds, 'center-left');
          finalX = leftPt.x - gap;
          finalY = leftPt.y;
          break;
        case 'center':
        case 'inside':
          finalAnchor = 'center';
          const centerPt = getPointOnBox(targetBounds, 'center');
          finalX = centerPt.x;
          finalY = centerPt.y;
          break;
      }
    }
  }

  const placement: ResolvedPlacement = {
    id: request.assetId, // Typically would use a unique instance ID, but using assetId for simplicity here
    assetId: request.assetId,
    x: finalX,
    y: finalY,
    width: finalWidth,
    height: finalHeight,
    anchor: finalAnchor,
    positionMode: request.positionMode || 'absolute',
    safeZoneId: request.preferredZoneId
  };

  // Skip collision/safe-zone math if it's an auto-positioned element, since AutoPositioning will override x/y anyway
  if (placement.positionMode === 'auto') {
    return { ...placement, diagnostics };
  }

  // 4. Overlaps / Collisions (using Base Bounding Boxes)
  const myBounds = getAbsoluteBounds(placement);

  for (const existing of context.existingPlacements) {
    if (existing.positionMode === 'auto') continue;
    
    const theirBounds = getAbsoluteBounds(existing);
    
    // Simple AABB overlap check
    const intersectX = Math.max(0, Math.min(myBounds.x + myBounds.width, theirBounds.x + theirBounds.width) - Math.max(myBounds.x, theirBounds.x));
    const intersectY = Math.max(0, Math.min(myBounds.y + myBounds.height, theirBounds.y + theirBounds.height) - Math.max(myBounds.y, theirBounds.y));
    
    if (intersectX > 0 && intersectY > 0) {
      diagnostics.push({
        severity: 'warning',
        reason: 'collision',
        message: `Asset overlaps with ${existing.id}`
      });
    }
  }

  // 5. Safe Zones Check
  for (const zone of context.safeZones) {
    const zoneBounds = resolveSafeZoneBounds(zone, context.canvas.width, context.canvas.height);
    const overlap = checkSafeZoneOverlap(myBounds, zoneBounds);

    if (zone.type === 'restricted' && overlap.intersecting) {
      diagnostics.push({
        severity: 'error',
        reason: 'restricted-overlap',
        message: `Asset overlaps restricted zone ${zone.id}`
      });
    }
  }

  if (diagnostics.length > 0) {
    placement.diagnostics = diagnostics;
  }

  return placement;
}
