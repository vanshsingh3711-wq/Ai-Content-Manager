import React from 'react';

export interface ParallaxConfig {
  x?: number;
  y?: number;
}

export interface ParallaxProps {
  depth?: number;
  intensity?: number;
  axis?: 'x' | 'y' | 'both';
  from?: ParallaxConfig;
  to?: ParallaxConfig;
  delayInFrames?: number;
  durationInFrames?: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  currentFrame: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  testId?: string;
}
