'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { resolveSequence, SequenceDefinition } from '@ai-content-manager/motion-components/src/sequence';
import { SequenceRenderer } from '@ai-content-manager/motion-components/src/elements/Sequence/SequenceRenderer';
import { SceneResolutionContext } from '@ai-content-manager/motion-components/src/scene/scene.types';

const MOCK_FPS = 30;

export default function TransitionsDemoPage() {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const context: SceneResolutionContext = useMemo(() => ({
    canvas: { width: 1080, height: 1920 },
    fps: MOCK_FPS,
    autoRepair: true
  }), []);

  const sequence = useMemo<SequenceDefinition>(() => ({
    id: 'demo-sequence',
    scenes: [
      {
        id: 'scene_1',
        durationInFrames: 60,
        elements: []
      },
      {
        id: 'scene_2',
        durationInFrames: 60,
        transitionIn: { type: 'fade', durationInFrames: 30 },
        elements: []
      },
      {
        id: 'scene_3',
        durationInFrames: 60,
        transitionIn: { type: 'slide', direction: 'left', durationInFrames: 30 },
        elements: []
      },
      {
        id: 'scene_4',
        durationInFrames: 60,
        transitionIn: { type: 'wipe', direction: 'up', durationInFrames: 30 },
        elements: []
      },
      {
        id: 'scene_5',
        durationInFrames: 60,
        transitionIn: { type: 'zoom', direction: 'in', durationInFrames: 30 },
        elements: []
      }
    ]
  }), []);

  const resolvedSequence = useMemo(() => resolveSequence(sequence, context), [sequence, context]);

  useEffect(() => {
    if (!isPlaying) return;
    let animationId: number;
    let lastTime = Date.now();

    const loop = () => {
      const now = Date.now();
      const elapsed = now - lastTime;
      
      if (elapsed > (1000 / MOCK_FPS)) {
        setFrame(f => {
          if (f >= resolvedSequence.durationInFrames) return 0;
          return f + 1;
        });
        lastTime = now;
      }
      animationId = requestAnimationFrame(loop);
    };
    
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, resolvedSequence.durationInFrames]);

  // Mock scenes for the demo
  const colors = {
    scene_1: '#ef4444', // red
    scene_2: '#3b82f6', // blue
    scene_3: '#10b981', // green
    scene_4: '#f59e0b', // amber
    scene_5: '#8b5cf6', // purple
  };

  const renderScene = (sceneData: any, localFrame: number) => {
    return (
      <div style={{
        width: '100%', height: '100%',
        backgroundColor: colors[sceneData.id as keyof typeof colors] || '#000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: 'white', fontFamily: 'sans-serif', fontSize: '3rem', fontWeight: 'bold'
      }}>
        {sceneData.id}
        <div style={{ fontSize: '1.5rem', marginTop: 20 }}>Local Frame: {localFrame}</div>
      </div>
    );
  };

  return (
    <div className="p-8 bg-gray-950 min-h-screen text-gray-100 font-sans flex gap-12">
      <div className="w-[400px]">
        <h1 className="text-3xl font-bold mb-6 text-white tracking-tight">Transitions Pipeline</h1>
        
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-md mb-6">
          <div className="text-2xl font-mono mb-4 text-center">
            Frame: {frame.toString().padStart(3, '0')} / {resolvedSequence.durationInFrames}
          </div>
          
          <input 
            type="range" 
            min="0" 
            max={resolvedSequence.durationInFrames} 
            value={frame} 
            onChange={(e) => {
              setFrame(parseInt(e.target.value));
              setIsPlaying(false);
            }} 
            className="w-full mb-4 accent-blue-500"
          />

          <div className="flex gap-4">
            <button 
              onClick={() => setIsPlaying(!isPlaying)} 
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors"
            >
              {isPlaying ? 'Pause' : 'Play Sequence'}
            </button>
            <button 
              onClick={() => setFrame(0)} 
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-md max-h-[600px] overflow-auto">
          <h2 className="text-lg font-bold text-white mb-4">Diagnostics</h2>
          {resolvedSequence.diagnostics.length === 0 ? (
            <p className="text-gray-500">No issues found.</p>
          ) : (
            <ul className="space-y-2">
              {resolvedSequence.diagnostics.map((d, i) => (
                <li key={i} className="text-sm p-3 bg-red-900/20 text-red-400 rounded-lg border border-red-900/50">
                  [{d.severity}] {d.message}
                </li>
              ))}
            </ul>
          )}

          <h2 className="text-lg font-bold text-white mt-8 mb-4">Sequence Timing Map</h2>
          <ul className="space-y-4">
            {resolvedSequence.scenes.map((s, i) => (
              <li key={i} className="text-sm border-l-2 border-gray-700 pl-4">
                <span className="font-bold text-gray-300">{s.id}</span>
                <div className="text-gray-500 font-mono mt-1">
                  Global: {s.globalStartFrame} → {s.globalEndFrame}
                </div>
                {s.transitionIn && (
                  <div className="text-blue-400 mt-1">
                    Transition: {s.transitionIn.type} ({s.transitionIn.durationInFrames}f)
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex-1 flex justify-center items-center">
        {/* The canvas */}
        <div 
          className="relative bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800"
          style={{ width: '400px', height: `${400 * (1920/1080)}px` }}
        >
          <div className="absolute inset-0 origin-top-left" style={{ transform: `scale(${400 / 1080})`, width: 1080, height: 1920 }}>
            <SequenceRenderer 
              sequence={resolvedSequence} 
              forceFrame={frame}
              renderScene={renderScene}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
