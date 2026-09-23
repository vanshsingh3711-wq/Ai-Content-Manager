"use client";

import React, { useState, useEffect } from 'react';
import { Shake } from '@ai-content-manager/motion-components/src/animations/shake/Shake';
import { Bounce } from '@ai-content-manager/motion-components/src/animations/bounce/Bounce';
import { Fade } from '@ai-content-manager/motion-components/src/animations/fade/Fade';
import { Move } from '@ai-content-manager/motion-components/src/animations/move/Move';

export default function ShakeDemoPage() {
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
      <h1>Shake Primitive Demo</h1>
      <p>Current Frame: {frame} (Loops every 150 frames)</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40, marginTop: 40 }}>
        
        {/* 1. Horizontal Shake */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>1. Horizontal (x)</div>
          <Shake 
            axis="x"
            amplitude={15}
            frequency={4}
            currentFrame={frame} 
            durationInFrames={40}
          >
            <Box text="X-Shake" color="#3b82f6" />
          </Shake>
        </div>

        {/* 2. Vertical Shake */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>2. Vertical (y)</div>
          <Shake 
            axis="y"
            amplitude={15}
            frequency={4}
            currentFrame={frame} 
            durationInFrames={40}
          >
            <Box text="Y-Shake" color="#ef4444" />
          </Shake>
        </div>

        {/* 3. Both Axes */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>3. Both Axes</div>
          <Shake 
            axis="both"
            amplitude={20}
            frequency={5}
            currentFrame={frame} 
            durationInFrames={40}
          >
            <Box text="Crazy" color="#10b981" />
          </Shake>
        </div>

        {/* 4. Subtle Shake */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>4. Subtle</div>
          <Shake 
            axis="x"
            amplitude={4}
            frequency={3}
            currentFrame={frame} 
            durationInFrames={40}
          >
            <Box text="Subtle" color="#f59e0b" />
          </Shake>
        </div>

        {/* 5. Strong & Fast Shake */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>5. Strong & Fast</div>
          <Shake 
            axis="x"
            amplitude={30}
            frequency={8}
            currentFrame={frame} 
            durationInFrames={40}
          >
            <Box text="Strong" color="#8b5cf6" />
          </Shake>
        </div>

        {/* 6. Delayed Shake */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>6. Delayed Starts at 60</div>
          <Shake 
            axis="both"
            amplitude={15}
            frequency={6}
            currentFrame={frame} 
            delayInFrames={60}
            durationInFrames={40}
          >
            <Box text="Delayed" color="#ec4899" />
          </Shake>
        </div>

        {/* 7. Combo (Move + Fade + Bounce + Shake) */}
        <div style={{ height: 200, border: '1px dashed #ccc', position: 'relative', overflow: 'hidden', gridColumn: '1 / -1' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>7. Nested Combo (Wait for frame 40)</div>
          <Move
            from={{ x: 20, y: 50 }}
            to={{ x: 400, y: 50 }}
            currentFrame={frame}
            durationInFrames={40}
            easing="easeOut"
          >
            <Fade
              from={0}
              to={1}
              currentFrame={frame}
              durationInFrames={20}
              easing="easeInOut"
            >
              <Bounce
                property="scale"
                from={0.2}
                to={1.2}
                currentFrame={frame}
                durationInFrames={40}
                intensity={0.3}
                bounces={2}
              >
                {/* Shake triggers right at the end of the bounce/move combo! */}
                <Shake
                  axis="both"
                  amplitude={15}
                  frequency={6}
                  currentFrame={frame}
                  delayInFrames={40}
                  durationInFrames={30}
                >
                  <Box text="Impact!" color="#333" />
                </Shake>
              </Bounce>
            </Fade>
          </Move>
        </div>

      </div>
    </div>
  );
}
