'use client';

import React, { useState, useEffect } from 'react';
import { SlideInEffect, AnimatedKPI, Phone, PhoneAppScreen, PhonePayment } from '@ai-content-manager/motion-components';

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
    <div className="min-h-screen bg-gray-950 flex flex-col items-center text-white py-12 relative overflow-hidden">
      <h1 className="text-3xl font-bold mb-4 z-50">SlideInEffect Demo</h1>
      
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

      <div className="flex flex-col gap-16 w-full max-w-4xl bg-gray-900 rounded-xl p-16 relative">
        
        {/* Demo 1: KPI sliding from left */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-48 flex flex-col items-start justify-center">
          <div className="text-sm font-bold text-gray-500 mb-4">Slide from Left</div>
          <SlideInEffect
            direction="left"
            distance={150}
            durationInFrames={20}
            delayInFrames={10}
            easing="easeOut"
            fade={true}
            currentFrame={frame}
          >
            <div className="w-64 h-24">
              <AnimatedKPI
                title="Active Users"
                value={124500}
                format="number"
                trend={5.4}
                currentFrame={60} // Pre-rendered content for slide
              />
            </div>
          </SlideInEffect>
        </div>

        {/* Demo 2: Text sliding from right without fade */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-48 flex flex-col items-end justify-center overflow-hidden">
          <div className="text-sm font-bold text-gray-500 mb-4 self-start">Slide from Right (No Fade)</div>
          <SlideInEffect
            direction="right"
            distance={400}
            durationInFrames={30}
            delayInFrames={20}
            easing="easeInOut"
            fade={false}
            currentFrame={frame}
          >
            <div className="bg-blue-600 px-8 py-4 rounded-xl shadow-lg border border-blue-500 text-3xl font-black">
              Q3 Targets Hit!
            </div>
          </SlideInEffect>
        </div>

        {/* Demo 3: Phone/Card sliding from bottom */}
        <div className="relative border border-gray-800 p-8 rounded-lg h-80 flex flex-col items-center justify-end overflow-hidden pt-24">
          <div className="text-sm font-bold text-gray-500 absolute top-4 left-4">Slide from Bottom</div>
          <SlideInEffect
            direction="bottom"
            distance={300}
            durationInFrames={25}
            delayInFrames={40}
            easing="easeOut"
            fade={true}
            currentFrame={frame}
          >
            <div className="scale-75 origin-bottom translate-y-16">
              <Phone>
                <PhoneAppScreen appName="Payment">
                  <PhonePayment 
                    amount={45} 
                    recipient="Coffee Shop" 
                    status="success" 
                    currentFrame={60} 
                  />
                </PhoneAppScreen>
              </Phone>
            </div>
          </SlideInEffect>
        </div>

      </div>
    </div>
  );
}
