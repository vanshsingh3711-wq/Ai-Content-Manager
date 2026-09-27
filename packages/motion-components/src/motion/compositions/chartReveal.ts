import { MotionCompositionDefinition, MotionCompositionParams, ResolvedMotionComposition, ResolvedMotionLayer } from '../types';
import { getPatternOrThrow } from '../registry';
import { getPersonality } from '../personality';

export const chartRevealComposition: MotionCompositionDefinition = {
  id: 'chart_reveal',
  name: 'Chart Reveal',
  category: 'data',
  description: 'Sequential reveal of chart container, grid, and data series',
  defaultDurationInFrames: 120,
  tags: ['chart', 'data', 'graph', 'stagger'],
  suitableFor: ['chart', 'comparison'],

  resolve(elementIds: Record<string, string>, params: MotionCompositionParams): ResolvedMotionComposition {
    const layers: ResolvedMotionLayer[] = [];
    const diagnostics = [];
    const personality = getPersonality(params.personality);
    
    const baseDuration = (params.durationInFrames || this.defaultDurationInFrames) * personality.speedMultiplier;
    const intensity = params.intensity ?? 1.0;

    // 1. Chart Container/Background
    if (elementIds.container) {
      const pattern = getPatternOrThrow('soft_reveal');
      layers.push({
        targetElementId: elementIds.container,
        role: 'container',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.4),
          offsetFrames: 0,
          intensity: intensity * 0.5,
          easing: personality.defaultEasing
        })
      });
    }

    // 2. Chart Grid/Axes
    if (elementIds.grid) {
      const pattern = getPatternOrThrow('soft_reveal');
      layers.push({
        targetElementId: elementIds.grid,
        role: 'grid',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.3),
          offsetFrames: Math.round(15 * personality.staggerMultiplier),
          intensity: intensity * 0.3,
          easing: 'easeOut'
        })
      });
    }

    // 3. Data Series (The main chart lines/bars)
    if (elementIds.series) {
      const pattern = getPatternOrThrow('draw_reveal'); // assumes chart is SVG-based
      layers.push({
        targetElementId: elementIds.series,
        role: 'series',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.5),
          offsetFrames: Math.round(25 * personality.staggerMultiplier),
          easing: 'easeInOut'
        })
      });
    }

    // 4. Data Labels / Points
    if (elementIds.labels) {
      const pattern = getPatternOrThrow('stagger_reveal');
      layers.push({
        targetElementId: elementIds.labels,
        role: 'labels',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.3),
          offsetFrames: Math.round(45 * personality.staggerMultiplier),
          intensity: intensity * 0.5,
          easing: personality.defaultEasing
        })
      });
    }

    // 5. Highlight / Callout (Focusing on a specific data point)
    if (elementIds.callout) {
      const pattern = getPatternOrThrow('scale_punch');
      const offset = Math.round(65 * personality.staggerMultiplier);
      layers.push({
        targetElementId: elementIds.callout,
        role: 'callout',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.3),
          offsetFrames: offset,
          intensity: intensity * personality.scalePunchIntensity,
          overshoot: personality.overshoot
        }),
        attention: {
          id: `att_${elementIds.callout}`,
          type: 'callout',
          intensity: 1.0,
          startFrame: offset,
          durationInFrames: baseDuration - offset,
        }
      });
    }

    return {
      id: this.id,
      layers,
      durationInFrames: Math.round(baseDuration),
      diagnostics
    };
  }
};
