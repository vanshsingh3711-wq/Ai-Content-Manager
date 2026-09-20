import React from 'react';

export interface RotateProps {
  from: number; // in degrees
  to: number; // in degrees
  delayInFrames?: number;
  durationInFrames?: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  currentFrame: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  testId?: string;
}
