import React from 'react';
import { SlideInEffectProps } from './SlideInEffect.types';
import { interpolate, easeOutCubic, easeInOutCubic } from './SlideInEffect.utils';

export const SlideInEffect: React.FC<SlideInEffectProps> = ({
  children,
  x,
  y,
  direction = 'left',
  distance = 100,
  opacityFrom = 0,
  opacityTo = 1,
  durationInFrames = 20,
  delayInFrames = 0,
  easing = 'easeOut',
  fade = true,
  currentFrame = 0,
  className = '',
  style = {},
}) => {
  const endFrame = delayInFrames + durationInFrames;

  let progress = 0;
  if (currentFrame >= endFrame) {
    progress = 1;
  } else if (currentFrame > delayInFrames) {
    const rawProgress = interpolate(currentFrame, [delayInFrames, endFrame], [0, 1], 'clamp');
    
    if (easing === 'easeOut') {
      progress = easeOutCubic(rawProgress);
    } else if (easing === 'easeInOut') {
      progress = easeInOutCubic(rawProgress);
    } else {
      progress = rawProgress;
    }
  }

  // Opacity Calculation
  let currentOpacity = 1;
  if (fade) {
    currentOpacity = interpolate(progress, [0, 1], [opacityFrom, opacityTo], 'clamp');
  }

  if (currentFrame < delayInFrames && fade) {
    currentOpacity = opacityFrom;
  }

  // Directional Translation Calculation
  let txFrom = 0;
  let tyFrom = 0;

  if (direction === 'left') txFrom = -distance;
  if (direction === 'right') txFrom = distance;
  if (direction === 'top') tyFrom = -distance;
  if (direction === 'bottom') tyFrom = distance;

  const currentTx = interpolate(progress, [0, 1], [txFrom, 0], 'clamp');
  const currentTy = interpolate(progress, [0, 1], [tyFrom, 0], 'clamp');

  // Positioning
  const isAbsolute = x !== undefined || y !== undefined;
  
  return (
    <div
      data-testid="slide-in-effect"
      className={className}
      style={{
        position: isAbsolute ? 'absolute' : 'relative',
        left: x,
        top: y,
        opacity: currentOpacity,
        transform: `translate(${currentTx}px, ${currentTy}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
