import React from 'react';

export interface ImpactEffectProps {
  children?: React.ReactNode;

  x?: number;
  y?: number;

  scaleFrom?: number;
  scalePeak?: number;
  scaleTo?: number;

  opacityFrom?: number;
  opacityPeak?: number;
  opacityTo?: number;

  blurFrom?: number;
  blurPeak?: number;
  blurTo?: number;

  shake?: boolean;
  shakeAmount?: number;

  glow?: boolean;
  glowColor?: string;
  glowOpacity?: number;
  glowRadius?: number;

  durationInFrames?: number;
  delayInFrames?: number;

  easing?: 'linear' | 'easeOut' | 'easeInOut';

  currentFrame?: number;
  fps?: number;
  
  className?: string;
  style?: React.CSSProperties;
}
