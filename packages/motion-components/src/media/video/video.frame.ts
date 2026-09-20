export interface GetSourceFrameOptions {
  localFrame: number;
  sourceStartFrame: number;
  sourceEndFrame?: number;
  playbackRate: number;
  loop: boolean;
  durationInFrames?: number; // Optional metadata duration
}

/**
 * Pure function to deterministically map a scene's local frame to a video's source frame.
 * Does not mutate anything.
 */
export function getSourceFrame({
  localFrame,
  sourceStartFrame,
  sourceEndFrame,
  playbackRate,
  loop,
  durationInFrames
}: GetSourceFrameOptions): number {
  if (localFrame < 0) return sourceStartFrame;

  // Calculate the raw frame offset based on rate
  const frameOffset = Math.floor(localFrame * playbackRate);
  
  // What is the max frame we can seek to?
  let effectiveEndFrame = Infinity;
  if (sourceEndFrame !== undefined) {
    effectiveEndFrame = sourceEndFrame;
  } else if (durationInFrames !== undefined) {
    effectiveEndFrame = durationInFrames - 1; // 0-indexed frames
  }

  // Range bounds checking
  if (effectiveEndFrame <= sourceStartFrame) {
    // Malformed bounds, clamp to start
    return sourceStartFrame;
  }

  const rangeLength = effectiveEndFrame - sourceStartFrame + 1; // +1 to make it inclusive

  if (!loop) {
    // Clamp to effective end if not looping
    const targetFrame = sourceStartFrame + frameOffset;
    return Math.min(targetFrame, effectiveEndFrame);
  } else {
    // Wrap around
    return sourceStartFrame + (frameOffset % rangeLength);
  }
}
