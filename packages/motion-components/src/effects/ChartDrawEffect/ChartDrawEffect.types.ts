import React from 'react';

export interface ChartDrawEffectProps {
  children?: React.ReactNode;

  x?: number;
  y?: number;

  width?: number | string;
  height?: number | string;

  durationInFrames?: number;
  delayInFrames?: number;

  direction?: 'left-to-right' | 'right-to-left';

  progressFrom?: number;
  progressTo?: number;

  opacityFrom?: number;
  opacityTo?: number;

  easing?: 'linear' | 'easeOut' | 'easeInOut';

  revealMode?: 'draw' | 'wipe';

  currentFrame?: number;
  fps?: number;
  
  className?: string;
  style?: React.CSSProperties;
}
