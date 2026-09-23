'use client';

import React, { useState, useEffect } from 'react';
import { NumberChangeEffect } from '@ai-content-manager/motion-components';

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
    <div className="min-h-screen bg-gray-950 flex flex-col items-center text-white py-12 relative overflow-hidden font-sans">
      <h1 className="text-3xl font-bold mb-4 z-50">NumberChangeEffect Demo</h1>
      
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
        
        {/* Demo 1: Revenue */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex flex-col items-center justify-center">
          <div className="text-sm font-bold text-gray-500 mb-2">Revenue Growth ($2.4M → $3.8M)</div>
          <NumberChangeEffect
            from={2.4}
            to={3.8}
            decimals={1}
            prefix="$"
            suffix="M"
            durationInFrames={45}
            delayInFrames={15}
            currentFrame={frame}
            fontSize={64}
            fontWeight={900}
            color="#22c55e" // green-500
          />
        </div>

        {/* Demo 2: Percentage */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex flex-col items-center justify-center">
          <div className="text-sm font-bold text-gray-500 mb-2">Market Share (45% → 72%)</div>
          <NumberChangeEffect
            from={45}
            to={72}
            decimals={0}
            suffix="%"
            durationInFrames={30}
            delayInFrames={10}
            currentFrame={frame}
            fontSize={56}
            fontWeight={700}
            color="#3b82f6" // blue-500
          />
        </div>

        {/* Demo 3: Stock Price (decimals) */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex flex-col items-center justify-center">
          <div className="text-sm font-bold text-gray-500 mb-2">Stock Price ($120.50 → $156.25)</div>
          <NumberChangeEffect
            from={120.50}
            to={156.25}
            decimals={2}
            prefix="$"
            durationInFrames={60}
            delayInFrames={20}
            currentFrame={frame}
            fontSize={48}
            fontWeight={600}
            color="#eab308" // yellow-500
          />
        </div>

        {/* Demo 4: Negative change with prefix */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex flex-col items-center justify-center">
          <div className="text-sm font-bold text-gray-500 mb-2">Negative Balance ($5,000 → -$2,450)</div>
          <NumberChangeEffect
            from={5000}
            to={-2450}
            decimals={0}
            prefix="$"
            separator={true}
            durationInFrames={50}
            delayInFrames={15}
            currentFrame={frame}
            fontSize={48}
            fontWeight={700}
            color="#ef4444" // red-500
          />
        </div>

        {/* Demo 5: Massive Numbers */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex flex-col items-center justify-center">
          <div className="text-sm font-bold text-gray-500 mb-2">Active Users (1,250,000 → 2,800,000)</div>
          <NumberChangeEffect
            from={1250000}
            to={2800000}
            decimals={0}
            separator={true}
            durationInFrames={60}
            delayInFrames={30}
            currentFrame={frame}
            fontSize={56}
            fontWeight={900}
            color="#a855f7" // purple-500
          />
        </div>

      </div>
    </div>
  );
}
