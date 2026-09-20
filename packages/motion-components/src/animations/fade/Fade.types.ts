import React from 'react';

export interface FadeProps {
  from: number; // 0 to 1
  to: number; // 0 to 1
  delayInFrames?: number;
  durationInFrames?: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  currentFrame: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  testId?: string;
}
