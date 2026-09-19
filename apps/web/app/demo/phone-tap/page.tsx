'use client';

import React, { useState, useEffect } from 'react';
import { Phone, PhoneAppScreen, PhoneTap } from '@ai-content-manager/motion-components';

export default function DemoPage() {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const duration = 120; // 4 seconds at 30fps
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
      <h1 className="text-3xl font-bold mb-4">PhoneTap Demo</h1>
      
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
        
        {/* Demo 1: Tap Mode */}
        <div className="relative">
          <Phone
            width={340}
            height={700}
            currentFrame={30} // Keep phone static for this demo to focus on the tap
            style={{ screenColor: '#f9fafb' }}
          >
            <PhoneAppScreen
              header={{ title: "Transfer Demo" }}
              currentFrame={30}
              style={{ background: '#f9fafb' }}
            >
              <div className="p-4 flex flex-col gap-4 h-full relative">
                 <div className="w-full h-16 bg-white rounded-xl shadow-sm border border-gray-100" />
                 <div className="w-full h-16 bg-white rounded-xl shadow-sm border border-gray-100" />
                 
                 {/* The Target Button */}
                 <div className="w-full h-12 bg-blue-600 rounded-full mt-auto mb-16 flex items-center justify-center font-semibold text-white shadow">
                    Pay Now
                 </div>
              </div>
            </PhoneAppScreen>

            {/* The Tap Animation overlays the screen independently! */}
            <PhoneTap
              x={170} // Center X of phone
              y={560} // Center Y of button
              size={60}
              animation={{ type: 'tap', durationInFrames: 30, delayInFrames: 30 }}
              currentFrame={frame}
              style={{ color: 'rgba(59, 130, 246, 0.5)' }} // blue ripple
            />
          </Phone>
        </div>

        {/* Demo 2: Pointer Mode */}
        <div className="relative">
          <Phone
            width={340}
            height={700}
            currentFrame={30}
            style={{ screenColor: '#f9fafb' }}
          >
            <PhoneAppScreen
              header={{ title: "Pointer Demo" }}
              currentFrame={30}
              style={{ background: '#f9fafb' }}
            >
              <div className="p-4 flex flex-col gap-4 h-full relative">
                 {/* Target Card */}
                 <div className="w-full h-32 bg-white rounded-2xl shadow-sm border border-gray-100 mt-12" />
              </div>
            </PhoneAppScreen>

            {/* The Pointer Animation */}
            <PhoneTap
              x={170}
              y={200}
              size={32}
              animation={{ type: 'pointer', durationInFrames: 45, delayInFrames: 30 }}
              currentFrame={frame}
            />
          </Phone>
        </div>

      </div>
    </div>
  );
}
