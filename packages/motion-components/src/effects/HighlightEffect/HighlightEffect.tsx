import React from 'react';
import { HighlightEffectProps } from './HighlightEffect.types';
import { interpolate, easeOutExpo, easeInOutCubic } from './HighlightEffect.utils';

export const HighlightEffect: React.FC<HighlightEffectProps> = ({
  x,
  y,
  width = '100%',
  height = '100%',
  color = '#fbbf24', // default amber marker color
  opacity = 0.8,
  borderRadius = 8,
  strokeWidth = 4,
  durationInFrames = 90,
  delayInFrames = 0,
  enterDurationInFrames = 15,
  exitDurationInFrames = 15,
  animation = 'box',
  currentFrame = 0,
  style = {},
}) => {
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
  let currentOpacity = 0;
  let currentScale = 1;
  let markerWidthProgress = 1;

  if (phase === 'enter') {
    const rawProgress = interpolate(currentFrame, [delayInFrames, enterEndFrame], [0, 1], 'clamp');
    
    if (animation === 'marker') {
      const easedProgress = easeInOutCubic(rawProgress);
      markerWidthProgress = easedProgress;
      currentOpacity = interpolate(rawProgress, [0, 0.1], [0, opacity], 'clamp');
    } else {
      const easedProgress = easeOutExpo(rawProgress);
      currentOpacity = interpolate(easedProgress, [0, 1], [0, opacity], 'clamp');
      currentScale = interpolate(easedProgress, [0, 1], [0.96, 1], 'clamp');
    }
  } else if (phase === 'hold') {
    currentOpacity = opacity;
    currentScale = 1;
    markerWidthProgress = 1;
  } else if (phase === 'exit') {
    const rawProgress = interpolate(currentFrame, [exitStartFrame, endFrame], [0, 1], 'clamp');
    currentOpacity = interpolate(rawProgress, [0, 1], [opacity, 0], 'clamp');
    currentScale = interpolate(rawProgress, [0, 1], [1, 0.98], 'clamp');
    markerWidthProgress = 1;
  }

  // Hide before start
  if (currentFrame < delayInFrames) {
    currentOpacity = 0;
  }

  // Positioning
  const positionStyle: React.CSSProperties = {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: 50,
  };

  if (x !== undefined) positionStyle.left = x;
  if (y !== undefined) positionStyle.top = y;
  positionStyle.width = width;
  positionStyle.height = height;

  const renderContent = () => {
    switch (animation) {
      case 'box':
        return (
          <svg width="100%" height="100%" style={{ overflow: 'visible', opacity: currentOpacity, transform: `scale(${currentScale})` }}>
            <rect
              x={strokeWidth / 2}
              y={strokeWidth / 2}
              width={`calc(100% - ${strokeWidth}px)`}
              height={`calc(100% - ${strokeWidth}px)`}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              rx={borderRadius}
              ry={borderRadius}
            />
          </svg>
        );
      
      case 'glow':
        return (
          <div 
            style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius, 
              boxShadow: `0 0 24px 4px ${color}`,
              opacity: currentOpacity,
              transform: `scale(${currentScale})`,
            }} 
          />
        );

      case 'marker':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              opacity: currentOpacity,
              mixBlendMode: 'multiply',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div 
              style={{ 
                height: '100%', 
                width: `${markerWidthProgress * 100}%`,
                backgroundColor: color,
                borderRadius,
              }}
            />
          </div>
        );
    }
  };

  return (
    <div data-testid="highlight-effect" style={{ ...positionStyle, ...style }}>
      {renderContent()}
    </div>
  );
};
