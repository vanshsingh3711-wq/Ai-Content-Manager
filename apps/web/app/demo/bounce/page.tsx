"use client";

import React, { useState, useEffect } from 'react';
import { Bounce } from '@ai-content-manager/motion-components/src/animations/bounce/Bounce';
import { Blur } from '@ai-content-manager/motion-components/src/animations/blur/Blur';
import { Fade } from '@ai-content-manager/motion-components/src/animations/fade/Fade';
import { Rotate } from '@ai-content-manager/motion-components/src/animations/rotate/Rotate';
import { Scale } from '@ai-content-manager/motion-components/src/animations/scale/Scale';
import { Move } from '@ai-content-manager/motion-components/src/animations/move/Move';

export default function BounceDemoPage() {
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
      <h1>Bounce Primitive Demo</h1>
      <p>Current Frame: {frame} (Loops every 150 frames)</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40, marginTop: 40 }}>
        
        {/* 1. Subtle Scale Bounce */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>1. Subtle Scale Bounce</div>
          <Bounce 
            property="scale"
            from={0} 
            to={1} 
            currentFrame={frame} 
            durationInFrames={60}
            intensity={0.1}
            bounces={1}
          >
            <Box text="Subtle" color="#3b82f6" />
          </Bounce>
        </div>

        {/* 2. Strong Scale Bounce */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>2. Strong Scale Bounce</div>
          <Bounce 
            property="scale"
            from={0} 
            to={1} 
            currentFrame={frame} 
            durationInFrames={60}
            intensity={0.4}
            bounces={2}
          >
            <Box text="Strong" color="#ef4444" />
          </Bounce>
        </div>

        {/* 3. Vertical Y-axis Bounce */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>3. Vertical Drop (y)</div>
          <Bounce 
            property="y"
            from={-150} 
            to={0} 
            currentFrame={frame} 
            durationInFrames={60}
            intensity={0.2}
            bounces={2}
          >
            <Box text="Drop" color="#10b981" />
          </Bounce>
        </div>

        {/* 4. Horizontal X-axis Bounce */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>4. Horizontal (x)</div>
          <Bounce 
            property="x"
            from={-100} 
            to={0} 
            currentFrame={frame} 
            durationInFrames={60}
            intensity={0.15}
            bounces={2}
          >
            <Box text="Slide" color="#f59e0b" />
          </Bounce>
        </div>

        {/* 5. Rotate Bounce */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>5. Rotate Bounce</div>
          <Bounce 
            property="rotate"
            from={-90} 
            to={0} 
            currentFrame={frame} 
            durationInFrames={60}
            intensity={0.2}
            bounces={2}
          >
            <Box text="Rotate" color="#8b5cf6" />
          </Bounce>
        </div>

        {/* 6. Combo (Move + Fade + Bounce) */}
        <div style={{ height: 200, border: '1px dashed #ccc', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>6. Nested Combo</div>
          <Move
            from={{ x: 20, y: 50 }}
            to={{ x: 200, y: 50 }}
            currentFrame={frame}
            durationInFrames={60}
            easing="easeOut"
          >
            <Fade
              from={0}
              to={1}
              currentFrame={frame}
              durationInFrames={40}
              easing="easeInOut"
            >
              <Bounce
                property="scale"
                from={0.2}
                to={1.2}
                currentFrame={frame}
                durationInFrames={60}
                intensity={0.3}
                bounces={2}
              >
                <Box text="COMBO" color="#ec4899" />
              </Bounce>
            </Fade>
          </Move>
        </div>

      </div>
    </div>
  );
}
