'use client';

import React, { useState, useEffect } from 'react';
import { SceneDefinition, ResolvedSceneGraph } from '@motion/scene/scene.types';
import { resolveSceneGraph } from '@motion/scene/scene.resolve';
import { SceneAudioRenderer } from '@motion/elements/Audio/SceneAudioRenderer';

// We just reuse the tokens and theme from auto-position since this is a pure logic demo
import { DEFAULT_THEME } from '@motion/themes/default.theme';
import { DEFAULT_TOKENS } from '@motion/themes/default.tokens';

const DEMO_SCENE: SceneDefinition = {
  id: 'audio-demo',
  durationInFrames: 300,
  elements: [],
  audio: [
    {
      id: 'bgm-track',
      type: 'music',
      src: 'music.mp3',
      startFrame: 0,
      volume: 0.3, // Lower volume for background music
      fadeInFrames: 30, // 1 second fade in
      fadeOutFrames: 60, // 2 second fade out at the end of the scene
      loop: true,
      metadata: {
        durationInFrames: 120 // Short track to demonstrate looping
      }
    },
    {
      id: 'vo-track-1',
      type: 'voiceover',
      src: 'vo1.mp3',
      startFrame: 30,
      durationInFrames: 90,
      volume: 1,
      fadeInFrames: 5,
      fadeOutFrames: 5
    },
    {
      id: 'vo-track-2',
      type: 'voiceover',
      src: 'vo2.mp3',
      startFrame: 150,
      durationInFrames: 90,
      volume: 1,
      fadeInFrames: 5,
      fadeOutFrames: 5
    },
    {
      id: 'sfx-pop-1',
      type: 'sfx',
      src: 'pop.mp3',
      startFrame: 45,
      volume: 0.8,
      durationInFrames: 15
    },
    {
      id: 'sfx-pop-2',
      type: 'sfx',
      src: 'pop.mp3',
      startFrame: 165,
      volume: 0.8,
      durationInFrames: 15
    },
    {
      id: 'video-audio',
      type: 'video',
      src: 'embedded-video.mp4',
      startFrame: 60,
      volume: 1,
      muted: true, // Demonstrate muting embedded audio
      durationInFrames: 60
    }
  ]
};

const FPS = 30;

export default function AudioDemoPage() {
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
      setFrame(prev => {
        const next = prev + 1;
        if (next >= resolvedGraph.durationInFrames) {
          return 0; // loop composition
        }
        return next;
      });
      animationId = requestAnimationFrame(loop);
    };
    
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, resolvedGraph]);

  if (!resolvedGraph) return null;

  return (
    <div className="p-8 bg-gray-950 min-h-screen text-gray-100 font-sans flex gap-12">
      <div className="w-[400px]">
        <h1 className="text-3xl font-bold mb-6 text-white tracking-tight">Audio Media System</h1>
        
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
            <div className="text-gray-500 italic">No audio resolution errors.</div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-gray-900/50 rounded-2xl border border-gray-800 p-8 overflow-hidden relative" style={{ minHeight: '600px' }}>
        <h2 className="text-gray-500 text-xl font-bold mb-4">Composition Preview</h2>
        <p className="text-gray-600 mb-8 max-w-md text-center">Since Remotion is not installed, this visually mocks the deterministic state of the audio tracks frame-by-frame.</p>
        
        {/* Render audio track badges over the empty visual scene */}
        <SceneAudioRenderer tracks={resolvedGraph.audio} localFrame={frame} />
      </div>
    </div>
  );
}
