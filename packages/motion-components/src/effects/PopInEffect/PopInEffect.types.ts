import React from 'react';

export interface PopInEffectProps {
  children?: React.ReactNode;

  x?: number;
  y?: number;

  scaleFrom?: number;
  scaleTo?: number;

  opacityFrom?: number;
  opacityTo?: number;

  durationInFrames?: number;
  delayInFrames?: number;

  easing?: 'linear' | 'easeOut' | 'backOut';
  direction?: 'center' | 'top' | 'bottom' | 'left' | 'right';

  currentFrame?: number;
  fps?: number;
  
  className?: string;
  style?: React.CSSProperties;
}
