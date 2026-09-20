"use client";

import React, { useState, useEffect } from 'react';
import { Parallax } from '@ai-content-manager/motion-components/src/animations/parallax/Parallax';

export default function ParallaxDemoPage() {
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

  // Use a large movement vector so parallax is obvious
  const FROM = { x: -200, y: 0 };
  const TO = { x: 200, y: 0 };
  const DURATION = 100;

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh', overflow: 'hidden' }}>
      <h1>Parallax Primitive Demo</h1>
      <p>Current Frame: {frame} (Loops every 150 frames)</p>
      
      <div style={{ marginTop: 40, position: 'relative', height: 400, border: '1px solid #ccc', backgroundColor: '#fff', overflow: 'hidden' }}>
        
        {/* Layer 1: Background (slowest) */}
        <Parallax currentFrame={frame} from={FROM} to={TO} durationInFrames={DURATION} depth={0.2} easing="easeInOut">
          <div style={{ position: 'absolute', top: 50, left: '50%', width: 100, height: 100, backgroundColor: '#cbd5e1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: -50, opacity: 0.5 }}>
            <span style={{ fontSize: 10 }}>Depth 0.2</span>
          </div>
        </Parallax>

        {/* Layer 2: Middle (medium speed) */}
        <Parallax currentFrame={frame} from={FROM} to={TO} durationInFrames={DURATION} depth={0.6} easing="easeInOut">
          <div style={{ position: 'absolute', top: 100, left: '50%', width: 80, height: 80, backgroundColor: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: -40, opacity: 0.8, transform: 'rotate(45deg)' }}>
            <span style={{ fontSize: 10, color: 'white', transform: 'rotate(-45deg)' }}>Depth 0.6</span>
          </div>
        </Parallax>

        {/* Layer 3: Object (normal speed) */}
        <Parallax currentFrame={frame} from={FROM} to={TO} durationInFrames={DURATION} depth={1} easing="easeInOut">
          <div style={{ position: 'absolute', top: 150, left: '50%', width: 120, height: 60, backgroundColor: '#3b82f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: -60, color: 'white', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            Depth 1.0 (Focus)
          </div>
        </Parallax>

        {/* Layer 4: Foreground (fastest) */}
        <Parallax currentFrame={frame} from={FROM} to={TO} durationInFrames={DURATION} depth={1.8} easing="easeInOut">
          <div style={{ position: 'absolute', top: 220, left: '50%', width: 150, height: 40, backgroundColor: '#0f172a', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: -75, color: 'white', fontWeight: 'bold', boxShadow: '0 10px 15px rgba(0,0,0,0.2)' }}>
            Depth 1.8 (Foreground)
          </div>
        </Parallax>
        
        <div style={{ position: 'absolute', bottom: 10, left: 10, fontSize: 12, color: '#94a3b8' }}>
          Notice how the layers move horizontally at different speeds, creating a 3D depth effect.
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 40 }}>
        {/* Y Axis Parallax */}
        <div style={{ height: 250, border: '1px dashed #ccc', padding: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold', color: '#64748b' }}>Y Axis Parallax (depth 0.5 vs 1.5)</div>
          <Parallax axis="y" currentFrame={frame} from={{x: 0, y: -50}} to={{x: 0, y: 50}} durationInFrames={80} depth={0.5} easing="easeInOut">
            <div style={{ position: 'absolute', top: '50%', left: 100, width: 40, height: 40, backgroundColor: '#94a3b8', borderRadius: '50%', marginTop: -20 }} />
          </Parallax>
          <Parallax axis="y" currentFrame={frame} from={{x: 0, y: -50}} to={{x: 0, y: 50}} durationInFrames={80} depth={1.5} easing="easeInOut">
            <div style={{ position: 'absolute', top: '50%', left: 150, width: 60, height: 60, backgroundColor: '#3b82f6', borderRadius: '50%', marginTop: -30 }} />
          </Parallax>
        </div>

        {/* Intensity multiplier */}
        <div style={{ height: 250, border: '1px dashed #ccc', padding: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold', color: '#64748b' }}>Intensity (depth 1, intensity 3)</div>
          <Parallax axis="both" currentFrame={frame} from={{x: -20, y: -20}} to={{x: 20, y: 20}} durationInFrames={60} depth={1} intensity={3} easing="easeOut">
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: 80, height: 80, backgroundColor: '#ec4899', borderRadius: 8, marginTop: -40, marginLeft: -40 }} />
          </Parallax>
        </div>
      </div>
    </div>
  );
}
