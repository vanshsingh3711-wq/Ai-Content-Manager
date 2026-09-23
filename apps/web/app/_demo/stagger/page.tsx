"use client";

import React, { useState, useEffect } from 'react';
import { Stagger } from '@ai-content-manager/motion-components/src/animations/stagger/Stagger';
import { Fade } from '@ai-content-manager/motion-components/src/animations/fade/Fade';
import { Move } from '@ai-content-manager/motion-components/src/animations/move/Move';
import { Scale } from '@ai-content-manager/motion-components/src/animations/scale/Scale';

export default function StaggerDemoPage() {
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

  const Card = ({ title, value }: { title: string, value: string }) => (
    <div style={{ backgroundColor: 'white', padding: '10px 20px', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: 8, borderLeft: '4px solid #3b82f6', width: 200 }}>
      <div style={{ fontSize: 12, color: '#64748b' }}>{title}</div>
      <div style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a' }}>{value}</div>
    </div>
  );

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1>Stagger Primitive Demo</h1>
      <p>Current Frame: {frame} (Loops every 150 frames)</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 40 }}>
        
        {/* 1. Text List (Forward) */}
        <div style={{ height: 250, border: '1px dashed #ccc', padding: 20, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold', color: '#64748b' }}>1. Text List (Forward, stagger: 10)</div>
          <div style={{ marginTop: 40 }}>
            <Stagger currentFrame={frame} delayInFrames={10} staggerInFrames={10}>
              <Fade durationInFrames={20}>
                <Move from={{x: -20, y: 0}} to={{x: 0, y: 0}} durationInFrames={20}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Revenue ↑</div>
                </Move>
              </Fade>
              <Fade durationInFrames={20}>
                <Move from={{x: -20, y: 0}} to={{x: 0, y: 0}} durationInFrames={20}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Users ↑</div>
                </Move>
              </Fade>
              <Fade durationInFrames={20}>
                <Move from={{x: -20, y: 0}} to={{x: 0, y: 0}} durationInFrames={20}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Profit ↑</div>
                </Move>
              </Fade>
            </Stagger>
          </div>
        </div>

        {/* 2. Cards (Reverse) */}
        <div style={{ height: 250, border: '1px dashed #ccc', padding: 20, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold', color: '#64748b' }}>2. Cards (Reverse direction)</div>
          <div style={{ marginTop: 40 }}>
            <Stagger currentFrame={frame} delayInFrames={10} staggerInFrames={10} direction="reverse">
              <Fade durationInFrames={20}>
                <Move from={{x: 20, y: 0}} to={{x: 0, y: 0}} durationInFrames={20}>
                  <Card title="Q1 Performance" value="$12,000" />
                </Move>
              </Fade>
              <Fade durationInFrames={20}>
                <Move from={{x: 20, y: 0}} to={{x: 0, y: 0}} durationInFrames={20}>
                  <Card title="Q2 Performance" value="$15,500" />
                </Move>
              </Fade>
              <Fade durationInFrames={20}>
                <Move from={{x: 20, y: 0}} to={{x: 0, y: 0}} durationInFrames={20}>
                  <Card title="Q3 Performance" value="$21,000" />
                </Move>
              </Fade>
            </Stagger>
          </div>
        </div>

        {/* 3. Short Stagger (5 frames) */}
        <div style={{ height: 250, border: '1px dashed #ccc', padding: 20, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold', color: '#64748b' }}>3. Rapid Stagger (5 frames)</div>
          <div style={{ marginTop: 40, display: 'flex', gap: 10 }}>
            <Stagger currentFrame={frame} staggerInFrames={5}>
              {[1, 2, 3, 4, 5].map(i => (
                <Scale key={i} from={0} to={1} durationInFrames={20}>
                  <Fade durationInFrames={20}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>{i}</div>
                  </Fade>
                </Scale>
              ))}
            </Stagger>
          </div>
        </div>

        {/* 4. Eased Stagger (easeIn speeds up the stagger) */}
        <div style={{ height: 250, border: '1px dashed #ccc', padding: 20, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12, fontWeight: 'bold', color: '#64748b' }}>4. Eased Stagger (easeIn starts slow, ends fast)</div>
          <div style={{ marginTop: 40, display: 'flex', gap: 10 }}>
            <Stagger currentFrame={frame} staggerInFrames={15} easing="easeIn">
              {[1, 2, 3, 4, 5].map(i => (
                <Scale key={i} from={0} to={1} durationInFrames={20}>
                  <Fade durationInFrames={20}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>{i}</div>
                  </Fade>
                </Scale>
              ))}
            </Stagger>
          </div>
        </div>

      </div>
    </div>
  );
}
