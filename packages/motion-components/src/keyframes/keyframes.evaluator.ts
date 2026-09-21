import { interpolate, Easing } from 'remotion';
import { AnimatableProperty, ElementKeyframeState, Keyframe, KeyframeTrack } from './keyframes.types';

export function evaluateKeyframeTrack(track: KeyframeTrack, currentFrame: number, baseValue?: number): number | undefined {
  if (!track.keyframes || track.keyframes.length === 0) {
    return baseValue;
  }

  // If there's only one keyframe, we hold its value statically
  if (track.keyframes.length === 1) {
    return track.keyframes[0].value;
  }

  // Ensure keyframes are sorted by frame
  const sorted = [...track.keyframes].sort((a, b) => a.frame - b.frame);

  // Before first keyframe
  if (currentFrame <= sorted[0].frame) {
    return sorted[0].value;
  }

  // After last keyframe
  const lastKeyframe = sorted[sorted.length - 1];
  if (currentFrame >= lastKeyframe.frame) {
    return lastKeyframe.value;
  }

  // Between keyframes
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i];
    const next = sorted[i + 1];

    if (currentFrame >= curr.frame && currentFrame <= next.frame) {
      let easingFunc = Easing.linear;
      
      switch (curr.easing) {
        case 'easeIn':
          easingFunc = Easing.in(Easing.ease);
          break;
        case 'easeOut':
          easingFunc = Easing.out(Easing.ease);
          break;
        case 'easeInOut':
          easingFunc = Easing.inOut(Easing.ease);
          break;
        case 'linear':
        default:
          easingFunc = Easing.linear;
          break;
      }

      return interpolate(
        currentFrame,
        [curr.frame, next.frame],
        [curr.value, next.value],
        {
          easing: easingFunc,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp'
        }
      );
    }
  }

  return baseValue;
}

/**
 * Evaluates all keyframe tracks for an element and returns a dictionary of overrides.
 */
export function evaluateElementKeyframes(
  tracks: KeyframeTrack[] | undefined,
  currentFrame: number,
  baseValues: ElementKeyframeState = {}
): ElementKeyframeState {
  const result: ElementKeyframeState = { ...baseValues };

  if (!tracks || tracks.length === 0) {
    return result;
  }

  for (const track of tracks) {
    const evaluated = evaluateKeyframeTrack(track, currentFrame, baseValues[track.property]);
    if (evaluated !== undefined) {
      result[track.property] = evaluated;
    }
  }

  return result;
}
