'use client';

import React, { useState, useEffect } from 'react';
import { Phone, PhoneAppScreen, PhoneStockApp } from '@ai-content-manager/motion-components';

export default function DemoPage() {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Total animation timeline:
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

  const nvdaData = [
    { label: "1", value: 150 },
    { label: "2", value: 155 },
    { label: "3", value: 151 },
    { label: "4", value: 165 },
    { label: "5", value: 175 },
    { label: "6", value: 182.45 }
  ];
  
  const badData = [
    { label: "1", value: 182 },
    { label: "2", value: 180 },
    { label: "3", value: 185 },
    { label: "4", value: 170 },
    { label: "5", value: 165 },
    { label: "6", value: 150 }
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white py-12">
      <h1 className="text-3xl font-bold mb-4">PhoneStockApp Demo</h1>
      
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
        
        {/* Positive State */}
        <div className="flex flex-col items-center gap-4">
          <Phone
            width={340}
            height={700}
            currentFrame={30} // Keep static
            style={{ screenColor: '#ffffff' }}
          >
            <PhoneAppScreen
              header={{ title: "", showBackButton: false }}
              currentFrame={30}
              style={{ background: '#ffffff', color: '#111827' }}
            >
              <PhoneStockApp
                symbol="NVDA"
                companyName="Example Semiconductor"
                price={182.45}
                change={8.42}
                changePercent={4.82}
                currency="$"
                chartData={nvdaData}
                currentFrame={frame}
                animation={{
                  startDelayInFrames: 15,
                  durationInFrames: 60,
                  chartDurationInFrames: 90,
                }}
              />
            </PhoneAppScreen>
          </Phone>
        </div>
        
        {/* Negative State (Dark Mode) */}
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
              <PhoneStockApp
                symbol="BAD"
                companyName="Losing Corp"
                price={150.00}
                change={-32.45}
                changePercent={-17.78}
                currency="$"
                chartData={badData}
                currentFrame={frame}
                style={{
                  backgroundColor: 'transparent',
                  textColor: 'white',
                  secondaryTextColor: '#9ca3af'
                }}
                animation={{
                  startDelayInFrames: 15,
                  durationInFrames: 60,
                  chartDurationInFrames: 90,
                }}
              />
            </PhoneAppScreen>
          </Phone>
        </div>

      </div>
    </div>
  );
}
