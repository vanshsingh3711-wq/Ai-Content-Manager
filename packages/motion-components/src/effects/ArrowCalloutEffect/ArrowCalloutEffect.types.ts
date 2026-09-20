import React from 'react';

export interface ArrowCalloutEffectProps {
  fromX: number;
  fromY: number;

  toX: number;
  toY: number;

  color?: string;
  opacity?: number;
  strokeWidth?: number;
  headSize?: number;

  curvature?: number; // 0 for straight, positive/negative for curved

  durationInFrames?: number;
  delayInFrames?: number;

  animation?: 'draw' | 'fade' | 'draw-fade';
  style?: 'straight' | 'curved';

  currentFrame?: number;
  fps?: number;
  
  className?: string;
  containerStyle?: React.CSSProperties;
}
