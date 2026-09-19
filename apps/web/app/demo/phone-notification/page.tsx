'use client';

import React, { useState, useEffect } from 'react';
import { Phone, PhoneNotification } from '@ai-content-manager/motion-components';

export default function DemoPage() {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const duration = 90; // 3 seconds at 30fps
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
      <h1 className="text-3xl font-bold mb-4">Phone Notification Demo</h1>
      
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
        {/* Phone 1: Notification sliding down inside the phone */}
        <div>
          <Phone
            width={340}
            height={700}
            animation={{ enter: 'scale', durationInFrames: 30 }} // Phone enters first
            currentFrame={Math.min(frame, 30)} // Hold phone at final frame after it enters
            style={{ screenColor: '#f3f4f6' }}
          >
            {/* The Notification enters AT frame 30 (delay 30) */}
            <PhoneNotification
              title="Payment successful"
              message="₹5,000 sent successfully"
              icon={
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
              }
              animation={{ enter: 'slideDown', durationInFrames: 20, delayInFrames: 30 }}
              currentFrame={frame}
              style={{ marginTop: 40 }} // Clears the notch
            />
            
            {/* Mock background content to show it floats OVER content */}
            <div className="p-6 mt-10 space-y-4 opacity-50">
              <div className="w-full h-24 bg-gray-200 rounded-xl" />
              <div className="w-full h-16 bg-gray-200 rounded-xl" />
              <div className="w-3/4 h-16 bg-gray-200 rounded-xl" />
            </div>
          </Phone>
        </div>

      </div>
    </div>
  );
}
