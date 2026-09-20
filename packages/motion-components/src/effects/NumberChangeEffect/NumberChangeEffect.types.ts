import React from 'react';

export interface NumberChangeEffectProps {
  from: number;
  to: number;

  durationInFrames?: number;
  delayInFrames?: number;

  decimals?: number;

  prefix?: string;
  suffix?: string;

  separator?: boolean;

  locale?: string;

  easing?: 'linear' | 'easeOut' | 'easeInOut';

  color?: string;
  fontSize?: number | string;
  fontWeight?: number | string;

  align?: 'left' | 'center' | 'right';

  currentFrame?: number;
  fps?: number;
  
  className?: string;
  style?: React.CSSProperties;
}
