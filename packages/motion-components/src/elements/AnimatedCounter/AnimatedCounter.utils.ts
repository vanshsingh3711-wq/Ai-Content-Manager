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

export function formatValue(
  val: number,
  format: "number" | "currency" | "percentage",
  decimals: number,
  currencySymbol: string,
  prefix: string,
  suffix: string
): string {
  let formatted = val.toFixed(decimals);
  
  // Add commas
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  formatted = parts.join('.');

  if (format === 'currency') {
    formatted = `${currencySymbol}${formatted}`;
  } else if (format === 'percentage') {
    formatted = `${formatted}%`;
  }

  return `${prefix}${formatted}${suffix}`;
}
