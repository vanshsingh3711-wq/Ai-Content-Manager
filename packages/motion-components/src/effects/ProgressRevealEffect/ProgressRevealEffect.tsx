import React from 'react';
import { ProgressRevealEffectProps } from './ProgressRevealEffect.types';
import { interpolate, easeOutCubic, easeInOutCubic } from './ProgressRevealEffect.utils';

export const ProgressRevealEffect: React.FC<ProgressRevealEffectProps> = ({
  children,
  x,
  y,
  width,
  height,
  direction = 'left-to-right',
  durationInFrames = 30,
  delayInFrames = 0,
  fromProgress = 0,
  toProgress = 1,
  opacityFrom,
  opacityTo,
  easing = 'easeOut',
  borderRadius = 0,
  currentFrame = 0,
  className = '',
  style = {},
}) => {
  const endFrame = delayInFrames + durationInFrames;

  // Calculate timeline progress
  let timelineProgress = 0;
  if (currentFrame >= endFrame) {
    timelineProgress = 1;
  } else if (currentFrame > delayInFrames) {
    const rawProgress = interpolate(currentFrame, [delayInFrames, endFrame], [0, 1], 'clamp');
    if (easing === 'easeOut') {
      timelineProgress = easeOutCubic(rawProgress);
    } else if (easing === 'easeInOut') {
      timelineProgress = easeInOutCubic(rawProgress);
    } else {
      timelineProgress = rawProgress;
    }
  }

  // Calculate actual progress based on from/to bounds
  const clampedFrom = Math.max(0, Math.min(1, fromProgress));
  const clampedTo = Math.max(0, Math.min(1, toProgress));
  
  const currentProgress = interpolate(timelineProgress, [0, 1], [clampedFrom, clampedTo], 'clamp');
  
  const pct = currentProgress * 100;
  const inv = 100 - pct;

  // Clip Path calculation based on direction
  let clipPath = '';
  if (direction === 'left-to-right') {
    clipPath = `polygon(0% 0%, ${pct}% 0%, ${pct}% 100%, 0% 100%)`;
  } else if (direction === 'right-to-left') {
    clipPath = `polygon(${inv}% 0%, 100% 0%, 100% 100%, ${inv}% 100%)`;
  } else if (direction === 'top-to-bottom') {
    clipPath = `polygon(0% 0%, 100% 0%, 100% ${pct}%, 0% ${pct}%)`;
  } else if (direction === 'bottom-to-top') {
    clipPath = `polygon(0% ${inv}%, 100% ${inv}%, 100% 100%, 0% 100%)`;
  }

  // Opacity calculation if provided
  let opacity = 1;
  if (opacityFrom !== undefined && opacityTo !== undefined) {
    opacity = interpolate(timelineProgress, [0, 1], [opacityFrom, opacityTo], 'clamp');
  } else if (opacityFrom !== undefined) {
    opacity = timelineProgress === 0 ? opacityFrom : 1;
  } else if (opacityTo !== undefined) {
    opacity = timelineProgress === 1 ? opacityTo : 1;
  }

  const isAbsolute = x !== undefined || y !== undefined;

  return (
    <div
      data-testid="progress-reveal-effect"
      className={className}
      style={{
        position: isAbsolute ? 'absolute' : 'relative',
        left: x,
        top: y,
        width,
        height,
        borderRadius,
        clipPath,
        WebkitClipPath: clipPath,
        opacity,
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
