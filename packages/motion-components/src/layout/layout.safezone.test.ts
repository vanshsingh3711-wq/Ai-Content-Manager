import { describe, it, expect } from 'vitest';
import { resolveSafeZoneBounds, checkSafeZoneOverlap, validateSceneSafeZones } from './layout.safezone';
import { applyAutoPositioning } from './layout.auto';
import { SceneLayout } from './layout.types';

describe('Safe Zone System', () => {

  describe('resolveSafeZoneBounds', () => {
    it('handles absolute bounds', () => {
      const z = resolveSafeZoneBounds({ id: '1', type: 'safe', x: 10, y: 20, width: 300, height: 400 }, 1000, 1000);
      expect(z.x).toBe(10);
      expect(z.y).toBe(20);
      expect(z.width).toBe(300);
      expect(z.height).toBe(400);
    });

    it('handles normalized bounds', () => {
      const z = resolveSafeZoneBounds({ id: '1', type: 'safe', x: 0.1, y: 0.2, width: 0.5, height: 0.8 }, 1000, 1000);
      expect(z.x).toBe(100);
      expect(z.y).toBe(200);
      expect(z.width).toBe(500);
      expect(z.height).toBe(800);
    });
  });

  describe('checkSafeZoneOverlap', () => {
    const zone = { id: 'z1', x: 100, y: 100, width: 200, height: 200 }; // (100,100) to (300,300)

    it('detects completely inside', () => {
      const overlap = checkSafeZoneOverlap({ id: 'e', x: 150, y: 150, width: 50, height: 50 }, zone);
      expect(overlap.inside).toBe(true);
      expect(overlap.intersecting).toBe(true);
      expect(overlap.intersectionArea).toBe(2500);
      expect(overlap.overflow.top).toBe(0);
    });

    it('detects completely outside', () => {
      const overlap = checkSafeZoneOverlap({ id: 'e', x: 0, y: 0, width: 50, height: 50 }, zone);
      expect(overlap.inside).toBe(false);
      expect(overlap.intersecting).toBe(false);
      expect(overlap.intersectionArea).toBe(0);
      expect(overlap.overflow.top).toBe(100); // 100 - 0
    });

    it('detects partial intersection', () => {
      const overlap = checkSafeZoneOverlap({ id: 'e', x: 50, y: 150, width: 100, height: 50 }, zone);
      // Element is (50,150) to (150,200). Zone starts at 100.
      // Intersects x:100-150 (50), y:150-200 (50). Area = 2500
      expect(overlap.inside).toBe(false);
      expect(overlap.intersecting).toBe(true);
      expect(overlap.intersectionArea).toBe(2500);
      expect(overlap.overflow.left).toBe(50);
    });
  });

  describe('Auto Positioning Dodging', () => {
    it('dodges restricted zones deterministically', () => {
      const layout: SceneLayout = {
        width: 1000,
        height: 1000,
        safeZones: [
          // Restricted zone covering (0,0) to (1000, 200)
          { id: 'top-nav', type: 'restricted', x: 0, y: 0, width: 1000, height: 200 }
        ],
        elements: [
          { id: 'auto-1', positionMode: 'auto', x: 0, y: 0, width: 100, height: 50 }
        ]
      };

      const result = applyAutoPositioning(layout, { direction: 'vertical', alignment: 'start' });
      // The element should have dodged the top-nav and been pushed to Y = 200
      expect(result.layout.elements[0].y).toBe(200);
    });

    it('prioritizes high priority elements during auto placement', () => {
      const layout: SceneLayout = {
        width: 1000,
        height: 1000,
        safeZones: [],
        elements: [
          { id: 'low', positionMode: 'auto', priority: 1, x: 0, y: 0, width: 10, height: 10 },
          { id: 'high', positionMode: 'auto', priority: 10, x: 0, y: 0, width: 10, height: 10 }
        ]
      };

      const result = applyAutoPositioning(layout, { direction: 'vertical', gap: 10 });
      const els = result.layout.elements;
      // High priority is placed FIRST (so it gets Y=0)
      const high = els.find(e => e.id === 'high')!;
      const low = els.find(e => e.id === 'low')!;
      expect(high.y).toBe(0);
      expect(low.y).toBe(20); // 10 (height) + 10 (gap)
    });
  });

  describe('validateSceneSafeZones', () => {
    it('generates diagnostic if restricted zone overlaps absolute element', () => {
      const layout: SceneLayout = {
        width: 1000, height: 1000,
        safeZones: [{ id: 'restricted-1', type: 'restricted', x: 0, y: 0, width: 100, height: 100 }],
        elements: [
          { id: 'fixed', positionMode: 'absolute', x: 50, y: 50, width: 100, height: 100 }
        ]
      };
      
      const diagnostics = validateSceneSafeZones(layout);
      expect(diagnostics.length).toBe(1);
      expect(diagnostics[0].reason).toBe('restricted-zone-overlap');
      expect(diagnostics[0].elementId).toBe('fixed');
    });

    it('generates diagnostic if element overflows requested safe zone', () => {
      const layout: SceneLayout = {
        width: 1000, height: 1000,
        safeZones: [{ id: 'main', type: 'safe', x: 100, y: 100, width: 500, height: 500 }],
        elements: [
          { id: 'fixed', positionMode: 'absolute', safeZoneId: 'main', x: 50, y: 150, width: 100, height: 100 } // x is 50, overflows left
        ]
      };

      const diagnostics = validateSceneSafeZones(layout);
      expect(diagnostics.length).toBe(1);
      expect(diagnostics[0].reason).toBe('safe-zone-overflow');
    });
  });

});
