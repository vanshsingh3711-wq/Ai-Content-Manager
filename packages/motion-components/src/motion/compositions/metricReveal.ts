import { MotionCompositionDefinition, MotionCompositionParams, ResolvedMotionComposition, ResolvedMotionLayer } from '../types';
import { getPatternOrThrow } from '../registry';
import { getPersonality } from '../personality';

export const metricRevealComposition: MotionCompositionDefinition = {
  id: 'metric_reveal',
  name: 'Metric Reveal',
  category: 'data',
  description: 'Punchy reveal for a primary metric or KPI',
  defaultDurationInFrames: 75,
  tags: ['metric', 'kpi', 'number', 'data'],
  suitableFor: ['kpi', 'comparison'],

  resolve(elementIds: Record<string, string>, params: MotionCompositionParams): ResolvedMotionComposition {
    const layers: ResolvedMotionLayer[] = [];
    const diagnostics = [];
    const personality = getPersonality(params.personality);
    
    const baseDuration = (params.durationInFrames || this.defaultDurationInFrames) * personality.speedMultiplier;
    const intensity = params.intensity ?? 1.0;

    // 1. Label
    if (elementIds.label) {
      const pattern = getPatternOrThrow('soft_reveal');
      layers.push({
        targetElementId: elementIds.label,
        role: 'label',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.4),
          offsetFrames: 0,
          intensity: intensity * 0.5,
          easing: personality.defaultEasing
        })
      });
    }

    // 2. Metric (The hero number)
    if (elementIds.metric) {
      // Energetic personality uses Elastic Reveal, otherwise Scale Punch
      const patternName = params.personality === 'energetic' ? 'elastic_reveal' : 'scale_punch';
      const pattern = getPatternOrThrow(patternName);
      
      layers.push({
        targetElementId: elementIds.metric,
        role: 'metric',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.6),
          offsetFrames: Math.round(10 * personality.staggerMultiplier),
          intensity: intensity * personality.scalePunchIntensity,
          overshoot: personality.overshoot
        })
      });
    }

    // 3. Delta / Change Indicator
    if (elementIds.delta) {
      const pattern = getPatternOrThrow('slide_reveal');
      layers.push({
        targetElementId: elementIds.delta,
        role: 'delta',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.4),
          offsetFrames: Math.round(25 * personality.staggerMultiplier),
          intensity,
          direction: 'left', // slides out from the metric usually
          easing: 'easeOutBack'
        })
      });
    }

    // 4. Accent/Underline
    if (elementIds.accent) {
      const pattern = getPatternOrThrow('draw_reveal');
      layers.push({
        targetElementId: elementIds.accent,
        role: 'accent',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.3),
          offsetFrames: Math.round(35 * personality.staggerMultiplier),
          easing: 'easeInOut'
        })
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
