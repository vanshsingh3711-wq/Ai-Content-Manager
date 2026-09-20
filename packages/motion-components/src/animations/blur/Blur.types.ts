import React from 'react';

export interface BlurProps {
  from: number; // in pixels
  to: number; // in pixels
  delayInFrames?: number;
  durationInFrames?: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  currentFrame: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  testId?: string;
}
