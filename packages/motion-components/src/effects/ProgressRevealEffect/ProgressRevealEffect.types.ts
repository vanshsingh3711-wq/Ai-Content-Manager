import React from 'react';

export interface ProgressRevealEffectProps {
  children?: React.ReactNode;

  x?: number;
  y?: number;

  width?: number | string;
  height?: number | string;

  direction?: 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top';

  durationInFrames?: number;
  delayInFrames?: number;

  fromProgress?: number;
  toProgress?: number;

  opacityFrom?: number;
  opacityTo?: number;

  easing?: 'linear' | 'easeOut' | 'easeInOut';

  borderRadius?: number | string;

  currentFrame?: number;
  fps?: number;
  
  className?: string;
  style?: React.CSSProperties;
}
