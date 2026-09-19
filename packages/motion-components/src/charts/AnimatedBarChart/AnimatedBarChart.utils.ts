export function getMaxValue(data: { value: number }[], customMax?: number): number {
  if (customMax !== undefined) return customMax;
  if (data.length === 0) return 100;
  const max = Math.max(...data.map(d => d.value));
  return max > 0 ? max : 100;
}

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
