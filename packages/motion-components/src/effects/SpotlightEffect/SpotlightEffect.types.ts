import React from 'react';

export interface SpotlightEffectProps {
  x: number;
  y: number;

  toX?: number;
  toY?: number;

  radius?: number;

  radiusX?: number;
  radiusY?: number;

  overlayColor?: string;
  overlayOpacity?: number;

  feather?: number; // 0 to 100

  glow?: boolean;
  glowColor?: string;
  glowOpacity?: number;

  durationInFrames?: number;
  delayInFrames?: number;
  enterDurationInFrames?: number;
  exitDurationInFrames?: number;

  animation?: 'fade' | 'expand' | 'contract';

  currentFrame?: number;
  fps?: number;
  
  style?: React.CSSProperties;
}
