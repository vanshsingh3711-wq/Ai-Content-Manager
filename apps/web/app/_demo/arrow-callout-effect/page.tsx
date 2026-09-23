'use client';

import React, { useState, useEffect } from 'react';
import { ArrowCalloutEffect, AnimatedKPI, AnimatedBarChart } from '@ai-content-manager/motion-components';

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

  const mockData = [
    { label: 'Q1', value: 320, color: '#9ca3af' },
    { label: 'Q2', value: 450, color: '#9ca3af' },
    { label: 'Q3', value: 890, color: '#3b82f6' }, // Target!
    { label: 'Q4', value: 650, color: '#9ca3af' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center text-white py-12 relative overflow-hidden">
      <h1 className="text-3xl font-bold mb-4 z-50">ArrowCalloutEffect Demo</h1>
      
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
        
        {/* Demo 1: Straight arrow pointing to negative trend */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-48 flex items-center justify-between">
          <div className="text-3xl font-bold z-[60]">
            Revenue dropped
          </div>
          <div className="w-48 h-32 relative z-[60]">
            <AnimatedKPI
              title="Monthly Revenue"
              value={420000}
              format="currency"
              trend={-20.5}
              currentFrame={60} // Keep static
            />
          </div>
          <ArrowCalloutEffect
            fromX={280} 
            fromY={96}
            toX={650}
            toY={96}
            color="#ef4444"
            strokeWidth={4}
            headSize={14}
            style="straight"
            animation="draw"
            durationInFrames={30}
            delayInFrames={10}
            currentFrame={frame}
          />
        </div>

        {/* Demo 2: Curved arrow pointing to a chart */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-80 flex items-center justify-between">
          <div className="text-3xl font-bold italic text-gray-400 w-1/3 z-[60]">
            Massive spike in Q3 due to product launch
          </div>
          <div className="w-1/2 h-64 relative z-[60]">
            <AnimatedBarChart
              data={mockData}
              width="100%"
              height="100%"
              maxValue={1000}
              currentFrame={60} // Keep static
            />
          </div>
          <ArrowCalloutEffect
            fromX={220} // From text
            fromY={100}
            toX={620} // To Q3 bar
            toY={80}
            color="#3b82f6"
            strokeWidth={4}
            headSize={16}
            style="curved"
            curvature={-0.3} // Curve upwards
            animation="draw-fade"
            durationInFrames={40}
            delayInFrames={20}
            currentFrame={frame}
          />
        </div>

        {/* Demo 3: Diagonal straight arrow */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-48 flex flex-col justify-between items-center">
          <div className="text-xl font-bold text-gray-500 z-[60] absolute top-8 left-16">
            Source Metric
          </div>
          <div className="text-xl font-bold text-green-400 z-[60] absolute bottom-8 right-16">
            Target Outcome
          </div>
          <ArrowCalloutEffect
            fromX={160}
            fromY={56}
            toX={700}
            toY={140}
            color="#10b981"
            strokeWidth={3}
            headSize={12}
            style="straight"
            animation="draw"
            durationInFrames={25}
            delayInFrames={35}
            currentFrame={frame}
          />
        </div>

      </div>
    </div>
  );
}
