import React from 'react';

export interface TransitionWipeEffectProps {
  from?: React.ReactNode;
  to?: React.ReactNode;

  width?: number | string;
  height?: number | string;

  x?: number;
  y?: number;

  direction?: 'left' | 'right' | 'top' | 'bottom';

  durationInFrames?: number;
  delayInFrames?: number;

  color?: string;
  colorOpacity?: number;

  style?: 'solid' | 'reveal';

  easing?: 'linear' | 'easeOut' | 'easeInOut';

  currentFrame?: number;
  fps?: number;
  
  className?: string;
  containerStyle?: React.CSSProperties;
}
