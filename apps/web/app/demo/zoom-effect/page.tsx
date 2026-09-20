'use client';

import React, { useState, useEffect } from 'react';
import { ZoomEffect, AnimatedBarChart } from '@ai-content-manager/motion-components';

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

  // We are creating a mock scene of 800x600 inside the preview window.
  // The zoom effect will act as a camera over this entire 800x600 area.
  const SCENE_W = 800;
  const SCENE_H = 600;

  const SceneContent = () => (
    <div className="w-full h-full bg-slate-900 flex flex-col p-16 relative">
      <div className="absolute top-16 left-16">
        <div className="text-gray-400 mb-2">Total Revenue</div>
        <div className="text-6xl font-bold font-mono text-white">
          ₹25,00,000
        </div>
      </div>

      <div className="absolute bottom-16 right-16 w-[400px] h-[300px] bg-slate-800 p-6 rounded-lg">
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
      <h1 className="text-3xl font-bold mb-4">ZoomEffect Demo</h1>
      
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
        
        {/* Demo 1: Zoom IN towards top left */}
        <div className="w-full">
          <h2 className="text-xl font-semibold mb-4 text-gray-400 text-center">1. Zoom IN (Top Left Target)</h2>
          <div className="border-4 border-gray-800 rounded-xl overflow-hidden mx-auto" style={{ width: SCENE_W, height: SCENE_H }}>
            <ZoomEffect
              centerX={180} // Target X: Inside the revenue number
              centerY={100} // Target Y: Inside the revenue number
              viewportWidth={SCENE_W}
              viewportHeight={SCENE_H}
              fromScale={1}
              toScale={1.5}
              durationInFrames={60}
              delayInFrames={30}
              currentFrame={frame}
              mode="in"
            >
              <SceneContent />
            </ZoomEffect>
          </div>
        </div>

        {/* Demo 2: Zoom IN-OUT towards bottom right */}
        <div className="w-full">
          <h2 className="text-xl font-semibold mb-4 text-gray-400 text-center">2. Zoom IN-OUT (Bottom Right Target)</h2>
          <div className="border-4 border-gray-800 rounded-xl overflow-hidden mx-auto" style={{ width: SCENE_W, height: SCENE_H }}>
            <ZoomEffect
              centerX={600} // Target X: Inside the chart
              centerY={450} // Target Y: Inside the chart
              viewportWidth={SCENE_W}
              viewportHeight={SCENE_H}
              fromScale={1}
              toScale={1.35}
              durationInFrames={90}
              delayInFrames={30}
              currentFrame={frame}
              mode="in-out"
            >
              <SceneContent />
            </ZoomEffect>
          </div>
        </div>

      </div>
    </div>
  );
}
