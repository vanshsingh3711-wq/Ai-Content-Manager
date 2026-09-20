"use client";

import React, { useState, useEffect } from 'react';
import { Morph } from '@ai-content-manager/motion-components/src/animations/morph/Morph';

export default function MorphDemoPage() {
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

  // Square -> Triangle -> Square compatible paths
  const SQUARE_PATH = "M 10 10 L 90 10 L 90 90 L 10 90 Z";
  const TRIANGLE_PATH = "M 50 10 L 90 90 L 10 90 L 50 10 Z"; // Same 4 points (starting top-mid, right, left, top-mid again)

  // Arrow up -> Arrow down (same number of commands)
  const ARROW_UP = "M 50 10 L 90 50 L 70 50 L 70 90 L 30 90 L 30 50 L 10 50 Z";
  const ARROW_DOWN = "M 50 90 L 90 50 L 70 50 L 70 10 L 30 10 L 30 50 L 10 50 Z";

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1>Morph Primitive Demo</h1>
      <p>Current Frame: {frame} (Loops every 150 frames)</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 40 }}>
        
        {/* 1. Square to Triangle */}
        <div style={{ height: 250, border: '1px dashed #ccc', padding: 20, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold', color: '#64748b' }}>1. Simple Morph (Square to Triangle)</div>
          
          <svg width="100" height="100" viewBox="0 0 100 100">
            <Morph 
              from={SQUARE_PATH} 
              to={TRIANGLE_PATH} 
              delayInFrames={30} 
              durationInFrames={40} 
              currentFrame={frame} 
              easing="easeInOut"
            >
              <path fill="#3b82f6" />
            </Morph>
          </svg>
        </div>

        {/* 2. Arrow Up to Arrow Down */}
        <div style={{ height: 250, border: '1px dashed #ccc', padding: 20, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold', color: '#64748b' }}>2. Arrow Reversal</div>
          
          <svg width="100" height="100" viewBox="0 0 100 100">
            <Morph 
              from={ARROW_UP} 
              to={ARROW_DOWN} 
              delayInFrames={20} 
              durationInFrames={60} 
              currentFrame={frame} 
              easing="easeInOut"
            >
              <path fill="#ef4444" stroke="#7f1d1d" strokeWidth="2" strokeLinejoin="round" />
            </Morph>
          </svg>
        </div>

        {/* 3. Fast Morph (Bouncy effect simulated via easeOut) */}
        <div style={{ height: 250, border: '1px dashed #ccc', padding: 20, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold', color: '#64748b' }}>3. Fast Morph (easeOut)</div>
          
          <svg width="100" height="100" viewBox="0 0 100 100">
            <Morph 
              from={SQUARE_PATH} 
              to={TRIANGLE_PATH} 
              delayInFrames={30} 
              durationInFrames={15} 
              currentFrame={frame} 
              easing="easeOut"
            >
              <path fill="#10b981" />
            </Morph>
          </svg>
        </div>

        {/* 4. Incompatible Fallback Test */}
        <div style={{ height: 250, border: '1px dashed #ccc', padding: 20, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold', color: '#64748b' }}>4. Incompatible Path (Graceful Fallback)</div>
          
          <svg width="100" height="100" viewBox="0 0 100 100">
            <Morph 
              from={SQUARE_PATH} 
              to={"M 50 50 C 100 50 100 100 50 100 Z"} // Invalid length/commands compared to Square
              delayInFrames={30} 
              durationInFrames={40} 
              currentFrame={frame} 
            >
              <path fill="#f59e0b" />
            </Morph>
          </svg>
          <div style={{ position: 'absolute', bottom: 10, left: 10, fontSize: 10, color: '#94a3b8' }}>
            Remains a square because the target path commands (C instead of L) are structurally incompatible.
          </div>
        </div>

      </div>
    </div>
  );
}
