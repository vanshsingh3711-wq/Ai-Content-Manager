'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  SceneDefinition, 
  resolveSceneGraph 
} from '@ai-content-manager/motion-components/src/scene';
import { SequenceRenderer } from '@ai-content-manager/motion-components/src/elements/Sequence/SequenceRenderer';
import { SceneResolutionContext, ResolvedSceneElement } from '@ai-content-manager/motion-components/src/scene/scene.types';
import { Typography } from '@ai-content-manager/motion-components/src/elements/Typography';
import { getAnchorOffset } from '@ai-content-manager/motion-components/src/layout/layout.utils';

const MOCK_FPS = 30;

export default function AttentionDemoPage() {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const context: SceneResolutionContext = useMemo(() => ({
    canvas: { width: 1080, height: 1920 },
    fps: MOCK_FPS,
    autoRepair: true
  }), []);

  const scene: SceneDefinition = useMemo(() => {
    return {
      id: 'attention-demo',
      themeId: 'premium_dark', 
      durationInFrames: 600, // 20 seconds
      elements: [
        {
          id: 'headline',
          type: 'text',
          textContent: 'Q3 Financial Results',
          textConfig: { role: 'hero', align: 'center', maxWidth: 900 },
          placement: { position: { x: 540, y: 300 }, positionMode: 'absolute', anchor: 'center' }
        },
        {
          // We mock a Chart with a text block for simplicity, just a large element
          id: 'chart',
          type: 'text',
          textContent: '[ Chart Area ]',
          textConfig: { role: 'body', align: 'center', maxWidth: 800 },
          placement: { position: { x: 540, y: 800 }, positionMode: 'absolute', anchor: 'center', size: { width: 800, height: 600 } }
        },
        {
          id: 'kpi',
          type: 'text',
          textContent: 'Revenue: $4.2M',
          textConfig: { role: 'heading', align: 'center' },
          placement: { position: { x: 540, y: 1300 }, positionMode: 'absolute', anchor: 'center' }
        },
        {
          id: 'phone',
          type: 'text',
          textContent: '📱 App Demo',
          textConfig: { role: 'label', align: 'center' },
          placement: { position: { x: 540, y: 1600 }, positionMode: 'absolute', anchor: 'center' }
        }
      ],
      attention: [
        // 1. Highlight Headline (exclusive)
        {
          id: 'att-1',
          targetId: 'headline',
          type: 'highlight',
          intensity: 1,
          startFrame: 30,
          durationInFrames: 90,
          priority: 5
        },
        // 2. Spotlight Chart
        {
          id: 'att-2',
          targetId: 'chart',
          type: 'spotlight',
          intensity: 1,
          startFrame: 150,
          durationInFrames: 90,
          priority: 5
        },
        // 3. Zoom KPI
        {
          id: 'att-3',
          targetId: 'kpi',
          type: 'zoom',
          intensity: 0.5,
          startFrame: 270,
          durationInFrames: 90,
          priority: 5
        },
        // 4. Callout phone
        {
          id: 'att-4',
          targetId: 'phone',
          type: 'callout',
          intensity: 1,
          startFrame: 390,
          durationInFrames: 90,
          priority: 5
        },
        // 5. Multiple simultaneous conflict (Priority testing)
        // Chart gets Spotlight (priority 10), KPI gets underline (priority 5)
        // In exclusive mode, the spotlight wins.
        {
          id: 'att-5a',
          targetId: 'chart',
          type: 'spotlight',
          intensity: 1,
          startFrame: 500,
          durationInFrames: 90,
          priority: 10
        },
        {
          id: 'att-5b',
          targetId: 'kpi',
          type: 'underline',
          intensity: 1,
          startFrame: 500,
          durationInFrames: 90,
          priority: 5
        }
      ]
    };
  }, []);

  const resolvedGraph = useMemo(() => resolveSceneGraph(scene, context), [scene, context]);

  // Playback Loop
  useEffect(() => {
    if (!isPlaying) return;
    let animationId: number;
    let lastTime = Date.now();

    const loop = () => {
      const now = Date.now();
      const elapsed = now - lastTime;
      
      if (elapsed > (1000 / MOCK_FPS)) {
        setFrame(f => {
          if (f >= resolvedGraph.durationInFrames) return 0;
          return f + 1;
        });
        lastTime = now;
      }
      animationId = requestAnimationFrame(loop);
    };
    
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, resolvedGraph.durationInFrames]);

  // Minimal Mock Renderer
  const renderScene = (sceneData: any, localFrame: number) => {
    return (
      <div style={{
        width: '100%', height: '100%',
        backgroundColor: '#0f172a',
        position: 'relative'
      }}>
        {sceneData.scene.elements.map((el: ResolvedSceneElement) => {
          const offset = getAnchorOffset(el.geometry.width, el.geometry.height, el.anchor);
          
          return (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: el.geometry.x + offset.x,
                top: el.geometry.y + offset.y,
                width: el.geometry.width,
                height: el.geometry.height,
                border: el.id === 'chart' ? '2px dashed #334155' : 'none',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: el.id === 'chart' ? '#1e293b' : 'transparent',
              }}
            >
              {el.type === 'text' && (
                <Typography
                  element={el}
                  tokens={sceneData.scene.tokens}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-8 bg-gray-950 min-h-screen text-gray-100 font-sans flex gap-12">
      <div className="w-[400px]">
        <h1 className="text-3xl font-bold mb-6 text-white tracking-tight">Attention & Emphasis</h1>
        
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-md mb-6">
          <div className="text-2xl font-mono mb-4 text-center">
            Frame: {frame.toString().padStart(3, '0')} / {resolvedGraph.durationInFrames}
          </div>
          
          <input 
            type="range" 
            min="0" 
            max={resolvedGraph.durationInFrames} 
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
              {isPlaying ? 'Pause' : 'Play'}
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
          {resolvedGraph.diagnostics.length === 0 ? (
            <p className="text-gray-500">No issues found.</p>
          ) : (
            <ul className="space-y-2">
              {resolvedGraph.diagnostics.map((d, i) => (
                <li key={i} className="text-sm p-3 bg-red-900/20 text-red-400 rounded-lg border border-red-900/50">
                  [{d.severity}] {d.message}
                </li>
              ))}
            </ul>
          )}

          <h2 className="text-lg font-bold text-white mt-8 mb-4">Resolved Instructions</h2>
          <ul className="space-y-4">
            {resolvedGraph.attention.instructions.map((s, i) => (
              <li key={i} className="text-sm border-l-2 border-gray-700 pl-4">
                <span className="font-bold text-gray-300">{s.id}</span>
                <div className="text-blue-400 font-mono mt-1">
                  Type: {s.type}
                </div>
                <div className="text-gray-500 font-mono mt-1">
                  Targets: {s.targetIds.join(', ')}
                </div>
                <div className="text-gray-500 font-mono mt-1">
                  Frames: {s.startFrame} → {s.startFrame + s.durationInFrames}
                </div>
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
            {/* Wrap inside SequenceRenderer to reuse the framework we built */}
            <SequenceRenderer 
              sequence={{
                durationInFrames: resolvedGraph.durationInFrames,
                diagnostics: [],
                scenes: [
                  {
                    id: resolvedGraph.id,
                    scene: resolvedGraph,
                    globalStartFrame: 0,
                    globalEndFrame: resolvedGraph.durationInFrames
                  }
                ]
              }}
              forceFrame={frame}
              renderScene={renderScene}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
