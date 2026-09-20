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

export function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function hexToRgba(hex: string, alpha: number): string {
  // Support both 3-digit and 6-digit hex
  let r = 0, g = 0, b = 0;
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (hex.length === 3) {
    r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
    g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
    b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else if (hex.length === 8) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
    // Ignore existing alpha in hex 8
  } else {
    // Fallback if not valid hex (e.g. they passed 'red' or 'rgb(0,0,0)')
    // In a real app we might use a dedicated color parser
    return hex;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
