import React from 'react';
import { ParallaxProps } from './Parallax.types';
import { interpolate, getEasingFunction } from '../utils/math';

export const Parallax: React.FC<ParallaxProps> = ({
  depth = 1,
  intensity = 1,
  axis = 'both',
  from = { x: 0, y: 0 },
  to = { x: 0, y: 0 },
  delayInFrames = 0,
  durationInFrames = 30,
  easing = 'linear',
  currentFrame,
  children,
  style = {},
  testId = 'parallax-animation-wrapper',
}) => {
  const ease = getEasingFunction(easing);
  const endFrame = delayInFrames + durationInFrames;

  let progress = 0;

  if (currentFrame >= delayInFrames) {
    if (currentFrame >= endFrame || durationInFrames === 0) {
      progress = 1;
    } else {
      const rawProgress = interpolate(currentFrame, [delayInFrames, endFrame], [0, 1], 'clamp');
      progress = ease(rawProgress);
    }
  }

  // Calculate base movement based on from/to
  const startX = from?.x || 0;
  const startY = from?.y || 0;
  const endX = to?.x || 0;
  const endY = to?.y || 0;

  // Calculate raw interpolated distance
  const currentRawX = interpolate(progress, [0, 1], [startX, endX]);
  const currentRawY = interpolate(progress, [0, 1], [startY, endY]);

  // Apply parallax depth and intensity multiplier
  const multiplier = depth * intensity;
  const offsetX = currentRawX * multiplier;
  const offsetY = currentRawY * multiplier;

  // Filter based on axis
  const finalX = axis === 'x' || axis === 'both' ? offsetX : 0;
  const finalY = axis === 'y' || axis === 'both' ? offsetY : 0;

  let transformString = `translate(${finalX}px, ${finalY}px)`;
  if (finalX === 0 && finalY === 0) {
    transformString = ''; // no transform if no offset
  }

  return (
    <div
      data-testid={testId}
      style={{
        ...style,
        ...(transformString ? { transform: transformString } : {}),
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
};
