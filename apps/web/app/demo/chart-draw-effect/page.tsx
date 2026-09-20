'use client';

import React, { useState, useEffect } from 'react';
import { ChartDrawEffect, AnimatedLineChart, AnimatedBarChart } from '@ai-content-manager/motion-components';

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

  const stockData = [
    { label: 'Jan', value: 120 },
    { label: 'Feb', value: 135 },
    { label: 'Mar', value: 128 },
    { label: 'Apr', value: 156 },
    { label: 'May', value: 142 },
    { label: 'Jun', value: 180 },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center text-white py-12 relative overflow-hidden font-sans">
      <h1 className="text-3xl font-bold mb-4 z-50">ChartDrawEffect Demo</h1>
      
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
        
        {/* Demo 1: Line Chart draw left to right */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex flex-col h-96">
          <div className="text-sm font-bold text-gray-500 mb-2">Line Chart Draw (left-to-right)</div>
          
          <ChartDrawEffect
            direction="left-to-right"
            durationInFrames={60}
            delayInFrames={10}
            currentFrame={frame}
            width="100%"
            height="100%"
          >
            {/* The chart is completely unaffected by the wrapper, it renders normally as if frame = 60 */}
            <div className="w-full h-full flex items-center justify-center pt-8">
              <AnimatedLineChart data={stockData} width={760} height={280} maxValue={200} currentFrame={100} />
            </div>
          </ChartDrawEffect>
        </div>

        {/* Demo 2: Bar Chart wipe right to left with opacity */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex flex-col h-96">
          <div className="text-sm font-bold text-gray-500 mb-2">Bar Chart Wipe (right-to-left) with Fade In</div>
          
          <ChartDrawEffect
            direction="right-to-left"
            durationInFrames={45}
            delayInFrames={30} // Delayed start
            opacityFrom={0}
            opacityTo={1}
            currentFrame={frame}
            width="100%"
            height="100%"
          >
            <div className="w-full h-full flex items-center justify-center pt-8">
              <AnimatedBarChart data={stockData} width={760} height={280} maxValue={200} currentFrame={100} />
            </div>
          </ChartDrawEffect>
        </div>

      </div>
    </div>
  );
}
