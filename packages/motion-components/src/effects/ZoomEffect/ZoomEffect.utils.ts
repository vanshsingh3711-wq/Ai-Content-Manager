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

export function easeLinear(x: number): number {
  return x;
}

export function easeIn(x: number): number {
  return x * x * x;
}

export function easeOut(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

export function easeInOut(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function getEasingFunction(easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut') {
  switch (easing) {
    case 'easeIn': return easeIn;
    case 'easeOut': return easeOut;
    case 'easeInOut': return easeInOut;
    default: return easeLinear;
  }
}
