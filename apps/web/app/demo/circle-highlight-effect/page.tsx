'use client';

import React, { useState, useEffect } from 'react';
import { CircleHighlightEffect, AnimatedKPI, AnimatedBarChart } from '@ai-content-manager/motion-components';

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
    <div className="min-h-screen bg-gray-950 flex flex-col items-center text-white py-12">
      <h1 className="text-3xl font-bold mb-4">CircleHighlightEffect Demo</h1>
      
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
        
        {/* Demo 1: Hand-drawn circle around a number */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-48 flex items-center justify-center">
          <div className="text-4xl font-bold relative z-[60]">
            Revenue: <span className="text-white font-mono">₹25,00,000</span>
          </div>
          <CircleHighlightEffect
            x={525} // Approx center of ₹25,00,000
            y={95}
            width={240}
            height={70}
            padding={16}
            color="#ef4444"
            strokeWidth={4}
            animation="draw"
            style="hand-drawn"
            durationInFrames={40}
            delayInFrames={10}
            currentFrame={frame}
          />
        </div>

        {/* Demo 2: Perfect Ellipse over KPI Percentage */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-48 flex items-center justify-center">
          <div className="w-64 h-32 relative z-[60]">
            <AnimatedKPI
              title="Q3 Performance"
              value={25}
              format="percentage"
              trend={12.5}
              currentFrame={60} // Keep static
            />
          </div>
          <CircleHighlightEffect
            x={448} // Center of the KPI container roughly
            y={80} // Over the 25% value
            width={160}
            height={90}
            padding={8}
            color="#3b82f6"
            strokeWidth={6}
            animation="draw-fade"
            style="ellipse"
            durationInFrames={30}
            delayInFrames={15}
            currentFrame={frame}
          />
        </div>

        {/* Demo 3: Hand-drawn oval over chart bar */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-80 flex items-center justify-center">
          <div className="w-96 h-64 relative z-[60]">
            <AnimatedBarChart
              data={mockData}
              width="100%"
              height="100%"
              maxValue={1000}
              currentFrame={60} // Keep static
            />
          </div>
          <CircleHighlightEffect
            x={500} // Over Q3 bar roughly
            y={150} // Top of the bar
            width={60}
            height={100}
            padding={24}
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
