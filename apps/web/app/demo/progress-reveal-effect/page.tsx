'use client';

import React, { useState, useEffect } from 'react';
import { ProgressRevealEffect, AnimatedBarChart, AnimatedCounter } from '@ai-content-manager/motion-components';

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

  const chartData = [
    { label: 'Q1', value: 200, color: '#3b82f6' },
    { label: 'Q2', value: 450, color: '#3b82f6' },
    { label: 'Q3', value: 890, color: '#3b82f6' },
    { label: 'Q4', value: 950, color: '#3b82f6' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center text-white py-12 relative overflow-hidden">
      <h1 className="text-3xl font-bold mb-4 z-50">ProgressRevealEffect Demo</h1>
      
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
        
        {/* Demo 1: Progress Bar (left-to-right) */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex flex-col items-center justify-center">
          <div className="flex justify-between w-full max-w-md mb-2 text-gray-400 font-bold">
            <span>Market Share</span>
            <AnimatedCounter 
              value={68} 
              durationInFrames={40}
              delayInFrames={10}
              currentFrame={frame}
              suffix="%" 
            />
          </div>
          
          <div className="w-full max-w-md h-8 bg-gray-800 rounded-full overflow-hidden relative">
            <ProgressRevealEffect
              direction="left-to-right"
              durationInFrames={40}
              delayInFrames={10}
              toProgress={0.68}
              currentFrame={frame}
              width="100%"
              height="100%"
            >
              {/* This is the EXISTING child being revealed */}
              <div className="w-full h-full bg-blue-500 rounded-full" />
            </ProgressRevealEffect>
          </div>
        </div>

        {/* Demo 2: Percentage / Loading Visual (bottom-to-top) */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex items-center justify-center gap-8">
          <div className="w-32 h-48 border-4 border-gray-800 rounded-xl relative overflow-hidden bg-gray-950">
            <ProgressRevealEffect
              direction="bottom-to-top"
              durationInFrames={50}
              delayInFrames={30}
              toProgress={0.82}
              currentFrame={frame}
              width="100%"
              height="100%"
            >
              <div className="w-full h-full bg-green-500" />
            </ProgressRevealEffect>
          </div>
          <div className="flex flex-col text-green-400 font-bold text-4xl">
            <AnimatedCounter 
              value={82} 
              durationInFrames={50}
              delayInFrames={30}
              currentFrame={frame}
              suffix="%" 
            />
            <span className="text-gray-500 text-sm mt-2">Funding Secured</span>
          </div>
        </div>

        {/* Demo 3: Chart Fill (right-to-left wipe) */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-96 flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold mb-4 text-gray-400">Quarterly Breakdown</h2>
          
          {/* Background Empty Chart */}
          <div className="absolute inset-8 pt-16 flex items-center justify-center opacity-20 grayscale pointer-events-none">
            <AnimatedBarChart data={chartData} width="100%" height="100%" maxValue={1000} currentFrame={60} />
          </div>

          {/* Progress Reveal of the Colored Chart */}
          <ProgressRevealEffect
            direction="left-to-right"
            durationInFrames={60}
            delayInFrames={15}
            currentFrame={frame}
            width="100%"
            height="100%"
          >
            <div className="w-full h-full flex items-center justify-center">
              <AnimatedBarChart data={chartData} width="100%" height="100%" maxValue={1000} currentFrame={60} />
            </div>
          </ProgressRevealEffect>
        </div>

      </div>
    </div>
  );
}
