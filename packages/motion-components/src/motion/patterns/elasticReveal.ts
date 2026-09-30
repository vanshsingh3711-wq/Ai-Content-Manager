import { KeyframeTrack } from '../../keyframes/keyframes.types';
import { MotionPatternDefinition, MotionPatternParams } from '../types';

let _uid = 0;
function uid(): string { return `kf_er_${_uid++}`; }

/**
 * ElasticReveal: Spring-like entrance with strong overshoot.
 * Scale from 0 → overshoot → settle at 1.
 * More aggressive than ScalePunch — used for playful/energetic compositions.
 */
export const elasticRevealPattern: MotionPatternDefinition = {
  id: 'elastic_reveal',
  name: 'Elastic Reveal',
  description: 'Spring entrance with scale overshoot and fade',
  animates: ['scale', 'opacity'],

  resolve(params: MotionPatternParams): KeyframeTrack[] {
    const dur = params.durationInFrames;
    const offset = params.offsetFrames ?? 0;
    const intensity = params.intensity ?? 1;
    const overshoot = params.overshoot ?? 0.3;

    const peak = 1 + (overshoot * intensity);
    const f1 = offset;
    const f2 = offset + Math.round(dur * 0.35);
    const f3 = offset + Math.round(dur * 0.65);
    const f4 = offset + dur;

    return [
      {
        property: 'scale',
        keyframes: [
          { id: uid(), frame: f1, value: 0, easing: 'easeOut' },
          { id: uid(), frame: f2, value: peak, easing: 'easeOut' },
          { id: uid(), frame: f3, value: 1 - (overshoot * 0.15 * intensity), easing: 'easeInOut' },
          { id: uid(), frame: f4, value: 1.0 },
        ],
      },
      {
        property: 'opacity',
        keyframes: [
          { id: uid(), frame: f1, value: 0, easing: 'easeOut' },
          { id: uid(), frame: f1 + Math.round(dur * 0.2), value: 1 },
        ],
      },
    ];
  },
};
