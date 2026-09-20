import { LayoutElement, LayoutGroup, SceneLayout } from './layout.types';

/**
 * Recursively sorts elements by their explicit `layer` property.
 * If layers are equal or undefined, it preserves their original document insertion order.
 */
export function resolveLayerOrder(elements: (LayoutElement | LayoutGroup)[]): (LayoutElement | LayoutGroup)[] {
  // We use a map to guarantee stable sorting regardless of JS engine implementation.
  // Explicit layer defaults to 0 if undefined.
  const mapped = elements.map((el, index) => ({
    el: { ...el }, // Shallow clone to avoid mutating the original array elements
    index,
    layer: el.layer ?? 0
  }));

  mapped.sort((a, b) => {
    if (a.layer !== b.layer) {
      return a.layer - b.layer;
    }
    return a.index - b.index;
  });

  return mapped.map(({ el }) => {
    if ('children' in el && Array.isArray(el.children)) {
      el.children = resolveLayerOrder(el.children as (LayoutElement | LayoutGroup)[]);
    }
    return el;
  });
}

/**
 * Helper: Clones the layout and applies a mutation function to a specific element by ID.
 * Safely traverses groups.
 */
function mutateElementLayer(
  layout: SceneLayout,
  targetId: string,
  mutator: (siblings: (LayoutElement | LayoutGroup)[], targetIndex: number) => void
): SceneLayout {
  const newLayout = JSON.parse(JSON.stringify(layout)) as SceneLayout;

  const traverse = (siblings: (LayoutElement | LayoutGroup)[]): boolean => {
    const index = siblings.findIndex(el => el.id === targetId);
    if (index !== -1) {
      mutator(siblings, index);
      return true;
    }

    for (const el of siblings) {
      if ('children' in el && Array.isArray(el.children)) {
        if (traverse(el.children as (LayoutElement | LayoutGroup)[])) return true;
      }
    }
    return false;
  };

  traverse(newLayout.elements);
  return newLayout;
}

export function bringToFront(layout: SceneLayout, id: string): SceneLayout {
  return mutateElementLayer(layout, id, (siblings, targetIndex) => {
    const maxLayer = siblings.reduce((max, el) => Math.max(max, el.layer ?? 0), -Infinity);
    siblings[targetIndex].layer = maxLayer + 1;
  });
}

export function sendToBack(layout: SceneLayout, id: string): SceneLayout {
  return mutateElementLayer(layout, id, (siblings, targetIndex) => {
    const minLayer = siblings.reduce((min, el) => Math.min(min, el.layer ?? 0), Infinity);
    siblings[targetIndex].layer = minLayer - 1;
  });
}

export function bringForward(layout: SceneLayout, id: string): SceneLayout {
  return mutateElementLayer(layout, id, (siblings, targetIndex) => {
    // We do a simple +1 to its current layer. 
    // Since we preserve array order on tie-breaks, if it ties with the element above it, 
    // it technically stays behind it in DOM order unless its layer explicitly exceeds it.
    const currentLayer = siblings[targetIndex].layer ?? 0;
    
    // Find the layer of the element currently immediately above this one in the sorted order
    const sorted = resolveLayerOrder(siblings);
    const sortedIndex = sorted.findIndex(el => el.id === id);
    
    if (sortedIndex < sorted.length - 1) {
      const elementAbove = sorted[sortedIndex + 1];
      siblings[targetIndex].layer = (elementAbove.layer ?? 0) + 1;
    } else {
      // It's already at the absolute front, just +1 for safety
      siblings[targetIndex].layer = currentLayer + 1;
    }
  });
}

export function sendBackward(layout: SceneLayout, id: string): SceneLayout {
  return mutateElementLayer(layout, id, (siblings, targetIndex) => {
    const currentLayer = siblings[targetIndex].layer ?? 0;
    
    const sorted = resolveLayerOrder(siblings);
    const sortedIndex = sorted.findIndex(el => el.id === id);
    
    if (sortedIndex > 0) {
      const elementBelow = sorted[sortedIndex - 1];
      siblings[targetIndex].layer = (elementBelow.layer ?? 0) - 1;
    } else {
      // It's already at the absolute back, just -1 for safety
      siblings[targetIndex].layer = currentLayer - 1;
    }
  });
}
