import React from 'react';

export interface FreezeHighlightEffectProps {
  children?: React.ReactNode;

  x?: number;
  y?: number;
  width?: number;
  height?: number;

  overlayColor?: string;
  overlayOpacity?: number;

  highlightOpacity?: number;

  borderRadius?: number;

  glow?: boolean;
  glowColor?: string;
  glowOpacity?: number;
  glowRadius?: number;

  padding?: number;

  durationInFrames?: number;
  delayInFrames?: number;

  animation?: 'fade' | 'instant';

  currentFrame?: number;
  fps?: number;
  
  className?: string;
  style?: React.CSSProperties;
}
