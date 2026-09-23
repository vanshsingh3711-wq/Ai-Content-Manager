import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const LowerThirds: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slide in from left
  const slideIn = spring({
    fps,
    frame,
    config: {
      damping: 14,
      stiffness: 100,
      mass: 1,
    },
  });

  const translateX = -1000 + (slideIn * 1000);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        backgroundColor: 'transparent',
        padding: '100px',
      }}
    >
      <div
        style={{
          transform: `translateX(${translateX}px)`,
          backgroundColor: '#ffeb3b', // Bright yellow for lower thirds
          padding: '30px 60px',
          borderRadius: '15px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          borderLeft: '15px solid #000',
        }}
      >
        <h1
          style={{
            color: 'black',
            fontSize: '60px',
            fontFamily: 'sans-serif',
            fontWeight: '900',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}
        >
          {text}
        </h1>
      </div>
    </AbsoluteFill>
  );
};
