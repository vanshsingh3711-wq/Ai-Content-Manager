'use client';

import React, { useState, useEffect } from 'react';
import { Phone, PhoneAppScreen, PhoneTyping } from '@ai-content-manager/motion-components';

export default function DemoPage() {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const duration = 150; // 5 seconds at 30fps
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
      <h1 className="text-3xl font-bold mb-4">PhoneTyping Demo</h1>
      
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
        
        <div className="relative">
          <Phone
            width={340}
            height={700}
            currentFrame={30} // Keep phone static
            style={{ screenColor: '#f9fafb' }}
          >
            <PhoneAppScreen
              header={{ title: "Search Assets", showBackButton: true }}
              currentFrame={30}
              style={{ background: '#f9fafb' }}
            >
              <div className="p-4 flex flex-col h-full relative">
                 {/* Search Bar Container */}
                 <div className="w-full h-14 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center px-4 relative">
                   <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                   </svg>
                   
                   {/* The typing animation! */}
                   <PhoneTyping
                      text="Find NVIDIA stock"
                      fontSize={16}
                      currentFrame={frame}
                      typing={{ durationInFrames: 60, startDelayInFrames: 30 }}
                      cursor={{ visible: true, blink: true, blinkRateInFrames: 15 }}
                      style={{ textColor: '#1f2937' }}
                   />
                 </div>
                 
                 {/* Placeholder Search Results */}
                 <div className="mt-8 space-y-4 opacity-30">
                    <div className="w-full h-16 bg-white rounded-xl border border-gray-200" />
                    <div className="w-full h-16 bg-white rounded-xl border border-gray-200" />
                 </div>
              </div>
            </PhoneAppScreen>
          </Phone>
        </div>

      </div>
    </div>
  );
}
