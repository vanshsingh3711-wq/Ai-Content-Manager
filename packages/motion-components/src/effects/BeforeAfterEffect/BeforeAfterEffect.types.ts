import React from 'react';

export interface BeforeAfterEffectProps {
  before?: React.ReactNode;
  after?: React.ReactNode;

  width?: number | string;
  height?: number | string;

  x?: number;
  y?: number;

  direction?: 'horizontal' | 'vertical';
  
  revealProgress?: number;

  durationInFrames?: number;
  delayInFrames?: number;

  labelBefore?: string;
  labelAfter?: string;

  showDivider?: boolean;
  dividerWidth?: number;

  showLabels?: boolean;
  labelOpacity?: number;

  easing?: 'linear' | 'easeOut' | 'easeInOut';

  currentFrame?: number;
  fps?: number;
  
  className?: string;
  style?: React.CSSProperties;
}
