import { describe, it, expect } from 'vitest';
import { getAnchorOffset, getPointOnBox, resolveSceneLayout } from './layout.utils';
import { BoundingBox, SceneLayout } from './layout.types';

describe('Scene Layout Utilities', () => {

  describe('getAnchorOffset', () => {
    it('resolves top-left offset', () => {
      expect(getAnchorOffset(100, 100, 'top-left')).toEqual({ x: 0, y: 0 });
    });
    it('resolves center offset', () => {
      expect(getAnchorOffset(100, 100, 'center')).toEqual({ x: -50, y: -50 });
    });
    it('resolves bottom-right offset', () => {
      expect(getAnchorOffset(100, 100, 'bottom-right')).toEqual({ x: -100, y: -100 });
    });
  });

  describe('getPointOnBox', () => {
    const box: BoundingBox = { id: 'box1', x: 200, y: 300, width: 100, height: 100 };

    it('resolves top-left point', () => {
      expect(getPointOnBox(box, 'top-left')).toEqual({ x: 200, y: 300 });
    });
    it('resolves center point', () => {
      expect(getPointOnBox(box, 'center')).toEqual({ x: 250, y: 350 });
    });
    it('resolves bottom-right point', () => {
      expect(getPointOnBox(box, 'bottom-right')).toEqual({ x: 300, y: 400 });
    });
  });

  describe('resolveSceneLayout', () => {
    it('resolves basic elements correctly using anchors', () => {
      const layout: SceneLayout = {
        width: 1080,
        height: 1920,
        elements: [
          {
            id: 'title',
            x: 540,
            y: 960,
            width: 200,
            height: 50,
            anchor: 'center'
          }
        ]
      };

      const resolved = resolveSceneLayout(layout);
      const titleBox = resolved.get('title');
      
      expect(titleBox).toBeDefined();
      expect(titleBox?.x).toBe(540 - 100); // 440
      expect(titleBox?.y).toBe(960 - 25); // 935
    });

    it('resolves group elements correctly (inheriting group position)', () => {
      const layout: SceneLayout = {
        width: 1000,
        height: 1000,
        elements: [
          {
            id: 'group1',
            x: 100,
            y: 100,
            width: 500,
            height: 500,
            children: [
              {
                id: 'child1',
                x: 50, // Relative to group
                y: 50, // Relative to group
                width: 100,
                height: 100,
                anchor: 'top-left'
              },
              {
                id: 'child2',
                x: 250, // center of group
                y: 250, // center of group
                width: 100,
                height: 100,
                anchor: 'center'
              }
            ]
          }
        ]
      };

      const resolved = resolveSceneLayout(layout);
      const child1 = resolved.get('child1');
      const child2 = resolved.get('child2');
      
      expect(child1?.x).toBe(100 + 50); // 150
      expect(child1?.y).toBe(100 + 50); // 150

      expect(child2?.x).toBe(100 + 250 - 50); // 300
      expect(child2?.y).toBe(100 + 250 - 50); // 300
    });

    it('resolves relative positioning accurately (even defined out of order)', () => {
      const layout: SceneLayout = {
        width: 1000,
        height: 1000,
        elements: [
          {
            id: 'label',
            // Dependent on chart
            relativeTo: 'chart',
            relativeAnchor: 'bottom-center',
            anchor: 'top-center',
            offsetX: 0,
            offsetY: 20,
            x: 0,
            y: 0,
            width: 100,
            height: 30
          },
          {
            id: 'chart',
            x: 500,
            y: 500,
            width: 400,
            height: 300,
            anchor: 'center'
          }
        ]
      };

      const resolved = resolveSceneLayout(layout);
      const chart = resolved.get('chart');
      const label = resolved.get('label');
      
      // Chart is 400x300, center anchor at 500, 500
      // TopLeft: 300, 350
      // BottomCenter: 300 + 200 = 500, 350 + 300 = 650
      expect(chart?.x).toBe(300);
      expect(chart?.y).toBe(350);

      // Label is relative to Chart's bottom-center (500, 650)
      // Offset by 0, 20 => (500, 670)
      // Label is 100x30, anchor is top-center.
      // TopLeft: 500 - 50 = 450, 670 - 0 = 670
      expect(label?.x).toBe(450);
      expect(label?.y).toBe(670);
    });

    it('throws error on circular dependencies', () => {
      const layout: SceneLayout = {
        width: 1000,
        height: 1000,
        elements: [
          {
            id: 'a',
            relativeTo: 'b',
            x: 0, y: 0, width: 10, height: 10
          },
          {
            id: 'b',
            relativeTo: 'a',
            x: 0, y: 0, width: 10, height: 10
          }
        ]
      };

      expect(() => resolveSceneLayout(layout)).toThrowError(/Circular dependency/);
    });
    
    it('handles zero elements gracefully', () => {
      const layout: SceneLayout = { width: 100, height: 100, elements: [] };
      const resolved = resolveSceneLayout(layout);
      expect(resolved.size).toBe(0);
    });
  });

});
