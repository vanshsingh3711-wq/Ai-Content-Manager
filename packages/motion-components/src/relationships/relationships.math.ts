import { AnchorPoint, BoundingBox } from '../layout/layout.types';
import { getPointOnBox } from '../layout/layout.utils';
import { CompositionRelation } from './relationships.types';

export function calculateRelationshipGeometry(
  sourceOriginal: BoundingBox & { anchor: AnchorPoint },
  targetBounds: BoundingBox,
  relation: CompositionRelation,
  gap: number = 0
): { x: number; y: number; anchor: AnchorPoint } {
  
  // We want to calculate the new X, Y that the Source needs to be placed at.
  // To avoid anchor math drift, we return the precise Anchor to use for the new Placement.
  
  switch (relation) {
    case 'below': {
      const targetPt = getPointOnBox(targetBounds, 'bottom-center');
      return { x: targetPt.x, y: targetPt.y + gap, anchor: 'top-center' };
    }
    case 'above': {
      const targetPt = getPointOnBox(targetBounds, 'top-center');
      return { x: targetPt.x, y: targetPt.y - gap, anchor: 'bottom-center' };
    }
    case 'left': {
      const targetPt = getPointOnBox(targetBounds, 'center-left');
      return { x: targetPt.x - gap, y: targetPt.y, anchor: 'center-right' };
    }
    case 'right': {
      const targetPt = getPointOnBox(targetBounds, 'center-right');
      return { x: targetPt.x + gap, y: targetPt.y, anchor: 'center-left' };
    }
    case 'center':
    case 'inside': {
      const targetPt = getPointOnBox(targetBounds, 'center');
      return { x: targetPt.x, y: targetPt.y, anchor: 'center' };
    }
    
    // Alignments (these preserve one axis of the source, but modify the other)
    case 'align-left': {
      // Keep source Y, but match Left edge
      // The easiest way is to use top-left anchor.
      const currentAbsY = sourceOriginal.y; // Simplified assumption for absolute alignments
      return { x: targetBounds.x, y: currentAbsY, anchor: 'top-left' };
    }
    case 'align-right': {
      const currentAbsY = sourceOriginal.y;
      return { x: targetBounds.x + targetBounds.width, y: currentAbsY, anchor: 'top-right' };
    }
    case 'align-top': {
      const currentAbsX = sourceOriginal.x;
      return { x: currentAbsX, y: targetBounds.y, anchor: 'top-left' };
    }
    case 'align-bottom': {
      const currentAbsX = sourceOriginal.x;
      return { x: currentAbsX, y: targetBounds.y + targetBounds.height, anchor: 'bottom-left' };
    }
    case 'center-horizontal': {
      const currentAbsY = sourceOriginal.y;
      return { x: targetBounds.x + (targetBounds.width / 2), y: currentAbsY, anchor: 'top-center' };
    }
    case 'center-vertical': {
      const currentAbsX = sourceOriginal.x;
      return { x: currentAbsX, y: targetBounds.y + (targetBounds.height / 2), anchor: 'center-left' };
    }
    default:
      return { x: sourceOriginal.x, y: sourceOriginal.y, anchor: sourceOriginal.anchor };
  }
}
