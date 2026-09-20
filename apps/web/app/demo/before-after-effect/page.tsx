'use client';

import React, { useState, useEffect } from 'react';
import { BeforeAfterEffect, AnimatedKPI, AnimatedBarChart, AnimatedArrow } from '@ai-content-manager/motion-components';

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

  const beforeData = [
    { label: 'Q1', value: 320, color: '#ef4444' },
    { label: 'Q2', value: 450, color: '#ef4444' },
  ];

  const afterData = [
    { label: 'Q1', value: 320, color: '#9ca3af' },
    { label: 'Q2', value: 450, color: '#9ca3af' },
    { label: 'Q3', value: 890, color: '#3b82f6' },
    { label: 'Q4', value: 950, color: '#10b981' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center text-white py-12 relative overflow-hidden">
      <h1 className="text-3xl font-bold mb-4 z-50">BeforeAfterEffect Demo</h1>
      
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
        
        {/* Demo 1: KPI Comparison (Horizontal) */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-64 flex items-center justify-center">
          <BeforeAfterEffect
            width={400}
            height={200}
            direction="horizontal"
            durationInFrames={40}
            delayInFrames={10}
            showLabels={true}
            labelBefore="2025"
            labelAfter="2026"
            currentFrame={frame}
            before={
              <div className="w-full h-full bg-gray-900 border-2 border-dashed border-gray-700 rounded p-4 flex items-center justify-center grayscale opacity-50">
                <AnimatedKPI title="Annual Revenue" value={1200000} format="currency" trend={-2} currentFrame={60} />
              </div>
            }
            after={
              <div className="w-full h-full bg-gray-800 border-2 border-solid border-green-500 rounded p-4 flex items-center justify-center">
                <AnimatedKPI title="Annual Revenue" value={3400000} format="currency" trend={15.4} currentFrame={60} />
              </div>
            }
          />
        </div>

        {/* Demo 2: Chart Reveal (Vertical) */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-96 flex items-center justify-center">
          <BeforeAfterEffect
            width="100%"
            height={300}
            direction="vertical"
            durationInFrames={50}
            delayInFrames={30}
            showLabels={true}
            labelBefore="Before AI"
            labelAfter="After AI Integration"
            currentFrame={frame}
            before={
              <div className="w-full h-full bg-gray-950 p-8 flex items-center justify-center grayscale">
                <AnimatedBarChart data={beforeData} width="100%" height="100%" maxValue={1000} currentFrame={60} />
              </div>
            }
            after={
              <div className="w-full h-full bg-gray-900 p-8 flex items-center justify-center">
                <AnimatedBarChart data={afterData} width="100%" height="100%" maxValue={1000} currentFrame={60} />
              </div>
            }
          />
        </div>

        {/* Demo 3: UI Transformation (Horizontal) */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-64 flex items-center justify-center">
          <BeforeAfterEffect
            width={600}
            height={200}
            direction="horizontal"
            durationInFrames={35}
            delayInFrames={50}
            showLabels={false}
            dividerWidth={4}
            currentFrame={frame}
            before={
              <div className="w-full h-full bg-red-950 flex flex-col items-center justify-center rounded-xl text-red-500 font-bold text-3xl">
                Manual Verification
                <div className="w-16 h-16 mt-4 opacity-50">
                  <AnimatedArrow direction="right" color="#ef4444" thickness={6} currentFrame={60} />
                </div>
              </div>
            }
            after={
              <div className="w-full h-full bg-green-950 flex flex-col items-center justify-center rounded-xl text-green-400 font-bold text-3xl">
                Instant Processing
                <div className="w-16 h-16 mt-4">
                  <AnimatedArrow direction="up-right" color="#10b981" thickness={6} currentFrame={60} />
                </div>
              </div>
            }
          />
        </div>

      </div>
    </div>
  );
}
