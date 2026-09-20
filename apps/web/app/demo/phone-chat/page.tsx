'use client';

import React, { useState, useEffect } from 'react';
import { Phone, PhoneAppScreen, PhoneChat } from '@ai-content-manager/motion-components';

export default function DemoPage() {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Total animation timeline:
  const duration = 300; 
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

  const messages = [
    { id: '1', text: "Did you see the market today?", sender: "left" as const, delayInFrames: 30 },
    { id: '2', text: "Yes. Everything dropped.", sender: "right" as const, delayInFrames: 45 },
    { id: '3', text: "Why did the stock fall?", sender: "left" as const, delayInFrames: 30 },
    { id: '4', text: "Earnings were below expectations. A lot of tech stocks are getting hit right now.", sender: "right" as const, delayInFrames: 45 },
    { id: '5', text: "Should we buy the dip?", sender: "left" as const, delayInFrames: 30 },
    { id: '6', text: "Maybe. Let's wait and see.", sender: "right" as const, delayInFrames: 45 },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white py-12">
      <h1 className="text-3xl font-bold mb-4">PhoneChat Demo</h1>
      
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
            style={{ screenColor: '#f9fafb' }}
          >
            <PhoneAppScreen
              header={{ title: "Alex", showBackButton: true }}
              currentFrame={30}
              style={{ background: '#f9fafb' }}
            >
              <PhoneChat
                messages={messages}
                currentFrame={frame}
                animation={{
                  startDelayInFrames: 10,
                  defaultGapInFrames: 45,
                  messageDurationInFrames: 15,
                }}
              />
              
              {/* Fake message input at the bottom */}
              <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '80px', backgroundColor: 'white', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 16px', boxSizing: 'border-box' }}>
                <div style={{ width: '100%', height: '40px', backgroundColor: '#f3f4f6', borderRadius: '20px', padding: '0 16px', display: 'flex', alignItems: 'center', color: '#9ca3af' }}>
                  Message...
                </div>
              </div>
            </PhoneAppScreen>
          </Phone>
        </div>

      </div>
    </div>
  );
}
