import React from 'react';

export interface ConnectionLineEffectProps {
  fromX: number;
  fromY: number;

  toX: number;
  toY: number;

  color?: string;
  opacity?: number;

  strokeWidth?: number;

  style?: 'straight' | 'curved';

  curvature?: number;

  showStartDot?: boolean;
  showEndDot?: boolean;

  showArrow?: boolean;
  arrowSize?: number;

  durationInFrames?: number;
  delayInFrames?: number;

  animation?: 'draw' | 'fade' | 'draw-fade';

  easing?: 'linear' | 'easeOut' | 'easeInOut';

  currentFrame?: number;
  fps?: number;
  
  className?: string;
  styleProp?: React.CSSProperties; // Rename to avoid collision with 'style'
}
