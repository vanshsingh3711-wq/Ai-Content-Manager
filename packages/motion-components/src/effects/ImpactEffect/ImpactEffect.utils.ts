export function interpolate(
  frame: number,
  inputRange: number[],
  outputRange: number[],
  extrapolate: 'clamp' | 'extend' = 'clamp'
): number {
  if (inputRange.length !== outputRange.length) {
    throw new Error('inputRange and outputRange must be same length');
  }

  // Handle multi-stop interpolation
  for (let i = 0; i < inputRange.length - 1; i++) {
    if (frame >= inputRange[i] && frame <= inputRange[i + 1]) {
      const inMin = inputRange[i];
      const inMax = inputRange[i + 1];
      const outMin = outputRange[i];
      const outMax = outputRange[i + 1];

      if (inMax - inMin === 0) return outMax;

      const progress = (frame - inMin) / (inMax - inMin);
      return outMin + progress * (outMax - outMin);
    }
  }

  // Handle extrapolation
  if (frame < inputRange[0]) {
    return extrapolate === 'clamp' ? outputRange[0] : outputRange[0]; // Simplified for this component
  }
  
  if (frame > inputRange[inputRange.length - 1]) {
    return extrapolate === 'clamp' ? outputRange[outputRange.length - 1] : outputRange[outputRange.length - 1];
  }

  return outputRange[outputRange.length - 1];
}

export function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
