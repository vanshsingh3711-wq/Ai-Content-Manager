'use client';

import React, { useState, useEffect } from 'react';
import { Phone, AnimatedBarChart } from '@ai-content-manager/motion-components';

export default function DemoPage() {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const duration = 60; // 2 seconds at 30fps
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
        
        if (currentFrameDecimal >= duration + 60) {
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
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white py-12">
      <h1 className="text-3xl font-bold mb-4">Phone Container Demo</h1>
      
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

      <div className="flex gap-16 items-center justify-center w-full max-w-7xl overflow-auto p-16">
        {/* Phone 1: Simple scale entrance with dummy content */}
        <div>
          <h3 className="text-center text-gray-500 mb-8 font-mono text-sm uppercase tracking-widest">Scale Entrance</h3>
          <Phone
            width={300}
            height={600}
            animation={{ enter: 'scale', durationInFrames: 30 }}
            currentFrame={frame}
            style={{ screenColor: '#f9fafb' }}
          >
            {/* Mock Screen Content */}
            <div className="p-6 flex flex-col h-full">
              <div className="w-full h-12 bg-gray-200 rounded-lg mb-6" />
              <div className="w-2/3 h-8 bg-gray-200 rounded-lg mb-4" />
              <div className="w-full h-32 bg-gray-200 rounded-lg mb-4" />
              <div className="flex gap-4 mt-auto">
                <div className="w-1/2 h-12 bg-blue-500 rounded-lg" />
                <div className="w-1/2 h-12 bg-gray-200 rounded-lg" />
              </div>
            </div>
          </Phone>
        </div>

        {/* Phone 2: SlideUp entrance containing an actual Animated Component! */}
        <div>
          <h3 className="text-center text-gray-500 mb-8 font-mono text-sm uppercase tracking-widest">SlideUp + Animated Content</h3>
          <Phone
            width={300}
            height={600}
            animation={{ enter: 'slideUp', durationInFrames: 30 }}
            currentFrame={frame}
            style={{ screenColor: '#0a0a0a', borderColor: '#262626' }}
          >
            <div className="w-full h-full flex items-center justify-center pt-8">
               <AnimatedBarChart
                  width={300}
                  height={400}
                  data={[
                    { label: 'Q1', value: 40 },
                    { label: 'Q2', value: 55 },
                    { label: 'Q3', value: 72 },
                  ]}
                  title="Growth"
                  animation={{ type: 'grow', delayInFrames: 15, durationInFrames: 30 }}
                  currentFrame={frame}
                  fps={fps}
                  typography={{ titleSize: 24, labelSize: 12, valueSize: 12 }}
               />
            </div>
          </Phone>
        </div>

      </div>
    </div>
  );
}
