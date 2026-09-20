import React from 'react';

export interface ShakeProps {
  axis?: 'x' | 'y' | 'both';
  amplitude?: number; // max pixel displacement
  frequency?: number; // number of oscillations
  delayInFrames?: number;
  durationInFrames?: number;
  currentFrame: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  testId?: string;
}
