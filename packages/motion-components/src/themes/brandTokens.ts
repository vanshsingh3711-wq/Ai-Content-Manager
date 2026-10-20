import { Easing } from 'remotion';

export const BRAND = {
  wordmark: ['AI', 'Content', 'Studio'] as readonly string[],
  signoff: 'Created with AI Content Manager',
} as const;

export const COLORS = {
  // primary brand roles
  accent: '#6366F1', // indigo primary
  accent2: '#9b7cc4', // violet secondary
  signal: '#4db8a8', // teal success / highlight
  signalAlt: '#4ecdc4', // teal-green companion
  warn: '#f5d76e', // yellow attention
  danger: '#e8879f', // pink contrast / error
  ink: '#1a1a2e', // dark text on light
  muted: '#6b6b7b', // secondary text
  paper: '#fffef7', // light surface / bg
  cream: '#faf8f5', // alt light band
  line: '#e7e3da', // 1px borders on light
  // dark UI / terminal scale (GitHub/VSCode ink)
  d900: '#0d1117',
  d800: '#161b22',
  d600: '#30363d',
  d400: '#8b949e',
  d300: '#c9d1d9',
} as const;

export const GRADIENT = `linear-gradient(120deg, ${COLORS.accent}, ${COLORS.accent2}, ${COLORS.signal})`;

export const RADIUS = { card: 16, panel: 14, window: 10, pill: 999 } as const;

export const SHADOW = {
  soft: '0 8px 32px rgba(26,26,46,0.10)',
  card: '0 10px 40px rgba(26,26,46,0.08)',
} as const;

// Smooth, professional cubic-bezier easings (no cartoon bounce)
export const EASINGS = {
  easeOut: Easing.bezier(0.33, 1, 0.68, 1),
  easeIn: Easing.bezier(0.32, 0, 0.67, 0),
  easeInOut: Easing.bezier(0.37, 0, 0.63, 1),
  overshoot: Easing.bezier(0.34, 1.4, 0.64, 1),
} as const;

// Standard clean typography stacks
export const FONT_DISPLAY = "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
export const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
export const FONT_MONO = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace";
export const FONT_SERIF = "'Spectral', 'Georgia', serif";
