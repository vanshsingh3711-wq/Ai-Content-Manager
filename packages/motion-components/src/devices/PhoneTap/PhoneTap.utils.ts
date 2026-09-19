export function interpolate(
  frame: number,
  inputRange: number[],
  outputRange: number[],
  extrapolate: 'clamp' | 'extend' = 'clamp'
): number {
  if (inputRange.length !== outputRange.length) {
    throw new Error('inputRange and outputRange must be same length');
  }

  if (inputRange.length === 2) {
    return linearInterpolate(frame, inputRange as [number, number], outputRange as [number, number], extrapolate);
  }

  // Multi-segment interpolation
  for (let i = 0; i < inputRange.length - 1; i++) {
    if (frame >= inputRange[i] && frame <= inputRange[i + 1]) {
      return linearInterpolate(
        frame,
        [inputRange[i], inputRange[i + 1]],
        [outputRange[i], outputRange[i + 1]],
        extrapolate
      );
    }
  }

  if (frame < inputRange[0]) {
    if (extrapolate === 'clamp') return outputRange[0];
    return linearInterpolate(frame, [inputRange[0], inputRange[1]], [outputRange[0], outputRange[1]], 'extend');
  }

  const lastIdx = inputRange.length - 1;
  if (extrapolate === 'clamp') return outputRange[lastIdx];
  return linearInterpolate(frame, [inputRange[lastIdx - 1], inputRange[lastIdx]], [outputRange[lastIdx - 1], outputRange[lastIdx]], 'extend');
}

function linearInterpolate(
  frame: number,
  inputRange: [number, number],
  outputRange: [number, number],
  extrapolate: 'clamp' | 'extend'
): number {
  const [inMin, inMax] = inputRange;
  const [outMin, outMax] = outputRange;

  if (inMax - inMin === 0) return outMax;

  let progress = (frame - inMin) / (inMax - inMin);

  if (extrapolate === 'clamp') {
    progress = Math.max(0, Math.min(1, progress));
  }

  return outMin + progress * (outMax - outMin);
}
