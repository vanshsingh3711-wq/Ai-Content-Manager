import React from 'react';

export interface MorphProps {
  from: string;
  to: string;
  delayInFrames?: number;
  durationInFrames?: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  mode?: 'path'; // extensible for future modes like 'polygon' or 'viewBox'
  currentFrame: number;
  children: React.ReactElement; // Requires exactly one child element (usually <path /> or <svg><path /></svg>)
  testId?: string;
}
