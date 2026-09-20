import React from 'react';
import { ZoomEffectProps } from './ZoomEffect.types';
import { interpolate, getEasingFunction } from './ZoomEffect.utils';

export const ZoomEffect: React.FC<ZoomEffectProps> = ({
  centerX,
  centerY,
  viewportWidth = 1080,
  viewportHeight = 1920,
  fromScale = 1.0,
  toScale = 1.15,
  durationInFrames = 60,
  delayInFrames = 0,
  easing = 'easeInOut',
  mode = 'in',
  currentFrame = 0,
  children,
  style = {},
}) => {
  const ease = getEasingFunction(easing);
  
  const endFrame = delayInFrames + durationInFrames;
  
  // Calculate normalized progress
  let progress = 0;
  
  if (currentFrame >= delayInFrames) {
    if (currentFrame >= endFrame) {
      progress = 1;
    } else {
      const rawProgress = interpolate(currentFrame, [delayInFrames, endFrame], [0, 1], 'clamp');
      progress = ease(rawProgress);
    }
  }

  // Adjust progress based on mode
  if (mode === 'out') {
    // Starts at 1, goes to 0
    progress = 1 - progress;
  } else if (mode === 'in-out') {
    // 0 -> 1 -> 0
    if (currentFrame < delayInFrames) {
      progress = 0;
    } else if (currentFrame >= endFrame) {
      progress = 0;
    } else {
      const halfDuration = durationInFrames / 2;
      const midFrame = delayInFrames + halfDuration;
      
      if (currentFrame <= midFrame) {
        const rawProgress = interpolate(currentFrame, [delayInFrames, midFrame], [0, 1], 'clamp');
        progress = ease(rawProgress);
      } else {
        const rawProgress = interpolate(currentFrame, [midFrame, endFrame], [1, 0], 'clamp');
        // We apply easing to the reverse as well for symmetry
        progress = ease(rawProgress);
      }
    }
  }

  // Camera math
  // At progress = 0, camera is at the center of the viewport
  // At progress = 1, camera is at the focal point (centerX, centerY)
  const defaultCamX = viewportWidth / 2;
  const defaultCamY = viewportHeight / 2;

  const camX = interpolate(progress, [0, 1], [defaultCamX, centerX], 'extend');
  const camY = interpolate(progress, [0, 1], [defaultCamY, centerY], 'extend');
  const currentScale = interpolate(progress, [0, 1], [fromScale, toScale], 'extend');

  // We want to translate the camera position to the center of the viewport
  const transform = `translate(${viewportWidth / 2}px, ${viewportHeight / 2}px) scale(${currentScale}) translate(${-camX}px, ${-camY}px)`;

  return (
    <div 
      data-testid="zoom-effect-container"
      style={{
        width: viewportWidth,
        height: viewportHeight,
        overflow: 'hidden',
        position: 'relative',
        ...style
      }}
    >
      <div
        data-testid="zoom-effect-scene"
        style={{
          width: '100%',
          height: '100%',
          transformOrigin: '0 0',
          transform,
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
};
