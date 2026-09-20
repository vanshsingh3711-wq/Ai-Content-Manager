import React, { useId } from 'react';
import { SpotlightEffectProps } from './SpotlightEffect.types';
import { interpolate, easeOutCubic, easeInOutCubic } from './SpotlightEffect.utils';

export const SpotlightEffect: React.FC<SpotlightEffectProps> = ({
  x,
  y,
  toX,
  toY,
  radius,
  radiusX,
  radiusY,
  overlayColor = '#000000',
  overlayOpacity = 0.65,
  feather = 50,
  glow = false,
  glowColor = '#ffffff',
  glowOpacity = 0.3,
  durationInFrames = 90,
  delayInFrames = 0,
  enterDurationInFrames = 20,
  exitDurationInFrames = 20,
  animation = 'fade',
  currentFrame = 0,
  style = {},
}) => {
  const maskId = useId();
  const gradId = useId();

  const enterEndFrame = delayInFrames + enterDurationInFrames;
  const exitStartFrame = delayInFrames + durationInFrames - exitDurationInFrames;
  const endFrame = delayInFrames + durationInFrames;

  let phase: 'hidden' | 'enter' | 'hold' | 'exit' = 'hidden';
  if (currentFrame >= endFrame) phase = 'hidden';
  else if (currentFrame >= exitStartFrame) phase = 'exit';
  else if (currentFrame >= enterEndFrame) phase = 'hold';
  else if (currentFrame >= delayInFrames) phase = 'enter';

  if (phase === 'hidden' && currentFrame >= endFrame) {
    return null;
  }

  let currentOpacity = 0;
  let scaleModifier = 1;

  if (phase === 'enter') {
    const rawProgress = interpolate(currentFrame, [delayInFrames, enterEndFrame], [0, 1], 'clamp');
    const easedProgress = easeOutCubic(rawProgress);

    if (animation === 'fade') {
      currentOpacity = interpolate(easedProgress, [0, 1], [0, overlayOpacity]);
    } else if (animation === 'expand') {
      currentOpacity = interpolate(easedProgress, [0, 1], [0, overlayOpacity]);
      scaleModifier = interpolate(easedProgress, [0, 1], [0.01, 1]);
    } else if (animation === 'contract') {
      currentOpacity = interpolate(easedProgress, [0, 1], [0, overlayOpacity]);
      scaleModifier = interpolate(easedProgress, [0, 1], [3, 1]);
    }
  } else if (phase === 'hold') {
    currentOpacity = overlayOpacity;
    scaleModifier = 1;
  } else if (phase === 'exit') {
    const rawProgress = interpolate(currentFrame, [exitStartFrame, endFrame], [0, 1], 'clamp');
    currentOpacity = interpolate(rawProgress, [0, 1], [overlayOpacity, 0]);
    if (animation === 'expand') {
      scaleModifier = interpolate(rawProgress, [0, 1], [1, 0.01]);
    } else if (animation === 'contract') {
      scaleModifier = interpolate(rawProgress, [0, 1], [1, 3]);
    }
  }

  // Calculate position movement
  let cx = x;
  let cy = y;

  if (toX !== undefined && toY !== undefined) {
    const holdProgress = interpolate(currentFrame, [enterEndFrame, exitStartFrame], [0, 1], 'clamp');
    const easedHold = easeInOutCubic(holdProgress);
    cx = interpolate(easedHold, [0, 1], [x, toX]);
    cy = interpolate(easedHold, [0, 1], [y, toY]);
  }

  const effectiveRadiusX = (radiusX ?? radius ?? 100) * scaleModifier;
  const effectiveRadiusY = (radiusY ?? radius ?? 100) * scaleModifier;

  // Safe guard feather range
  const safeFeather = Math.max(0, Math.min(100, feather));
  const innerStop = Math.max(0, 100 - safeFeather);

  return (
    <div
      data-testid="spotlight-effect"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
        ...style,
      }}
    >
      <svg width="100%" height="100%">
        <defs>
          <radialGradient id={gradId}>
            <stop offset={`${innerStop}%`} stopColor="black" />
            <stop offset="100%" stopColor="white" />
          </radialGradient>

          <mask id={maskId}>
            {/* White background: fully show the overlay */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            
            {/* Cutout: black = punch hole, white = no hole */}
            <ellipse
              cx={cx}
              cy={cy}
              rx={effectiveRadiusX}
              ry={effectiveRadiusY}
              fill={`url(#${gradId})`}
            />
          </mask>
        </defs>

        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={overlayColor}
          mask={`url(#${maskId})`}
          opacity={currentOpacity}
          data-testid="spotlight-overlay"
        />

        {glow && (
          <ellipse
            cx={cx}
            cy={cy}
            rx={effectiveRadiusX}
            ry={effectiveRadiusY}
            fill="none"
            stroke={glowColor}
            strokeWidth={4}
            opacity={currentOpacity * (glowOpacity / overlayOpacity)}
            style={{
              filter: 'blur(12px)',
            }}
            data-testid="spotlight-glow"
          />
        )}
      </svg>
    </div>
  );
};
