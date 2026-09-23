"use client";

import React, { useState, useEffect } from 'react';
import { Move } from '@ai-content-manager/motion-components/src/animations/move/Move';

export default function MoveDemoPage() {
  const [frame, setFrame] = useState(0);

  // Simple loop for previewing the animation over 150 frames
  useEffect(() => {
    let animationFrameId: number;
    let current = 0;

    const loop = () => {
      current = (current + 1) % 150;
      setFrame(current);
      animationFrameId = requestAnimationFrame(loop);
    };
    
    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const Box = ({ text, color }: { text: string; color: string }) => (
    <div style={{
      width: 100,
      height: 100,
      backgroundColor: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      borderRadius: 12,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      {text}
    </div>
  );

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1>Move Primitive Demo</h1>
      <p>Current Frame: {frame} (Loops every 150 frames)</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 40 }}>
        
        {/* 1. Left to Right */}
        <div style={{ height: 150, border: '1px dashed #ccc', position: 'relative' }}>
          <h4>1. Left to Right (Linear)</h4>
          <Move 
            from={{ x: 0, y: 0 }} 
            to={{ x: 300, y: 0 }} 
            currentFrame={frame} 
            durationInFrames={60}
            easing="linear"
          >
            <Box text="Linear" color="#3b82f6" />
          </Move>
        </div>

        {/* 2. Top to Bottom */}
        <div style={{ height: 250, border: '1px dashed #ccc', position: 'relative' }}>
          <h4>2. Top to Bottom (Ease Out)</h4>
          <Move 
            from={{ x: 0, y: 0 }} 
            to={{ x: 0, y: 120 }} 
            currentFrame={frame} 
            durationInFrames={60}
            easing="easeOut"
          >
            <Box text="EaseOut" color="#ef4444" />
          </Move>
        </div>

        {/* 3. Diagonal */}
        <div style={{ height: 200, border: '1px dashed #ccc', position: 'relative' }}>
          <h4>3. Diagonal (Ease In Out)</h4>
          <Move 
            from={{ x: 0, y: 0 }} 
            to={{ x: 200, y: 80 }} 
            currentFrame={frame} 
            durationInFrames={60}
            easing="easeInOut"
          >
            <Box text="Diagonal" color="#10b981" />
          </Move>
        </div>

        {/* 4. Delayed Movement */}
        <div style={{ height: 150, border: '1px dashed #ccc', position: 'relative' }}>
          <h4>4. Delayed (Starts at frame 60)</h4>
          <Move 
            from={{ x: 0, y: 0 }} 
            to={{ x: 300, y: 0 }} 
            currentFrame={frame} 
            delayInFrames={60}
            durationInFrames={30}
            easing="easeInOut"
          >
            <Box text="Delayed" color="#f59e0b" />
          </Move>
        </div>

        {/* 5. Short Duration */}
        <div style={{ height: 150, border: '1px dashed #ccc', position: 'relative' }}>
          <h4>5. Short Duration (10 frames)</h4>
          <Move 
            from={{ x: 0, y: 0 }} 
            to={{ x: 300, y: 0 }} 
            currentFrame={frame} 
            durationInFrames={10}
            easing="linear"
          >
            <Box text="Fast" color="#8b5cf6" />
          </Move>
        </div>

        {/* 6. Long Duration */}
        <div style={{ height: 150, border: '1px dashed #ccc', position: 'relative' }}>
          <h4>6. Long Duration (120 frames)</h4>
          <Move 
            from={{ x: 0, y: 0 }} 
            to={{ x: 300, y: 0 }} 
            currentFrame={frame} 
            durationInFrames={120}
            easing="easeInOut"
          >
            <Box text="Slow" color="#ec4899" />
          </Move>
        </div>

      </div>
    </div>
  );
}
