'use client';

import React, { useState, useEffect } from 'react';
import { FreezeHighlightEffect, AnimatedLineChart } from '@ai-content-manager/motion-components';

export default function DemoPage() {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Total animation timeline:
  const duration = 150; 
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


  const stockData = [
    { label: 'Jan', value: 120 },
    { label: 'Feb', value: 135 },
    { label: 'Mar', value: 128 },
    { label: 'Apr', value: 196 }, // highlight point
    { label: 'May', value: 142 },
    { label: 'Jun', value: 180 },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center text-white py-12 relative overflow-hidden font-sans">
      <h1 className="text-3xl font-bold mb-4 z-50">FreezeHighlightEffect Demo</h1>
      
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

      <div className="grid grid-cols-2 gap-8 w-full max-w-6xl p-8 relative">
        
        {/* Demo 1: Highlighting a KPI */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex flex-col items-center bg-gray-900 overflow-hidden min-h-[400px]">
          <div className="absolute top-4 left-4 text-sm font-bold text-gray-500 z-50 bg-gray-900/80 px-2 rounded">
            1. KPI Highlight (Fade Mode)
          </div>
          
          <div className="w-full flex gap-4 justify-between mt-12 opacity-80">
            <div className="p-4 bg-gray-800 rounded flex-1"><div className="text-sm">Revenue</div><div className="text-2xl font-bold">$1.2B</div></div>
            <div className="p-4 bg-gray-800 rounded flex-1"><div className="text-sm">Users</div><div className="text-2xl font-bold">4.2M</div></div>
            <div className="p-4 bg-gray-800 rounded flex-1"><div className="text-sm">Churn</div><div className="text-2xl font-bold">1.2%</div></div>
          </div>

          <div className="mt-16 w-full flex justify-center">
            <FreezeHighlightEffect
              delayInFrames={30}
              durationInFrames={60}
              animation="fade"
              overlayOpacity={0.85}
              padding={16}
              borderRadius={12}
              currentFrame={frame}
            >
              <div className="p-8 bg-blue-900/40 border border-blue-500 rounded-xl text-center">
                <div className="text-xl text-blue-200 mb-2">Net Profit (Q3)</div>
                <div className="text-6xl font-black text-white">$4.8B</div>
              </div>
            </FreezeHighlightEffect>
          </div>
        </div>

        {/* Demo 2: Highlighting a Chart Region with Glow */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex flex-col items-center bg-gray-900 overflow-hidden min-h-[400px]">
          <div className="absolute top-4 left-4 text-sm font-bold text-gray-500 z-50 bg-gray-900/80 px-2 rounded">
            2. Chart Highlight (Instant + Glow)
          </div>
          
          <div className="w-full h-full flex flex-col items-center justify-center mt-8">
            <div className="relative">
              <AnimatedLineChart data={stockData} width={400} height={200} maxValue={220} currentFrame={100} />
              
              {/* Highlight specifically the April spike area via absolute positioning */}
              <FreezeHighlightEffect
                x={210}
                y={20}
                width={80}
                height={160}
                delayInFrames={40}
                durationInFrames={50}
                animation="instant"
                overlayOpacity={0.7}
                glow={true}
                glowColor="#3b82f6" // blue
                glowRadius={25}
                borderRadius={8}
                padding={10}
                currentFrame={frame}
              >
                {/* Empty children because the background chart is what's being highlighted! */}
              </FreezeHighlightEffect>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
