import React from 'react';

export interface FocusEffectProps {
  x: number;
  y: number;
  width: number;
  height: number;

  overlayColor?: string;
  overlayOpacity?: number;

  borderRadius?: number;

  glow?: boolean;
  glowColor?: string;
  glowOpacity?: number;

  durationInFrames?: number;
  delayInFrames?: number;
  enterDurationInFrames?: number;
  exitDurationInFrames?: number;

  animation?: 'fade' | 'zoom';

  currentFrame?: number;
  fps?: number;
  
  style?: React.CSSProperties;
}
