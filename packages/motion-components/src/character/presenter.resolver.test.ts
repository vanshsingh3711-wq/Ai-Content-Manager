import { describe, it, expect, vi } from 'vitest';
import { resolveSceneGraph } from '../scene/scene.resolve';
import { SceneDefinition, SceneResolutionContext } from '../scene/scene.types';
import { RiveCharacterAdapter } from './adapters/rive.adapter';
import { getCharacterAdapter } from './adapters';

const mockContext: SceneResolutionContext = {
  canvas: { width: 1920, height: 1080 },
  fps: 30,
  autoRepair: true
};

describe('Presenter System Resolution', () => {
  it('resolves valid idle action correctly', () => {
    const scene: SceneDefinition = {
      id: 'test-scene',
      elements: [
        {
          id: 'p1',
          type: 'presenter',
          presenterTimeline: [
            {
              presenterId: 'p1',
              characterAssetId: 'rive-presenter',
              action: 'idle',
              startFrame: 0,
              durationInFrames: 30
            }
          ],
          placement: { size: { width: 400, height: 400 } }
        }
      ]
    };

    const result = resolveSceneGraph(scene, mockContext);
    
    expect(result.diagnostics).toHaveLength(0);
    const presenter = result.elements.find(e => e.id === 'p1');
    expect(presenter?.presenterTimeline?.[0].action).toBe('idle');
  });

  it('falls back to idle for unsupported action and issues warning', () => {
    const scene: SceneDefinition = {
      id: 'test-scene',
      elements: [
        {
          id: 'p1',
          type: 'presenter',
          presenterTimeline: [
            {
              presenterId: 'p1',
              characterAssetId: 'rive-presenter',
              action: 'think', // Rive adapter does not support think
              startFrame: 0,
              durationInFrames: 30
            }
          ],
          placement: { size: { width: 400, height: 400 } }
        }
      ]
    };

    const result = resolveSceneGraph(scene, mockContext);
    
    const warning = result.diagnostics.find(d => d.type === 'UNSUPPORTED_PRESENTER_ACTION');
    expect(warning).toBeDefined();
    
    const presenter = result.elements.find(e => e.id === 'p1');
    expect(presenter?.presenterTimeline?.[0].action).toBe('idle'); // Fallback
  });

  it('resolves target geometry for target-aware actions', () => {
    const scene: SceneDefinition = {
      id: 'test-scene',
      elements: [
        {
          id: 'chart1',
          type: 'asset',
          assetId: 'fake-asset',
          placement: { position: { x: 500, y: 500 }, size: { width: 200, height: 100 } }
        },
        {
          id: 'p1',
          type: 'presenter',
          presenterTimeline: [
            {
              presenterId: 'p1',
              characterAssetId: 'svg-presenter',
              action: 'pointRight',
              targetId: 'chart1',
              startFrame: 0,
              durationInFrames: 30
            }
          ],
          placement: { size: { width: 400, height: 400 } }
        }
      ]
    };

    const result = resolveSceneGraph(scene, mockContext);
    
    const presenter = result.elements.find(e => e.id === 'p1');
    expect(presenter?.presenterTimeline?.[0].resolvedTargetGeometry).toBeDefined();
    expect(presenter?.presenterTimeline?.[0].resolvedTargetGeometry?.width).toBe(200);
    expect(presenter?.presenterTimeline?.[0].resolvedTargetGeometry?.height).toBe(100);
  });

  it('automatically corrects pointRight to pointLeft if target is on the left', () => {
    const scene: SceneDefinition = {
      id: 'test-scene',
      elements: [
        {
          id: 'chart1', // Positioned at x=-500 (left)
          type: 'asset',
          assetId: 'fake-asset',
          placement: { positionMode: 'absolute', position: { x: -500, y: 150 }, size: { width: 100, height: 100 } }
        },
        {
          id: 'p1',     // Positioned at x=0
          type: 'presenter',
          presenterTimeline: [
            {
              presenterId: 'p1',
              characterAssetId: 'svg-presenter',
              action: 'pointRight', // Intent is pointRight
              targetId: 'chart1',
              startFrame: 0,
              durationInFrames: 30
            }
          ],
          placement: { positionMode: 'absolute', position: { x: 0, y: 0 }, size: { width: 400, height: 400 } }
        }
      ]
    };

    const result = resolveSceneGraph(scene, mockContext);
    
    const presenter = result.elements.find(e => e.id === 'p1');
    // Because target is at -500 and presenter is at 0, the dx is negative.
    // The adapter logic should swap 'pointRight' to 'pointLeft'.
    expect(presenter?.presenterTimeline?.[0].action).toBe('pointLeft');
  });

  it('issues warning when targetId is missing in scene', () => {
    const scene: SceneDefinition = {
      id: 'test-scene',
      elements: [
        {
          id: 'p1',
          type: 'presenter',
          presenterTimeline: [
            {
              presenterId: 'p1',
              characterAssetId: 'svg-presenter',
              action: 'pointRight',
              targetId: 'non-existent-chart',
              startFrame: 0,
              durationInFrames: 30
            }
          ]
        }
      ]
    };

    const result = resolveSceneGraph(scene, mockContext);
    const diag = result.diagnostics.find(d => d.type === 'MISSING_PRESENTER_TARGET');
    expect(diag).toBeDefined();
  });

  it('issues warning when presenter targets itself', () => {
    const scene: SceneDefinition = {
      id: 'test-scene',
      elements: [
        {
          id: 'p1',
          type: 'presenter',
          presenterTimeline: [
            {
              presenterId: 'p1',
              characterAssetId: 'svg-presenter',
              action: 'pointRight',
              targetId: 'p1', // self targeting
              startFrame: 0,
              durationInFrames: 30
            }
          ]
        }
      ]
    };

    const result = resolveSceneGraph(scene, mockContext);
    const diag = result.diagnostics.find(d => d.type === 'INVALID_PRESENTER_TARGET');
    expect(diag).toBeDefined();
    expect(diag?.message).toMatch(/cannot target itself/);
  });

  it('issues warning for invalid timeline frames', () => {
    const scene: SceneDefinition = {
      id: 'test-scene',
      elements: [
        {
          id: 'p1',
          type: 'presenter',
          presenterTimeline: [
            {
              presenterId: 'p1',
              characterAssetId: 'svg-presenter',
              action: 'talk',
              startFrame: -10, // negative start frame
              durationInFrames: 0 // zero duration
            }
          ]
        }
      ]
    };

    const result = resolveSceneGraph(scene, mockContext);
    const diag = result.diagnostics.find(d => d.type === 'INVALID_PRESENTER_TIMING');
    expect(diag).toBeDefined();
    expect(diag?.message).toMatch(/invalid timing/);
  });
});
