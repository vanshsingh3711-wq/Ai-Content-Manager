import { MotionCompositionDefinition, MotionCompositionParams, ResolvedMotionComposition, ResolvedMotionLayer } from '../types';
import { getPatternOrThrow } from '../registry';
import { getPersonality } from '../personality';

export const stepSequenceComposition: MotionCompositionDefinition = {
  id: 'step_sequence',
  name: 'Step Sequence',
  category: 'storytelling',
  description: 'Staggered sequential reveal of multiple list items or steps',
  defaultDurationInFrames: 150,
  tags: ['list', 'steps', 'sequence', 'stagger'],
  suitableFor: ['steps', 'process', 'timeline'],

  resolve(elementIds: Record<string, string>, params: MotionCompositionParams): ResolvedMotionComposition {
    const layers: ResolvedMotionLayer[] = [];
    const diagnostics = [];
    const personality = getPersonality(params.personality);
    
    const baseDuration = (params.durationInFrames || this.defaultDurationInFrames) * personality.speedMultiplier;
    const intensity = params.intensity ?? 1.0;
    
    // In a step sequence, elementIds will usually contain step1, step2, step3, etc.
    // We dynamically extract all keys that start with 'step' or 'item'
    const stepKeys = Object.keys(elementIds)
      .filter(k => k.startsWith('step') || k.startsWith('item'))
      .sort(); // ensures step1, step2, etc. are in order

    // 1. Container / Title
    if (elementIds.title) {
      const pattern = getPatternOrThrow('soft_reveal');
      layers.push({
        targetElementId: elementIds.title,
        role: 'title',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.2),
          offsetFrames: 0,
          intensity,
          easing: personality.defaultEasing
        })
      });
    }

    // 2. Steps
    const pattern = getPatternOrThrow('stagger_reveal');
    const staggerDelay = Math.round((params.staggerFrames || 15) * personality.staggerMultiplier);
    const stepDuration = Math.round(baseDuration * 0.3); // each step takes 30% of total time
    
    let currentOffset = Math.round(15 * personality.staggerMultiplier);

    stepKeys.forEach((key, index) => {
      const targetId = elementIds[key];
      
      layers.push({
        targetElementId: targetId,
        role: key,
        keyframeTracks: pattern.resolve({
          durationInFrames: stepDuration,
          offsetFrames: currentOffset,
          intensity,
          easing: personality.defaultEasing
        }),
        // Highlight the current step while dimming others
        attention: {
          id: `att_${targetId}`,
          type: 'spotlight',
          intensity: 1.0,
          startFrame: currentOffset,
          // If it's the last step, hold it until the end. Otherwise hold until next step starts
          durationInFrames: index === stepKeys.length - 1 
            ? baseDuration - currentOffset 
            : staggerDelay
        }
      });
      
      currentOffset += staggerDelay;
    });

    return {
      id: this.id,
      layers,
      durationInFrames: Math.round(Math.max(baseDuration, currentOffset + stepDuration)),
      diagnostics
    };
  }
};
