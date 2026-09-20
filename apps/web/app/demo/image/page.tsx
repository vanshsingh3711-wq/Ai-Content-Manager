'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { SceneDefinition, SceneResolutionContext, ResolvedSceneElement } from '@ai-content-manager/motion-components/src/scene/scene.types';
import { resolveSceneGraph } from '@ai-content-manager/motion-components/src/scene/scene.resolve';
import { ImageMedia } from '@ai-content-manager/motion-components/src/elements/ImageMedia/ImageMedia';
import { AttentionRenderer } from '@ai-content-manager/motion-components/src/attention/AttentionRenderer';
import { getAnchorOffset } from '@ai-content-manager/motion-components/src/layout/layout.utils';

const MOCK_FPS = 30;
const DURATION_SECONDS = 15;
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

export default function ImageDemoPage() {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  
  const context = useMemo<SceneResolutionContext>(() => ({
    canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    fps: MOCK_FPS,
    autoRepair: true,
  }), []);

  const scene = useMemo<SceneDefinition>(() => {
    return {
      id: 'img-scene',
      durationInFrames: MOCK_FPS * DURATION_SECONDS,
      themeId: 'premium_dark',
      elements: [
        // 1. Contain fit (default)
        {
          id: 'img-contain',
          type: 'image',
          imageConfig: {
            src: 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=1000&auto=format&fit=crop',
            fit: 'contain',
          },
          placement: {
            positionMode: 'absolute',
            position: { x: 200, y: 200 },
            size: { width: 300, height: 400 }
          }
        },
        // 2. Cover fit (centered)
        {
          id: 'img-cover',
          type: 'image',
          imageConfig: {
            src: 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=1000&auto=format&fit=crop',
            fit: 'cover',
          },
          placement: {
            positionMode: 'absolute',
            position: { x: 600, y: 200 },
            size: { width: 300, height: 400 }
          }
        },
        // 3. Cover fit with focal point (left/top)
        {
          id: 'img-focal-top-left',
          type: 'image',
          imageConfig: {
            src: 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=1000&auto=format&fit=crop',
            fit: 'cover',
            position: { x: 0, y: 0 }
          },
          placement: {
            positionMode: 'absolute',
            position: { x: 200, y: 700 },
            size: { width: 300, height: 400 }
          }
        },
        // 4. Cover fit with focal point (right/bottom)
        {
          id: 'img-focal-bottom-right',
          type: 'image',
          imageConfig: {
            src: 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=1000&auto=format&fit=crop',
            fit: 'cover',
            position: { x: 1, y: 1 }
          },
          placement: {
            positionMode: 'absolute',
            position: { x: 600, y: 700 },
            size: { width: 300, height: 400 }
          }
        },
        // 5. Image with opacity and Attention effect
        {
          id: 'img-attention',
          type: 'image',
          imageConfig: {
            src: 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=1000&auto=format&fit=crop',
            fit: 'cover',
            opacity: 0.8
          },
          placement: {
            positionMode: 'absolute',
            position: { x: 340, y: 1200 },
            size: { width: 400, height: 300 }
          }
        }
      ],
      attention: [
        {
          id: 'att-1',
          targetId: 'img-attention',
          type: 'zoom',
          intensity: 1,
          startFrame: 60,
          durationInFrames: 200,
          priority: 10
        },
        {
          id: 'att-2',
          targetId: 'img-cover',
          type: 'callout',
          intensity: 1,
          startFrame: 150,
          durationInFrames: 100,
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
  const renderScene = () => {
    return (
      <div style={{
        width: '100%', height: '100%',
        backgroundColor: '#0f172a',
        position: 'relative'
      }}>
        {resolvedGraph.elements.map((el: ResolvedSceneElement) => {
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
                border: '1px solid #334155',
                overflow: 'hidden'
              }}
            >
              <ImageMedia element={el} />
              
              {/* Overlay label just for demo readability */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(0,0,0,0.7)',
                color: '#fff',
                padding: '4px 8px',
                fontSize: 14,
                fontFamily: 'monospace'
              }}>
                {el.id} | {el.imageConfig?.fit}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-8 bg-gray-950 min-h-screen text-gray-100 font-sans flex gap-12">
      <div className="w-[400px]">
        <h1 className="text-3xl font-bold mb-6 text-white tracking-tight">Image Media System</h1>
        
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-md mb-6">
          <div className="text-2xl font-mono mb-4 text-center">
            {String(Math.floor(frame / MOCK_FPS)).padStart(2, '0')}:
            {String(frame % MOCK_FPS).padStart(2, '0')}
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

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-md text-sm">
          <h2 className="font-semibold mb-4 text-gray-400 uppercase tracking-wider">Active Validations</h2>
          {resolvedGraph.diagnostics.length > 0 ? (
            <div className="flex flex-col gap-2">
              {resolvedGraph.diagnostics.map((d, i) => (
                <div key={i} className={`p-3 rounded-lg ${d.severity === 'error' ? 'bg-red-950 border border-red-900/50 text-red-200' : 'bg-yellow-950 border border-yellow-900/50 text-yellow-200'}`}>
                  <span className="font-bold mr-2 uppercase text-xs opacity-70">[{d.severity}]</span>
                  {d.message}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 italic">No layout or image resolution errors.</div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-gray-900/50 rounded-2xl border border-gray-800 p-8 overflow-hidden">
        {/* Responsive scaling container */}
        <div 
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: 'scale(0.35)', // Scale down 1080x1920 to fit most screens
            transformOrigin: 'center center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            borderRadius: '24px',
            overflow: 'hidden',
            backgroundColor: '#0f172a',
            position: 'relative'
          }}
        >
          <AttentionRenderer 
            sequence={resolvedGraph.attention} 
            localFrame={frame} 
            viewportWidth={CANVAS_WIDTH} 
            viewportHeight={CANVAS_HEIGHT}
          >
            {renderScene()}
          </AttentionRenderer>
        </div>
      </div>
    </div>
  );
}
