import { KeyframeTrack } from '../../keyframes/keyframes.types';
import { MotionPatternDefinition, MotionPatternParams } from '../types';

let _uid = 0;
function uid(): string { return `kf_sr_${_uid++}`; }

/**
 * SoftReveal: A gentle fade + rise. The most common "enter" pattern.
 * Animates opacity (0→1) and translateY (distance→0).
 */
export const softRevealPattern: MotionPatternDefinition = {
  id: 'soft_reveal',
  name: 'Soft Reveal',
  description: 'Gentle fade-in with upward rise',
  animates: ['opacity', 'translateY'],

  resolve(params: MotionPatternParams): KeyframeTrack[] {
    const dur = params.durationInFrames;
    const offset = params.offsetFrames ?? 0;
    const intensity = params.intensity ?? 1;
    const easing = params.easing ?? 'easeOut';

    const distance = (params.direction === 'down' ? -30 : 30) * intensity;

    return [
      {
        property: 'opacity',
        keyframes: [
          { id: uid(), frame: offset, value: 0, easing },
          { id: uid(), frame: offset + dur, value: 1 },
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
