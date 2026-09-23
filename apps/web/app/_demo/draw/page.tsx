"use client";

import React, { useState, useEffect } from 'react';
import { Draw } from '@ai-content-manager/motion-components/src/animations/draw/Draw';
import { Fade } from '@ai-content-manager/motion-components/src/animations/fade/Fade';
import { Scale } from '@ai-content-manager/motion-components/src/animations/scale/Scale';

export default function DrawDemoPage() {
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

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1>Draw Primitive Demo (Path & Hand modes)</h1>
      <p>Current Frame: {frame} (Loops every 150 frames)</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40, marginTop: 40 }}>
        
        {/* 1. Clean Path Draw */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>1. Clean Line Draw</div>
          <Draw mode="path" currentFrame={frame} durationInFrames={60}>
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="40" stroke="#3b82f6" strokeWidth="4" />
              <path d="M 30 50 L 45 65 L 75 35" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Draw>
        </div>

        {/* 2. Reverse Draw */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>2. Reverse Draw (Erase)</div>
          <Draw mode="path" direction="reverse" currentFrame={frame} durationInFrames={60}>
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
              <rect x="20" y="20" width="60" height="60" stroke="#ef4444" strokeWidth="4" rx="8" />
            </svg>
          </Draw>
        </div>

        {/* 3. Multi-path Draw */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>3. Multi-Path Diagram</div>
          <Draw mode="path" currentFrame={frame} durationInFrames={80} easing="linear">
            <svg width="150" height="100" viewBox="0 0 150 100" fill="none">
              <path d="M 10 90 L 140 90" stroke="#64748b" strokeWidth="2" />
              <path d="M 20 90 L 20 50 L 50 50 L 50 90" stroke="#10b981" strokeWidth="4" />
              <path d="M 60 90 L 60 30 L 90 30 L 90 90" stroke="#10b981" strokeWidth="4" />
              <path d="M 100 90 L 100 10 L 130 10 L 130 90" stroke="#10b981" strokeWidth="4" />
            </svg>
          </Draw>
        </div>

        {/* 4. Hand-drawn Arrow */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>4. Hand-Drawn Arrow</div>
          <Draw 
            mode="hand" 
            hand={{ wobble: 0.15, speedVariation: 0.2 }}
            currentFrame={frame} 
            durationInFrames={60}
          >
            <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
              <path d="M 10 40 Q 60 10 110 40" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 90 20 L 110 40 L 90 60" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Draw>
        </div>

        {/* 5. Strong Wobble Circle */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>5. Strong Wobble Circle</div>
          <Draw 
            mode="hand" 
            hand={{ wobble: 0.35, speedVariation: 0.5 }}
            currentFrame={frame} 
            durationInFrames={80}
            easing="linear"
          >
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="40" stroke="#8b5cf6" strokeWidth="4" />
            </svg>
          </Draw>
        </div>

        {/* 6. Combo Nested Draw */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>6. Draw + Scale + Fade</div>
          <Fade from={0} to={1} durationInFrames={40} currentFrame={frame}>
            <Scale from={0.5} to={1} durationInFrames={40} currentFrame={frame}>
              <Draw 
                mode="hand" 
                hand={{ wobble: 0.1, speedVariation: 0.1 }}
                currentFrame={frame} 
                delayInFrames={20}
                durationInFrames={50}
              >
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                  <path d="M 60 10 L 110 110 L 10 110 Z" stroke="#ec4899" strokeWidth="4" strokeLinejoin="round" />
                </svg>
              </Draw>
            </Scale>
          </Fade>
        </div>

      </div>
    </div>
  );
}
