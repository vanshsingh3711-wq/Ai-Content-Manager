'use client';

import React, { useState, useEffect } from 'react';
import { 
  SceneDefinition, 
  SceneResolutionContext, 
  resolveSceneGraph 
} from '@ai-content-manager/motion-components/src/scene';
import { registerAsset, clearRegistry } from '@ai-content-manager/motion-components/src/assets/assets.registry';
import { getAnchorOffset } from '@ai-content-manager/motion-components/src/layout/layout.utils';

export default function SceneDemoPage() {
  const [sceneGraph, setSceneGraph] = useState<any>(null);

  useEffect(() => {
    // 1. Setup Environment (Mock Asset Registry)
    clearRegistry();
    registerAsset({ 
      id: 'phone_mockup', 
      type: 'image', 
      tags: ['ui', 'mockup'], 
      capabilities: [],
      intrinsicSize: { width: 300, height: 600 }
    });
    registerAsset({ 
      id: 'headline_text', 
      type: 'text', 
      tags: ['heading'], 
      capabilities: [],
      intrinsicSize: { width: 800, height: 100 }
    });
    registerAsset({ 
      id: 'cta_button', 
      type: 'ui', 
      tags: ['button'], 
      capabilities: [],
      intrinsicSize: { width: 200, height: 60 }
    });
    registerAsset({ 
      id: 'profile_pic', 
      type: 'image', 
      tags: ['avatar'], 
      capabilities: [],
      intrinsicSize: { width: 120, height: 120 }
    });

    // 2. Define AI Declarative Scene
    const scene: SceneDefinition = {
      id: 'marketing_scene',
      safeZones: [
        { id: 'top_nav', type: 'restricted', x: 0, y: 0, width: 1, height: 0.1 },
        { id: 'bottom_nav', type: 'restricted', x: 0, y: 0.9, width: 1, height: 0.1 }
      ],
      elements: [
        {
          id: 'phone',
          assetRequest: { type: 'image', tags: ['mockup'] },
          placement: { positionMode: 'auto', position: { x: 390, y: 600 } }, // Center-ish
          timing: { startFrame: 0, durationInFrames: 90 },
          layer: 1
        },
        {
          id: 'title',
          assetRequest: { type: 'text', tags: ['heading'] },
          placement: { positionMode: 'auto', position: { x: 540, y: 150 }, anchor: 'center' }, 
          timing: { startFrame: 15, durationInFrames: 75 },
          layer: 2
        },
        {
          id: 'cta',
          assetRequest: { type: 'ui', tags: ['button'] },
          placement: { positionMode: 'auto' }, // Will be positioned via relationships
          timing: { startFrame: 30, durationInFrames: 60 },
          layer: 3
        },
        {
          id: 'profile',
          assetRequest: { type: 'image', tags: ['avatar'] },
          placement: { positionMode: 'auto' },
          timing: { startFrame: 0, durationInFrames: 90 },
          layer: 4
        },
        {
          id: 'bad_overflow',
          assetRequest: { type: 'image', tags: ['avatar'] },
          placement: { positionMode: 'absolute', position: { x: -50, y: 50 }, size: { width: 100, height: 100 } }
        }
      ],
      relationships: [
        { sourceId: 'cta', targetId: 'phone', relation: 'inside', gap: 0 },
        { sourceId: 'profile', targetId: 'title', relation: 'left', gap: 20 }
      ]
    };

    const context: SceneResolutionContext = {
      canvas: { width: 1080, height: 1920 },
      fps: 30,
      autoRepair: true
    };

    // 3. Resolve the Pipeline!
    const resolved = resolveSceneGraph(scene, context);
    setSceneGraph(resolved);

  }, []);

  if (!sceneGraph) return <div>Loading...</div>;

  return (
    <div className="p-8 bg-gray-950 min-h-screen text-gray-100 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-white tracking-tight">Scene Assembly Pipeline Demo</h1>
        <p className="text-gray-400 mb-8 max-w-2xl text-lg">
          This demo visually represents the output of the entire orchestrated pipeline: 
          AI Intent &gt; Asset Selection &gt; Auto Positioning &gt; Relationships &gt; Safe Zones &gt; Validation/Repair &gt; Renderable Scene Graph.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Canvas visualization */}
          <div>
            <div className="relative border-4 border-gray-800 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl" 
                 style={{ width: '400px', height: `${400 * (1920/1080)}px` }}>
              
              {/* Render Safe Zones (scaled down) */}
              <div className="absolute top-0 left-0 w-full h-[10%] bg-red-500/20 border-b border-red-500/50 flex items-center justify-center">
                <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Top Nav Restricted</span>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-[10%] bg-red-500/20 border-t border-red-500/50 flex items-center justify-center">
                <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Bottom Nav Restricted</span>
              </div>

              {/* Render Resolved Elements */}
              {sceneGraph.elements.map((el: any) => {
                const scale = 400 / 1080;
                
                // Colors based on asset ID for visual distinction
                const colors: Record<string, string> = {
                  'phone_mockup': 'bg-blue-500/30 border-blue-400 text-blue-200',
                  'headline_text': 'bg-purple-500/30 border-purple-400 text-purple-200',
                  'cta_button': 'bg-green-500/30 border-green-400 text-green-200',
                  'profile_pic': 'bg-yellow-500/30 border-yellow-400 text-yellow-200'
                };
                
                const styleClass = colors[el.assetId] || 'bg-gray-500/30 border-gray-400 text-gray-200';

                // Convert anchored geometry to absolute top-left for the DOM
                const offset = getAnchorOffset(el.geometry.width, el.geometry.height, el.anchor);
                const absoluteLeft = el.geometry.x + offset.x;
                const absoluteTop = el.geometry.y + offset.y;

                return (
                  <div
                    key={el.id}
                    className={`absolute border-2 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center p-2 shadow-lg transition-all duration-500 ${styleClass}`}
                    style={{
                      left: absoluteLeft * scale,
                      top: absoluteTop * scale,
                      width: el.geometry.width * scale,
                      height: el.geometry.height * scale,
                    }}
                  >
                    <span className="font-bold text-sm tracking-wide">{el.id}</span>
                    <span className="text-xs opacity-75">{el.assetId}</span>
                    <span className="text-[10px] mt-1 bg-black/40 px-2 py-0.5 rounded-full font-mono">
                      f{el.timing.startFrame}-{el.timing.endFrame}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Output */}
          <div className="space-y-6">
            
            {/* Status Panel */}
            <div className={`p-6 rounded-xl border-l-4 shadow-md ${sceneGraph.valid ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'}`}>
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                {sceneGraph.valid ? '✅ Render Gate: PASSED' : '❌ Render Gate: FAILED'}
              </h2>
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-gray-300 font-mono">
                <div>Duration: <span className="text-white">{sceneGraph.durationInFrames} frames</span></div>
                <div>Elements: <span className="text-white">{sceneGraph.elements.length}</span></div>
                <div>FPS: <span className="text-white">{sceneGraph.fps}</span></div>
                <div>Resolution: <span className="text-white">{sceneGraph.width}x{sceneGraph.height}</span></div>
              </div>
            </div>

            {/* Diagnostics */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-md">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                Diagnostics Pipeline
                <span className="bg-gray-800 text-xs px-2 py-1 rounded-full">{sceneGraph.diagnostics.length}</span>
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {sceneGraph.diagnostics.length === 0 && (
                  <p className="text-gray-500 italic">No diagnostics generated.</p>
                )}
                {sceneGraph.diagnostics.map((diag: any, i: number) => (
                  <div key={i} className={`p-3 rounded-lg border flex gap-3 text-sm
                    ${diag.severity === 'error' ? 'bg-red-900/10 border-red-900/50 text-red-200' : ''}
                    ${diag.severity === 'warning' ? 'bg-yellow-900/10 border-yellow-900/50 text-yellow-200' : ''}
                    ${diag.severity === 'info' ? 'bg-blue-900/10 border-blue-900/50 text-blue-200' : ''}
                  `}>
                    <span className="uppercase text-[10px] font-bold tracking-wider mt-0.5 opacity-80 w-16">
                      {diag.severity}
                    </span>
                    <div>
                      <p className="font-semibold mb-1">{diag.message}</p>
                      <div className="flex gap-2">
                        <span className="text-xs opacity-75 font-mono">type: {diag.type}</span>
                        {diag.elementIds?.length > 0 && (
                          <span className="text-xs opacity-75 font-mono">elements: {diag.elementIds.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw JSON */}
            <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-md">
              <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
                <span className="text-xs font-mono text-gray-400">ResolvedSceneGraph.json</span>
              </div>
              <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto custom-scrollbar h-64">
                {JSON.stringify(sceneGraph, null, 2)}
              </pre>
            </div>

          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />
    </div>
  );
}
