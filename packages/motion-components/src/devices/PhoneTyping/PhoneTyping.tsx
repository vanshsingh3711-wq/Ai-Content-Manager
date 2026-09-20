import React from 'react';
import { PhoneTypingProps } from './PhoneTyping.types';

export const PhoneTyping: React.FC<PhoneTypingProps> = ({
  text,
  x,
  y,
  width,
  fontSize = 16,
  typing = {},
  cursor = {},
  currentFrame = 0,
  fps = 30, // For API consistency
  style = {},
}) => {
  const {
    durationInFrames = 30,
    startDelayInFrames = 0,
  } = typing;

  const {
    visible: cursorVisible = true,
    blink: cursorBlink = true,
    blinkRateInFrames = 15, // Blink every 15 frames (0.5s at 30fps)
  } = cursor;

  const {
    textColor = '#111827',
    cursorColor = '#3b82f6', // blue cursor
    fontFamily = 'sans-serif',
  } = style;

  const startFrame = startDelayInFrames;
  const endFrame = startDelayInFrames + durationInFrames;

  // Determine how many characters to show
  let visibleCharCount = 0;
  if (currentFrame >= endFrame) {
    visibleCharCount = text.length;
  } else if (currentFrame > startFrame) {
    const progress = (currentFrame - startFrame) / durationInFrames;
    visibleCharCount = Math.floor(progress * text.length);
  }
  
  const displayedText = text.slice(0, visibleCharCount);

  // Cursor blinking logic
  let showCursor = cursorVisible;
  if (cursorVisible && cursorBlink) {
    showCursor = Math.floor(currentFrame / blinkRateInFrames) % 2 === 0;
  }

  const wrapperStyle: React.CSSProperties = {
    fontSize,
    fontFamily,
    color: textColor,
    width,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    wordBreak: 'break-word',
  };

  if (x !== undefined || y !== undefined) {
    wrapperStyle.position = 'absolute';
    wrapperStyle.left = x;
    wrapperStyle.top = y;
  }

  return (
    <div data-testid="phone-typing" style={wrapperStyle}>
      <span data-testid="typing-text">{displayedText}</span>
      <span 
        data-testid="typing-cursor"
        style={{
          display: 'inline-block',
          width: 2,
          height: fontSize * 1.2,
          backgroundColor: cursorColor,
          marginLeft: 2,
          opacity: showCursor ? 1 : 0,
          transition: 'none', // Strictly no CSS transitions
        }} 
      />
    </div>
  );
};
