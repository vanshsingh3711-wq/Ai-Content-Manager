'use client';

import React, { useState, useEffect } from 'react';
import { AnimatedLineChart } from '@ai-content-manager/motion-components';

export default function DemoPage() {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Realistic example data
  const data = [
    { label: '2021', value: 40 },
    { label: '2022', value: 55 },
    { label: '2023', value: 72 },
    { label: '2024', value: 91 },
  ];

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
        
        if (currentFrameDecimal >= duration + 30) {
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
      <h1 className="text-3xl font-bold mb-4">AnimatedLineChart Demo</h1>
      
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
          className="border border-gray-800 rounded-3xl overflow-hidden shadow-2xl shrink-0 bg-black flex items-center justify-center" 
          style={{ width: '540px', height: '960px' }}
        >
          <AnimatedLineChart
            width={540}
            height={960}
            data={data}
            title="Portfolio Value"
            subtitle="Historical growth (in thousands)"
            maxValue={100}
            animation={{
              type: 'draw',
              durationInFrames: 60,
              delayInFrames: 5,
            }}
            currentFrame={frame}
            fps={fps}
            typography={{
              titleSize: 24,
              labelSize: 14,
              valueSize: 16
            }}
            style={{
              background: '#0a0a0a',
              lineColor: '#10b981', // green line
              pointColor: '#10b981',
              textColor: '#ffffff',
              secondaryTextColor: '#9ca3af',
              gridColor: '#1f2937'
            }}
          />
        </div>
      </div>
    </div>
  );
}
