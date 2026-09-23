'use client';

import React, { useState, useEffect } from 'react';
import { AnimatedArrow } from '@ai-content-manager/motion-components';

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
      <h1 className="text-3xl font-bold mb-4">AnimatedArrow Demo</h1>
      
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
          className="border border-gray-800 rounded-3xl overflow-hidden shadow-2xl shrink-0 bg-black flex flex-col gap-16 items-center justify-center p-8 relative" 
          style={{ width: '540px', height: '960px' }}
        >
          <div className="absolute top-20 text-gray-500 font-mono text-sm uppercase tracking-widest">
            Straight Arrow (Up Right)
          </div>
          <AnimatedArrow
            size={150}
            thickness={8}
            rotation={-45}
            color="#10b981" // Green
            animation={{ type: 'draw', durationInFrames: 60 }}
            currentFrame={frame}
          />

          <div className="absolute top-[400px] text-gray-500 font-mono text-sm uppercase tracking-widest">
            Curved Arrow (Downward)
          </div>
          <div className="mt-20">
            <AnimatedArrow
              size={200}
              thickness={6}
              curvature={100} // Bends downward
              rotation={45}
              color="#ef4444" // Red
              animation={{ type: 'draw', durationInFrames: 60 }}
              currentFrame={frame}
            />
          </div>

          <div className="absolute bottom-32 text-gray-500 font-mono text-sm uppercase tracking-widest">
            Subtle Curve (Connecting Data)
          </div>
          <div className="mt-20">
            <AnimatedArrow
              size={250}
              thickness={4}
              curvature={-50} // Bends upward
              rotation={0}
              color="#3b82f6" // Blue
              headSize={10}
              animation={{ type: 'draw', durationInFrames: 60 }}
              currentFrame={frame}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
