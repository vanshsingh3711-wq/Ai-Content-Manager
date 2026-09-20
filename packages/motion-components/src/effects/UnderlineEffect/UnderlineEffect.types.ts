import React from 'react';

export interface UnderlineEffectProps {
  x: number;
  y: number;

  width: number;
  height?: number; // Used for curvature/thickness bounds

  color?: string;
  opacity?: number;

  strokeWidth?: number;
  borderRadius?: number;

  durationInFrames?: number;
  delayInFrames?: number;

  animation?: 'draw' | 'fade' | 'draw-fade';
  style?: 'solid' | 'marker' | 'hand-drawn';

  currentFrame?: number;
  fps?: number;
  
  className?: string;
  containerStyle?: React.CSSProperties;
}
