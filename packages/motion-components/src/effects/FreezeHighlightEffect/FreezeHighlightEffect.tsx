import React from 'react';
import { FreezeHighlightEffectProps } from './FreezeHighlightEffect.types';
import { interpolate } from './FreezeHighlightEffect.utils';

export const FreezeHighlightEffect: React.FC<FreezeHighlightEffectProps> = ({
  children,
  x,
  y,
  width = '100%',
  height = '100%',
  overlayColor = 'rgba(0, 0, 0, 1)',
  overlayOpacity = 0.7,
  highlightOpacity = 1,
  borderRadius = 8,
  glow = false,
  glowColor = 'rgba(255, 255, 255, 0.5)',
  glowOpacity = 1,
  glowRadius = 20,
  padding = 10,
  durationInFrames = 60,
  delayInFrames = 0,
  animation = 'fade',
  currentFrame = 0,
  className = '',
  style = {},
}) => {
  const endFrame = delayInFrames + durationInFrames;
  const fadeFrames = Math.min(10, Math.floor(durationInFrames / 2));

  let progress = 0;

  if (currentFrame >= delayInFrames && currentFrame < endFrame) {
    if (animation === 'instant') {
      progress = 1;
    } else {
      // Fade in
      if (currentFrame < delayInFrames + fadeFrames) {
        progress = interpolate(
          currentFrame,
          [delayInFrames, delayInFrames + fadeFrames],
          [0, 1],
          'clamp'
        );
      }
      // Fade out
      else if (currentFrame > endFrame - fadeFrames) {
        progress = interpolate(
          currentFrame,
          [endFrame - fadeFrames, endFrame],
          [1, 0],
          'clamp'
        );
      }
      // Hold
      else {
        progress = 1;
      }
    }
  }

  const currentOverlayOpacity = overlayOpacity * progress;
  const currentGlowOpacity = glowOpacity * progress;

  const isAbsolute = x !== undefined || y !== undefined;
  
  // Extract RGB components if color is hex, for safest rendering (optional, modern browsers support opacity separately, but we apply it to the whole cutout)
  // Actually, we apply `currentOverlayOpacity` directly to the cutout container's `opacity`.
  // Wait, if we apply opacity to the cutout, it dims the glow as well, which is perfect for fade in/out!

  // Box shadow trick: 
  // 1. The glow (if enabled)
  // 2. The 9999px solid shadow which darkens the rest of the screen
  const boxShadows: string[] = [];
  
  if (glow && glowRadius > 0) {
    // Drop shadow syntax: offsetX offsetY blurRadius spreadRadius color
    // We want the glow to spread slightly, or just blur
    boxShadows.push(`0 0 ${glowRadius}px 0px ${glowColor}`);
  }
  
  // The massive mask
  boxShadows.push(`0 0 0 9999px ${overlayColor}`);

  return (
    <div
      data-testid="freeze-highlight-effect"
      className={className}
      style={{
        position: isAbsolute ? 'absolute' : 'relative',
        left: x,
        top: y,
        width,
        height,
        ...style,
      }}
    >
      {/* 1. The Child Content (Rendered below the cutout in DOM, but cutout is transparent inside) */}
      <div 
        style={{ 
          width: '100%', 
          height: '100%', 
          opacity: highlightOpacity 
        }}
      >
        {children}
      </div>

      {/* 2. The Cutout Overlay (Rendered above child in DOM, transparent inside, massive shadow outside) */}
      {progress > 0 && (
        <div
          data-testid="freeze-highlight-cutout"
          style={{
            position: 'absolute',
            left: -padding,
            top: -padding,
            right: -padding,
            bottom: -padding,
            borderRadius,
            boxShadow: boxShadows.join(', '),
            opacity: currentOverlayOpacity,
            pointerEvents: 'none', // Ensure clicks pass through to the children
            zIndex: 9999, // Render above sibling scene elements if they share a stacking context
          }}
        />
      )}
    </div>
  );
};
