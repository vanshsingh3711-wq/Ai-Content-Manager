import { describe, it, expect } from 'vitest';
import { resolveTransition } from './transitions.resolver';
import { resolveSequence } from '../sequence/sequence.resolve';
import { SequenceDefinition } from '../sequence/sequence.types';
import { SceneResolutionContext } from '../scene/scene.types';

describe('Transition Resolver', () => {
  it('resolves valid transitions correctly', () => {
    const { resolved, diagnostics } = resolveTransition({ type: 'fade', durationInFrames: 30 });
    expect(resolved.type).toBe('fade');
    expect(resolved.durationInFrames).toBe(30);
    expect(diagnostics.length).toBe(0);
  });

  it('clamps negative durations', () => {
    const { resolved, diagnostics } = resolveTransition({ type: 'slide', durationInFrames: -10 });
    expect(resolved.durationInFrames).toBe(0);
    expect(diagnostics.length).toBe(1);
    expect(diagnostics[0].severity).toBe('warning');
  });

  it('falls back to cut on unknown types', () => {
    const { resolved, diagnostics } = resolveTransition({ type: 'magic_teleport' as any, durationInFrames: 20 });
    expect(resolved.type).toBe('cut');
    expect(resolved.durationInFrames).toBe(0); // cuts are instant
    expect(diagnostics.length).toBe(1);
    expect(diagnostics[0].severity).toBe('error');
  });
});

describe('Sequence Resolver Timing Math', () => {
  it('calculates overlaps properly across scenes', () => {
    const sequence: SequenceDefinition = {
      id: 'seq-1',
      scenes: [
        { id: 's1', durationInFrames: 60, elements: [] },
        { 
          id: 's2', 
          durationInFrames: 90, 
          elements: [], 
          transitionIn: { type: 'crossfade', durationInFrames: 15 } 
        }
      ]
    };
    
    const context: SceneResolutionContext = {
      canvas: { width: 1080, height: 1920 },
      fps: 30,
      autoRepair: true
    };
    
    const result = resolveSequence(sequence, context);
    
    expect(result.scenes.length).toBe(2);
    // S1: 0 -> 60
    expect(result.scenes[0].globalStartFrame).toBe(0);
    expect(result.scenes[0].globalEndFrame).toBe(60);
    
    // Transition duration is 15. So S2 should start at 60 - 15 = 45.
    // S2 ends at 45 + 90 = 135
    expect(result.scenes[1].globalStartFrame).toBe(45);
    expect(result.scenes[1].globalEndFrame).toBe(135);
    
    expect(result.durationInFrames).toBe(135);
  });

  it('clamps transition duration if it exceeds scene duration', () => {
    const sequence: SequenceDefinition = {
      id: 'seq-1',
      scenes: [
        { id: 's1', durationInFrames: 30, elements: [] },
        { 
          id: 's2', 
          durationInFrames: 30, 
          elements: [], 
          transitionIn: { type: 'crossfade', durationInFrames: 60 } 
        }
      ]
    };
    
    const context: SceneResolutionContext = {
      canvas: { width: 1080, height: 1920 },
      fps: 30,
      autoRepair: true
    };
    
    const result = resolveSequence(sequence, context);
    
    expect(result.diagnostics.length).toBeGreaterThan(0);
    
    // S1: 0 -> 30
    // S2 transition gets clamped to 30 (because previous scene is 30, and current is 30)
    // S2 starts at 30 - 30 = 0
    // S2 ends at 0 + 30 = 30
    expect(result.scenes[1].globalStartFrame).toBe(0);
    expect(result.scenes[1].globalEndFrame).toBe(30);
    expect(result.durationInFrames).toBe(30);
  });
});
