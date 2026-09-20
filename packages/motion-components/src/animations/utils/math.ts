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

export function easeSpring(t: number, intensity: number = 0.15, bounces: number = 2): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  const decay = 10 / (intensity * 10 + 1); // higher intensity = lower decay
  const freq = bounces * Math.PI * 2;
  // A simple decaying cosine that starts at 1 and decays to 0
  return 1 - Math.exp(-decay * t) * Math.cos(freq * t);
}

export function easeShake(t: number, frequency: number = 4, phase: number = 0): number {
  if (t === 0 || t === 1) return 0;
  // linearly decay the amplitude from 1 to 0 over the duration
  const decay = 1 - t;
  return Math.sin(t * frequency * Math.PI * 2 + phase) * decay;
}
