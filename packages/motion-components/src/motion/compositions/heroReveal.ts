import { MotionCompositionDefinition, MotionCompositionParams, ResolvedMotionComposition, ResolvedMotionLayer } from '../types';
import { getPatternOrThrow } from '../registry';
import { getPersonality } from '../personality';

export const heroRevealComposition: MotionCompositionDefinition = {
  id: 'hero_reveal',
  name: 'Hero Reveal',
  category: 'text',
  description: 'Dramatic multi-layer reveal for primary titles',
  defaultDurationInFrames: 90,
  tags: ['hero', 'title', 'intro', 'dramatic'],
  suitableFor: ['hero', 'quote', 'text_visual'],

  resolve(elementIds: Record<string, string>, params: MotionCompositionParams): ResolvedMotionComposition {
    const layers: ResolvedMotionLayer[] = [];
    const diagnostics = [];
    const personality = getPersonality(params.personality);
    
    // Base duration and intensity
    const baseDuration = (params.durationInFrames || this.defaultDurationInFrames) * personality.speedMultiplier;
    const intensity = params.intensity ?? 1.0;

    // 1. Background layer
    if (elementIds.background) {
      const pattern = getPatternOrThrow('soft_reveal');
      layers.push({
        targetElementId: elementIds.background,
        role: 'background',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.8),
          offsetFrames: 0,
          intensity: intensity * 0.5, // gentle reveal
          easing: 'easeInOut'
        }),
      });
    }

    // 2. Label/Eyebrow
    if (elementIds.label) {
      const pattern = getPatternOrThrow('soft_reveal');
      layers.push({
        targetElementId: elementIds.label,
        role: 'label',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.4),
          offsetFrames: Math.round(10 * personality.staggerMultiplier),
          intensity,
          direction: 'down', // drop down slightly
          easing: personality.defaultEasing
        })
      });
    }

    // 3. Headline (The main attraction)
    if (elementIds.headline) {
      const pattern = getPatternOrThrow('blur_reveal');
      layers.push({
        targetElementId: elementIds.headline,
        role: 'headline',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.6),
          offsetFrames: Math.round(15 * personality.staggerMultiplier),
          intensity,
          easing: personality.defaultEasing
        })
      });
    }

    // 4. Supporting text
    if (elementIds.supporting) {
      const pattern = getPatternOrThrow('soft_reveal');
      layers.push({
        targetElementId: elementIds.supporting,
        role: 'supporting',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.5),
          offsetFrames: Math.round(35 * personality.staggerMultiplier),
          intensity,
          easing: personality.defaultEasing
        })
      });
    }

    // 5. Accent/Keyword (Scale Punch + Attention)
    if (elementIds.accent || elementIds.emphasis) {
      const targetId = elementIds.accent || elementIds.emphasis;
      const pattern = getPatternOrThrow('scale_punch');
      const offset = Math.round(45 * personality.staggerMultiplier);
      
      layers.push({
        targetElementId: targetId,
        role: 'accent',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.4),
          offsetFrames: offset,
          intensity: intensity * personality.scalePunchIntensity,
          overshoot: personality.overshoot
        }),
        attention: {
          id: `att_${targetId}`,
          type: 'highlight',
          targetId: targetId,
          intensity: 0.8,
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
