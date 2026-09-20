import { describe, it, expect } from 'vitest';
import { resolveRelationships } from './relationships.solver';
import { ResolvedPlacement } from '../placement/placement.types';
import { CompositionRelationship } from './relationships.types';

describe('Composition Relationships Solver', () => {

  const getBasePlacements = (): ResolvedPlacement[] => [
    {
      id: 'A', // Fixed at 100, 100
      assetId: 'asset_a',
      x: 100, y: 100,
      width: 50, height: 50,
      anchor: 'top-left'
    },
    {
      id: 'B',
      assetId: 'asset_b',
      x: 0, y: 0,
      width: 50, height: 50,
      anchor: 'top-left'
    },
    {
      id: 'C',
      assetId: 'asset_c',
      x: 0, y: 0,
      width: 50, height: 50,
      anchor: 'top-left'
    }
  ];

  it('resolves a simple A below B relationship', () => {
    // We want B to be below A. A is at 100,100 -> bottom is 150.
    const rels: CompositionRelationship[] = [
      { sourceId: 'B', targetId: 'A', relation: 'below', gap: 10 }
    ];

    const result = resolveRelationships(getBasePlacements(), rels);
    
    const pb = result.placements.find(p => p.id === 'B')!;
    expect(pb.y).toBe(160); // 150 + 10
    expect(pb.anchor).toBe('top-center');
    expect(pb.x).toBe(125); // Center of A (100 + 25)
  });

  it('resolves a dependency chain dynamically (C below B below A)', () => {
    const rels: CompositionRelationship[] = [
      // Out of order intentionally to prove Topological Sort works
      { sourceId: 'C', targetId: 'B', relation: 'below', gap: 20 },
      { sourceId: 'B', targetId: 'A', relation: 'below', gap: 10 }
    ];

    const result = resolveRelationships(getBasePlacements(), rels);
    
    // Check topological order output
    expect(result.resolvedOrder).toEqual(['A', 'B', 'C']);

    const pb = result.placements.find(p => p.id === 'B')!;
    const pc = result.placements.find(p => p.id === 'C')!;

    // A bottom = 150. B top = 160.
    expect(pb.y).toBe(160); 
    // B bottom = 160 + 50 (height is 50 for top-center anchor, offset is y=0, wait, anchor is top-center)
    // top-center anchor means y is the top edge. height is 50. so bottom edge is 210.
    // C top = 210 + 20 gap = 230
    expect(pc.y).toBe(230);
  });

  it('detects circular dependencies without infinite loops', () => {
    const rels: CompositionRelationship[] = [
      { sourceId: 'B', targetId: 'C', relation: 'below' },
      { sourceId: 'C', targetId: 'B', relation: 'below' }
    ];

    const result = resolveRelationships(getBasePlacements(), rels);

    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reason: 'circular-dependency' })
      ])
    );
  });

  it('resolves alignments without modifying the secondary axis', () => {
    const rels: CompositionRelationship[] = [
      { sourceId: 'B', targetId: 'A', relation: 'align-left' }
    ];

    const placements = getBasePlacements();
    placements[1].y = 500; // Put B way down on Y

    const result = resolveRelationships(placements, rels);
    
    const pb = result.placements.find(p => p.id === 'B')!;
    expect(pb.x).toBe(100); // Matched A's left edge
    expect(pb.y).toBe(500); // Preserved B's original Y
  });
});
