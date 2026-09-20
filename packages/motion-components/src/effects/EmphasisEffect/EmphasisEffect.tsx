import React from 'react';
import { EmphasisEffectProps } from './EmphasisEffect.types';
import { interpolate, easeOutCubic, easeInOutCubic, hexToRgba } from './EmphasisEffect.utils';

export const EmphasisEffect: React.FC<EmphasisEffectProps> = ({
  children,
  x,
  y,
  scaleFrom = 1.0,
  scalePeak = 1.08,
  scaleTo = 1.0,
  opacityFrom = 1.0,
  opacityPeak = 1.0,
  opacityTo = 1.0,
  rotationFrom = 0,
  rotationPeak = 0,
  rotationTo = 0,
  glow = false,
  glowColor = '#3b82f6',
  glowOpacity = 0.5,
  glowRadius = 20,
  durationInFrames = 30,
  delayInFrames = 0,
  easing = 'easeInOut',
  currentFrame = 0,
  className = '',
  style = {},
}) => {
  const endFrame = delayInFrames + durationInFrames;

  let progress = 0;
  if (currentFrame >= endFrame) {
    progress = 1;
  } else if (currentFrame > delayInFrames) {
    progress = interpolate(currentFrame, [delayInFrames, endFrame], [0, 1], 'clamp');
  }

  let phaseProgress = 0;
  let isFirstHalf = true;

  if (progress < 0.5) {
    phaseProgress = interpolate(progress, [0, 0.5], [0, 1], 'clamp');
  } else {
    phaseProgress = interpolate(progress, [0.5, 1], [0, 1], 'clamp');
    isFirstHalf = false;
  }

  // Apply easing to each half of the pulse
  if (easing === 'easeOut') {
    phaseProgress = easeOutCubic(phaseProgress);
  } else if (easing === 'easeInOut') {
    phaseProgress = easeInOutCubic(phaseProgress);
  }

  // State calculations
  let currentScale = scaleTo;
  let currentOpacity = opacityTo;
  let currentRotation = rotationTo;
  let currentGlowRadius = 0;

  if (currentFrame >= delayInFrames && currentFrame <= endFrame) {
    if (isFirstHalf) {
      currentScale = interpolate(phaseProgress, [0, 1], [scaleFrom, scalePeak]);
      currentOpacity = interpolate(phaseProgress, [0, 1], [opacityFrom, opacityPeak]);
      currentRotation = interpolate(phaseProgress, [0, 1], [rotationFrom, rotationPeak]);
      currentGlowRadius = interpolate(phaseProgress, [0, 1], [0, glowRadius]);
    } else {
      currentScale = interpolate(phaseProgress, [0, 1], [scalePeak, scaleTo]);
      currentOpacity = interpolate(phaseProgress, [0, 1], [opacityPeak, opacityTo]);
      currentRotation = interpolate(phaseProgress, [0, 1], [rotationPeak, rotationTo]);
      currentGlowRadius = interpolate(phaseProgress, [0, 1], [glowRadius, 0]);
    }
  } else if (currentFrame < delayInFrames) {
    currentScale = scaleFrom;
    currentOpacity = opacityFrom;
    currentRotation = rotationFrom;
    currentGlowRadius = 0;
  }

  // Positioning
  const isAbsolute = x !== undefined || y !== undefined;

  let filter = 'none';
  if (glow && currentGlowRadius > 0) {
    const rgba = hexToRgba(glowColor, glowOpacity);
    filter = `drop-shadow(0px 0px ${currentGlowRadius}px ${rgba})`;
  }
  
  return (
    <div
      data-testid="emphasis-effect"
      className={className}
      style={{
        position: isAbsolute ? 'absolute' : 'relative',
        left: x,
        top: y,
        opacity: currentOpacity,
        transform: `scale(${currentScale}) rotate(${currentRotation}deg)`,
        transformOrigin: 'center center',
        filter,
        willChange: 'transform, filter, opacity',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
