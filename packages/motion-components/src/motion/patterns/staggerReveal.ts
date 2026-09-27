import { KeyframeTrack } from '../../keyframes/keyframes.types';
import { MotionPatternDefinition, MotionPatternParams } from '../types';

let _uid = 0;
function uid(): string { return `kf_str_${_uid++}`; }

/**
 * StaggerReveal: Designed for lists/groups.
 * Same as SoftReveal but with built-in stagger math for the caller
 * to invoke multiple times with increasing offsets.
 * Primarily a helper — compositions call this N times with computed offsets.
 */
export const staggerRevealPattern: MotionPatternDefinition = {
  id: 'stagger_reveal',
  name: 'Stagger Reveal',
  description: 'Staggered fade+rise for list items',
  animates: ['opacity', 'translateY'],

  resolve(params: MotionPatternParams): KeyframeTrack[] {
    const dur = params.durationInFrames;
    const offset = params.offsetFrames ?? 0;
    const intensity = params.intensity ?? 1;
    const easing = params.easing ?? 'easeOutBack';

    const distance = 25 * intensity;

    return [
      {
        property: 'opacity',
        keyframes: [
          { id: uid(), frame: offset, value: 0, easing: 'easeOut' },
          { id: uid(), frame: offset + Math.round(dur * 0.6), value: 1 },
        ],
      },
      {
        property: 'translateY',
        keyframes: [
          { id: uid(), frame: offset, value: distance, easing },
          { id: uid(), frame: offset + dur, value: 0 },
        ],
      },
    ];
  },
};
