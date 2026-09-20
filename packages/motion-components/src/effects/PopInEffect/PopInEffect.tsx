import React from 'react';
import { PopInEffectProps } from './PopInEffect.types';
import { interpolate, easeOutCubic, easeOutBackSubtle } from './PopInEffect.utils';

export const PopInEffect: React.FC<PopInEffectProps> = ({
  children,
  x,
  y,
  scaleFrom = 0.85,
  scaleTo = 1,
  opacityFrom = 0,
  opacityTo = 1,
  durationInFrames = 18,
  delayInFrames = 0,
  easing = 'backOut',
  direction = 'center',
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
    } else if (easing === 'backOut') {
      progress = easeOutBackSubtle(rawProgress);
    } else {
      progress = rawProgress;
    }
  }

  // Animation Values
  const currentScale = interpolate(progress, [0, 1], [scaleFrom, scaleTo], 'extend'); // Extend allows backOut to overshoot
  
  // Opacity should not overshoot above 1 or below 0, so we use rawProgress or clamp it
  const opacityProgress = easing === 'backOut' ? interpolate(progress, [0, 1], [0, 1], 'clamp') : progress;
  let currentOpacity = interpolate(opacityProgress, [0, 1], [opacityFrom, opacityTo], 'clamp');

  if (currentFrame < delayInFrames) {
    currentOpacity = 0;
  }

  // Directional translation
  const offsetDistance = 40;
  let txFrom = 0;
  let tyFrom = 0;

  if (direction === 'top') tyFrom = -offsetDistance;
  if (direction === 'bottom') tyFrom = offsetDistance;
  if (direction === 'left') txFrom = -offsetDistance;
  if (direction === 'right') txFrom = offsetDistance;

  // We only interpolate translation from offset to 0
  const currentTx = interpolate(progress, [0, 1], [txFrom, 0], 'extend');
  const currentTy = interpolate(progress, [0, 1], [tyFrom, 0], 'extend');

  // Positioning
  const isAbsolute = x !== undefined || y !== undefined;
  
  return (
    <div
      data-testid="pop-in-effect"
      className={className}
      style={{
        position: isAbsolute ? 'absolute' : 'relative',
        left: x,
        top: y,
        opacity: currentOpacity,
        transform: `translate(${currentTx}px, ${currentTy}px) scale(${currentScale})`,
        transformOrigin: 'center center',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
