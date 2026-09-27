import { MotionCompositionDefinition, MotionCompositionParams, ResolvedMotionComposition, ResolvedMotionLayer } from '../types';
import { getPatternOrThrow } from '../registry';
import { getPersonality } from '../personality';

export const quoteRevealComposition: MotionCompositionDefinition = {
  id: 'quote_reveal',
  name: 'Quote Reveal',
  category: 'storytelling',
  description: 'Editorial reveal for a blockquote with attribution',
  defaultDurationInFrames: 110,
  tags: ['quote', 'editorial', 'text'],
  suitableFor: ['quote'],

  resolve(elementIds: Record<string, string>, params: MotionCompositionParams): ResolvedMotionComposition {
    const layers: ResolvedMotionLayer[] = [];
    const diagnostics = [];
    const personality = getPersonality(params.personality);
    
    const baseDuration = (params.durationInFrames || this.defaultDurationInFrames) * personality.speedMultiplier;
    const intensity = params.intensity ?? 1.0;

    // 1. Quote Marks / Decoration
    if (elementIds.marks) {
      const pattern = getPatternOrThrow('scale_punch'); // quote marks usually pop in
      layers.push({
        targetElementId: elementIds.marks,
        role: 'accent',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.4),
          offsetFrames: 0,
          intensity: intensity * personality.scalePunchIntensity * 0.8,
          overshoot: personality.overshoot
        })
      });
    }

    // 2. The Quote Text
    if (elementIds.quote) {
      const pattern = getPatternOrThrow('soft_reveal');
      layers.push({
        targetElementId: elementIds.quote,
        role: 'headline',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.5),
          offsetFrames: Math.round(15 * personality.staggerMultiplier),
          intensity,
          direction: 'left', // editorial slide in from left
          easing: personality.defaultEasing
        })
      });
    }

    // 3. Attribution (Author / Role)
    if (elementIds.author) {
      const pattern = getPatternOrThrow('soft_reveal');
      layers.push({
        targetElementId: elementIds.author,
        role: 'label',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.4),
          offsetFrames: Math.round(40 * personality.staggerMultiplier),
          intensity: intensity * 0.7,
          easing: 'easeOut'
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
