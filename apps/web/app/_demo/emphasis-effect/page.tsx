'use client';

import React, { useState, useEffect } from 'react';
import { EmphasisEffect, AnimatedKPI, AnimatedArrow } from '@ai-content-manager/motion-components';

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
      <h1 className="text-3xl font-bold mb-4 z-50">EmphasisEffect Demo</h1>
      
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
        
        {/* Demo 1: Emphasizing a large percentage with subtle scale and blue glow */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-48 flex items-center justify-center bg-gray-800/50">
          <EmphasisEffect
            durationInFrames={40}
            delayInFrames={10}
            scalePeak={1.15}
            glow={true}
            glowColor="#3b82f6" // blue
            glowRadius={30}
            glowOpacity={0.8}
            easing="easeInOut"
            currentFrame={frame}
            fps={30}
          >
            <div className="text-7xl font-black text-white">
              +45.2%
            </div>
          </EmphasisEffect>
        </div>

        {/* Demo 2: Emphasizing a KPI card with a subtle scale pop, no glow */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-48 flex items-center justify-center">
          <EmphasisEffect
            durationInFrames={30}
            delayInFrames={30}
            scalePeak={1.06}
            glow={false}
            easing="easeOut" // easeOut gives a sharp jump and slow settle, great for a heartbeat
            currentFrame={frame}
          >
            <div className="w-64 h-32">
              <AnimatedKPI
                title="Active Users"
                value={124500}
                format="number"
                trend={5.4}
                currentFrame={60} // Pre-rendered content
              />
            </div>
          </EmphasisEffect>
        </div>

        {/* Demo 3: Emphasizing an Icon with rotation and red glow */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-48 flex items-center justify-center">
          <EmphasisEffect
            durationInFrames={35}
            delayInFrames={50}
            scalePeak={1.2}
            rotationPeak={-15} // Slight tilt left
            glow={true}
            glowColor="#ef4444" // red
            glowRadius={40}
            glowOpacity={1}
            easing="easeInOut"
            currentFrame={frame}
          >
            <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center">
              <div className="w-12 h-12 rotate-180">
                <AnimatedArrow
                  direction="down-right"
                  color="#ffffff"
                  thickness={6}
                  currentFrame={100} // Pre-drawn
                />
              </div>
            </div>
          </EmphasisEffect>
        </div>

      </div>
    </div>
  );
}
