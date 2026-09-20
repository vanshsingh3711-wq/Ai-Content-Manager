import React from 'react';

export interface TypewriterProps {
  text: string;
  direction?: 'forward' | 'reverse';
  delayInFrames?: number;
  durationInFrames?: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  cursor?: {
    enabled?: boolean;
    character?: string;
    blink?: boolean;
  };
  currentFrame: number;
  style?: React.CSSProperties;
  testId?: string;
}
