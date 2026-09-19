'use client';

import React, { useState, useEffect } from 'react';
import { AnimatedKPI } from '@ai-content-manager/motion-components';

export default function DemoPage() {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const duration = 60; // 2 seconds at 30fps
  const fps = 30;

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let currentFrameDecimal = frame;

    const loop = (time: number) => {
      if (isPlaying) {
        const deltaTime = time - lastTime;
        const framesToAdvance = deltaTime / (1000 / fps);
        
        currentFrameDecimal += framesToAdvance;
        
        if (currentFrameDecimal >= duration + 40) {
          currentFrameDecimal = 0;
        }

        setFrame(Math.floor(currentFrameDecimal));
      }
      lastTime = time;
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, frame, duration, fps]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white py-12">
      <h1 className="text-3xl font-bold mb-4">AnimatedKPI Demo</h1>
      
      <div className="mb-8 flex gap-4">
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition cursor-pointer"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button 
          onClick={() => setFrame(0)}
          className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 transition cursor-pointer"
        >
          Reset
        </button>
        <div className="flex items-center px-4 py-2 bg-gray-800 rounded text-gray-400 font-mono">
          Frame: {frame.toString().padStart(3, '0')}
        </div>
      </div>

      <div className="flex gap-8 items-center justify-center w-full max-w-7xl overflow-auto">
        <div 
          className="border border-gray-800 rounded-3xl overflow-hidden shadow-2xl shrink-0 bg-black flex flex-col gap-12 items-center justify-center p-8" 
          style={{ width: '540px', height: '960px' }}
        >
          {/* Positive KPI */}
          <div>
            <AnimatedKPI
              width={400}
              height={200}
              title="Quarterly Revenue"
              value={1542000}
              startValue={500000}
              format="currency"
              changeValue={12.4}
              animation={{ type: 'slideUp', durationInFrames: 45, staggerInFrames: 5 }}
              currentFrame={frame}
              fps={fps}
            />
          </div>

          {/* Negative KPI */}
          <div>
            <AnimatedKPI
              width={400}
              height={200}
              title="Customer Churn"
              value={4.2}
              startValue={2}
              decimals={1}
              format="percentage"
              changeValue={-1.5}
              animation={{ type: 'slideUp', durationInFrames: 45, staggerInFrames: 5 }}
              currentFrame={frame}
              fps={fps}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
