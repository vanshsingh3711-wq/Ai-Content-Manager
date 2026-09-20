import { ResolvedPlacement } from '../placement/placement.types';
import { CompositionRepair, CompositionValidationConfig } from './validation.types';
import { getAnchorOffset } from '../layout/layout.utils';
import { BoundingBox } from '../layout/layout.types';

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

export function autoRepairComposition(
  placements: ResolvedPlacement[],
  canvas: { width: number; height: number },
  config: CompositionValidationConfig
): { placements: ResolvedPlacement[]; repairs: CompositionRepair[] } {
  
  if (!config.autoRepair) return { placements, repairs: [] };

  const repairedPlacements = placements.map(p => ({ ...p }));
  const repairs: CompositionRepair[] = [];

  for (const placement of repairedPlacements) {
    const before = getAbsoluteBounds(placement);

    let needsRepair = false;
    let newX = placement.x;
    let newY = placement.y;

    if (config.repairOverflow && config.allowClamping) {
      const bounds = getAbsoluteBounds(placement);
      
      // Clamp Left
      if (bounds.x < 0) {
        newX += (0 - bounds.x);
        needsRepair = true;
      }
      
      // Clamp Right
      if (bounds.x + bounds.width > canvas.width) {
        newX -= ((bounds.x + bounds.width) - canvas.width);
        needsRepair = true;
      }
      
      // Clamp Top
      if (bounds.y < 0) {
        newY += (0 - bounds.y);
        needsRepair = true;
      }
      
      // Clamp Bottom
      if (bounds.y + bounds.height > canvas.height) {
        newY -= ((bounds.y + bounds.height) - canvas.height);
        needsRepair = true;
      }
    }

    if (needsRepair) {
      placement.x = newX;
      placement.y = newY;
      
      const after = getAbsoluteBounds(placement);
      
      repairs.push({
        type: 'repair-overflow',
        elementId: placement.id,
        before,
        after,
        reason: 'Element overflowed canvas bounds and was deterministically clamped.'
      });
    }
  }

  return { placements: repairedPlacements, repairs };
}
