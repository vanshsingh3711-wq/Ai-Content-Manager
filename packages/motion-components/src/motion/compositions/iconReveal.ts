import { MotionCompositionDefinition, MotionCompositionParams, ResolvedMotionComposition, ResolvedMotionLayer } from '../types';
import { getPatternOrThrow } from '../registry';
import { getPersonality } from '../personality';

export const iconRevealComposition: MotionCompositionDefinition = {
  id: 'icon_reveal',
  name: 'Icon Reveal',
  category: 'editorial',
  description: 'A glowing, floating icon reveal for abstract concepts',
  defaultDurationInFrames: 90,
  tags: ['icon', 'concept', 'floating'],
  suitableFor: ['concept', 'metaphor'],

  resolve(elementIds: Record<string, string>, params: MotionCompositionParams): ResolvedMotionComposition {
    const layers: ResolvedMotionLayer[] = [];
    const diagnostics = [];
    const personality = getPersonality(params.personality);
    
    const baseDuration = (params.durationInFrames || this.defaultDurationInFrames) * personality.speedMultiplier;
    const intensity = params.intensity ?? 1.0;

    // 1. The glowing background/halo
    if (elementIds.halo) {
      const pattern = getPatternOrThrow('soft_reveal');
      layers.push({
        targetElementId: elementIds.halo,
        role: 'background',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.4),
          offsetFrames: 0,
          intensity: intensity * 0.5,
          easing: personality.defaultEasing
        })
      });
    }

    // 2. The main icon
    if (elementIds.icon) {
      const patternName = params.personality === 'energetic' ? 'elastic_reveal' : 'scale_punch';
      const pattern = getPatternOrThrow(patternName);
      
      layers.push({
        targetElementId: elementIds.icon,
        role: 'icon',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.5),
          offsetFrames: Math.round(10 * personality.staggerMultiplier),
          intensity: intensity * personality.scalePunchIntensity,
          overshoot: personality.overshoot
        })
      });
    }

    // 3. The label below the icon
    if (elementIds.label) {
      const pattern = getPatternOrThrow('slide_reveal');
      layers.push({
        targetElementId: elementIds.label,
        role: 'label',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.4),
          offsetFrames: Math.round(20 * personality.staggerMultiplier),
          intensity,
          direction: 'up',
          easing: 'easeOutBack'
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
