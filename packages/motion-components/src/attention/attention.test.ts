import { describe, it, expect } from 'vitest';
import { resolveAttentionInstructions } from './attention.resolve';
import { AttentionInstruction } from './attention.types';
import { ResolvedSceneGraph } from '../scene/scene.types';

describe('Attention Resolver', () => {
  const mockScene: ResolvedSceneGraph = {
    id: 's1',
    width: 1080,
    height: 1920,
    fps: 30,
    durationInFrames: 300,
    theme: {} as any,
    tokens: {} as any,
    attention: { instructions: [], diagnostics: [] },
    diagnostics: [],
    valid: true,
    elements: [
      {
        id: 'headline',
        type: 'text',
        geometry: { x: 100, y: 100, width: 880, height: 200 },
        anchor: 'top-left',
        timing: { startFrame: 0, durationInFrames: 300, endFrame: 300 },
        layer: 0
      },
      {
        id: 'chart',
        type: 'asset',
        geometry: { x: 100, y: 400, width: 880, height: 800 },
        anchor: 'top-left',
        timing: { startFrame: 30, durationInFrames: 270, endFrame: 300 },
        layer: 1
      },
      {
        id: 'kpi',
        type: 'asset',
        geometry: { x: 100, y: 1300, width: 880, height: 200 },
        anchor: 'top-left',
        timing: { startFrame: 60, durationInFrames: 240, endFrame: 300 },
        layer: 2
      }
    ]
  };

  it('resolves valid instructions with correct combined geometry', () => {
    const instructions: AttentionInstruction[] = [
      { id: 'i1', targetId: 'headline', type: 'highlight', durationInFrames: 60 }
    ];

    const result = resolveAttentionInstructions(instructions, mockScene);
    
    expect(result.diagnostics.length).toBe(0);
    expect(result.instructions.length).toBe(1);
    expect(result.instructions[0].geometry).toEqual({
      x: 100,
      y: 100,
      width: 880,
      height: 200,
      centerX: 540,
      centerY: 200
    });
  });

  it('handles group targets and computes bounding box', () => {
    const instructions: AttentionInstruction[] = [
      { id: 'i1', targetIds: ['headline', 'chart'], type: 'spotlight', durationInFrames: 60 }
    ];

    const result = resolveAttentionInstructions(instructions, mockScene);
    
    expect(result.diagnostics.length).toBe(0);
    expect(result.instructions[0].geometry).toEqual({
      x: 100,
      y: 100,
      width: 880,
      height: 1100, // 400 + 800 - 100
      centerX: 540,
      centerY: 650 // 100 + 1100/2
    });
  });

  it('rejects instructions with missing targets', () => {
    const instructions: AttentionInstruction[] = [
      { id: 'i1', targetId: 'non-existent', type: 'highlight', durationInFrames: 60 }
    ];

    const result = resolveAttentionInstructions(instructions, mockScene);
    
    expect(result.instructions.length).toBe(0);
    expect(result.diagnostics.length).toBe(2);
    expect(result.diagnostics[0].severity).toBe('warning');
    expect(result.diagnostics[1].severity).toBe('error');
    expect(result.diagnostics[1].message).toMatch(/attention target missing/);
  });

  it('resolves exclusive conflicts by priority', () => {
    const instructions: AttentionInstruction[] = [
      { id: 'i1', targetId: 'headline', type: 'highlight', startFrame: 0, durationInFrames: 100, priority: 5 },
      { id: 'i2', targetId: 'chart', type: 'spotlight', startFrame: 50, durationInFrames: 100, priority: 10 }
    ];

    const result = resolveAttentionInstructions(instructions, mockScene, { mode: 'exclusive' });
    
    // i1 is active 0-100, i2 is active 50-150.
    // In exclusive mode, both should be present but ideally they don't break each other.
    // Actually, our naive implementation keeps both if they win at least ONE frame.
    // i1 wins frames 0-49. i2 wins frames 50-150.
    // Therefore both should be retained in the final list.
    expect(result.instructions.length).toBe(2);
    expect(result.instructions.find(i => i.id === 'i1')).toBeDefined();
    expect(result.instructions.find(i => i.id === 'i2')).toBeDefined();
  });

  it('drops fully eclipsed lower priority instructions in exclusive mode', () => {
    const instructions: AttentionInstruction[] = [
      { id: 'i1', targetId: 'headline', type: 'highlight', startFrame: 50, durationInFrames: 50, priority: 5 },
      { id: 'i2', targetId: 'chart', type: 'spotlight', startFrame: 50, durationInFrames: 50, priority: 10 }
    ];

    const result = resolveAttentionInstructions(instructions, mockScene, { mode: 'exclusive' });
    
    // i1 is fully eclipsed by i2 (same time bounds, i2 has higher priority).
    // So i1 should be dropped.
    expect(result.instructions.length).toBe(1);
    expect(result.instructions[0].id).toBe('i2');
  });

  it('keeps both if mode is additive', () => {
    const instructions: AttentionInstruction[] = [
      { id: 'i1', targetId: 'headline', type: 'highlight', startFrame: 50, durationInFrames: 50, priority: 5 },
      { id: 'i2', targetId: 'chart', type: 'spotlight', startFrame: 50, durationInFrames: 50, priority: 10 }
    ];

    const result = resolveAttentionInstructions(instructions, mockScene, { mode: 'additive' });
    
    expect(result.instructions.length).toBe(2);
  });
});
