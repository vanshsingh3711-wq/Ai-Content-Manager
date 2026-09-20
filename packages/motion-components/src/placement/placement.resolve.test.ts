import { describe, it, expect } from 'vitest';
import { resolvePlacement, PlacementContext } from './placement.resolve';

const mockContext: PlacementContext = {
  canvas: { width: 1080, height: 1920 },
  assets: [
    {
      id: 'phone',
      type: 'object',
      intrinsicSize: { width: 300, height: 600 }
    },
    {
      id: 'icon',
      type: 'object' // no intrinsic
    }
  ],
  existingPlacements: [
    {
      id: 'title',
      assetId: 'title_text',
      x: 540,
      y: 200,
      width: 400,
      height: 100,
      anchor: 'center'
    }
  ],
  safeZones: [
    {
      id: 'logo_zone',
      type: 'restricted',
      x: 0,
      y: 0,
      width: 200,
      height: 200
    }
  ]
};

describe('Asset Placement & Composition', () => {

  describe('Dimension Resolution', () => {
    it('uses explicit width and height if provided', () => {
      const p = resolvePlacement({ assetId: 'phone', size: { width: 400, height: 400 } }, mockContext);
      expect(p.width).toBe(400);
      expect(p.height).toBe(400);
    });

    it('derives height from aspect ratio when only width is provided', () => {
      const p = resolvePlacement({ assetId: 'phone', size: { width: 150 } }, mockContext);
      expect(p.width).toBe(150);
      expect(p.height).toBe(300); // Intrinsic is 300x600 (1:2 ratio)
    });

    it('scales intrinsic dimensions correctly', () => {
      const p = resolvePlacement({ assetId: 'phone', size: { scale: 0.5 } }, mockContext);
      expect(p.width).toBe(150);
      expect(p.height).toBe(300);
    });

    it('returns a diagnostic warning if intrinsic size is missing and no size provided', () => {
      const p = resolvePlacement({ assetId: 'icon' }, mockContext);
      expect(p.width).toBe(100); // Default fallback
      expect(p.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ reason: 'missing-intrinsic-size' })
        ])
      );
    });
  });

  describe('Relative Placement', () => {
    it('places an asset below a target with a gap', () => {
      // title is at (540, 200) center anchored, so its bottom is 250.
      const p = resolvePlacement({ 
        assetId: 'phone', 
        relativeTo: 'title',
        relation: 'below',
        gap: 50
      }, mockContext);
      
      expect(p.anchor).toBe('top-center');
      expect(p.x).toBe(540); // Matches center X
      expect(p.y).toBe(300); // 250 (bottom of title) + 50 (gap)
    });

    it('places an asset to the right of a target', () => {
      // title center is 540, right is 540 + 200 = 740
      const p = resolvePlacement({ 
        assetId: 'phone', 
        relativeTo: 'title',
        relation: 'right',
        gap: 20
      }, mockContext);
      
      expect(p.anchor).toBe('center-left');
      expect(p.x).toBe(760); // 740 + 20
      expect(p.y).toBe(200); // Matches center Y
    });
  });

  describe('Validation & Diagnostics', () => {
    it('detects overlap with restricted safe zones', () => {
      // Logo restricted zone is 0,0 to 200,200.
      const p = resolvePlacement({ 
        assetId: 'phone', 
        position: { x: 50, y: 50 },
        anchor: 'top-left'
      }, mockContext);

      expect(p.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ reason: 'restricted-overlap' })
        ])
      );
    });

    it('detects collisions with other absolute placed elements', () => {
      // Title is from x: 340 to 740, y: 150 to 250
      const p = resolvePlacement({ 
        assetId: 'phone', 
        position: { x: 540, y: 200 },
        anchor: 'top-left'
      }, mockContext);

      expect(p.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ reason: 'collision' })
        ])
      );
    });
  });
});
