import React from 'react';
import { PhoneScrollingProps } from './PhoneScrolling.types';
import { easeInOutCubic } from './PhoneScrolling.utils';

export const PhoneScrolling: React.FC<PhoneScrollingProps> = ({
  children,
  x,
  y,
  width = '100%',
  height = '100%',
  scroll = {},
  direction = 'up',
  currentFrame = 0,
  fps = 30, // For API consistency
  style = {},
  showIndicator = false,
}) => {
  const {
    fromOffset = 0,
    toOffset = 300,
    durationInFrames = 60,
    startDelayInFrames = 0,
  } = scroll;

  const {
    backgroundColor = 'transparent',
    borderRadius = 0,
    indicatorColor = 'rgba(156, 163, 175, 0.5)',
  } = style;

  const startFrame = startDelayInFrames;
  const endFrame = startDelayInFrames + durationInFrames;

  let progress = 0;
  if (currentFrame >= endFrame) {
    progress = 1;
  } else if (currentFrame > startFrame) {
    const rawProgress = (currentFrame - startFrame) / durationInFrames;
    progress = easeInOutCubic(rawProgress);
  }

  const offsetDiff = toOffset - fromOffset;
  const currentOffset = fromOffset + offsetDiff * progress;

  // direction="up" means content moves up (typical scrolling down a page)
  const sign = direction === 'up' ? -1 : 1;
  const translateY = currentOffset * sign;

  const wrapperStyle: React.CSSProperties = {
    position: (x !== undefined || y !== undefined) ? 'absolute' : 'relative',
    left: x,
    top: y,
    width,
    height,
    backgroundColor,
    borderRadius,
    overflow: 'hidden', // This masks/clips the content outside viewport
    boxSizing: 'border-box',
  };

  const indicatorHeight = 40;

  return (
    <div data-testid="phone-scrolling" style={wrapperStyle}>
      <div 
        data-testid="scrolling-content"
        style={{
          transform: `translateY(${translateY}px)`,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {children}
      </div>

      {showIndicator && (
        <div
          data-testid="scroll-indicator"
          style={{
            position: 'absolute',
            right: 4,
            top: `calc(${progress * 100}% - ${progress * indicatorHeight}px)`,
            width: 4,
            height: indicatorHeight,
            backgroundColor: indicatorColor,
            borderRadius: 2,
            transition: 'none',
            zIndex: 50,
          }}
        />
      )}
    </div>
  );
};
