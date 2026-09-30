import { MotionCompositionDefinition, MotionCompositionParams, ResolvedMotionComposition, ResolvedMotionLayer } from '../types';
import { getPatternOrThrow } from '../registry';
import { getPersonality } from '../personality';

export const beforeAfterComposition: MotionCompositionDefinition = {
  id: 'before_after',
  name: 'Before & After',
  category: 'visual',
  description: 'Side-by-side or overlapping comparison reveal',
  defaultDurationInFrames: 120,
  tags: ['comparison', 'before', 'after', 'visual'],
  suitableFor: ['before_after', 'comparison'],

  resolve(elementIds: Record<string, string>, params: MotionCompositionParams): ResolvedMotionComposition {
    const layers: ResolvedMotionLayer[] = [];
    const diagnostics = [];
    const personality = getPersonality(params.personality);
    
    const baseDuration = (params.durationInFrames || this.defaultDurationInFrames) * personality.speedMultiplier;
    const intensity = params.intensity ?? 1.0;

    // 1. Before State (usually fades in first)
    if (elementIds.before) {
      const pattern = getPatternOrThrow('soft_reveal');
      layers.push({
        targetElementId: elementIds.before,
        role: 'background', // using background semantic role for the initial state
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.4),
          offsetFrames: 0,
          intensity,
          easing: 'easeInOut'
        }),
        // Draw attention to the 'before' state initially
        attention: {
          id: `att_${elementIds.before}`,
          type: 'highlight',
          intensity: 0.5,
          startFrame: 0,
          durationInFrames: Math.round(baseDuration * 0.5)
        }
      });
    }

    // 2. Before Label
    if (elementIds.beforeLabel) {
      const pattern = getPatternOrThrow('soft_reveal');
      layers.push({
        targetElementId: elementIds.beforeLabel,
        role: 'label',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.3),
          offsetFrames: Math.round(15 * personality.staggerMultiplier),
          intensity: intensity * 0.8,
          easing: 'easeOut'
        })
      });
    }

    // 3. After State (the punchline)
    if (elementIds.after) {
      const pattern = getPatternOrThrow('scale_punch');
      const offset = Math.round(50 * personality.staggerMultiplier);
      layers.push({
        targetElementId: elementIds.after,
        role: 'accent', // the 'after' state is the accent/focus
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.4),
          offsetFrames: offset,
          intensity: intensity * personality.scalePunchIntensity,
          overshoot: personality.overshoot
        }),
        // Shift attention to the 'after' state
        attention: {
          id: `att_${elementIds.after}`,
          type: 'spotlight',
          intensity: 1.0,
          startFrame: offset,
          durationInFrames: baseDuration - offset
        }
      });
    }

    // 4. After Label
    if (elementIds.afterLabel) {
      const pattern = getPatternOrThrow('slide_reveal');
      layers.push({
        targetElementId: elementIds.afterLabel,
        role: 'label',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.3),
          offsetFrames: Math.round(65 * personality.staggerMultiplier),
          intensity,
          direction: 'left',
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
