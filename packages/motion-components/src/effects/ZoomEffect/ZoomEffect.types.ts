import React from 'react';

export interface ZoomEffectProps {
  centerX: number;
  centerY: number;

  viewportWidth?: number;
  viewportHeight?: number;

  fromScale?: number;
  toScale?: number;

  durationInFrames?: number;
  delayInFrames?: number;

  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  mode?: 'in' | 'out' | 'in-out';

  currentFrame?: number;
  fps?: number;
  
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
