import React from 'react';
import { PhoneProps } from './Phone.types';
import { interpolate } from './Phone.utils';

export const Phone: React.FC<PhoneProps> = ({
  width = 400,
  height = 800,
  children,
  frame = {},
  showSpeaker = true,
  showCamera = true,
  showHomeIndicator = true,
  animation = {},
  currentFrame = 0,
  fps = 30, // Default for API consistency
  style = {},
}) => {
  const {
    radius = 48,
    borderWidth = 16,
  } = frame;

  const {
    enter = 'scale',
    durationInFrames = 30,
    delayInFrames = 0,
  } = animation;

  const {
    bodyColor = '#1f2937', // dark gray
    screenColor = '#ffffff',
    borderColor = '#111827', // darker gray/black
  } = style;

  // Animation values
  let scale = 1;
  let opacity = 1;
  let translateY = 0;

  const startFrame = delayInFrames;
  const endFrame = delayInFrames + durationInFrames;

  if (enter === 'fade') {
    opacity = interpolate(currentFrame, [startFrame, endFrame], [0, 1]);
  } else if (enter === 'scale') {
    scale = interpolate(currentFrame, [startFrame, endFrame], [0.8, 1]);
    opacity = interpolate(currentFrame, [startFrame, endFrame], [0, 1]);
  } else if (enter === 'slideUp') {
    translateY = interpolate(currentFrame, [startFrame, endFrame], [100, 0]);
    opacity = interpolate(currentFrame, [startFrame, endFrame], [0, 1]);
  } else if (enter === 'slideDown') {
    translateY = interpolate(currentFrame, [startFrame, endFrame], [-100, 0]);
    opacity = interpolate(currentFrame, [startFrame, endFrame], [0, 1]);
  }

  return (
    <div
      data-testid="phone-container"
      style={{
        width,
        height,
        position: 'relative',
        borderRadius: radius,
        backgroundColor: borderColor,
        boxShadow: `inset 0 0 0 ${borderWidth}px ${bodyColor}, 0 25px 50px -12px rgba(0, 0, 0, 0.25)`,
        opacity,
        transform: `scale(${scale}) translateY(${translateY}px)`,
        transformOrigin: 'center center',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Screen Area */}
      <div
        data-testid="phone-screen"
        style={{
          position: 'absolute',
          top: borderWidth,
          left: borderWidth,
          right: borderWidth,
          bottom: borderWidth,
          backgroundColor: screenColor,
          borderRadius: radius > borderWidth ? radius - borderWidth : 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>

      {/* Notch / Speaker Area */}
      {showSpeaker && (
        <div
          data-testid="phone-notch"
          style={{
            position: 'absolute',
            top: borderWidth,
            left: '50%',
            transform: 'translateX(-50%)',
            width: width * 0.4,
            height: 28,
            backgroundColor: bodyColor,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          {showCamera && (
            <div
              style={{
                width: 12,
                height: 12,
                backgroundColor: '#111827',
                borderRadius: '50%',
                marginRight: 12,
              }}
            />
          )}
          <div
            style={{
              width: 48,
              height: 6,
              backgroundColor: '#374151',
              borderRadius: 3,
            }}
          />
        </div>
      )}

      {/* Home Indicator */}
      {showHomeIndicator && (
        <div
          data-testid="phone-home-indicator"
          style={{
            position: 'absolute',
            bottom: borderWidth + 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: width * 0.35,
            height: 5,
            backgroundColor: '#d1d5db',
            borderRadius: 2.5,
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
};
