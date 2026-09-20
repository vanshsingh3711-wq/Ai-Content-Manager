"use client";

import React, { useState, useEffect } from 'react';
import { Rotate } from '@ai-content-manager/motion-components/src/animations/rotate/Rotate';
import { Scale } from '@ai-content-manager/motion-components/src/animations/scale/Scale';
import { Move } from '@ai-content-manager/motion-components/src/animations/move/Move';

export default function RotateDemoPage() {
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
      <h1>Rotate Primitive Demo</h1>
      <p>Current Frame: {frame} (Loops every 150 frames)</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40, marginTop: 40 }}>
        
        {/* 1. Clockwise Quarter Turn */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>1. Clockwise (0 → 90)</div>
          <Rotate 
            from={0} 
            to={90} 
            currentFrame={frame} 
            durationInFrames={40}
            easing="easeOut"
          >
            <Box text="Right" color="#3b82f6" />
          </Rotate>
        </div>

        {/* 2. Counter-Clockwise Quarter Turn */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>2. Counter-CW (0 → -90)</div>
          <Rotate 
            from={0} 
            to={-90} 
            currentFrame={frame} 
            durationInFrames={40}
            easing="easeOut"
          >
            <Box text="Left" color="#ef4444" />
          </Rotate>
        </div>

        {/* 3. Full Turn */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>3. Full Turn (0 → 360)</div>
          <Rotate 
            from={0} 
            to={360} 
            currentFrame={frame} 
            durationInFrames={60}
            easing="easeInOut"
          >
            <Box text="Spin" color="#10b981" />
          </Rotate>
        </div>

        {/* 4. Delayed Start */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>4. Delayed (Starts at frame 60)</div>
          <Rotate 
            from={0} 
            to={180} 
            currentFrame={frame} 
            delayInFrames={60}
            durationInFrames={30}
            easing="easeOut"
          >
            <Box text="Delayed" color="#f59e0b" />
          </Rotate>
        </div>

        {/* 5. Combo (Move + Scale + Rotate) */}
        <div style={{ height: 200, border: '1px dashed #ccc', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>5. Nested (Move + Scale + Rotate)</div>
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
              <Rotate
                from={0}
                to={360}
                currentFrame={frame}
                durationInFrames={60}
                easing="easeInOut"
              >
                <Box text="Combo" color="#8b5cf6" />
              </Rotate>
            </Scale>
          </Move>
        </div>

        {/* 6. Long Duration */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>6. Long Duration (120 frames)</div>
          <Rotate 
            from={0} 
            to={180} 
            currentFrame={frame} 
            durationInFrames={120}
            easing="linear"
          >
            <Box text="Slow" color="#ec4899" />
          </Rotate>
        </div>

      </div>
    </div>
  );
}
