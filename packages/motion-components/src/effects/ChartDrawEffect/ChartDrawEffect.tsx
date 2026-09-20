import React from 'react';
import { ChartDrawEffectProps } from './ChartDrawEffect.types';
import { interpolate, easeOutCubic, easeInOutCubic } from './ChartDrawEffect.utils';

export const ChartDrawEffect: React.FC<ChartDrawEffectProps> = ({
  children,
  x,
  y,
  width = '100%',
  height = '100%',
  durationInFrames = 45,
  delayInFrames = 0,
  direction = 'left-to-right',
  progressFrom = 0,
  progressTo = 1,
  opacityFrom,
  opacityTo,
  easing = 'easeOut',
  revealMode = 'draw', // defaults to using clip-path wipe natively
  currentFrame = 0,
  className = '',
  style = {},
}) => {
  const endFrame = delayInFrames + durationInFrames;

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
  const clampedFrom = Math.max(0, Math.min(1, progressFrom));
  const clampedTo = Math.max(0, Math.min(1, progressTo));
  
  const currentProgress = interpolate(timelineProgress, [0, 1], [clampedFrom, clampedTo], 'clamp');
  
  const pct = currentProgress * 100;
  const inv = 100 - pct;

  // Clip Path calculation based on direction
  // For arbitrary nested React children (like an AnimatedLineChart wrapper), 
  // relying on DOM inspection to find SVG <path> elements is extremely fragile and breaks Remotion SSR.
  // Instead, wiping a bounding box perfectly achieves the visual effect of "drawing" a chart left-to-right.
  let clipPath = '';
  if (direction === 'left-to-right') {
    clipPath = `polygon(0% 0%, ${pct}% 0%, ${pct}% 100%, 0% 100%)`;
  } else if (direction === 'right-to-left') {
    clipPath = `polygon(${inv}% 0%, 100% 0%, 100% 100%, ${inv}% 100%)`;
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
      data-testid="chart-draw-effect"
      className={className}
      style={{
        position: isAbsolute ? 'absolute' : 'relative',
        left: x,
        top: y,
        width,
        height,
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
