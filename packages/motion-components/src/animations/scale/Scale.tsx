import React from 'react';
import { ScaleProps } from './Scale.types';
import { interpolate, getEasingFunction } from '../utils/math';

export const Scale: React.FC<ScaleProps> = ({
  from,
  to,
  delayInFrames = 0,
  durationInFrames = 30,
  easing = 'easeInOut',
  currentFrame,
  children,
  style = {},
  testId = 'scale-animation-wrapper',
}) => {
  const ease = getEasingFunction(easing);
  const endFrame = delayInFrames + durationInFrames;

  let progress = 0;

  if (currentFrame >= delayInFrames) {
    if (currentFrame >= endFrame) {
      progress = 1;
    } else {
      const rawProgress = interpolate(currentFrame, [delayInFrames, endFrame], [0, 1], 'clamp');
      progress = ease(rawProgress);
    }
  }

  const currentScale = interpolate(progress, [0, 1], [from, to], 'clamp');

  return (
    <div
      data-testid={testId}
      style={{
        ...style,
        transform: `scale(${currentScale})`,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
};
