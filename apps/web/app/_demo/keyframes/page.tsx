'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SceneDefinition, resolveSceneGraph } from '@ai-content-manager/motion-components/src/scene';
import { SequenceRenderer } from '@ai-content-manager/motion-components/src/elements/Sequence/SequenceRenderer';
import { SceneResolutionContext, ResolvedSceneElement } from '@ai-content-manager/motion-components/src/scene/scene.types';
import { Typography } from '@ai-content-manager/motion-components/src/elements/Typography';
import { getAnchorOffset } from '@ai-content-manager/motion-components/src/layout/layout.utils';
import { evaluateElementKeyframes } from '@ai-content-manager/motion-components/src/keyframes';
import { Timeline } from '@ai-content-manager/motion-components/src/timeline/components/Timeline';
import { TimelineState } from '@ai-content-manager/motion-components/src/timeline/timeline.types';

const MOCK_FPS = 30;

export default function KeyframesDemoPage() {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [keyframeMode, setKeyframeMode] = useState(false);
  
  // State for scene elements (to allow editing)
  const [elements, setElements] = useState<SceneDefinition['elements']>([
    {
      id: 'animated-text',
      type: 'text',
      textContent: 'Keyframed Text',
      textConfig: { role: 'hero', align: 'center', maxWidth: 900 },
      placement: { position: { x: 540, y: 960 }, positionMode: 'absolute', anchor: 'center' },
      keyframes: [
        {
          property: 'x',
          keyframes: [
            { id: 'kf-x-1', frame: 30, value: 300, easing: 'easeInOut' },
            { id: 'kf-x-2', frame: 120, value: 780, easing: 'easeInOut' }
          ]
        },
        {
          property: 'scale',
          keyframes: [
            { id: 'kf-s-1', frame: 30, value: 1, easing: 'easeOut' },
            { id: 'kf-s-2', frame: 75, value: 1.5, easing: 'easeIn' },
            { id: 'kf-s-3', frame: 120, value: 1, easing: 'easeOut' }
          ]
        }
      ]
    }
  ]);

  const context: SceneResolutionContext = useMemo(() => ({
    canvas: { width: 1080, height: 1920 },
    fps: MOCK_FPS,
    autoRepair: true
  }), []);

  const scene: SceneDefinition = useMemo(() => {
    return {
      id: 'keyframes-demo',
      themeId: 'premium_dark', 
      durationInFrames: 300, // 10 seconds
      elements
    };
  }, [elements]);

  const resolvedGraph = useMemo(() => resolveSceneGraph(scene, context), [scene, context]);

  // Build timeline state for the UI
  const timelineState: TimelineState = useMemo(() => {
    return {
      durationInFrames: 300,
      fps: MOCK_FPS,
      tracks: [
        {
          id: 'track-1',
          type: 'visual',
          label: 'Elements',
          items: resolvedGraph.elements.map(el => ({
            id: el.id,
            type: el.type === 'text' ? 'visual' : 'scene',
            sourceId: el.id,
            startFrame: el.timing.startFrame,
            durationInFrames: el.timing.durationInFrames,
            trackId: 'track-1',
            label: el.textContent || el.id,
            keyframes: el.keyframes?.flatMap(kft => kft.keyframes.map(k => ({ id: k.id, frame: k.frame })))
          }))
        }
      ]
    };
  }, [resolvedGraph]);

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
          if (f >= resolvedGraph.durationInFrames) {
            setIsPlaying(false);
            return f;
          }
          return f + 1;
        });
        lastTime = now;
      }
      animationId = requestAnimationFrame(loop);
    };
    
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, resolvedGraph.durationInFrames]);

  // Minimal Mock Renderer that evaluates keyframes
  const renderScene = useCallback((sceneData: any, localFrame: number) => {
    return (
      <div style={{
        width: '100%', height: '100%',
        backgroundColor: '#0f172a',
        position: 'relative'
      }}>
        {sceneData.scene.elements.map((el: ResolvedSceneElement) => {
          // Evaluate keyframes for this specific frame
          const baseState = {
            x: el.geometry.x,
            y: el.geometry.y,
            scale: 1,
            rotation: 0,
            opacity: 1
          };
          const resolvedState = evaluateElementKeyframes(el.keyframes, localFrame, baseState);

          const finalX = resolvedState.x ?? el.geometry.x;
          const finalY = resolvedState.y ?? el.geometry.y;
          const finalScale = resolvedState.scale ?? 1;
          const finalRotation = resolvedState.rotation ?? 0;
          const finalOpacity = resolvedState.opacity ?? 1;

          const offset = getAnchorOffset(el.geometry.width, el.geometry.height, el.anchor);
          
          return (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: finalX + offset.x,
                top: finalY + offset.y,
                width: el.geometry.width,
                height: el.geometry.height,
                transform: `scale(${finalScale}) rotate(${finalRotation}deg)`,
                opacity: finalOpacity,
                transformOrigin: 'center center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
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
  }, []);

  const handleEditX = (newX: number) => {
    setElements(prev => {
      const copy = [...prev];
      const el = { ...copy[0] }; // hardcode first element for demo
      
      if (keyframeMode) {
        // Find or create 'x' track
        const keyframes = el.keyframes ? [...el.keyframes] : [];
        let xTrack = keyframes.find(t => t.property === 'x');
        
        if (!xTrack) {
          xTrack = { property: 'x', keyframes: [] };
          keyframes.push(xTrack);
        } else {
          xTrack = { ...xTrack, keyframes: [...xTrack.keyframes] };
          keyframes[keyframes.indexOf(keyframes.find(t => t.property === 'x')!)] = xTrack;
        }

        const existingKeyframeIndex = xTrack.keyframes.findIndex(k => k.frame === frame);
        if (existingKeyframeIndex >= 0) {
          // Update existing
          xTrack.keyframes[existingKeyframeIndex] = { ...xTrack.keyframes[existingKeyframeIndex], value: newX };
        } else {
          // Create new
          xTrack.keyframes.push({ id: `kf-${Date.now()}`, frame, value: newX, easing: 'easeInOut' });
        }
        
        el.keyframes = keyframes;
      } else {
        // Edit base layout property
        el.placement = { ...el.placement, position: { ...el.placement?.position, x: newX } };
      }
      
      copy[0] = el;
      return copy;
    });
  };

  // Extract current X for the slider
  const targetElement = resolvedGraph.elements[0];
  const currentEvaluatedX = targetElement 
    ? (evaluateElementKeyframes(targetElement.keyframes, frame, { x: targetElement.geometry.x }).x ?? 540)
    : 540;

  return (
    <div className="p-8 bg-gray-950 min-h-screen text-gray-100 font-sans flex flex-col gap-8">
      <div className="flex gap-12">
        <div className="w-[400px]">
          <h1 className="text-3xl font-bold mb-6 text-white tracking-tight">Keyframe System</h1>
          
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

            <div className="flex gap-4 mb-8">
              <button 
                onClick={() => setIsPlaying(!isPlaying)} 
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
            </div>

            <div className="border-t border-gray-800 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-300">Properties (Element 1)</h3>
                <span className={`text-xs px-2 py-1 rounded font-bold ${keyframeMode ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                  {keyframeMode ? 'KEYFRAME MODE ON' : 'BASE EDIT MODE'}
                </span>
              </div>
              
              <div className="mb-2">
                <label className="text-sm text-gray-400 block mb-1">Position X: {Math.round(currentEvaluatedX)}px</label>
                <input 
                  type="range" 
                  min="0" 
                  max="1080" 
                  value={currentEvaluatedX}
                  onChange={(e) => handleEditX(parseInt(e.target.value))} 
                  className="w-full accent-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {keyframeMode 
                    ? "Editing X will add/update a keyframe at the current playhead." 
                    : "Editing X will update the base layout (static)."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex justify-center items-center">
          <div 
            className="relative bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800"
            style={{ width: '400px', height: `${400 * (1920/1080)}px` }}
          >
            <div className="absolute inset-0 origin-top-left" style={{ transform: `scale(${400 / 1080})`, width: 1080, height: 1920 }}>
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
      
      {/* Timeline Integration */}
      <div className="w-full mt-4">
        <Timeline 
          timeline={timelineState}
          currentFrame={frame}
          onCurrentFrameChange={setFrame}
          keyframeMode={keyframeMode}
          onKeyframeModeToggle={setKeyframeMode}
          pixelsPerFrame={3}
        />
      </div>
    </div>
  );
}
