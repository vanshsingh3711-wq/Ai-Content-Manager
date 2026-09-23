"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { 
  TimingConfig,
  resolveTimingState,
  getSceneDuration
} from '@ai-content-manager/motion-components/src/timing';

// Note: For the demo, we are mocking the animation primitives to show how Timing connects to them.
const MOCK_FPS = 30;

type DemoElement = {
  id: string;
  color: string;
  timing: TimingConfig;
  y: number;
};

const ELEMENTS: DemoElement[] = [
  {
    id: 'Title',
    color: '#3b82f6',
    y: 50,
    timing: { startFrame: 0, durationInFrames: 150, enter: { durationInFrames: 15 }, exit: { durationInFrames: 15 } }
  },
  {
    id: 'Chart',
    color: '#f59e0b',
    y: 120,
    timing: { startFrame: 30, durationInFrames: 120, enter: { durationInFrames: 20 }, exit: { durationInFrames: 15 } }
  },
  {
    id: 'Caption',
    color: '#10b981',
    y: 190,
    timing: { startFrame: 60, durationInFrames: 90, enter: { durationInFrames: 10 }, exit: { durationInFrames: 15 } }
  },
  {
    id: 'Group_Item_1',
    color: '#8b5cf6',
    y: 280,
    // Group starts at 90, so effective start is 90. Duration 60 ends at 150.
    timing: { startFrame: 0, durationInFrames: 60, enter: { durationInFrames: 10 }, exit: { durationInFrames: 15 } }
  },
  {
    id: 'Group_Item_2',
    color: '#8b5cf6',
    y: 350,
    // Group starts at 90. Delay 15 means effective start is 105. Duration 45 ends at 150.
    timing: { startFrame: 0, delayInFrames: 15, durationInFrames: 45, enter: { durationInFrames: 10 }, exit: { durationInFrames: 15 } }
  },
];

const SCENE_DURATION = getSceneDuration(ELEMENTS as any); // Approx 150

export default function TimingDemoPage() {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Playback Loop
  useEffect(() => {
    if (!isPlaying) return;
    
    let animationId: number;
    let lastTime = Date.now();
    
    const loop = () => {
      const now = Date.now();
      const elapsed = now - lastTime;
      
      if (elapsed > (1000 / MOCK_FPS)) {
        setFrame(f => {
          if (f >= SCENE_DURATION + 30) return 0; // Loop with 30 frame padding
          return f + 1;
        });
        lastTime = now;
      }
      animationId = requestAnimationFrame(loop);
    };
    
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying]);

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', gap: 40 }}>
      
      {/* Controls */}
      <div style={{ width: 350, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h1>Timing System</h1>
        
        <div style={{ padding: 20, backgroundColor: 'white', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10, fontFamily: 'monospace' }}>
            Frame: {frame.toString().padStart(3, '0')}
          </div>
          
          <input 
            type="range" 
            min="0" 
            max={SCENE_DURATION + 30} 
            value={frame} 
            onChange={(e) => {
              setFrame(parseInt(e.target.value));
              setIsPlaying(false);
            }} 
            style={{ width: '100%' }}
          />

          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <button onClick={() => setIsPlaying(!isPlaying)} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button onClick={() => setFrame(0)} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              Reset
            </button>
          </div>
        </div>
        
        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, backgroundColor: '#e2e8f0', padding: 15, borderRadius: 8 }}>
          <strong>Notice:</strong><br/>
          - The Timing System resolves states (`entering`, `visible`, `exiting`) entirely based on the global frame scrubber.<br/>
          - It computes normalized 0-1 `enterProgress` and `exitProgress` values.<br/>
          - The visual scaling and fading below is done by manually wiring those 0-1 progress values into inline CSS, proving that the Timing engine handles time, while the rendering engine handles pixels!
        </div>
      </div>

      {/* Canvas */}
      <div style={{ 
        position: 'relative', 
        width: 600, 
        height: 500,
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {ELEMENTS.map(el => {
          // GROUP OFFSET MOCK:
          // If the element is a Group Item, we'll pretend it's inside a group that started at frame 90
          const groupOffset = el.id.startsWith('Group') ? 90 : 0;
          
          // RESOLVE TIMING
          const timing = resolveTimingState(frame, el.timing, groupOffset);

          // If completely outside the lifecycle, unmount (or hide)
          if (timing.state === 'before' || timing.state === 'after') {
            return null;
          }

          // ANIMATION MOCK: Convert progress values into physical styles
          // - enterProgress (0->1) drives opacity and a Y slide
          // - exitProgress (0->1) drives opacity and scale down
          
          const opacity = (timing.enterProgress) * (1 - timing.exitProgress);
          const translateY = (1 - timing.enterProgress) * 20; // Slide up 20px on enter
          const scale = 1 - (timing.exitProgress * 0.2); // Shrink 20% on exit

          return (
            <div 
              key={el.id}
              style={{
                position: 'absolute',
                left: 50,
                top: el.y,
                width: 500,
                height: 50,
                backgroundColor: el.color,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 20,
                color: 'white',
                fontWeight: 'bold',
                borderRadius: 8,
                // Apply the purely mathematical progress values as visual transforms
                opacity: opacity,
                transform: `translateY(${translateY}px) scale(${scale})`,
              }}
            >
              {el.id} 
              <span style={{ marginLeft: 20, fontSize: 12, opacity: 0.8, fontFamily: 'monospace' }}>
                State: {timing.state} | Local Frame: {timing.localFrame} 
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
