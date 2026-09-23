'use client';

import React, { useState, useEffect } from 'react';
import { PopInEffect, AnimatedKPI, AnimatedArrow } from '@ai-content-manager/motion-components';

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
    <div className="min-h-screen bg-gray-950 flex flex-col items-center text-white py-12 relative overflow-hidden">
      <h1 className="text-3xl font-bold mb-4 z-50">PopInEffect Demo</h1>
      
      <div className="mb-8 flex gap-4 z-50">
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

      <div className="flex flex-col gap-16 w-full max-w-4xl bg-gray-900 rounded-xl p-16 relative">
        
        {/* Demo 1: KPI Pop in Center */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-48 flex items-center justify-center">
          <PopInEffect
            durationInFrames={18}
            delayInFrames={10}
            scaleFrom={0.85}
            scaleTo={1}
            easing="backOut"
            direction="center"
            currentFrame={frame}
            fps={30}
          >
            <div className="w-64 h-32">
              <AnimatedKPI
                title="Revenue"
                value={2500000}
                format="currency"
                trend={12}
                currentFrame={60} // Pre-rendered content for pop
              />
            </div>
          </PopInEffect>
        </div>

        {/* Demo 2: Percentage popping in from Bottom */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-48 flex items-center justify-center bg-gray-800/50">
          <PopInEffect
            durationInFrames={20}
            delayInFrames={30}
            scaleFrom={0.6}
            scaleTo={1}
            easing="backOut"
            direction="bottom" // Slightly translates up while appearing
            currentFrame={frame}
          >
            <div className="bg-green-500/20 text-green-400 px-8 py-4 rounded-xl border border-green-500/30 text-5xl font-black">
              +25%
            </div>
          </PopInEffect>
        </div>

        {/* Demo 3: Icon/Arrow popping in from Left */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-48 flex items-center justify-center">
          <PopInEffect
            durationInFrames={25}
            delayInFrames={50}
            scaleFrom={0.2}
            scaleTo={1}
            easing="easeOut" // Smooth, no overshoot
            direction="left"
            currentFrame={frame}
          >
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-900/50">
              <div className="w-12 h-12">
                <AnimatedArrow
                  direction="up-right"
                  color="#ffffff"
                  thickness={6}
                  currentFrame={100} // Pre-drawn
                />
              </div>
            </div>
          </PopInEffect>
        </div>

      </div>
    </div>
  );
}
