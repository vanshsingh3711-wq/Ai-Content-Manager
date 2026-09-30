import { MotionCompositionDefinition, MotionCompositionParams, ResolvedMotionComposition, ResolvedMotionLayer } from '../types';
import { getPatternOrThrow } from '../registry';
import { getPersonality } from '../personality';

export const mediaRevealComposition: MotionCompositionDefinition = {
  id: 'media_reveal',
  name: 'Media Reveal',
  category: 'editorial',
  description: 'Reveals a framed image (like a map or building) with a caption',
  defaultDurationInFrames: 120,
  tags: ['image', 'photo', 'map', 'reveal'],
  suitableFor: ['location', 'subject', 'evidence'],

  resolve(elementIds: Record<string, string>, params: MotionCompositionParams): ResolvedMotionComposition {
    const layers: ResolvedMotionLayer[] = [];
    const diagnostics = [];
    const personality = getPersonality(params.personality);
    
    const baseDuration = (params.durationInFrames || this.defaultDurationInFrames) * personality.speedMultiplier;
    const intensity = params.intensity ?? 1.0;

    // 1. The glass frame
    if (elementIds.frame) {
      const pattern = getPatternOrThrow('scale_punch');
      layers.push({
        targetElementId: elementIds.frame,
        role: 'frame',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.4),
          offsetFrames: 0,
          intensity: intensity * personality.scalePunchIntensity * 0.8,
          overshoot: personality.overshoot
        })
      });
    }

    // 2. The inner image/map
    if (elementIds.image) {
      const pattern = getPatternOrThrow('soft_reveal');
      layers.push({
        targetElementId: elementIds.image,
        role: 'image',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.5),
          offsetFrames: Math.round(15 * personality.staggerMultiplier),
          intensity: intensity,
          direction: 'down',
          easing: personality.defaultEasing
        })
      });
    }

    // 3. The caption
    if (elementIds.caption) {
      const pattern = getPatternOrThrow('slide_reveal');
      layers.push({
        targetElementId: elementIds.caption,
        role: 'caption',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.4),
          offsetFrames: Math.round(30 * personality.staggerMultiplier),
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
