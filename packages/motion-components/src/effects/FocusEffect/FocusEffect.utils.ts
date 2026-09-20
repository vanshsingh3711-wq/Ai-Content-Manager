export function interpolate(
  frame: number,
  inputRange: [number, number],
  outputRange: [number, number],
  extrapolate: 'clamp' | 'extend' = 'clamp'
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

export function easeOutExpo(x: number): number {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}
