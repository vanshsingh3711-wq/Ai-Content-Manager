import { describe, it, expect, beforeEach } from 'vitest';
import { resolveSceneGraph } from './scene.resolve';
import { SceneDefinition, SceneResolutionContext } from './scene.types';
import { registerAsset, clearRegistry } from '../assets/assets.registry';

describe('Scene Assembly & Resolution', () => {

  beforeEach(() => {
    clearRegistry();
    registerAsset({ id: 'text_asset', type: 'text', tags: ['heading'], capabilities: [] });
    registerAsset({ id: 'box', type: 'shape', tags: [], capabilities: [] });
  });

  const context: SceneResolutionContext = {
    canvas: { width: 1080, height: 1920 },
    fps: 30,
    autoRepair: true
  };

  it('resolves a simple AI declarative scene seamlessly', () => {
    const scene: SceneDefinition = {
      id: 'scene_01',
      elements: [
        {
          id: 'title',
          assetRequest: { type: 'text', tags: ['heading'] }, // Will map to fallback asset registry
          placement: { positionMode: 'auto', position: { x: 50, y: 100 } },
          timing: { startFrame: 0, durationInFrames: 60 }
        },
        {
          id: 'chart',
          assetId: 'asset_chart',
          placement: { positionMode: 'auto', position: { x: 0, y: 0 } },
          timing: { startFrame: 15, durationInFrames: 75 }
        }
      ],
      relationships: [
        { sourceId: 'chart', targetId: 'title', relation: 'below', gap: 50 }
      ]
    };

    const graph = resolveSceneGraph(scene, context);
    
    // Scene duration should auto-calculate to Math.max(0+60, 15+75) = 90
    expect(graph.durationInFrames).toBe(90);
    
    expect(graph.valid).toBe(true);
    expect(graph.elements).toHaveLength(2);

    // Verify Asset mapped properly
    const chartEl = graph.elements.find(e => e.id === 'chart')!;
    expect(chartEl.assetId).toBe('asset_chart');
    
    // Verify Relationship mapped properly
    // Title is at Y=100. Height might be fallback e.g. intrinsic (fallback is 100x100 for test, top-left anchor).
    // Bottom of title = 100 + 100 = 200.
    // Chart 'below' title gap 50 -> Chart Y = 250. Chart Anchor = top-center.
    expect(chartEl.geometry.y).toBe(250);
    expect(chartEl.anchor).toBe('top-center');
    
    // Timing extraction
    expect(chartEl.timing.startFrame).toBe(15);
    expect(chartEl.timing.durationInFrames).toBe(75);
    expect(chartEl.timing.endFrame).toBe(90);
  });

  it('rejects an invalid scene via Render Gate', () => {
    const scene: SceneDefinition = {
      id: 'scene_bad',
      elements: [
        {
          id: 'duplicate',
          assetId: 'asset_a',
          placement: { positionMode: 'auto', position: { x: 100, y: 100 } }
        },
        {
          id: 'duplicate', // Duplicate ID triggers an ERROR in validation
          assetId: 'asset_b',
          placement: { positionMode: 'auto', position: { x: 200, y: 200 } }
        }
      ]
    };

    const graph = resolveSceneGraph(scene, context);
    
    expect(graph.valid).toBe(false);
    expect(graph.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'duplicate-id', severity: 'error' })
      ])
    );
  });

  it('partially resolves when an AI asset request fails', () => {
    const scene: SceneDefinition = {
      id: 'scene_partial',
      elements: [
        {
          id: 'good_element',
          assetId: 'asset_a',
          placement: { positionMode: 'auto', position: { x: 100, y: 100 } }
        },
        {
          id: 'bad_element',
          assetRequest: { type: 'impossible_asset', capabilities: ['does-not-exist'] } // Fails registry
        }
      ]
    };

    const graph = resolveSceneGraph(scene, context);
    
    expect(graph.elements).toHaveLength(1); // Only good_element made it
    expect(graph.elements[0].id).toBe('good_element');

    expect(graph.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'asset-resolution-failed', severity: 'error' })
      ])
    );
    expect(graph.valid).toBe(false); // Render gate blocks missing assets
  });

  it('auto-repairs overflowing elements via the pipeline', () => {
    const scene: SceneDefinition = {
      id: 'scene_repair',
      elements: [
        {
          id: 'overflow',
          assetId: 'box',
          placement: { positionMode: 'absolute', position: { x: -50, y: 50 }, size: { width: 100, height: 100 } }
        }
      ]
    };

    const graph = resolveSceneGraph(scene, context);
    
    // Auto-repair pushed X from -50 to 0 safely
    const overflowEl = graph.elements.find(e => e.id === 'overflow')!;
    expect(overflowEl.geometry.x).toBe(0);
    
    expect(graph.valid).toBe(true);
    expect(graph.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'auto-repair-applied', severity: 'info' })
      ])
    );
  });

});
