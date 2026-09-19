import React from 'react';
import { PhoneTapProps } from './PhoneTap.types';
import { interpolate } from './PhoneTap.utils';

export const PhoneTap: React.FC<PhoneTapProps> = ({
  x,
  y,
  size = 48,
  animation = {},
  currentFrame = 0,
  fps = 30, // For API consistency
  style = {},
}) => {
  const {
    type = 'tap',
    durationInFrames = 30,
    delayInFrames = 0,
  } = animation;

  const {
    color = 'rgba(59, 130, 246, 0.4)', // blue-500 with opacity
    opacity = 1,
  } = style;

  const startFrame = delayInFrames;
  const endFrame = delayInFrames + durationInFrames;
  const midFrame = startFrame + Math.floor(durationInFrames / 2);

  let renderScale = 1;
  let renderOpacity = opacity;
  let renderTranslateX = x;
  let renderTranslateY = y;

  if (currentFrame < startFrame || currentFrame > endFrame) {
    renderOpacity = 0;
  } else {
    if (type === 'ripple') {
      // Ripple: starts small, expands and fades out
      renderScale = interpolate(currentFrame, [startFrame, endFrame], [0.2, 2]);
      renderOpacity = interpolate(currentFrame, [startFrame, endFrame], [opacity, 0]);
    } else if (type === 'tap') {
      // Tap: Compress down briefly then ripple out
      if (currentFrame < midFrame) {
        // Pressing down
        renderScale = interpolate(currentFrame, [startFrame, midFrame], [1.2, 0.5]);
        renderOpacity = interpolate(currentFrame, [startFrame, midFrame], [0, opacity]);
      } else {
        // Releasing and rippling
        renderScale = interpolate(currentFrame, [midFrame, endFrame], [0.5, 2]);
        renderOpacity = interpolate(currentFrame, [midFrame, endFrame], [opacity, 0]);
      }
    } else if (type === 'pointer') {
      // Pointer: cursor moves in, taps, and leaves
      if (currentFrame < midFrame) {
        // Move in
        renderTranslateX = interpolate(currentFrame, [startFrame, midFrame], [x + 50, x]);
        renderTranslateY = interpolate(currentFrame, [startFrame, midFrame], [y + 50, y]);
        renderScale = interpolate(currentFrame, [startFrame, midFrame], [1.5, 1]);
        renderOpacity = interpolate(currentFrame, [startFrame, midFrame], [0, opacity]);
      } else {
        // Tap and fade out
        renderTranslateX = x;
        renderTranslateY = y;
        renderScale = interpolate(currentFrame, [midFrame, midFrame + 5, endFrame], [1, 0.8, 1]);
        renderOpacity = interpolate(currentFrame, [midFrame + 10, endFrame], [opacity, 0]);
      }
    }
  }

  return (
    <div
      data-testid="phone-tap"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: size,
        height: size,
        backgroundColor: type === 'pointer' ? 'transparent' : color,
        borderRadius: '50%',
        opacity: renderOpacity,
        transform: `translate(${renderTranslateX - size / 2}px, ${renderTranslateY - size / 2}px) scale(${renderScale})`,
        transformOrigin: 'center center',
        pointerEvents: 'none', // Critical so it doesn't block interactions
        zIndex: 100, // Make sure it sits on top of everything
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {type === 'pointer' && (
        <svg data-testid="pointer-svg" width={size} height={size} viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="2">
          <path d="M4 4l5 15.5 3-5.5 5.5-3z" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
};
