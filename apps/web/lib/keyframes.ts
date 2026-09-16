import { Keyframe, ClipTransformState, AnimationState, InterpolationType } from "./timeline-types";

// Easing functions
const easeIn = (t: number) => t * t;
const easeOut = (t: number) => t * (2 - t);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

function interpolateScalar(val1: number, val2: number, t: number, type: InterpolationType): number {
  if (type === "hold") return val1;
  let progress = t;
  if (type === "easeIn") progress = easeIn(t);
  else if (type === "easeOut") progress = easeOut(t);
  else if (type === "easeInOut") progress = easeInOut(t);
  // bezier placeholder could be added here
  return val1 + (val2 - val1) * progress;
}

function interpolateValue(val1: any, val2: any, t: number, type: InterpolationType): any {
  if (typeof val1 === "number" && typeof val2 === "number") {
    return interpolateScalar(val1, val2, t, type);
  }
  if (typeof val1 === "object" && typeof val2 === "object" && val1 !== null && val2 !== null) {
    const result: any = { ...val1 };
    for (const key in val1) {
      if (typeof val1[key] === "number" && typeof val2[key] === "number") {
        result[key] = interpolateScalar(val1[key], val2[key], t, type);
      }
    }
    return result;
  }
  // Fallback for unknown types or mismatched types
  return type === "hold" || t < 1 ? val1 : val2;
}

/**
 * Gets the interpolated value for a property at a specific local time inside a clip.
 */
export function evaluatePropertyAtTime(
  animationState: ClipTransformState | undefined,
  property: string,
  localTime: number,
  defaultValue: any
): any {
  if (!animationState || !animationState[property] || animationState[property]!.keyframes.length === 0) {
    return defaultValue;
  }

  const kfs = animationState[property]!.keyframes;

  // If there's only 1 keyframe, just use its value
  if (kfs.length === 1) {
    return kfs[0].value;
  }

  // Find the two keyframes surrounding the localTime
  let prevKf: Keyframe | null = null;
  let nextKf: Keyframe | null = null;

  for (let i = 0; i < kfs.length; i++) {
    if (kfs[i].time <= localTime) {
      if (!prevKf || kfs[i].time > prevKf.time) {
        prevKf = kfs[i];
      }
    } else {
      if (!nextKf || kfs[i].time < nextKf.time) {
        nextKf = kfs[i];
      }
    }
  }

  // If localTime is before the very first keyframe, return the first keyframe value
  if (!prevKf && nextKf) {
    return nextKf.value;
  }

  // If localTime is after the very last keyframe, return the last keyframe value
  if (prevKf && !nextKf) {
    return prevKf.value;
  }

  // Interpolation between prevKf and nextKf
  if (prevKf && nextKf) {
    const timeDelta = nextKf.time - prevKf.time;
    if (timeDelta === 0) return prevKf.value;

    const progress = (localTime - prevKf.time) / timeDelta;
    return interpolateValue(prevKf.value, nextKf.value, progress, prevKf.interpolation);
  }

  return defaultValue;
}

/**
 * Checks if a property has ANY keyframes.
 */
export function hasAnyKeyframes(
  animationState: ClipTransformState | undefined,
  property: string
): boolean {
  if (!animationState || !animationState[property]) return false;
  return animationState[property]!.keyframes.length > 0;
}

/**
 * Finds exactly a keyframe at the current local time.
 */
export function getExactKeyframe(
  animationState: ClipTransformState | undefined,
  property: string,
  localTime: number,
  epsilon: number = 0.05
): Keyframe | undefined {
  if (!animationState || !animationState[property]) return undefined;
  
  return animationState[property]!.keyframes.find(
    (kf) => Math.abs(kf.time - localTime) <= epsilon
  );
}
