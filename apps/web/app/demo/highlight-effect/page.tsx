'use client';

import React, { useState, useEffect } from 'react';
import { HighlightEffect } from '@ai-content-manager/motion-components';

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

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center text-white py-12">
      <h1 className="text-3xl font-bold mb-4">HighlightEffect Demo</h1>
      
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
        
        {/* Box Highlight */}
        <div>
          <h2 className="text-xl font-semibold mb-8 text-gray-400">1. Box Highlight</h2>
          <div className="relative p-8 bg-gray-800 rounded-lg inline-block">
            <div className="text-4xl font-bold font-mono text-white relative z-10">
              ₹25,00,000
            </div>
            
            <HighlightEffect
              animation="box"
              x={-16}
              y={-16}
              width="calc(100% + 32px)"
              height="calc(100% + 32px)"
              color="#3b82f6" // blue
              currentFrame={frame}
              delayInFrames={30}
              durationInFrames={90}
            />
          </div>
        </div>

        {/* Glow Highlight */}
        <div>
          <h2 className="text-xl font-semibold mb-8 text-gray-400">2. Glow Highlight</h2>
          <div className="relative p-8 bg-gray-800 rounded-lg inline-block">
            <div className="text-4xl font-bold font-mono text-white relative z-10">
              User Retention +42%
            </div>
            
            <HighlightEffect
              animation="glow"
              x={0}
              y={0}
              width="100%"
              height="100%"
              color="#10b981" // green
              currentFrame={frame}
              delayInFrames={30}
              durationInFrames={90}
              opacity={0.4}
            />
          </div>
        </div>

        {/* Marker Highlight */}
        <div>
          <h2 className="text-xl font-semibold mb-8 text-gray-400">3. Marker Highlight</h2>
          <div className="relative p-4 inline-block bg-white text-gray-900 rounded-lg">
            <div className="text-4xl font-bold relative z-10">
              Focus on this specific text.
            </div>
            
            <HighlightEffect
              animation="marker"
              x={0}
              y={8}
              width="100%"
              height="calc(100% - 16px)"
              color="#fef08a" // yellow
              currentFrame={frame}
              delayInFrames={30}
              durationInFrames={90}
              opacity={1}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
