import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const MotionGraphicsPreview: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    fps,
    frame,
    config: {
      damping: 12,
      stiffness: 150,
      mass: 0.5,
    },
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '40px 80px',
          borderRadius: '30px',
          border: '10px solid white',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          maxWidth: '80%',
        }}
      >
        <h1
          style={{
            color: 'white',
            fontSize: '80px',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {text}
        </h1>
      </div>
    </AbsoluteFill>
  );
};
