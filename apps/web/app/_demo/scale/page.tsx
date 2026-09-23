"use client";

import React, { useState, useEffect } from 'react';
import { Scale } from '@ai-content-manager/motion-components/src/animations/scale/Scale';
import { Move } from '@ai-content-manager/motion-components/src/animations/move/Move';

export default function ScaleDemoPage() {
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
      <h1>Scale Primitive Demo</h1>
      <p>Current Frame: {frame} (Loops every 150 frames)</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40, marginTop: 40 }}>
        
        {/* 1. Scale In */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>1. Scale In (0 → 1)</div>
          <Scale 
            from={0} 
            to={1} 
            currentFrame={frame} 
            durationInFrames={40}
            easing="easeOut"
          >
            <Box text="Pop!" color="#3b82f6" />
          </Scale>
        </div>

        {/* 2. Scale Out */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>2. Scale Out (1 → 0)</div>
          <Scale 
            from={1} 
            to={0} 
            currentFrame={frame} 
            durationInFrames={40}
            easing="easeIn"
          >
            <Box text="Bye!" color="#ef4444" />
          </Scale>
        </div>

        {/* 3. Subtle Emphasis */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>3. Subtle Emphasis (1 → 1.15)</div>
          <Scale 
            from={1} 
            to={1.15} 
            currentFrame={frame} 
            durationInFrames={60}
            easing="easeInOut"
          >
            <Box text="Focus" color="#10b981" />
          </Scale>
        </div>

        {/* 4. Delayed Scale */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>4. Delayed (Starts at frame 60)</div>
          <Scale 
            from={0} 
            to={1} 
            currentFrame={frame} 
            delayInFrames={60}
            durationInFrames={30}
            easing="easeOut"
          >
            <Box text="Delayed" color="#f59e0b" />
          </Scale>
        </div>

        {/* 5. Chained / Nested (Move + Scale) */}
        <div style={{ height: 200, border: '1px dashed #ccc', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>5. Nested (Move + Scale)</div>
          <Move
            from={{ x: 20, y: 50 }}
            to={{ x: 200, y: 50 }}
            currentFrame={frame}
            durationInFrames={60}
            easing="easeInOut"
          >
            <Scale 
              from={0.5} 
              to={1.5} 
              currentFrame={frame} 
              durationInFrames={60}
              easing="easeInOut"
            >
              <Box text="Combo" color="#8b5cf6" />
            </Scale>
          </Move>
        </div>

        {/* 6. Long Duration */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>6. Long Duration (120 frames)</div>
          <Scale 
            from={0} 
            to={1.5} 
            currentFrame={frame} 
            durationInFrames={120}
            easing="linear"
          >
            <Box text="Slow" color="#ec4899" />
          </Scale>
        </div>

      </div>
    </div>
  );
}
