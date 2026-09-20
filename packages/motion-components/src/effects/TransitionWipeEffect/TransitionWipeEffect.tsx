import React from 'react';
import { TransitionWipeEffectProps } from './TransitionWipeEffect.types';
import { interpolate, easeOutCubic, easeInOutCubic } from './TransitionWipeEffect.utils';

function getClipPathStripe(direction: string, pStart: number, pEnd: number) {
  // CSS clip-path safely supports values outside 0-100%
  if (direction === 'right') {
    return `polygon(${pStart}% 0%, ${pEnd}% 0%, ${pEnd}% 100%, ${pStart}% 100%)`;
  }
  if (direction === 'left') {
    return `polygon(${100 - pEnd}% 0%, ${100 - pStart}% 0%, ${100 - pStart}% 100%, ${100 - pEnd}% 100%)`;
  }
  if (direction === 'bottom') {
    return `polygon(0% ${pStart}%, 100% ${pStart}%, 100% ${pEnd}%, 0% ${pEnd}%)`;
  }
  if (direction === 'top') {
    return `polygon(0% ${100 - pEnd}%, 100% ${100 - pEnd}%, 100% ${100 - pStart}%, 0% ${100 - pStart}%)`;
  }
  return '';
}

export const TransitionWipeEffect: React.FC<TransitionWipeEffectProps> = ({
  from,
  to,
  width = '100%',
  height = '100%',
  x,
  y,
  direction = 'left',
  durationInFrames = 30,
  delayInFrames = 0,
  color = '#3b82f6',
  colorOpacity = 1,
  style = 'reveal',
  easing = 'easeInOut',
  currentFrame = 0,
  className = '',
  containerStyle = {},
}) => {
  const endFrame = delayInFrames + durationInFrames;

  let timelineProgress = 0;
  if (currentFrame >= endFrame) {
    timelineProgress = 1;
  } else if (currentFrame > delayInFrames) {
    const rawProgress = interpolate(currentFrame, [delayInFrames, endFrame], [0, 1], 'clamp');
    if (easing === 'easeOut') {
      timelineProgress = easeOutCubic(rawProgress);
    } else if (easing === 'easeInOut') {
      timelineProgress = easeInOutCubic(rawProgress);
    } else {
      timelineProgress = rawProgress;
    }
  }

  // Calculate wipe geometry based on style
  let pA = 0; // Trailing edge (controls Scene B reveal)
  let pB = 0; // Leading edge (controls Solid Wipe layer)

  if (style === 'solid') {
    // Solid layer thickness is 20%
    const thickness = 20;
    // Sweep the leading edge from 0 to 100 + thickness
    pB = interpolate(timelineProgress, [0, 1], [0, 100 + thickness], 'clamp');
    // Trailing edge follows behind
    pA = interpolate(timelineProgress, [0, 1], [-thickness, 100], 'clamp');
  } else {
    // Pure reveal
    pA = interpolate(timelineProgress, [0, 1], [0, 100], 'clamp');
    pB = pA; // No thickness
  }

  // Create clip paths
  // Scene B is revealed from 0 up to pA
  const sceneBClipPath = getClipPathStripe(direction, 0, pA);
  
  // Solid Layer is rendered from pA to pB
  const solidLayerClipPath = getClipPathStripe(direction, pA, pB);

  const isAbsolute = x !== undefined || y !== undefined;

  return (
    <div
      data-testid="transition-wipe-effect"
      className={className}
      style={{
        position: isAbsolute ? 'absolute' : 'relative',
        left: x,
        top: y,
        width,
        height,
        overflow: 'hidden',
        ...containerStyle,
      }}
    >
      {/* Scene A: Base Layer */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {from}
      </div>

      {/* Scene B: Revealed Layer */}
      <div 
        data-testid="transition-scene-b"
        style={{ 
          position: 'absolute', 
          inset: 0,
          clipPath: sceneBClipPath,
          WebkitClipPath: sceneBClipPath,
        }}
      >
        {to}
      </div>

      {/* Solid Wipe Layer */}
      {style === 'solid' && timelineProgress > 0 && timelineProgress < 1 && (
        <div 
          data-testid="transition-solid-layer"
          style={{ 
            position: 'absolute', 
            inset: 0,
            backgroundColor: color,
            opacity: colorOpacity,
            clipPath: solidLayerClipPath,
            WebkitClipPath: solidLayerClipPath,
          }}
        />
      )}
    </div>
  );
};
