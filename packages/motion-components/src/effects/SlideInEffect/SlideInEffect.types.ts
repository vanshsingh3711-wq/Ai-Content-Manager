import React from 'react';

export interface SlideInEffectProps {
  children?: React.ReactNode;

  x?: number;
  y?: number;

  direction?: 'left' | 'right' | 'top' | 'bottom';
  distance?: number;

  opacityFrom?: number;
  opacityTo?: number;

  durationInFrames?: number;
  delayInFrames?: number;

  easing?: 'linear' | 'easeOut' | 'easeInOut';
  fade?: boolean;

  currentFrame?: number;
  fps?: number;
  
  className?: string;
  style?: React.CSSProperties;
}
