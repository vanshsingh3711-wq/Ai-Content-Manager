import { TimingConfig } from './timing.types';
import { resolveTimingState } from './timing.resolve';

// Minimal interface for traversal
export interface TimedElement {
  id: string;
  timing?: TimingConfig;
  children?: TimedElement[];
}

/**
 * Calculates the total duration in frames required to fully render a scene.
 * It traverses all elements (and nested groups), calculates their effective end frames,
 * and returns the maximum frame found.
 */
export function getSceneDuration(elements: TimedElement[]): number {
  let maxEndFrame = 0;

  const traverse = (els: TimedElement[], currentGroupOffset: number) => {
    for (const el of els) {
      const timing = resolveTimingState(0, el.timing, currentGroupOffset); // We only care about bounds, globalFrame doesn't matter here
      
      // If any element lacks a duration, the scene effectively has infinite duration.
      // In a real video editor, you might cap this or require explicit durations.
      if (timing.effectiveEndFrame === null) {
        // Return a high cap or throw. For now, assume it extends to current max + something, or return Infinity
        maxEndFrame = Infinity;
      } else if (timing.effectiveEndFrame > maxEndFrame) {
        maxEndFrame = timing.effectiveEndFrame;
      }

      if (el.children) {
        // Pass down this element's effective start frame as the offset for its children
        traverse(el.children, timing.effectiveStartFrame);
      }
    }
  };

  traverse(elements, 0);

  return maxEndFrame;
}

/**
 * Helper to convert seconds to frames deterministically.
 */
export function secondsToFrames(seconds: number, fps: number): number {
  return Math.round(seconds * fps);
}
