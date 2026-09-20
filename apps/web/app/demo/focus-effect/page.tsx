'use client';

import React, { useState, useEffect } from 'react';
import { FocusEffect, AnimatedBarChart } from '@ai-content-manager/motion-components';

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

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center text-white py-12">
      <h1 className="text-3xl font-bold mb-4">FocusEffect Demo</h1>
      
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
        
        {/* Basic Focus */}
        <div className="relative">
          <h2 className="text-xl font-semibold mb-8 text-gray-400 relative z-[60]">1. Focus Financial Number</h2>
          <div className="p-8 bg-gray-800 rounded-lg inline-block w-full text-center">
            <div className="text-gray-400 mb-2">Total Revenue</div>
            <div className="text-6xl font-bold font-mono text-white">
              ₹25,00,000
            </div>
          </div>
          
          <FocusEffect
            x={100}
            y={80}
            width={700}
            height={100}
            overlayOpacity={0.7}
            currentFrame={frame}
            delayInFrames={30}
            durationInFrames={90}
            animation="zoom"
          />
        </div>

        {/* Glow Focus over Chart */}
        <div className="relative mt-12">
          <h2 className="text-xl font-semibold mb-8 text-gray-400 relative z-[60]">2. Focus Chart with Glow</h2>
          <div className="p-8 bg-gray-800 rounded-lg h-80">
            <AnimatedBarChart
              data={mockData}
              width="100%"
              height="100%"
              maxValue={1000}
              currentFrame={60} // Keep chart static fully loaded
            />
          </div>
          
          <FocusEffect
            x={438}
            y={95}
            width={120}
            height={240}
            overlayOpacity={0.8}
            glow={true}
            glowColor="#3b82f6"
            currentFrame={frame}
            delayInFrames={30}
            durationInFrames={90}
            animation="fade"
          />
        </div>

      </div>
    </div>
  );
}
