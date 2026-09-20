'use client';

import React, { useState, useEffect } from 'react';
import { UnderlineEffect, AnimatedKPI } from '@ai-content-manager/motion-components';

export default function DemoPage() {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Total animation timeline:
  const duration = 120; 
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
        
        if (currentFrameDecimal >= duration) {
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
    <div className="min-h-screen bg-gray-950 flex flex-col items-center text-white py-12">
      <h1 className="text-3xl font-bold mb-4">UnderlineEffect Demo</h1>
      
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

      <div className="flex flex-col gap-16 w-full max-w-4xl bg-gray-900 rounded-xl p-16">
        
        {/* Demo 1: Solid */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-40 flex items-center">
          <div className="text-3xl font-bold relative z-[60]">
            Revenue increased by <span className="text-white">25%</span>
          </div>
          <UnderlineEffect
            x={31} // Measured approx relative to container for demo
            y={82}
            width={340}
            color="#ef4444"
            strokeWidth={4}
            animation="draw"
            style="solid"
            durationInFrames={30}
            delayInFrames={10}
            currentFrame={frame}
          />
        </div>

        {/* Demo 2: Marker */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-40 flex items-center">
          <div className="absolute top-8 left-8 w-64 h-32 z-[60]">
            <AnimatedKPI
              title="Q3 Performance"
              value={180}
              format="percentage"
              trend={12.5}
              currentFrame={60} // Keep static
            />
          </div>
          <UnderlineEffect
            x={32}
            y={85} // Underneath the title
            width={125}
            color="#3b82f6"
            opacity={0.8}
            strokeWidth={8}
            animation="draw-fade"
            style="marker"
            durationInFrames={40}
            delayInFrames={10}
            currentFrame={frame}
          />
        </div>

        {/* Demo 3: Hand-drawn */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-40 flex items-center justify-center">
          <div className="text-4xl font-serif italic text-gray-300 relative z-[60]">
            The Bottom Line
          </div>
          <UnderlineEffect
            x={310} // Approx center for 896px max-w (448 - 140)
            y={95}
            width={280}
            color="#f59e0b"
            strokeWidth={3}
            animation="draw"
            style="hand-drawn"
            durationInFrames={45}
            delayInFrames={20}
            currentFrame={frame}
          />
        </div>

      </div>
    </div>
  );
}
