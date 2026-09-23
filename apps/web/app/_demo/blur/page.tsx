"use client";

import React, { useState, useEffect } from 'react';
import { Blur } from '@ai-content-manager/motion-components/src/animations/blur/Blur';
import { Fade } from '@ai-content-manager/motion-components/src/animations/fade/Fade';
import { Rotate } from '@ai-content-manager/motion-components/src/animations/rotate/Rotate';
import { Scale } from '@ai-content-manager/motion-components/src/animations/scale/Scale';
import { Move } from '@ai-content-manager/motion-components/src/animations/move/Move';

export default function BlurDemoPage() {
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
      <h1>Blur Primitive Demo</h1>
      <p>Current Frame: {frame} (Loops every 150 frames)</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40, marginTop: 40 }}>
        
        {/* 1. Sharp to Blurred */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>1. Blur In (0 → 12)</div>
          <Blur 
            from={0} 
            to={12} 
            currentFrame={frame} 
            durationInFrames={40}
            easing="easeOut"
          >
            <Box text="Focusing" color="#3b82f6" />
          </Blur>
        </div>

        {/* 2. Blurred to Sharp */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>2. Blur Out (12 → 0)</div>
          <Blur 
            from={12} 
            to={0} 
            currentFrame={frame} 
            durationInFrames={40}
            easing="easeIn"
          >
            <Box text="Clear" color="#ef4444" />
          </Blur>
        </div>

        {/* 3. Partial Blur */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>3. Partial Blur (20 → 5)</div>
          <Blur 
            from={20} 
            to={5} 
            currentFrame={frame} 
            durationInFrames={60}
            easing="easeInOut"
          >
            <Box text="Hazy" color="#10b981" />
          </Blur>
        </div>

        {/* 4. Delayed Blur */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>4. Delayed (Starts at frame 60)</div>
          <Blur 
            from={0} 
            to={10} 
            currentFrame={frame} 
            delayInFrames={60}
            durationInFrames={30}
            easing="easeOut"
          >
            <Box text="Delayed" color="#f59e0b" />
          </Blur>
        </div>

        {/* 5. Combo (All 5 Primitives) */}
        <div style={{ height: 200, border: '1px dashed #ccc', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>5. Nested (All 5 Primitives)</div>
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
                <Fade
                  from={0}
                  to={1}
                  currentFrame={frame}
                  durationInFrames={60}
                  easing="easeInOut"
                >
                  <Blur
                    from={20}
                    to={0}
                    currentFrame={frame}
                    durationInFrames={60}
                    easing="easeOut"
                  >
                    <Box text="ULTRA" color="#8b5cf6" />
                  </Blur>
                </Fade>
              </Rotate>
            </Scale>
          </Move>
        </div>

        {/* 6. Long Duration */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>6. Long Duration (120 frames)</div>
          <Blur 
            from={0} 
            to={20} 
            currentFrame={frame} 
            durationInFrames={120}
            easing="linear"
          >
            <Box text="Slow" color="#ec4899" />
          </Blur>
        </div>

      </div>
    </div>
  );
}
