'use client';

import React, { useState, useEffect } from 'react';
import { ImpactEffect } from '@ai-content-manager/motion-components';

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
      <h1 className="text-3xl font-bold mb-4 z-50">ImpactEffect Demo</h1>
      
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

      <div className="flex flex-col gap-16 w-full max-w-4xl bg-gray-900 rounded-xl p-16 relative items-center">
        
        {/* Demo 1: Subtle Percentage Impact */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex flex-col items-center w-full">
          <div className="text-sm font-bold text-gray-500 mb-8">Subtle Percentage Impact</div>
          <ImpactEffect
            delayInFrames={10}
            durationInFrames={20}
            currentFrame={frame}
          >
            <div className="text-5xl font-bold text-emerald-400">+42.5%</div>
          </ImpactEffect>
        </div>

        {/* Demo 2: Headline with Glow */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex flex-col items-center w-full">
          <div className="text-sm font-bold text-gray-500 mb-8">Headline Impact with Glow</div>
          <ImpactEffect
            delayInFrames={30}
            durationInFrames={25}
            glow={true}
            glowColor="#ef4444" // red
            glowRadius={30}
            scalePeak={1.15}
            currentFrame={frame}
          >
            <div className="text-6xl font-black text-white bg-red-600 px-6 py-2 uppercase tracking-tighter">
              Revenue Drop
            </div>
          </ImpactEffect>
        </div>

        {/* Demo 3: Massive Financial Figure with Shake and Blur */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex flex-col items-center w-full">
          <div className="text-sm font-bold text-gray-500 mb-8">Heavy Impact (Shake + Blur)</div>
          <ImpactEffect
            delayInFrames={50}
            durationInFrames={30}
            shake={true}
            shakeAmount={15}
            blurFrom={10}
            blurPeak={0}
            blurTo={0}
            scaleFrom={1.5}
            scalePeak={0.9}
            scaleTo={1.0}
            currentFrame={frame}
          >
            <div className="text-7xl font-bold text-blue-400 tracking-tight">
              $1.4 Trillion
            </div>
          </ImpactEffect>
        </div>

      </div>
    </div>
  );
}
