import React from 'react';
import { BeforeAfterEffectProps } from './BeforeAfterEffect.types';
import { interpolate, easeOutCubic, easeInOutCubic } from './BeforeAfterEffect.utils';

export const BeforeAfterEffect: React.FC<BeforeAfterEffectProps> = ({
  before,
  after,
  width = '100%',
  height = '100%',
  x,
  y,
  direction = 'horizontal',
  revealProgress,
  durationInFrames = 45,
  delayInFrames = 0,
  labelBefore = 'Before',
  labelAfter = 'After',
  showDivider = true,
  dividerWidth = 2,
  showLabels = false,
  labelOpacity = 1,
  easing = 'easeInOut',
  currentFrame = 0,
  className = '',
  style = {},
}) => {
  const endFrame = delayInFrames + durationInFrames;

  let progress = 0;

  if (revealProgress !== undefined) {
    progress = Math.max(0, Math.min(1, revealProgress));
  } else {
    if (currentFrame >= endFrame) {
      progress = 1;
    } else if (currentFrame > delayInFrames) {
      const rawProgress = interpolate(currentFrame, [delayInFrames, endFrame], [0, 1], 'clamp');
      if (easing === 'easeOut') {
        progress = easeOutCubic(rawProgress);
      } else if (easing === 'easeInOut') {
        progress = easeInOutCubic(rawProgress);
      } else {
        progress = rawProgress;
      }
    }
  }

  const percent = progress * 100;

  // Clip Path for the `after` element
  let clipPath = '';
  if (direction === 'horizontal') {
    clipPath = `polygon(0% 0%, ${percent}% 0%, ${percent}% 100%, 0% 100%)`;
  } else {
    clipPath = `polygon(0% 0%, 100% 0%, 100% ${percent}%, 0% ${percent}%)`;
  }

  const isAbsolute = x !== undefined || y !== undefined;

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    opacity: labelOpacity,
    zIndex: 10,
    pointerEvents: 'none',
  };

  return (
    <div
      data-testid="before-after-effect"
      className={className}
      style={{
        position: isAbsolute ? 'absolute' : 'relative',
        left: x,
        top: y,
        width,
        height,
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* BEFORE LAYER */}
      <div style={{ position: 'absolute', inset: 0 }} data-testid="before-layer">
        {before}
      </div>

      {/* AFTER LAYER */}
      <div 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          clipPath,
          // Fallback for older browsers
          WebkitClipPath: clipPath 
        }} 
        data-testid="after-layer"
      >
        {after}
      </div>

      {/* DIVIDER */}
      {showDivider && progress > 0 && progress < 1 && (
        <div
          data-testid="before-after-divider"
          style={{
            position: 'absolute',
            backgroundColor: 'white',
            boxShadow: '0 0 10px rgba(0,0,0,0.5)',
            zIndex: 5,
            pointerEvents: 'none',
            ...(direction === 'horizontal'
              ? {
                  left: `${percent}%`,
                  top: 0,
                  bottom: 0,
                  width: dividerWidth,
                  transform: 'translateX(-50%)',
                }
              : {
                  top: `${percent}%`,
                  left: 0,
                  right: 0,
                  height: dividerWidth,
                  transform: 'translateY(-50%)',
                }),
          }}
        />
      )}

      {/* LABELS */}
      {showLabels && (
        <>
          <div
            style={{
              ...labelStyle,
              ...(direction === 'horizontal'
                ? { bottom: 12, left: 12 }
                : { top: 12, left: 12 }),
            }}
          >
            {labelBefore}
          </div>
          <div
            style={{
              ...labelStyle,
              ...(direction === 'horizontal'
                ? { bottom: 12, right: 12 }
                : { bottom: 12, left: 12 }),
            }}
          >
            {labelAfter}
          </div>
        </>
      )}
    </div>
  );
};
