import React from 'react';
import { MoveProps } from './Move.types';
import { interpolate, getEasingFunction } from '../utils/math';

export const Move: React.FC<MoveProps> = ({
  from,
  to,
  delayInFrames = 0,
  durationInFrames = 30,
  easing = 'easeInOut',
  currentFrame,
  children,
  style = {},
  testId = 'move-animation-wrapper',
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

  const currentX = interpolate(progress, [0, 1], [from.x, to.x], 'clamp');
  const currentY = interpolate(progress, [0, 1], [from.y, to.y], 'clamp');

  return (
    <div
      data-testid={testId}
      style={{
        ...style,
        transform: `translate(${currentX}px, ${currentY}px)`,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
};
