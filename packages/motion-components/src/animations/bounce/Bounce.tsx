import React from 'react';
import { BounceProps } from './Bounce.types';
import { interpolate, easeSpring } from '../utils/math';

export const Bounce: React.FC<BounceProps> = ({
  property = 'scale',
  from = 0,
  to = 1,
  delayInFrames = 0,
  durationInFrames = 45, // default to slightly longer duration for bounce settling
  intensity = 0.15,
  bounces = 2,
  currentFrame,
  children,
  style = {},
  testId = 'bounce-animation-wrapper',
}) => {
  const endFrame = delayInFrames + durationInFrames;

  let progress = 0;

  if (currentFrame >= delayInFrames) {
    if (currentFrame >= endFrame) {
      progress = 1;
    } else {
      const rawProgress = interpolate(currentFrame, [delayInFrames, endFrame], [0, 1], 'clamp');
      progress = easeSpring(rawProgress, intensity, bounces);
    }
  }

  // We don't clamp this interpolation because the bounce needs to overshoot
  // (e.g. progress can exceed 1 or dip below 0 depending on the math)
  const currentValue = interpolate(progress, [0, 1], [from, to], 'extend');

  let transformString = '';
  switch (property) {
    case 'scale':
      transformString = `scale(${currentValue})`;
      break;
    case 'x':
      transformString = `translateX(${currentValue}px)`;
      break;
    case 'y':
      transformString = `translateY(${currentValue}px)`;
      break;
    case 'rotate':
      transformString = `rotate(${currentValue}deg)`;
      break;
  }

  return (
    <div
      data-testid={testId}
      style={{
        ...style,
        transform: transformString,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
};
