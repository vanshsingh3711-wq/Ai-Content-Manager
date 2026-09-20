import { describe, it, expect } from 'vitest';
import { validateComposition } from './validation.engine';
import { canRenderComposition } from './validation.utils';
import { ResolvedPlacement } from '../placement/placement.types';

describe('Composition Validation & Auto-Repair', () => {

  const canvas = { width: 1080, height: 1920 };

  const getBasePlacements = (): ResolvedPlacement[] => [
    { id: 'valid_box', assetId: 'box', x: 100, y: 100, width: 200, height: 200, anchor: 'top-left' }
  ];

  it('validates a flawless scene', () => {
    const result = validateComposition(getBasePlacements(), canvas);
    expect(result.valid).toBe(true);
    expect(result.hasErrors).toBe(false);
    expect(canRenderComposition(result)).toBe(true);
  });

  it('detects duplicate IDs', () => {
    const placements = getBasePlacements();
    placements.push({ id: 'valid_box', assetId: 'box2', x: 400, y: 400, width: 200, height: 200, anchor: 'top-left' });
    
    const result = validateComposition(placements, canvas);
    expect(result.hasErrors).toBe(true);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'duplicate-id', severity: 'error' })
      ])
    );
  });

  it('detects negative dimensions', () => {
    const placements = getBasePlacements();
    placements[0].width = -50;
    
    const result = validateComposition(placements, canvas);
    expect(result.hasErrors).toBe(true);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'negative-dimension', severity: 'error' })
      ])
    );
  });

  it('detects canvas overflow (right and bottom)', () => {
    const placements = getBasePlacements();
    // 1080 canvas width. Element x=1000, width=200 -> ends at 1200 (200 overflow)
    placements[0].x = 1000;
    placements[0].y = 1900; // ends at 2100 (200 overflow)
    
    const result = validateComposition(placements, canvas);
    expect(result.hasWarnings).toBe(true);
    
    const overflowDiag = result.diagnostics.find(d => d.type.startsWith('overflow'));
    expect(overflowDiag).toBeDefined();
    expect(overflowDiag?.type).toContain('right');
    expect(overflowDiag?.type).toContain('bottom');
  });

  it('detects collisions between absolute elements', () => {
    const placements = getBasePlacements();
    // Bounding box overlaps with valid_box (100-300, 100-300)
    placements.push({ id: 'box_2', assetId: 'box2', x: 250, y: 250, width: 200, height: 200, anchor: 'top-left' });
    
    const result = validateComposition(placements, canvas);
    expect(result.hasWarnings).toBe(true);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'collision', severity: 'warning' })
      ])
    );
  });

  it('auto-repairs canvas overflow when enabled', () => {
    const placements = getBasePlacements();
    // Will overflow left side (ends up at x = -50)
    placements[0].x = -50;
    
    const result = validateComposition(placements, canvas, { autoRepair: true, repairOverflow: true, allowClamping: true });
    
    // Repair pushes it back so x=0
    expect(result.placements[0].x).toBe(0);
    expect(result.repairs.length).toBe(1);
    expect(result.repairs[0].type).toBe('repair-overflow');

    // Diagnostic should log the info
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'auto-repair-applied', severity: 'info' })
      ])
    );
    // Overflows should no longer be reported
    expect(result.hasWarnings).toBe(false); 
  });
});
