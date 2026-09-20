import React from 'react';

export interface BounceProps {
  property?: 'scale' | 'x' | 'y' | 'rotate';
  from?: number;
  to?: number;
  delayInFrames?: number;
  durationInFrames?: number;
  intensity?: number;
  bounces?: number;
  currentFrame: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  testId?: string;
}
