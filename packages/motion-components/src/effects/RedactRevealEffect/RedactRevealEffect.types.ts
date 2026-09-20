import React from 'react';

export interface RedactRevealEffectProps {
  children?: React.ReactNode;

  x?: number;
  y?: number;

  width?: number | string;
  height?: number | string;

  direction?: 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top';

  durationInFrames?: number;
  delayInFrames?: number;

  revealMode?: 'wipe' | 'mask';

  redactionColor?: string;
  redactionOpacity?: number;

  showRedactionBar?: boolean;

  easing?: 'linear' | 'easeOut' | 'easeInOut';

  currentFrame?: number;
  fps?: number;
  
  className?: string;
  style?: React.CSSProperties;
}
