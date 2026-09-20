import React from 'react';

export interface CircleHighlightEffectProps {
  x: number;
  y: number;

  width: number;
  height: number;

  color?: string;
  opacity?: number;

  strokeWidth?: number;
  padding?: number;

  durationInFrames?: number;
  delayInFrames?: number;

  animation?: 'draw' | 'fade' | 'draw-fade';
  style?: 'ellipse' | 'hand-drawn';

  currentFrame?: number;
  fps?: number;
  
  className?: string;
  containerStyle?: React.CSSProperties;
}
