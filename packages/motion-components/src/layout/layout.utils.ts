import { AnchorPoint, BoundingBox, LayoutElement, LayoutGroup, SceneLayout } from './layout.types';

/**
 * Returns the offset required to translate an anchored coordinate into a top-left coordinate.
 * For example, if you place a 100x100 box at (50, 50) using a "center" anchor,
 * the top-left coordinate is (50 - 50, 50 - 50) = (0, 0).
 */
export function getAnchorOffset(width: number, height: number, anchor: AnchorPoint = 'top-left'): { x: number; y: number } {
  switch (anchor) {
    case 'top-left': return { x: 0, y: 0 };
    case 'top-center': return { x: -width / 2, y: 0 };
    case 'top-right': return { x: -width, y: 0 };
    case 'center-left': return { x: 0, y: -height / 2 };
    case 'center': return { x: -width / 2, y: -height / 2 };
    case 'center-right': return { x: -width, y: -height / 2 };
    case 'bottom-left': return { x: 0, y: -height };
    case 'bottom-center': return { x: -width / 2, y: -height };
    case 'bottom-right': return { x: -width, y: -height };
    default: return { x: 0, y: 0 };
  }
}

/**
 * Returns the absolute (x, y) coordinate of a specific anchor point on a bounding box.
 * Used for relative positioning (e.g. attaching to the 'bottom-center' of another box).
 */
export function getPointOnBox(box: BoundingBox, anchor: AnchorPoint = 'top-left'): { x: number; y: number } {
  switch (anchor) {
    case 'top-left': return { x: box.x, y: box.y };
    case 'top-center': return { x: box.x + box.width / 2, y: box.y };
    case 'top-right': return { x: box.x + box.width, y: box.y };
    case 'center-left': return { x: box.x, y: box.y + box.height / 2 };
    case 'center': return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    case 'center-right': return { x: box.x + box.width, y: box.y + box.height / 2 };
    case 'bottom-left': return { x: box.x, y: box.y + box.height };
    case 'bottom-center': return { x: box.x + box.width / 2, y: box.y + box.height };
    case 'bottom-right': return { x: box.x + box.width, y: box.y + box.height };
    default: return { x: box.x, y: box.y };
  }
}

/**
 * Resolves a full SceneLayout into a map of absolute BoundingBoxes (top-left rendering coordinates).
 */
export function resolveSceneLayout(layout: SceneLayout): Map<string, BoundingBox> {
  const resolved = new Map<string, BoundingBox>();
  const pending = new Set<LayoutElement | LayoutGroup>();

  // Flatten the hierarchy to easily process dependencies, storing parent bounds if necessary
  // To handle groups cleanly, we'll assign group offsets directly during extraction.
  const flatElements: { el: LayoutElement; parentId: string | null }[] = [];

  const extract = (elements: (LayoutElement | LayoutGroup)[], parentId: string | null) => {
    for (const el of elements) {
      flatElements.push({ el, parentId });
      if ('children' in el) {
        extract(el.children as (LayoutElement | LayoutGroup)[], el.id);
      }
    }
  };

  extract(layout.elements, null);

  // Keep attempting to resolve until all are resolved or we detect a circular dependency
  let resolvedCount = 0;
  let maxIterations = flatElements.length * 2;

  while (resolved.size < flatElements.length && maxIterations > 0) {
    const previousResolvedCount = resolved.size;

    for (const { el, parentId } of flatElements) {
      if (resolved.has(el.id)) continue;

      let targetX = el.x;
      let targetY = el.y;

      // 1. If it's relative to another element, resolve that first
      if (el.relativeTo) {
        const referenceBox = resolved.get(el.relativeTo);
        if (!referenceBox) continue; // wait for dependency to resolve

        const refPoint = getPointOnBox(referenceBox, el.relativeAnchor || 'top-left');
        targetX = refPoint.x + (el.offsetX || 0) + el.x; // el.x acts as an additional offset here if provided
        targetY = refPoint.y + (el.offsetY || 0) + el.y;
      }

      // 2. Add parent group offset if applicable
      if (parentId) {
        const parentBox = resolved.get(parentId);
        if (!parentBox) continue; // wait for parent to resolve

        targetX += parentBox.x;
        targetY += parentBox.y;
      }

      // 3. Resolve internal anchor (calculate top-left)
      const offset = getAnchorOffset(el.width, el.height, el.anchor);
      
      resolved.set(el.id, {
        id: el.id,
        x: targetX + offset.x,
        y: targetY + offset.y,
        width: el.width,
        height: el.height,
      });
    }

    if (resolved.size === previousResolvedCount) {
      // No progress made in this iteration, meaning there is a missing dependency or circular reference
      const unresolved = flatElements.filter(({ el }) => !resolved.has(el.id)).map(e => e.el.id);
      throw new Error(`Failed to resolve layout. Circular dependency or missing reference for: ${unresolved.join(', ')}`);
    }

    maxIterations--;
  }

  return resolved;
}
