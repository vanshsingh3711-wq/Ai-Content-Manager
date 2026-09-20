'use client';

import React, { useState, useEffect } from 'react';
import { SceneDefinition, ResolvedSceneGraph } from '@motion/scene/scene.types';
import { resolveSceneGraph } from '@motion/scene/scene.resolve';
import { CaptionMedia } from '@motion/elements/Caption/CaptionMedia';

import { DEFAULT_THEME } from '@motion/themes/default.theme';
import { DEFAULT_TOKENS } from '@motion/themes/default.tokens';
import { getAnchorOffset } from '@motion/layout/layout.resolver';

const DEMO_SCENE: SceneDefinition = {
  id: 'caption-demo',
  durationInFrames: 300,
  elements: [
    {
      id: 'background-image',
      type: 'image',
      imageConfig: { src: 'demo-bg.jpg', objectFit: 'cover' },
      timing: { startFrame: 0, durationInFrames: 300 },
      placement: { positionMode: 'fullscreen' },
      layer: 0
    },
    {
      id: 'main-captions',
      type: 'caption',
      captionConfig: {
        id: 'track1',
        enabled: true,
        cues: [
          {
            id: 'cue1',
            text: 'The credit card looks convenient...',
            startFrame: 30,
            endFrame: 120,
            words: [
              { id: 'w1', text: 'The', startFrame: 30, endFrame: 45 },
              { id: 'w2', text: 'credit', startFrame: 45, endFrame: 65 },
              { id: 'w3', text: 'card', startFrame: 65, endFrame: 80 },
              { id: 'w4', text: 'looks', startFrame: 80, endFrame: 95 },
              { id: 'w5', text: 'convenient...', startFrame: 95, endFrame: 120 }
            ]
          },
          {
            id: 'cue2',
            text: 'but interest changes the story.',
            startFrame: 135,
            endFrame: 240,
            words: [
              { id: 'w6', text: 'but', startFrame: 135, endFrame: 150 },
              { id: 'w7', text: 'interest', startFrame: 150, endFrame: 180 },
              { id: 'w8', text: 'changes', startFrame: 180, endFrame: 200 },
              { id: 'w9', text: 'the', startFrame: 200, endFrame: 215 },
              { id: 'w10', text: 'story.', startFrame: 215, endFrame: 240 }
            ]
          }
        ]
      },
      textConfig: {
        role: 'caption',
        align: 'center',
        verticalAlign: 'bottom',
        background: 'pill'
      },
      timing: { startFrame: 0, durationInFrames: 300 },
      placement: {
        positionMode: 'safe-zone', // Natively respects safe zone layouts
        anchor: 'bottom-center',
        size: { width: 800 } // constrain width for wrapping
      },
      layer: 10 // On top
    }
  ],
  safeZones: [
    {
      id: 'bottom-nav',
      type: 'bottom-nav',
      priority: 1,
      rect: { x: 0, y: 1920 - 200, width: 1080, height: 200 },
      action: 'avoid'
    }
  ]
};

const FPS = 30;

export default function CaptionDemoPage() {
  const [resolvedGraph, setResolvedGraph] = useState<ResolvedSceneGraph | null>(null);
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const resolved = resolveSceneGraph(DEMO_SCENE, {
      canvas: { width: 1080, height: 1920 },
      fps: FPS
    }, DEFAULT_THEME, DEFAULT_TOKENS);
    
    setResolvedGraph(resolved);
  }, []);

  useEffect(() => {
    if (!isPlaying || !resolvedGraph) return;
    let animationId: number;
    const loop = () => {
      setFrame(prev => (prev + 1 >= resolvedGraph.durationInFrames ? 0 : prev + 1));
      animationId = requestAnimationFrame(loop);
    };
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, resolvedGraph]);

  if (!resolvedGraph) return null;

  return (
    <div className="p-8 bg-gray-950 min-h-screen text-gray-100 font-sans flex gap-12">
      <div className="w-[400px]">
        <h1 className="text-3xl font-bold mb-6 text-white tracking-tight">Caption System</h1>
        
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-md mb-6">
          <div className="text-2xl font-mono mb-4 text-center">
            {String(Math.floor(frame / FPS)).padStart(2, '0')}:
            {String(frame % FPS).padStart(2, '0')}
          </div>
          
          <div className="w-full h-2 bg-gray-800 rounded-full mb-6 overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-75 ease-linear"
              style={{ width: `${(frame / resolvedGraph.durationInFrames) * 100}%` }}
            />
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex-1 bg-white text-black py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button 
              onClick={() => setFrame(0)}
              className="flex-1 bg-gray-800 text-white py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-700"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-gray-900/50 rounded-2xl border border-gray-800 p-8">
        <div className="relative border-4 border-gray-800 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl" 
             style={{ width: '400px', height: `${400 * (1920/1080)}px` }}>
          
          {/* Safe Zone visualization */}
          <div className="absolute bottom-0 left-0 w-full h-[10.4%] bg-red-500/20 border-t border-red-500/50 flex items-center justify-center z-50 pointer-events-none">
            <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Bottom Safe Zone</span>
          </div>

          {/* Render scene elements */}
          {resolvedGraph.elements.map((el) => {
            const scale = 400 / 1080;
            const offset = getAnchorOffset(el.geometry.width, el.geometry.height, el.anchor);
            const absX = el.geometry.x + offset.x;
            const absY = el.geometry.y + offset.y;

            if (el.type === 'caption') {
              return (
                <div key={el.id} className="absolute" style={{
                  left: absX * scale,
                  top: absY * scale,
                  width: el.geometry.width * scale,
                  height: el.geometry.height * scale,
                  transformOrigin: 'top left',
                  transform: `scale(${scale})`
                }}>
                  <CaptionMedia element={el} localFrame={frame} tokens={DEFAULT_TOKENS} />
                </div>
              );
            }

            return null; // Ignore images in this demo
          })}
        </div>
      </div>
    </div>
  );
}
