import React from 'react';

export interface MoveProps {
  from: {
    x: number;
    y: number;
  };
  to: {
    x: number;
    y: number;
  };
  delayInFrames?: number;
  durationInFrames?: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  currentFrame: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  testId?: string;
}
