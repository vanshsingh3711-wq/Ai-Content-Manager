import { TimingConfig, ResolvedTiming, TimingState } from './timing.types';

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

/**
 * Mathematically resolves a global timeline frame into a local element's semantic state
 * and normalized progress values.
 * 
 * @param globalFrame The current frame of the entire video/composition.
 * @param config The timing configuration of the element.
 * @param groupOffset Inherited offset from parent groups (for stagger/delays).
 */
export function resolveTimingState(
  globalFrame: number, 
  config: TimingConfig = {}, 
  groupOffset = 0
): ResolvedTiming {
  
  const effectiveStartFrame = (config.startFrame || 0) + (config.delayInFrames || 0) + groupOffset;
  const effectiveEndFrame = config.durationInFrames !== undefined 
    ? effectiveStartFrame + config.durationInFrames 
    : null;

  const localFrame = globalFrame - effectiveStartFrame;

  // Determine State
  let state: TimingState = 'visible';

  if (globalFrame < effectiveStartFrame) {
    state = 'before';
  } else if (effectiveEndFrame !== null && globalFrame >= effectiveEndFrame) {
    state = 'after';
  } else if (config.enter?.durationInFrames && localFrame < config.enter.durationInFrames) {
    state = 'entering';
  } else if (effectiveEndFrame !== null && config.exit?.durationInFrames && globalFrame >= (effectiveEndFrame - config.exit.durationInFrames)) {
    state = 'exiting';
  }

  // Calculate Progress Values
  let enterProgress = 1; // Default to fully entered
  if (config.enter?.durationInFrames) {
    enterProgress = clamp(localFrame / config.enter.durationInFrames, 0, 1);
  }

  let exitProgress = 0; // Default to not exited
  if (effectiveEndFrame !== null && config.exit?.durationInFrames) {
    const exitStartFrame = effectiveEndFrame - config.exit.durationInFrames;
    const localExitFrame = globalFrame - exitStartFrame;
    exitProgress = clamp(localExitFrame / config.exit.durationInFrames, 0, 1);
  }

  let visibleProgress = 0;
  if (effectiveEndFrame !== null) {
    visibleProgress = clamp(localFrame / config.durationInFrames!, 0, 1);
  } else {
    // If infinite duration, progress is bound to 0
    visibleProgress = localFrame >= 0 ? 0 : 0; 
  }

  return {
    state,
    localFrame,
    enterProgress,
    visibleProgress,
    exitProgress,
    effectiveStartFrame,
    effectiveEndFrame
  };
}
