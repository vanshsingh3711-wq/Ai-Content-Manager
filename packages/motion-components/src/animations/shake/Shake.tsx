import React from 'react';
import { ShakeProps } from './Shake.types';
import { interpolate, easeShake } from '../utils/math';

export const Shake: React.FC<ShakeProps> = ({
  axis = 'x',
  amplitude = 10,
  frequency = 4,
  delayInFrames = 0,
  durationInFrames = 30,
  currentFrame,
  children,
  style = {},
  testId = 'shake-animation-wrapper',
}) => {
  const endFrame = delayInFrames + durationInFrames;

  let progress = 0;

  if (currentFrame >= delayInFrames) {
    if (currentFrame >= endFrame) {
      progress = 1;
    } else {
      progress = interpolate(currentFrame, [delayInFrames, endFrame], [0, 1], 'clamp');
    }
  }

  // Calculate the shake offsets based on progress
  const offsetX = axis === 'x' || axis === 'both' ? easeShake(progress, frequency, 0) * amplitude : 0;
  // For 'both', we add a phase offset to Y so it doesn't just shake perfectly diagonally
  const offsetY = axis === 'y' || axis === 'both' ? easeShake(progress, frequency, axis === 'both' ? Math.PI / 2 : 0) * amplitude : 0;

  let transformString = `translate(${offsetX}px, ${offsetY}px)`;
  if (offsetX === 0 && offsetY === 0) {
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
