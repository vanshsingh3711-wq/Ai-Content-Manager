export interface GetAudioVolumeOptions {
  localFrame: number;
  durationInFrames: number;
  baseVolume: number;
  muted: boolean;
  fadeInFrames: number;
  fadeOutFrames: number;
}

/**
 * Pure function to deterministically calculate crossfade linear interpolation for an audio track.
 */
export function getAudioVolumeAtFrame({
  localFrame,
  durationInFrames,
  baseVolume,
  muted,
  fadeInFrames,
  fadeOutFrames,
}: GetAudioVolumeOptions): number {
  if (muted || baseVolume === 0) return 0;
  
  if (localFrame < 0 || localFrame >= durationInFrames) {
    return 0; // Out of bounds
  }

  // Handle pathological case where fades overlap
  if (fadeInFrames + fadeOutFrames > durationInFrames) {
    // If fades overlap, we proportionally reduce them to meet in the middle
    const totalFade = fadeInFrames + fadeOutFrames;
    fadeInFrames = Math.floor(fadeInFrames * (durationInFrames / totalFade));
    fadeOutFrames = durationInFrames - fadeInFrames;
  }

  let multiplier = 1;

  // Fade In
  if (fadeInFrames > 0 && localFrame < fadeInFrames) {
    multiplier = fadeInFrames === 1 ? 1 : localFrame / (fadeInFrames - 1);
  }
  
  // Fade Out
  const framesFromEnd = durationInFrames - localFrame;
  if (fadeOutFrames > 0 && framesFromEnd <= fadeOutFrames) {
    multiplier = fadeOutFrames === 1 ? 0 : (framesFromEnd - 1) / (fadeOutFrames - 1);
  }
  
  // Clamp multiplier just to be absolutely certain due to floating point
  multiplier = Math.max(0, Math.min(1, multiplier));

  return baseVolume * multiplier;
}
