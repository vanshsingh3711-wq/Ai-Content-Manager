import React from 'react';
import { Composition, Sequence, useCurrentFrame } from 'remotion';
import { DefaultSceneRenderer } from '../render/DefaultSceneRenderer';
import { resolveMotionIntents } from './resolver';
import { SceneDefinition, ResolvedSceneGraph } from '../scene/scene.types';

// Mock components to render the showcase
const renderScene = (sceneId: string, elements: any[], intent: any) => {
  const baseScene: SceneDefinition = {
    id: sceneId,
    elements: elements.map((e, i) => ({
      id: e.id,
      type: 'text',
      textContent: e.id, // Just showing the ID for the showcase
      geometry: e.geometry || { x: 400, y: 300 + (i * 100), width: 300, height: 80 },
      anchor: 'center',
      timing: { startFrame: 0, durationInFrames: 300 },
      layer: i
    })),
  };

  const resolved = resolveMotionIntents(baseScene, [intent]);
  
  // Create a mock resolved scene graph for the DefaultSceneRenderer
  const resolvedSceneGraph: ResolvedSceneGraph = {
    ...resolved.scene,
    fps: 30,
    width: 1080,
    height: 1920,
    durationInFrames: 300,
    theme: { colors: { background: '#0F172A' } } as any,
    tokens: {} as any,
    attention: resolved.scene.attention as any || [],
    audio: [],
    diagnostics: [],
    valid: true,
    elements: resolved.scene.elements.map(e => ({
      ...e,
      anchor: 'center',
      geometry: e.geometry as any,
      timing: { startFrame: 0, durationInFrames: 300, endFrame: 300 }
    })) as any
  };

  return (
    <Sequence durationInFrames={300}>
      <DefaultSceneRenderer sceneData={{ id: 'seq-1', scene: resolvedSceneGraph, globalStartFrame: 0, globalEndFrame: 300 }} localFrame={useCurrentFrame()} />
    </Sequence>
  );
};

export const HeroRevealShowcase: React.FC = () => {
  return renderScene(
    'hero',
    [
      { id: 'bg-1', geometry: { x: 0, y: 0, width: 1080, height: 1920 } },
      { id: 'label-1', geometry: { x: 540, y: 700, width: 200, height: 50 } },
      { id: 'headline-1', geometry: { x: 540, y: 800, width: 800, height: 120 } },
      { id: 'keyword-1', geometry: { x: 540, y: 950, width: 400, height: 80 } },
      { id: 'support-1', geometry: { x: 540, y: 1100, width: 600, height: 60 } },
    ],
    {
      type: 'hero_reveal',
      targets: {
        background: 'bg-1',
        label: 'label-1',
        headline: 'headline-1',
        accent: 'keyword-1',
        supporting: 'support-1'
      },
      durationInFrames: 90
    }
  );
};

export const MetricRevealShowcase: React.FC = () => {
  return renderScene(
    'metric',
    [
      { id: 'm-label', geometry: { x: 540, y: 700, width: 300, height: 60 } },
      { id: 'm-value', geometry: { x: 540, y: 850, width: 500, height: 150 } },
      { id: 'm-delta', geometry: { x: 800, y: 850, width: 150, height: 60 } },
      { id: 'm-accent', geometry: { x: 540, y: 950, width: 400, height: 10 } },
    ],
    {
      type: 'metric_reveal',
      targets: {
        label: 'm-label',
        metric: 'm-value',
        delta: 'm-delta',
        accent: 'm-accent'
      },
      durationInFrames: 80,
      personality: 'energetic'
    }
  );
};

export const MotionShowcaseRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HeroReveal"
        component={HeroRevealShowcase}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="MetricReveal"
        component={MetricRevealShowcase}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* Add more compositions as needed */}
    </>
  );
};
