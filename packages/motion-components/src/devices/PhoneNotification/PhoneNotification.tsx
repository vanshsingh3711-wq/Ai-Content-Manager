import React from 'react';
import { PhoneNotificationProps } from './PhoneNotification.types';
import { interpolate } from './PhoneNotification.utils';

export const PhoneNotification: React.FC<PhoneNotificationProps> = ({
  title,
  message,
  icon,
  width = '90%',
  animation = {},
  currentFrame = 0,
  fps = 30, // For API consistency
  style = {},
}) => {
  const {
    enter = 'slideDown',
    durationInFrames = 30,
    delayInFrames = 0,
  } = animation;

  const {
    background = '#ffffff',
    titleColor = '#111827', // dark gray
    messageColor = '#6b7280', // lighter gray
    borderRadius = 16,
    boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    padding = 16,
    marginTop = 40,
  } = style;

  const startFrame = delayInFrames;
  const endFrame = delayInFrames + durationInFrames;

  let opacity = 1;
  let scale = 1;
  let translateY = 0;

  if (enter === 'fade') {
    opacity = interpolate(currentFrame, [startFrame, endFrame], [0, 1]);
  } else if (enter === 'scale') {
    opacity = interpolate(currentFrame, [startFrame, endFrame], [0, 1]);
    scale = interpolate(currentFrame, [startFrame, endFrame], [0.8, 1]);
  } else if (enter === 'slideDown') {
    opacity = interpolate(currentFrame, [startFrame, endFrame], [0, 1]);
    translateY = interpolate(currentFrame, [startFrame, endFrame], [-100, 0]);
  } else if (enter === 'slideUp') {
    opacity = interpolate(currentFrame, [startFrame, endFrame], [0, 1]);
    translateY = interpolate(currentFrame, [startFrame, endFrame], [100, 0]);
  }

  return (
    <div
      data-testid="phone-notification"
      style={{
        width,
        backgroundColor: background,
        borderRadius,
        boxShadow,
        padding,
        marginTop,
        marginLeft: 'auto',
        marginRight: 'auto',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        transformOrigin: 'top center',
        zIndex: 50,
        boxSizing: 'border-box',
      }}
    >
      {icon && (
        <div style={{ marginRight: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }} data-testid="notification-icon">
          {icon}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <span 
          style={{ 
            color: titleColor, 
            fontWeight: 600, 
            fontSize: '15px', 
            fontFamily: 'sans-serif',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          data-testid="notification-title"
        >
          {title}
        </span>
        {message && (
          <span 
            style={{ 
              color: messageColor, 
              fontSize: '13px', 
              fontFamily: 'sans-serif',
              marginTop: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            data-testid="notification-message"
          >
            {message}
          </span>
        )}
      </div>
    </div>
  );
};
