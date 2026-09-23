'use client';

import React, { useState, useEffect } from 'react';
import { ConnectionLineEffect, AnimatedKPI } from '@ai-content-manager/motion-components';

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
    <div className="min-h-screen bg-gray-950 flex flex-col items-center text-white py-12 relative overflow-hidden">
      <h1 className="text-3xl font-bold mb-4 z-50">ConnectionLineEffect Demo</h1>
      
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
        
        {/* Demo 1: Straight connection between two elements */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex items-center justify-between h-64">
          <div className="text-sm font-bold text-gray-500 absolute top-4 left-4">Straight line (draw)</div>
          
          <div className="bg-gray-800 p-4 rounded z-10 border border-gray-700">
            <AnimatedKPI title="Q1 Revenue" value={200000} format="currency" currentFrame={frame} />
          </div>
          
          <div className="bg-gray-800 p-4 rounded z-10 border border-blue-500">
            <AnimatedKPI title="Q2 Growth" value={25} format="percentage" trend={12.5} currentFrame={frame} />
          </div>

          <ConnectionLineEffect
            fromX={160} // Roughly center-right of left KPI
            fromY={128} // Center Y
            toX={650}   // Roughly center-left of right KPI
            toY={128}   // Center Y
            style="straight"
            color="#3b82f6" // blue-500
            strokeWidth={3}
            showStartDot
            showEndDot
            animation="draw"
            durationInFrames={40}
            delayInFrames={10}
            currentFrame={frame}
          />
        </div>

        {/* Demo 2: Curved connection with arrow */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-96 flex flex-col items-center justify-center">
          <div className="text-sm font-bold text-gray-500 absolute top-4 left-4">Curved line (draw + fade) with Arrow</div>
          
          <div className="absolute top-16 left-16 bg-gray-800 p-4 rounded-xl border border-gray-700 z-10 font-bold">
            Manufacturer
          </div>

          <div className="absolute bottom-16 right-16 bg-gray-800 p-4 rounded-xl border border-green-500 z-10 font-bold text-green-400">
            Consumer
          </div>

          <ConnectionLineEffect
            fromX={150}
            fromY={120}
            toX={650}
            toY={300}
            style="curved"
            curvature={100} // bends downward
            color="#22c55e" // green-500
            strokeWidth={4}
            showArrow
            arrowSize={16}
            animation="draw-fade"
            durationInFrames={50}
            delayInFrames={30}
            currentFrame={frame}
          />
        </div>

      </div>
    </div>
  );
}
