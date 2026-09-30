import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getPatternOrThrow, 
  hasPattern, 
  getAllPatterns, 
  hasComposition, 
  getCompositionOrThrow, 
  getAllCompositions 
} from './registry';
import { resolveMotionIntents } from './resolver';
import { SceneDefinition } from '../scene/scene.types';

// Import to trigger auto-registration
import './patterns';
import './compositions';

describe('Motion Composition System', () => {
  describe('Registry', () => {
    it('registers all core patterns', () => {
      expect(hasPattern('soft_reveal')).toBe(true);
      expect(hasPattern('scale_punch')).toBe(true);
      expect(hasPattern('slide_reveal')).toBe(true);
      expect(hasPattern('blur_reveal')).toBe(true);
      expect(getAllPatterns().length).toBeGreaterThanOrEqual(10);
    });

    it('registers all core compositions', () => {
      expect(hasComposition('hero_reveal')).toBe(true);
      expect(hasComposition('metric_reveal')).toBe(true);
      expect(hasComposition('chart_reveal')).toBe(true);
      expect(hasComposition('step_sequence')).toBe(true);
      expect(getAllCompositions().length).toBeGreaterThanOrEqual(5);
    });

    it('throws on unknown lookup', () => {
      expect(() => getPatternOrThrow('unknown_pattern' as any)).toThrow(/Unknown pattern ID/);
      expect(() => getCompositionOrThrow('unknown_comp' as any)).toThrow(/Unknown composition ID/);
    });
  });

  describe('Motion Patterns', () => {
    it('scale punch generates deterministic 4-stage keyframes', () => {
      const pattern = getPatternOrThrow('scale_punch');
      const tracks = pattern.resolve({ durationInFrames: 60, offsetFrames: 10, intensity: 1 });
      
      expect(tracks).toHaveLength(1);
      expect(tracks[0].property).toBe('scale');
      
      const keyframes = tracks[0].keyframes;
      expect(keyframes).toHaveLength(4);
      
      // Starts at frame 10
      expect(keyframes[0].frame).toBe(10);
      
      // Last frame is 70
      expect(keyframes[3].frame).toBe(70);
      expect(keyframes[3].value).toBe(1.0);
    });

    it('stagger reveal creates predictable offsets', () => {
      const pattern = getPatternOrThrow('stagger_reveal');
      
      const track1 = pattern.resolve({ durationInFrames: 30, offsetFrames: 0 });
      const track2 = pattern.resolve({ durationInFrames: 30, offsetFrames: 15 });
      
      expect(track1[0].keyframes[0].frame).toBe(0);
      expect(track2[0].keyframes[0].frame).toBe(15);
    });
  });

  describe('Motion Compositions', () => {
    it('hero_reveal resolves multi-layer animation correctly', () => {
      const comp = getCompositionOrThrow('hero_reveal');
      const resolved = comp.resolve(
        { background: 'bg-1', headline: 'hl-1', accent: 'acc-1' },
        { durationInFrames: 100 }
      );

      expect(resolved.diagnostics).toHaveLength(0);
      expect(resolved.layers).toHaveLength(3); // bg, headline, accent
      
      // Verify attention was added for the accent
      const accentLayer = resolved.layers.find(l => l.role === 'accent');
      expect(accentLayer?.attention).toBeDefined();
      expect(accentLayer?.attention?.type).toBe('highlight');
      expect(accentLayer?.attention?.targetId).toBe('acc-1');
    });

    it('personalities affect composition timing deterministically', () => {
      const comp = getCompositionOrThrow('metric_reveal');
      
      // Premium personality (speed 1.0)
      const premium = comp.resolve({ metric: 'm1' }, { personality: 'premium', durationInFrames: 100 });
      
      // Energetic personality (speed 1.4)
      const energetic = comp.resolve({ metric: 'm1' }, { personality: 'energetic', durationInFrames: 100 });
      
      // Energetic should have longer duration (100 * 1.4 = 140)
      expect(energetic.durationInFrames).toBe(140);
      expect(premium.durationInFrames).toBe(100);
    });
  });

  describe('Motion Resolver', () => {
    it('injects keyframes and attention into a valid scene', () => {
      const mockScene: SceneDefinition = {
        id: 's1',
        elements: [
          { id: 'h1', type: 'text' },
          { id: 'b1', type: 'asset' }
        ],
        attention: []
      };

      const result = resolveMotionIntents(mockScene, [
        {
          type: 'hero_reveal',
          targets: { headline: 'h1', background: 'b1' },
          durationInFrames: 90
        }
      ]);

      expect(result.diagnostics).toHaveLength(0);
      
      const headlineEl = result.scene.elements.find(e => e.id === 'h1');
      expect(headlineEl?.keyframes).toBeDefined();
      expect(headlineEl?.keyframes?.length).toBeGreaterThan(0);
      
      const fullScene: SceneDefinition = {
        id: 'scene-full',
        elements: [
          { id: 'bg-1', type: 'asset' },
          { id: 'label-1', type: 'text' },
          { id: 'headline-1', type: 'text' },
          { id: 'keyword-1', type: 'text' },
          { id: 'support-1', type: 'text' }
        ]
      };
      const resultFull = resolveMotionIntents(fullScene, [{
        type: 'hero_reveal',
        targets: { background: 'bg-1', label: 'label-1', headline: 'headline-1', accent: 'keyword-1', supporting: 'support-1' },
        durationInFrames: 120,
        personality: 'premium'
      }]);
      // Dump the JSON for the python backend to test
      require('fs').writeFileSync(
        '../../apps/worker/services/engine_3d/hero_reveal_data.json',
        JSON.stringify(resultFull.scene.elements, null, 2)
      );

      // original scene is not mutated
      expect(mockScene.elements[0].keyframes).toBeUndefined();
    });

    it('emits diagnostics for missing elements', () => {
      const mockScene: SceneDefinition = {
        id: 's1',
        elements: [
          { id: 'h1', type: 'text' }
        ]
      };

      const result = resolveMotionIntents(mockScene, [
        {
          type: 'hero_reveal',
          targets: { headline: 'h1', background: 'missing_bg' },
          durationInFrames: 90
        }
      ]);

      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0].severity).toBe('warning');
      expect(result.diagnostics[0].message).toMatch(/missing_bg/);
    });
  });
});
