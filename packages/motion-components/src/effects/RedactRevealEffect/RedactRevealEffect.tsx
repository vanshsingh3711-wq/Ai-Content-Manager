import React from 'react';
import { RedactRevealEffectProps } from './RedactRevealEffect.types';
import { interpolate, easeOutCubic, easeInOutCubic } from './RedactRevealEffect.utils';

export const RedactRevealEffect: React.FC<RedactRevealEffectProps> = ({
  children,
  x,
  y,
  width = '100%',
  height = '100%',
  direction = 'left-to-right',
  durationInFrames = 30,
  delayInFrames = 0,
  revealMode = 'mask',
  redactionColor = '#111827', // Tailwind gray-900
  redactionOpacity = 1,
  showRedactionBar = true,
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
    const rawProgress = interpolate(currentFrame, [delayInFrames, endFrame], [0, 1], 'clamp');
    if (easing === 'easeOut') {
      progress = easeOutCubic(rawProgress);
    } else if (easing === 'easeInOut') {
      progress = easeInOutCubic(rawProgress);
    } else {
      progress = rawProgress;
    }
  }

  const pct = progress * 100;
  const inv = 100 - pct;

  // Mask clipPath for the child
  let childClipPath = 'none';
  if (revealMode === 'mask') {
    if (direction === 'left-to-right') {
      childClipPath = `polygon(0% 0%, ${pct}% 0%, ${pct}% 100%, 0% 100%)`;
    } else if (direction === 'right-to-left') {
      childClipPath = `polygon(${inv}% 0%, 100% 0%, 100% 100%, ${inv}% 100%)`;
    } else if (direction === 'top-to-bottom') {
      childClipPath = `polygon(0% 0%, 100% 0%, 100% ${pct}%, 0% ${pct}%)`;
    } else if (direction === 'bottom-to-top') {
      childClipPath = `polygon(0% ${inv}%, 100% ${inv}%, 100% 100%, 0% 100%)`;
    }
  }

  // Redaction block position bounds
  const redactionStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: redactionColor,
    opacity: redactionOpacity,
    zIndex: 10,
    pointerEvents: 'none',
  };

  if (direction === 'left-to-right') {
    redactionStyle.left = `${pct}%`;
    redactionStyle.right = 0;
    redactionStyle.top = 0;
    redactionStyle.bottom = 0;
  } else if (direction === 'right-to-left') {
    redactionStyle.left = 0;
    redactionStyle.right = `${pct}%`;
    redactionStyle.top = 0;
    redactionStyle.bottom = 0;
  } else if (direction === 'top-to-bottom') {
    redactionStyle.top = `${pct}%`;
    redactionStyle.bottom = 0;
    redactionStyle.left = 0;
    redactionStyle.right = 0;
  } else if (direction === 'bottom-to-top') {
    redactionStyle.top = 0;
    redactionStyle.bottom = `${pct}%`;
    redactionStyle.left = 0;
    redactionStyle.right = 0;
  }

  const isAbsolute = x !== undefined || y !== undefined;
  
  // Hide redaction block entirely at the end
  const showRedaction = progress < 1;

  return (
    <div
      data-testid="redact-reveal-effect"
      className={className}
      style={{
        position: isAbsolute ? 'absolute' : 'relative',
        left: x,
        top: y,
        width,
        height,
        overflow: 'hidden', // constrain redaction
        ...style,
      }}
    >
      {/* CHILD */}
      <div 
        data-testid="redact-child-layer"
        style={{ 
          position: 'absolute', 
          inset: 0, 
          clipPath: childClipPath,
          WebkitClipPath: childClipPath !== 'none' ? childClipPath : undefined
        }}
      >
        {children}
      </div>

      {/* REDACTION LAYER */}
      {showRedaction && (
        <div data-testid="redact-layer" style={redactionStyle}>
          
          {/* REDACTION BAR BOUNDARY */}
          {showRedactionBar && progress > 0 && (
            <div
              style={{
                position: 'absolute',
                backgroundColor: 'white',
                boxShadow: '0 0 8px rgba(0,0,0,0.8)',
                ...(direction === 'left-to-right' ? { left: 0, top: 0, bottom: 0, width: 2 } : {}),
                ...(direction === 'right-to-left' ? { right: 0, top: 0, bottom: 0, width: 2 } : {}),
                ...(direction === 'top-to-bottom' ? { top: 0, left: 0, right: 0, height: 2 } : {}),
                ...(direction === 'bottom-to-top' ? { bottom: 0, left: 0, right: 0, height: 2 } : {}),
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
