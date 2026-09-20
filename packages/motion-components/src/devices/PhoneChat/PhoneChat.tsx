import React from 'react';
import { PhoneChatProps } from './PhoneChat.types';
import { interpolate, easeOutBack } from './PhoneChat.utils';

export const PhoneChat: React.FC<PhoneChatProps> = ({
  messages,
  x,
  y,
  width = '100%',
  height = '100%',
  animation = {},
  currentFrame = 0,
  fps = 30, // For API consistency
  style = {},
}) => {
  const {
    startDelayInFrames = 0,
    defaultGapInFrames = 45,
    messageDurationInFrames = 15,
  } = animation;

  const {
    backgroundColor = 'transparent',
    leftBubbleColor = '#e5e7eb', // gray-200
    rightBubbleColor = '#2563eb', // blue-600
    leftTextColor = '#111827', // gray-900
    rightTextColor = '#ffffff', // white
    borderRadius = 18,
    fontSize = 15,
  } = style;

  // Process timeline
  let currentStart = startDelayInFrames;
  
  const processedMessages = messages.map((msg) => {
    const gap = msg.delayInFrames ?? defaultGapInFrames;
    const msgStart = currentStart + gap;
    const msgEnd = msgStart + messageDurationInFrames;
    
    currentStart = msgStart; // Advance the timeline for the next message
    
    return {
      ...msg,
      startFrame: msgStart,
      endFrame: msgEnd,
      typingStartFrame: msgStart - gap,
    };
  });

  // Find if anyone is currently typing
  let typingSender: 'left' | 'right' | null = null;
  for (const pMsg of processedMessages) {
    if (currentFrame >= pMsg.typingStartFrame && currentFrame < pMsg.startFrame) {
      typingSender = pMsg.sender;
      break;
    }
  }

  // Filter messages that have started to appear
  const visibleMessages = processedMessages.filter((m) => currentFrame >= m.startFrame);

  // We use flex-end to pin content to the bottom.
  // This automatically scrolls (pushes content up) as new messages are added,
  // making it perfect for dynamic height text!
  return (
    <div
      data-testid="phone-chat"
      style={{
        position: (x !== undefined || y !== undefined) ? 'absolute' : 'relative',
        left: x,
        top: y,
        width,
        height,
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end', // Crucial for auto-scroll
        overflow: 'hidden', // Clips messages that scroll off the top
        padding: '16px',
        boxSizing: 'border-box',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
        {visibleMessages.map((msg) => {
          const isRight = msg.sender === 'right';
          
          // Animate entry (scale up and slide up slightly)
          let progress = 0;
          if (currentFrame >= msg.endFrame) {
            progress = 1;
          } else {
            const rawProgress = (currentFrame - msg.startFrame) / messageDurationInFrames;
            progress = easeOutBack(rawProgress);
          }

          const scale = interpolate(progress, [0, 1], [0.8, 1], 'clamp');
          const opacity = interpolate(progress, [0, 0.5], [0, 1], 'clamp');
          const translateY = interpolate(progress, [0, 1], [10, 0], 'clamp');

          return (
            <div
              key={msg.id}
              data-testid={`msg-${msg.id}`}
              style={{
                alignSelf: isRight ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                backgroundColor: isRight ? rightBubbleColor : leftBubbleColor,
                color: isRight ? rightTextColor : leftTextColor,
                padding: '10px 14px',
                borderRadius: `${borderRadius}px`,
                borderBottomRightRadius: isRight ? '4px' : `${borderRadius}px`,
                borderBottomLeftRadius: !isRight ? '4px' : `${borderRadius}px`,
                fontSize,
                lineHeight: 1.4,
                opacity,
                transform: `translateY(${translateY}px) scale(${scale})`,
                transformOrigin: isRight ? 'bottom right' : 'bottom left',
              }}
            >
              {msg.text}
            </div>
          );
        })}

        {/* Typing Indicator */}
        {typingSender && (
          <div
            data-testid="typing-indicator"
            style={{
              alignSelf: typingSender === 'right' ? 'flex-end' : 'flex-start',
              backgroundColor: typingSender === 'right' ? rightBubbleColor : leftBubbleColor,
              padding: '10px 14px',
              borderRadius: `${borderRadius}px`,
              borderBottomRightRadius: typingSender === 'right' ? '4px' : `${borderRadius}px`,
              borderBottomLeftRadius: typingSender !== 'right' ? '4px' : `${borderRadius}px`,
              display: 'flex',
              gap: '4px',
              alignItems: 'center',
              height: `${fontSize * 1.4}px`, // Match text line height
              opacity: 1,
            }}
          >
            {[0, 1, 2].map((i) => {
              // Deterministic bouncing dot
              // Cycle every 30 frames.
              const cycle = (currentFrame + i * 10) % 30;
              // Bounce up and down
              let dotY = 0;
              if (cycle < 15) {
                if (cycle < 7.5) {
                  dotY = interpolate(cycle, [0, 7.5], [0, -4]);
                } else {
                  dotY = interpolate(cycle, [7.5, 15], [-4, 0]);
                }
              }
              
              const dotColor = typingSender === 'right' ? rightTextColor : leftTextColor;
              return (
                <div
                  key={i}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '3px',
                    backgroundColor: dotColor,
                    opacity: 0.6,
                    transform: `translateY(${dotY}px)`,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
