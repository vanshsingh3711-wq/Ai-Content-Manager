import { MotionCompositionDefinition, MotionCompositionParams, ResolvedMotionComposition, ResolvedMotionLayer } from '../types';
import { getPatternOrThrow } from '../registry';
import { getPersonality } from '../personality';

export const codeRevealComposition: MotionCompositionDefinition = {
  id: 'code_reveal',
  name: 'Code Reveal',
  category: 'technical',
  description: 'Reveals a terminal/code snippet with a typing effect',
  defaultDurationInFrames: 150,
  tags: ['code', 'technical', 'terminal', 'typing'],
  suitableFor: ['technical', 'process', 'code'],

  resolve(elementIds: Record<string, string>, params: MotionCompositionParams): ResolvedMotionComposition {
    const layers: ResolvedMotionLayer[] = [];
    const diagnostics = [];
    const personality = getPersonality(params.personality);
    
    const baseDuration = (params.durationInFrames || this.defaultDurationInFrames) * personality.speedMultiplier;
    const intensity = params.intensity ?? 1.0;

    // 1. The glass terminal window
    if (elementIds.window) {
      const pattern = getPatternOrThrow('scale_punch');
      layers.push({
        targetElementId: elementIds.window,
        role: 'background',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.3),
          offsetFrames: 0,
          intensity: intensity * 0.8,
          easing: personality.defaultEasing
        })
      });
    }

    // 2. The title bar (macOS style dots)
    if (elementIds.titlebar) {
      const pattern = getPatternOrThrow('soft_reveal');
      layers.push({
        targetElementId: elementIds.titlebar,
        role: 'accent',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.2),
          offsetFrames: Math.round(15 * personality.staggerMultiplier),
          intensity,
          direction: 'down',
          easing: 'easeOut'
        })
      });
    }

    // 3. The code content itself (typing effect handled via JS, but we reveal the container)
    if (elementIds.code) {
      const pattern = getPatternOrThrow('soft_reveal');
      layers.push({
        targetElementId: elementIds.code,
        role: 'content',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.2),
          offsetFrames: Math.round(30 * personality.staggerMultiplier),
          intensity,
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
