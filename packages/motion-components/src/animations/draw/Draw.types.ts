import React from 'react';

export interface DrawProps {
  mode?: 'path' | 'hand';
  direction?: 'forward' | 'reverse';
  from?: number; // 0 to 1
  to?: number; // 0 to 1
  delayInFrames?: number;
  durationInFrames?: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  hand?: {
    wobble?: number;
    speedVariation?: number;
    strokeVariation?: number;
  };
  currentFrame: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  testId?: string;
}
