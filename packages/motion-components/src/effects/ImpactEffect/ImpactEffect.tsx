import React from 'react';
import { ImpactEffectProps } from './ImpactEffect.types';
import { interpolate, easeOutCubic, easeInOutCubic } from './ImpactEffect.utils';

export const ImpactEffect: React.FC<ImpactEffectProps> = ({
  children,
  x,
  y,
  scaleFrom = 0.92,
  scalePeak = 1.08,
  scaleTo = 1.00,
  opacityFrom = 0,
  opacityPeak = 1,
  opacityTo = 1,
  blurFrom,
  blurPeak,
  blurTo,
  shake = false,
  shakeAmount = 10,
  glow = false,
  glowColor = '#3b82f6',
  glowRadius = 20,
  durationInFrames = 20,
  delayInFrames = 0,
  easing = 'easeOut',
  currentFrame = 0,
  className = '',
  style = {},
}) => {
  const endFrame = delayInFrames + durationInFrames;
  const peakFraction = 0.3; // Impact happens at 30% of the timeline
  const peakFrame = delayInFrames + durationInFrames * peakFraction;

  let timelineProgress = 0;
  if (currentFrame >= endFrame) {
    timelineProgress = 1;
  } else if (currentFrame > delayInFrames) {
    const rawProgress = (currentFrame - delayInFrames) / durationInFrames;
    if (easing === 'easeOut') {
      timelineProgress = easeOutCubic(rawProgress);
    } else if (easing === 'easeInOut') {
      timelineProgress = easeInOutCubic(rawProgress);
    } else {
      timelineProgress = rawProgress;
    }
  }

  // 1. Scale
  let currentScale = scaleTo;
  if (currentFrame < delayInFrames) {
    currentScale = scaleFrom;
  } else if (currentFrame <= endFrame) {
    // Map timeline progress [0, 1] to [0, peakFraction, 1]
    currentScale = interpolate(
      timelineProgress,
      [0, peakFraction, 1],
      [scaleFrom, scalePeak, scaleTo],
      'clamp'
    );
  }

  // 2. Opacity
  let currentOpacity = opacityTo;
  if (currentFrame < delayInFrames) {
    currentOpacity = opacityFrom;
  } else if (currentFrame <= endFrame) {
    currentOpacity = interpolate(
      timelineProgress,
      [0, peakFraction, 1],
      [opacityFrom, opacityPeak, opacityTo],
      'clamp'
    );
  }

  // 3. Blur
  let currentBlur = 0;
  if (blurFrom !== undefined && blurPeak !== undefined && blurTo !== undefined) {
    if (currentFrame < delayInFrames) {
      currentBlur = blurFrom;
    } else if (currentFrame <= endFrame) {
      currentBlur = Math.max(0, interpolate(
        timelineProgress,
        [0, peakFraction, 1],
        [blurFrom, blurPeak, blurTo],
        'clamp'
      ));
    } else {
      currentBlur = blurTo;
    }
  }

  // 4. Glow
  let currentGlow = 0;
  if (glow) {
    if (currentFrame > delayInFrames && currentFrame <= endFrame) {
      currentGlow = Math.max(0, interpolate(
        timelineProgress,
        [0, peakFraction, 1],
        [0, glowRadius, 0],
        'clamp'
      ));
    }
  }

  // 5. Deterministic Shake (Damped Sine Wave)
  let translateX = 0;
  let translateY = 0;
  if (shake && currentFrame > delayInFrames && currentFrame < endFrame) {
    // Math.sin(progress * Math.PI * periods) * (1 - progress) * amplitude
    translateX = Math.sin(timelineProgress * Math.PI * 6) * (1 - timelineProgress) * shakeAmount;
    translateY = Math.sin(timelineProgress * Math.PI * 5) * (1 - timelineProgress) * shakeAmount * 0.5;
  }

  // Compile filters
  const filters: string[] = [];
  if (currentBlur > 0) {
    filters.push(`blur(${currentBlur}px)`);
  }
  if (currentGlow > 0) {
    filters.push(`drop-shadow(0px 0px ${currentGlow}px ${glowColor})`);
  }

  const isAbsolute = x !== undefined || y !== undefined;

  return (
    <div
      data-testid="impact-effect"
      className={className}
      style={{
        position: isAbsolute ? 'absolute' : 'relative',
        left: x,
        top: y,
        opacity: currentOpacity,
        transform: `scale(${currentScale}) translate(${translateX}px, ${translateY}px)`,
        filter: filters.length > 0 ? filters.join(' ') : 'none',
        display: 'inline-flex', // keeps wrappers tightly fit around content for scaling
        ...style,
      }}
    >
      {children}
    </div>
  );
};
