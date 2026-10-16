import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const COLORS = {
  bg: '#030303',
  surface: 'rgba(15,15,20,0.75)',
  border: 'rgba(255,255,255,0.10)',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.55)',
  accent: '#7C3AED',        // purple
  accentGlow: 'rgba(124,58,237,0.30)',
  green: '#10B981',
  greenBg: 'rgba(16,185,129,0.15)',
  red: '#EF4444',
  amber: '#F59E0B',
} as const;

export const FONT = {
  display: '"Inter", "SF Pro Display", system-ui, sans-serif',
  mono: '"JetBrains Mono", "Fira Code", monospace',
} as const;

/** Fade + rise in from below */
export function useFadeUp(startFrame: number, distance = 30, duration = 18) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - startFrame, fps, config: { damping: 14, mass: 0.8, stiffness: 100 } });
  return {
    opacity: Math.min(1, progress),
    transform: `translateY(${(1 - progress) * distance}px)`,
  };
}

/** Scale punch in */
export function useScaleIn(startFrame: number, duration = 14) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - startFrame, fps, config: { damping: 12, mass: 0.6, stiffness: 200 } });
  return {
    opacity: Math.min(1, progress * 2),
    transform: `scale(${0.7 + progress * 0.3})`,
  };
}

/** Fade out in last N frames */
export function useExitFade(totalFrames: number, exitDuration = 12) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [totalFrames - exitDuration, totalFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return { opacity };
}

/** Glassmorphism card style */
export const glassStyle: React.CSSProperties = {
  background: COLORS.surface,
  backdropFilter: 'blur(40px) saturate(180%)',
  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  border: `1px solid ${COLORS.border}`,
  borderRadius: 32,
  boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.05), 0 40px 100px rgba(0,0,0,0.7), 0 0 80px ${COLORS.accentGlow}`,
};

/** Transparent fullscreen background */
export const transparentBg: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'transparent',
};
