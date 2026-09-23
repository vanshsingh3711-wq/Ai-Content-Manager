'use client';

import React, { useState, useEffect } from 'react';
import { Phone, PhoneAppScreen } from '@ai-content-manager/motion-components';

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
      <h1 className="text-3xl font-bold mb-4">PhoneAppScreen Demo</h1>
      
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
        <div>
          <Phone
            width={340}
            height={700}
            animation={{ enter: 'scale', durationInFrames: 30 }}
            currentFrame={Math.min(frame, 30)} // Phone stops animating at frame 30
            style={{ screenColor: '#f9fafb' }}
          >
            {/* The App Screen enters after the Phone (delay 30) */}
            <PhoneAppScreen
              header={{ 
                title: "Finance", 
                subtitle: "Good Morning, Alex",
                showBackButton: false,
                showMenuButton: true
              }}
              navigationBar={{ visible: true }}
              animation={{ enter: 'slideUp', delayInFrames: 30, durationInFrames: 25 }}
              currentFrame={frame}
              style={{ background: '#f9fafb' }}
            >
              {/* Arbitrary Placeholder Content */}
              <div className="flex flex-col gap-4 p-4 h-full overflow-hidden">
                <div className="w-full h-32 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col p-4">
                   <div className="w-1/3 h-4 bg-gray-200 rounded mb-4" />
                   <div className="w-2/3 h-8 bg-gray-800 rounded" />
                </div>
                
                <div className="flex gap-4">
                   <div className="flex-1 h-24 bg-white rounded-2xl shadow-sm border border-gray-100" />
                   <div className="flex-1 h-24 bg-white rounded-2xl shadow-sm border border-gray-100" />
                </div>

                <div className="w-full flex-1 bg-white rounded-2xl shadow-sm border border-gray-100" />
              </div>
            </PhoneAppScreen>
          </Phone>
        </div>

      </div>
    </div>
  );
}
