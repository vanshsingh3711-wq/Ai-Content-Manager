import { MotionCompositionDefinition, MotionCompositionParams, ResolvedMotionComposition, ResolvedMotionLayer } from '../types';
import { getPatternOrThrow } from '../registry';
import { getPersonality } from '../personality';

export const ctaRevealComposition: MotionCompositionDefinition = {
  id: 'cta_reveal',
  name: 'CTA Reveal',
  category: 'social',
  description: 'Strong, commanding reveal for a Call to Action button or link',
  defaultDurationInFrames: 90,
  tags: ['cta', 'button', 'social', 'end'],
  suitableFor: ['cta', 'hero'],

  resolve(elementIds: Record<string, string>, params: MotionCompositionParams): ResolvedMotionComposition {
    const layers: ResolvedMotionLayer[] = [];
    const diagnostics = [];
    const personality = getPersonality(params.personality);
    
    const baseDuration = (params.durationInFrames || this.defaultDurationInFrames) * personality.speedMultiplier;
    const intensity = params.intensity ?? 1.0;

    // 1. CTA Headline
    if (elementIds.headline) {
      const pattern = getPatternOrThrow('blur_reveal');
      layers.push({
        targetElementId: elementIds.headline,
        role: 'headline',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.5),
          offsetFrames: 0,
          intensity,
          easing: personality.defaultEasing
        })
      });
    }

    // 2. The Button / Action Item
    if (elementIds.button) {
      const pattern = getPatternOrThrow('elastic_reveal'); // CTA needs to pop
      const offset = Math.round(20 * personality.staggerMultiplier);
      layers.push({
        targetElementId: elementIds.button,
        role: 'accent',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.5),
          offsetFrames: offset,
          intensity: intensity * 1.2, // extra punch for CTA
          overshoot: Math.max(personality.overshoot, 0.2) // ensure it bounces a bit
        }),
        // Add a pulse effect to the button after it lands
        attention: {
          id: `att_${elementIds.button}`,
          type: 'pulse',
          intensity: 0.5,
          startFrame: offset + Math.round(baseDuration * 0.6), // after it finishes animating
          durationInFrames: baseDuration // pulse for the rest of the scene
        }
      });
    }

    // 3. Supporting text / disclaimer
    if (elementIds.supporting) {
      const pattern = getPatternOrThrow('soft_reveal');
      layers.push({
        targetElementId: elementIds.supporting,
        role: 'supporting',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.4),
          offsetFrames: Math.round(40 * personality.staggerMultiplier),
          intensity: intensity * 0.5,
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
