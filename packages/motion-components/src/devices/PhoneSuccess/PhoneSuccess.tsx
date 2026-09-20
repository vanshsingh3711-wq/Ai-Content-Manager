import React from 'react';
import { PhoneSuccessProps } from './PhoneSuccess.types';
import { interpolate, easeOutBack } from './PhoneSuccess.utils';

export const PhoneSuccess: React.FC<PhoneSuccessProps> = ({
  title = 'Success',
  message,
  icon,
  width = '100%',
  height = '100%',
  animation = {},
  currentFrame = 0,
  style = {},
}) => {
  const {
    startDelayInFrames = 0,
    durationInFrames = 60,
    iconDurationInFrames = 30,
  } = animation;

  const {
    backgroundColor = 'transparent',
    textColor = '#111827',
    secondaryTextColor = '#6b7280',
    successColor = '#10b981',
    iconSize = 96,
  } = style;

  // Animation timelines
  const iconEndFrame = startDelayInFrames + iconDurationInFrames;
  const titleEndFrame = iconEndFrame + (durationInFrames - iconDurationInFrames) / 2;
  const messageEndFrame = startDelayInFrames + durationInFrames;

  // 1. Icon Animation
  const iconProgress = interpolate(currentFrame, [startDelayInFrames, iconEndFrame], [0, 1], 'clamp');
  const iconScale = currentFrame >= startDelayInFrames && iconProgress > 0 ? Math.max(0, easeOutBack(iconProgress)) : 0;
  
  // Custom checkmark drawing (if no icon provided)
  // Length of the checkmark path is roughly 50. We stroke-dasharray/offset to draw it.
  const pathDrawProgress = interpolate(currentFrame, [startDelayInFrames + iconDurationInFrames * 0.3, iconEndFrame], [0, 1], 'clamp');
  const pathLength = 50;
  const dashOffset = pathLength - (pathLength * pathDrawProgress);

  // 2. Title Animation
  const titleOpacity = interpolate(currentFrame, [iconEndFrame, titleEndFrame], [0, 1], 'clamp');
  const titleTranslateY = interpolate(currentFrame, [iconEndFrame, titleEndFrame], [20, 0], 'clamp');

  // 3. Message Animation
  const messageOpacity = interpolate(currentFrame, [titleEndFrame, messageEndFrame], [0, 1], 'clamp');
  const messageTranslateY = interpolate(currentFrame, [titleEndFrame, messageEndFrame], [20, 0], 'clamp');

  const defaultIcon = (
    <div style={{
      width: iconSize,
      height: iconSize,
      borderRadius: iconSize / 2,
      backgroundColor: successColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <svg width={iconSize * 0.5} height={iconSize * 0.5} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path 
          d="M20 6L9 17l-5-5" 
          strokeDasharray={pathLength}
          strokeDashoffset={dashOffset}
        />
      </svg>
    </div>
  );

  return (
    <div
      data-testid="phone-success"
      style={{
        width,
        height,
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        padding: '32px 24px',
        fontFamily: 'sans-serif',
        textAlign: 'center',
      }}
    >
      <div 
        data-testid="success-icon"
        style={{ 
          transform: `scale(${iconScale})`, 
          opacity: currentFrame >= startDelayInFrames ? 1 : 0,
          marginBottom: 32 
        }}
      >
        {icon || defaultIcon}
      </div>

      <div 
        data-testid="success-title"
        style={{ 
          fontSize: 28, 
          fontWeight: 700, 
          color: textColor, 
          marginBottom: 12,
          opacity: titleOpacity,
          transform: `translateY(${titleTranslateY}px)`
        }}
      >
        {title}
      </div>

      {message && (
        <div 
          data-testid="success-message"
          style={{ 
            fontSize: 16, 
            color: secondaryTextColor, 
            lineHeight: 1.5,
            opacity: messageOpacity,
            transform: `translateY(${messageTranslateY}px)`
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
};
