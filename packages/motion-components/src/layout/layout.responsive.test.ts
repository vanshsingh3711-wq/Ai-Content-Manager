import { describe, it, expect } from 'vitest';
import { applyResponsiveScaling } from './layout.responsive';
import { resolveSceneLayout, getPointOnBox } from './layout.utils';
import { SceneLayout } from './layout.types';

describe('Responsive Scaling', () => {

  const createScene = (): SceneLayout => ({
    width: 1080,
    height: 1920,
    safeZones: [
      { id: 'normalized', type: 'safe', x: 0.1, y: 0.1, width: 0.8, height: 0.8 } // 10% padding
    ],
    elements: [
      { id: 'center-box', x: 540, y: 960, width: 200, height: 200, anchor: 'center' },
      { 
        id: 'group', 
        x: 100, y: 100, width: 500, height: 500,
        children: [
          { id: 'child', x: 50, y: 50, width: 100, height: 100 }
        ]
      }
    ]
  });

  describe('contain mode', () => {
    it('scales proportionally and letterboxes (centers) the output', () => {
      const scene = createScene();
      // Going from 9:16 (1080x1920) to 16:9 (1920x1080)
      // Scale = min(1920/1080, 1080/1920) = min(1.77, 0.5625) = 0.5625
      // 1080 * 0.5625 = 607.5
      // Letterbox offset X = (1920 - 607.5) / 2 = 656.25
      const responsive = applyResponsiveScaling(scene, {
        designWidth: 1080,
        designHeight: 1920,
        targetWidth: 1920,
        targetHeight: 1080,
        mode: 'contain'
      });

      expect(responsive.width).toBe(1920);
      expect(responsive.height).toBe(1080);

      const centerBox = responsive.elements.find(e => e.id === 'center-box')!;
      // x' = x * scale + offsetX = 540 * 0.5625 + 656.25 = 960
      expect(centerBox.x).toBe(960); // Exactly the center of targetWidth
      // y' = y * scale + offsetY = 960 * 0.5625 + 0 = 540
      expect(centerBox.y).toBe(540); // Exactly the center of targetHeight

      // Width = 200 * 0.5625 = 112.5
      expect(centerBox.width).toBe(112.5);
      expect(centerBox.height).toBe(112.5);
    });
  });

  describe('cover mode', () => {
    it('scales proportionally and crops', () => {
      const scene = createScene();
      // Going from 1080x1920 to 1920x1080
      // Scale = max(1920/1080, 1080/1920) = 1.7777...
      const responsive = applyResponsiveScaling(scene, {
        designWidth: 1080,
        designHeight: 1920,
        targetWidth: 1920,
        targetHeight: 1080,
        mode: 'cover'
      });

      const centerBox = responsive.elements.find(e => e.id === 'center-box')!;
      // x' = 540 * 1.777 + offsetX = 960
      expect(Math.round(centerBox.x)).toBe(960);
      // y' = 960 * 1.777 + offsetY = 540
      expect(Math.round(centerBox.y)).toBe(540);
    });
  });

  describe('stretch mode', () => {
    it('scales X and Y independently without offset', () => {
      const scene = createScene();
      const responsive = applyResponsiveScaling(scene, {
        designWidth: 1080,
        designHeight: 1920,
        targetWidth: 2160, // 2x width
        targetHeight: 1920, // 1x height
        mode: 'stretch'
      });

      const centerBox = responsive.elements.find(e => e.id === 'center-box')!;
      expect(centerBox.width).toBe(400); // 200 * 2
      expect(centerBox.height).toBe(200); // 200 * 1
      expect(centerBox.x).toBe(1080); // 540 * 2
      expect(centerBox.y).toBe(960); // 960 * 1
    });
  });

  describe('Groups and Recursive Scaling', () => {
    it('scales nested elements correctly', () => {
      const scene = createScene();
      const responsive = applyResponsiveScaling(scene, {
        designWidth: 1080,
        designHeight: 1920,
        targetWidth: 1080,
        targetHeight: 1920, // 1:1, but testing recursion
        mode: 'contain'
      });

      const group: any = responsive.elements.find(e => e.id === 'group')!;
      expect(group.children[0].width).toBe(100);
      expect(group.children[0].x).toBe(50);
    });
  });

  describe('Safe Zones Integration', () => {
    it('resolves normalized safe zones perfectly to the transformed target', () => {
      const scene = createScene();
      const responsive = applyResponsiveScaling(scene, {
        designWidth: 1080,
        designHeight: 1920,
        targetWidth: 1920,
        targetHeight: 1080,
        mode: 'contain' // Scale 0.5625, offsetX 656.25
      });

      const zone = responsive.safeZones![0];
      // Original 0.1 of 1080 = 108
      // Scaled = 108 * 0.5625 = 60.75
      // Offset + Scaled = 656.25 + 60.75 = 717
      expect(zone.x).toBe(717);

      // Width: 0.8 of 1080 = 864
      // Scaled: 864 * 0.5625 = 486
      expect(zone.width).toBe(486);
      
      // Absolute pixels are locked into the target canvas perfectly!
    });
  });

});
