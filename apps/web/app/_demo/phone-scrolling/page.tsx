'use client';

import React, { useState, useEffect } from 'react';
import { Phone, PhoneAppScreen, PhoneScrolling } from '@ai-content-manager/motion-components';

export default function DemoPage() {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const duration = 180; // 6 seconds at 30fps
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

  // Fake Data
  const companies = ["NVIDIA", "Apple", "Microsoft", "Tesla", "Amazon", "Google", "Meta", "AMD", "Netflix", "Intel", "IBM", "Cisco", "Oracle", "Salesforce"];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white py-12">
      <h1 className="text-3xl font-bold mb-4">PhoneScrolling Demo</h1>
      
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
            currentFrame={30} // Keep static
            style={{ screenColor: '#f9fafb' }}
          >
            <PhoneAppScreen
              header={{ title: "Market News", showMenuButton: true }}
              currentFrame={30}
              style={{ background: '#f9fafb' }}
            >
              {/* The viewport acts as a mask / clip */}
              <PhoneScrolling
                scroll={{
                  fromOffset: 0,
                  toOffset: 600, // scroll down 600px
                  durationInFrames: 120, // 4 seconds
                  startDelayInFrames: 30, // Wait 1 sec before scrolling
                }}
                direction="up" // Content moves UP
                currentFrame={frame}
                showIndicator={true}
              >
                {/* Long arbitrary content */}
                <div className="p-4 space-y-4">
                  {companies.map((company, i) => (
                    <div key={i} className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{company}</div>
                        <div className="text-sm text-gray-500">Tech Sector</div>
                      </div>
                      <div className="text-green-600 font-semibold bg-green-50 px-2 py-1 rounded">
                        +{Math.floor(Math.random() * 5) + 1}.{Math.floor(Math.random() * 99)}%
                      </div>
                    </div>
                  ))}
                  
                  {/* Bottom spacer */}
                  <div className="h-12" />
                </div>
              </PhoneScrolling>
            </PhoneAppScreen>
          </Phone>
        </div>

      </div>
    </div>
  );
}
