"use client";

import React, { useState, useEffect } from 'react';
import { Typewriter } from '@ai-content-manager/motion-components/src/animations/typewriter/Typewriter';

export default function TypewriterDemoPage() {
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
      <h1>Typewriter Primitive Demo</h1>
      <p>Current Frame: {frame} (Loops every 150 frames)</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40, marginTop: 40 }}>
        
        {/* 1. Normal Typewriter */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 20 }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>1. Normal</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#333' }}>
            <Typewriter text="Welcome to the AI editor!" currentFrame={frame} durationInFrames={60} cursor={{ enabled: true }} />
          </div>
        </div>

        {/* 2. Fast Typing */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 20 }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>2. Fast (15 frames)</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#10b981' }}>
            <Typewriter text="Rapid deployment initialized." currentFrame={frame} durationInFrames={15} cursor={{ enabled: true, character: '█' }} />
          </div>
        </div>

        {/* 3. Slow Typing */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 20 }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>3. Slow with easeInOut</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#3b82f6' }}>
            <Typewriter text="Thinking deeply..." currentFrame={frame} durationInFrames={120} easing="easeInOut" cursor={{ enabled: true }} />
          </div>
        </div>

        {/* 4. Reverse / Delete */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 20 }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>4. Reverse (Delete Mode)</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ef4444' }}>
            <Typewriter text="Mistakes were made." direction="reverse" currentFrame={frame} durationInFrames={60} cursor={{ enabled: true }} />
          </div>
        </div>

        {/* 5. Multiline Text */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', position: 'relative', padding: 40 }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>5. Multiline Text</div>
          <div style={{ fontSize: 18, color: '#64748b', fontFamily: 'monospace' }}>
            <Typewriter text={"Line 1: Status OK\nLine 2: Systems Nominal\nLine 3: Boot Sequence Complete"} currentFrame={frame} durationInFrames={90} cursor={{ enabled: true }} />
          </div>
        </div>

        {/* 6. Emoji / Grapheme Safe */}
        <div style={{ height: 200, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 20 }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold' }}>6. Emoji / Grapheme Safe</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f59e0b' }}>
            <Typewriter text="👨‍👩‍👧‍👦 Hello world 👋🏽" currentFrame={frame} durationInFrames={60} cursor={{ enabled: true, character: '_' }} />
          </div>
        </div>

      </div>
    </div>
  );
}
