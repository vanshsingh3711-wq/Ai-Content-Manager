import React, { useId } from 'react';
import { FocusEffectProps } from './FocusEffect.types';
import { interpolate, easeOutExpo } from './FocusEffect.utils';

export const FocusEffect: React.FC<FocusEffectProps> = ({
  x,
  y,
  width,
  height,
  overlayColor = '#000000',
  overlayOpacity = 0.65,
  borderRadius = 12,
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

  // Timeline math
  const enterEndFrame = delayInFrames + enterDurationInFrames;
  const exitStartFrame = delayInFrames + durationInFrames - exitDurationInFrames;
  const endFrame = delayInFrames + durationInFrames;

  // Determine current phase
  let phase: 'hidden' | 'enter' | 'hold' | 'exit' = 'hidden';
  if (currentFrame >= endFrame) phase = 'hidden';
  else if (currentFrame >= exitStartFrame) phase = 'exit';
  else if (currentFrame >= enterEndFrame) phase = 'hold';
  else if (currentFrame >= delayInFrames) phase = 'enter';

  if (phase === 'hidden' && currentFrame >= endFrame) {
    return null; // Don't render after effect completes
  }

  // Animation values
  let currentOverlayOpacity = 0;
  let currentScale = 1;

  if (phase === 'enter') {
    const rawProgress = interpolate(currentFrame, [delayInFrames, enterEndFrame], [0, 1], 'clamp');
    const easedProgress = easeOutExpo(rawProgress);
    
    currentOverlayOpacity = interpolate(easedProgress, [0, 1], [0, overlayOpacity], 'clamp');
    
    if (animation === 'zoom') {
      currentScale = interpolate(easedProgress, [0, 1], [0.96, 1], 'clamp');
    }
  } else if (phase === 'hold') {
    currentOverlayOpacity = overlayOpacity;
    currentScale = 1;
  } else if (phase === 'exit') {
    const rawProgress = interpolate(currentFrame, [exitStartFrame, endFrame], [0, 1], 'clamp');
    currentOverlayOpacity = interpolate(rawProgress, [0, 1], [overlayOpacity, 0], 'clamp');
    
    if (animation === 'zoom') {
      currentScale = interpolate(rawProgress, [0, 1], [1, 0.98], 'clamp');
    }
  }

  // Hide before start
  if (currentFrame < delayInFrames) {
    currentOverlayOpacity = 0;
  }

  const cx = x + width / 2;
  const cy = y + height / 2;
  const transform = `scale(${currentScale})`;

  return (
    <div 
      data-testid="focus-effect" 
      style={{ 
        position: 'absolute', 
        inset: 0, 
        pointerEvents: 'none', 
        zIndex: 50,
        ...style 
      }}
    >
      <svg width="100%" height="100%">
        <defs>
          <mask id={maskId}>
            {/* White background means 'show overlay' */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black rectangle means 'hide overlay (create cutout)' */}
            <rect 
              x={x} 
              y={y} 
              width={width} 
              height={height} 
              fill="black" 
              rx={borderRadius} 
              ry={borderRadius}
              style={{
                transformOrigin: `${cx}px ${cy}px`,
                transform,
              }}
            />
          </mask>
        </defs>

        {/* The dimming overlay */}
        <rect 
          x="0" 
          y="0" 
          width="100%" 
          height="100%" 
          fill={overlayColor} 
          mask={`url(#${maskId})`} 
          opacity={currentOverlayOpacity} 
          data-testid="focus-overlay"
        />

        {/* Optional Subtle Glow around the cutout */}
        {glow && (
          <rect 
            x={x} 
            y={y} 
            width={width} 
            height={height} 
            fill="none" 
            stroke={glowColor}
            strokeWidth={4}
            rx={borderRadius}
            ry={borderRadius}
            opacity={currentOverlayOpacity * (glowOpacity / overlayOpacity)}
            style={{
              transformOrigin: `${cx}px ${cy}px`,
              transform,
              filter: 'blur(8px)',
            }}
            data-testid="focus-glow"
          />
        )}
      </svg>
    </div>
  );
};
