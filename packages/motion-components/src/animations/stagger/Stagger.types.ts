import React from 'react';

export interface StaggerProps {
  delayInFrames?: number; // Base delay applied to all children
  staggerInFrames?: number; // Frame offset between consecutive children
  direction?: 'forward' | 'reverse';
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  currentFrame: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  testId?: string;
}
