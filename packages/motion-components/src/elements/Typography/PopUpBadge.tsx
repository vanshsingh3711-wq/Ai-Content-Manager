import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const PopUpBadge: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Bouncy scale animation
  const scale = spring({
    fps,
    frame,
    config: {
      damping: 10,
      stiffness: 200,
      mass: 0.8,
    },
  });
  
  // Slight rotation for extra flair
  const rotation = spring({
    fps,
    frame,
    config: {
      damping: 12,
      stiffness: 150,
    }
  }) * -5; // rotate to -5 degrees

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
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          backgroundColor: '#f8312f', // TikTok style red
          padding: '20px 40px',
          borderRadius: '50px',
          boxShadow: '0 15px 35px rgba(248, 49, 47, 0.4)',
          border: '6px solid white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <h1
          style={{
            color: 'white',
            fontSize: '50px',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            textAlign: 'center',
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          {text}
        </h1>
      </div>
    </AbsoluteFill>
  );
};
