import { MotionCompositionDefinition, MotionCompositionParams, ResolvedMotionComposition, ResolvedMotionLayer } from '../types';
import { getPatternOrThrow } from '../registry';
import { getPersonality } from '../personality';

export const keywordEmphasisComposition: MotionCompositionDefinition = {
  id: 'keyword_emphasis',
  name: 'Keyword Emphasis',
  category: 'emphasis',
  description: 'In-line sentence emphasis with dimming and highlight',
  defaultDurationInFrames: 60,
  tags: ['keyword', 'emphasis', 'highlight', 'inline'],
  suitableFor: ['text_visual', 'quote'],

  resolve(elementIds: Record<string, string>, params: MotionCompositionParams): ResolvedMotionComposition {
    const layers: ResolvedMotionLayer[] = [];
    const diagnostics = [];
    const personality = getPersonality(params.personality);
    
    const baseDuration = (params.durationInFrames || this.defaultDurationInFrames) * personality.speedMultiplier;
    const intensity = params.intensity ?? 1.0;

    // 1. Sentence (Background text)
    if (elementIds.sentence) {
      const pattern = getPatternOrThrow('soft_reveal');
      layers.push({
        targetElementId: elementIds.sentence,
        role: 'sentence',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.4),
          offsetFrames: 0,
          intensity: 1,
          easing: personality.defaultEasing
        }),
        // Ask the attention system to dim this while the keyword is highlighted
        attention: {
          id: `att_dim_${elementIds.sentence}`,
          type: 'dimOthers', // special semantic type for the sentence container
          intensity: 0.4 * intensity,
          startFrame: Math.round(15 * personality.staggerMultiplier),
          durationInFrames: baseDuration - Math.round(15 * personality.staggerMultiplier)
        }
      });
    }

    // 2. Keyword
    if (elementIds.keyword) {
      const pattern = getPatternOrThrow('keyword_punch');
      const offset = Math.round(15 * personality.staggerMultiplier);
      
      layers.push({
        targetElementId: elementIds.keyword,
        role: 'keyword',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.5),
          offsetFrames: offset,
          intensity: intensity * personality.scalePunchIntensity
        }),
        attention: {
          id: `att_hl_${elementIds.keyword}`,
          type: 'highlight', // The actual visual highlight box
          intensity,
          startFrame: offset,
          durationInFrames: baseDuration - offset
        }
      });
    }

    // 3. Optional underline
    if (elementIds.underline) {
      const pattern = getPatternOrThrow('draw_reveal');
      layers.push({
        targetElementId: elementIds.underline,
        role: 'underline',
        keyframeTracks: pattern.resolve({
          durationInFrames: Math.round(baseDuration * 0.3),
          offsetFrames: Math.round(25 * personality.staggerMultiplier),
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
