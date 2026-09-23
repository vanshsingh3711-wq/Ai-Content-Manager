'use client';

import React from 'react';
import { Bank } from '@ai-content-manager/motion-components';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center text-white py-12 relative overflow-hidden font-sans">
      <h1 className="text-3xl font-bold mb-4 z-50">Bank Object Demo</h1>
      
      <div className="mb-8 text-gray-400 max-w-2xl text-center">
        This demonstrates the raw Bank business object. It provides a stable wrapper around the premium SVG vector, preserving its data-parts for future animation.
      </div>

      <div className="grid grid-cols-2 gap-8 w-full max-w-6xl p-8 relative">
        
        {/* Demo 1: Default Center */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex flex-col items-center justify-center bg-gray-900 min-h-[500px]">
          <div className="absolute top-4 left-4 text-sm font-bold text-gray-500 z-50 bg-gray-900/80 px-2 rounded">
            1. Default Scale
          </div>
          
          <Bank />
        </div>

        {/* Demo 2: Scaled Down & Shifted */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex flex-col items-center justify-center bg-gray-900 min-h-[500px]">
          <div className="absolute top-4 left-4 text-sm font-bold text-gray-500 z-50 bg-gray-900/80 px-2 rounded">
            2. Scaled Down (0.5x), Opacity (0.8)
          </div>
          
          <Bank scale={0.5} opacity={0.8} />
        </div>

        {/* Demo 3: Scaled Up & Rotated */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex flex-col items-center justify-center bg-gray-900 min-h-[500px] overflow-hidden">
          <div className="absolute top-4 left-4 text-sm font-bold text-gray-500 z-50 bg-gray-900/80 px-2 rounded">
            3. Scaled Up (1.5x) + Rotation
          </div>
          
          <Bank scale={1.5} rotation={-5} />
        </div>
        
        {/* Demo 4: Absolute Positioning */}
        <div className="relative border border-gray-800 p-8 rounded-lg flex flex-col bg-gray-900 min-h-[500px] overflow-hidden">
          <div className="absolute top-4 left-4 text-sm font-bold text-gray-500 z-50 bg-gray-900/80 px-2 rounded">
            4. Absolute Positioning (x, y)
          </div>
          
          {/* We position two banks to prove it works */}
          <Bank scale={0.4} x={0} y={150} opacity={0.4} />
          <Bank scale={0.6} x={150} y={50} />
        </div>

      </div>
    </div>
  );
}
