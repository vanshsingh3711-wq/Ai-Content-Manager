'use client';

import React, { useState, useEffect } from 'react';
import { RedactRevealEffect, AnimatedKPI } from '@ai-content-manager/motion-components';

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
      <h1 className="text-3xl font-bold mb-4 z-50">RedactRevealEffect Demo</h1>
      
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
        
        {/* Demo 1: Redacting a big financial number (mask mode) */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex flex-col items-center justify-center">
          <div className="text-sm font-bold text-gray-500 mb-4">Mask Mode (left-to-right)</div>
          <RedactRevealEffect
            direction="left-to-right"
            durationInFrames={30}
            delayInFrames={15}
            revealMode="mask"
            redactionColor="#111827"
            currentFrame={frame}
            width={350}
            height={100}
          >
            <div className="w-full h-full flex items-center justify-center text-7xl font-black text-green-500">
              $4.8B
            </div>
          </RedactRevealEffect>
        </div>

        {/* Demo 2: Redacting a KPI card (wipe mode) */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex flex-col items-center justify-center">
          <div className="text-sm font-bold text-gray-500 mb-4">Wipe Mode with opacity (top-to-bottom)</div>
          <RedactRevealEffect
            direction="top-to-bottom"
            durationInFrames={40}
            delayInFrames={30}
            revealMode="wipe"
            redactionColor="#ef4444" // red
            redactionOpacity={0.8} // You can vaguely see it before reveal
            currentFrame={frame}
            width={300}
            height={150}
          >
            <div className="w-full h-full bg-gray-800 p-4 rounded-xl border border-gray-700">
              <AnimatedKPI
                title="Q3 Loss"
                value={450000}
                format="currency"
                trend={-12.4}
                currentFrame={60} 
              />
            </div>
          </RedactRevealEffect>
        </div>

        {/* Demo 3: Guess the Company (right-to-left mask) */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex flex-col items-center justify-center">
          <div className="text-sm font-bold text-gray-500 mb-4">Mask Mode (right-to-left)</div>
          <h2 className="text-3xl mb-4">Acquisition Target:</h2>
          <RedactRevealEffect
            direction="right-to-left"
            durationInFrames={25}
            delayInFrames={50}
            revealMode="mask"
            redactionColor="#ffffff" // white redaction tape
            currentFrame={frame}
            width={400}
            height={60}
          >
            <div className="w-full h-full flex items-center justify-center bg-gray-800 text-3xl font-mono text-white">
              OpenAI
            </div>
          </RedactRevealEffect>
        </div>

      </div>
    </div>
  );
}
