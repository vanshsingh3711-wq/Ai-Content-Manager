'use client';

import React, { useState, useEffect } from 'react';
import { TransitionWipeEffect, AnimatedLineChart } from '@ai-content-manager/motion-components';

const SceneHeadline = () => (
  <div className="w-full h-full bg-blue-900 flex flex-col items-center justify-center text-white">
    <h1 className="text-6xl font-bold mb-4">Q3 Earnings Call</h1>
    <p className="text-2xl text-blue-200">Revenue growth exceeds expectations</p>
  </div>
);

const stockData = [
  { label: 'Jan', value: 120 },
  { label: 'Feb', value: 135 },
  { label: 'Mar', value: 128 },
  { label: 'Apr', value: 156 },
  { label: 'May', value: 142 },
  { label: 'Jun', value: 180 },
];

const SceneChart = () => (
  <div className="w-full h-full bg-gray-900 flex items-center justify-center p-8">
    <AnimatedLineChart data={stockData} width={760} height={250} maxValue={200} currentFrame={100} />
  </div>
);

const SceneConclusion = () => (
  <div className="w-full h-full bg-emerald-900 flex flex-col items-center justify-center text-white">
    <h1 className="text-6xl font-bold mb-4">+45% YoY</h1>
    <p className="text-2xl text-emerald-200">Strongest quarter in company history</p>
  </div>
);

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
    <div className="min-h-screen bg-gray-950 flex flex-col items-center text-white py-12 relative overflow-hidden font-sans">
      <h1 className="text-3xl font-bold mb-4 z-50">TransitionWipeEffect Demo</h1>
      
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
        
        {/* Demo 1: Headline -> Chart (Solid Left Wipe) */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex flex-col h-96">
          <div className="text-sm font-bold text-gray-500 mb-2">Solid Wipe Left (Headline → Chart)</div>
          
          <div className="relative w-full h-full rounded overflow-hidden">
            <TransitionWipeEffect
              from={<SceneHeadline />}
              to={<SceneChart />}
              direction="left"
              style="solid"
              color="#fbbf24" // amber-400
              durationInFrames={30}
              delayInFrames={30} // Stays on Scene A for 1 second
              currentFrame={frame}
            />
          </div>
        </div>

        {/* Demo 2: Chart -> Conclusion (Reveal Bottom Wipe) */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex flex-col h-96">
          <div className="text-sm font-bold text-gray-500 mb-2">Reveal Wipe Bottom (Chart → Conclusion)</div>
          
          <div className="relative w-full h-full rounded overflow-hidden">
            <TransitionWipeEffect
              from={<SceneChart />}
              to={<SceneConclusion />}
              direction="bottom"
              style="reveal"
              durationInFrames={45}
              delayInFrames={30} 
              currentFrame={frame}
              easing="easeInOut"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
