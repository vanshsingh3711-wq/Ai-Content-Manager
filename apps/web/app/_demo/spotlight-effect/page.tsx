'use client';

import React, { useState, useEffect } from 'react';
import { SpotlightEffect, AnimatedBarChart, AnimatedKPI } from '@ai-content-manager/motion-components';

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

  const mockData = [
    { label: 'Q1', value: 320, color: '#9ca3af' },
    { label: 'Q2', value: 450, color: '#9ca3af' },
    { label: 'Q3', value: 890, color: '#3b82f6' }, // Target!
    { label: 'Q4', value: 650, color: '#9ca3af' },
  ];

  const SceneContent = () => (
    <div className="w-full h-full bg-slate-900 flex flex-col p-8 relative">
      <div className="absolute top-8 left-8 w-64 h-32">
        <AnimatedKPI
          title="Total Revenue"
          value={2500000}
          format="currency"
          trend={12.5}
          currentFrame={60} // Keep static
        />
      </div>

      <div className="absolute bottom-8 right-8 w-96 h-64 bg-slate-800 p-6 rounded-lg">
        <AnimatedBarChart
          data={mockData}
          width="100%"
          height="100%"
          maxValue={1000}
          currentFrame={60} // Keep static
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center text-white py-12">
      <h1 className="text-3xl font-bold mb-4">SpotlightEffect Demo</h1>
      
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

      <div className="flex flex-col gap-16 w-full max-w-5xl items-center">
        
        {/* Demo 1: Circle Spotlight with Glow */}
        <div className="w-full">
          <h2 className="text-xl font-semibold mb-4 text-gray-400 text-center">1. Expanding Circle Spotlight on KPI</h2>
          <div className="relative border-4 border-gray-800 rounded-xl overflow-hidden mx-auto" style={{ width: 800, height: 400 }}>
            <SceneContent />
            <SpotlightEffect
              x={150} // Over KPI
              y={100}
              radius={130}
              overlayOpacity={0.8}
              feather={60}
              glow={true}
              glowColor="#3b82f6"
              animation="expand"
              durationInFrames={120}
              delayInFrames={10}
              currentFrame={frame}
            />
          </div>
        </div>

        {/* Demo 2: Moving Ellipse */}
        <div className="w-full">
          <h2 className="text-xl font-semibold mb-4 text-gray-400 text-center">2. Moving Elliptical Spotlight (KPI to Chart)</h2>
          <div className="relative border-4 border-gray-800 rounded-xl overflow-hidden mx-auto" style={{ width: 800, height: 400 }}>
            <SceneContent />
            <SpotlightEffect
              x={150} // Starts over KPI
              y={100}
              toX={600} // Moves over Chart
              toY={280}
              radiusX={220}
              radiusY={140}
              overlayOpacity={0.7}
              feather={80}
              animation="fade"
              durationInFrames={120} // Total duration
              enterDurationInFrames={20} // Fade in
              exitDurationInFrames={20} // Fade out
              delayInFrames={10}
              currentFrame={frame}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
