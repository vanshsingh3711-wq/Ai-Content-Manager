'use client';

import React, { useState, useEffect } from 'react';
import { Phone, PhoneAppScreen, PhoneCall } from '@ai-content-manager/motion-components';

export default function DemoPage() {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Total animation timeline:
  // calling (60) + connected (120) + end wait = 240
  const duration = 240; 
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
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white py-12">
      <h1 className="text-3xl font-bold mb-4">PhoneCall Demo</h1>
      
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
        
        <div className="flex flex-col items-center gap-4">
          <Phone
            width={340}
            height={700}
            currentFrame={30} // Keep static
            style={{ screenColor: '#111827' }}
          >
            <PhoneAppScreen
              header={{ title: "", showBackButton: false }}
              currentFrame={30}
              style={{ background: '#111827', color: 'white' }}
            >
              <PhoneCall
                contactName="Alex"
                contactSubtitle="Financial Support"
                currentFrame={frame}
                animation={{
                  startDelayInFrames: 0,
                  callingDurationInFrames: 60,
                  connectedDurationInFrames: 120,
                  endDurationInFrames: 30,
                }}
              />
            </PhoneAppScreen>
          </Phone>
        </div>

      </div>
    </div>
  );
}
