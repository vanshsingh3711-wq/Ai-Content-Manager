import { KeyframeTrack } from '../../keyframes/keyframes.types';
import { MotionPatternDefinition, MotionPatternParams } from '../types';

let _uid = 0;
function uid(): string { return `kf_sp_${_uid++}`; }

/**
 * ScalePunch: Professional overshoot scale animation.
 * 0.85 → 1.08 → 0.98 → 1.0
 * This creates the "pop" effect seen in Jitter and After Effects.
 */
export const scalePunchPattern: MotionPatternDefinition = {
  id: 'scale_punch',
  name: 'Scale Punch',
  description: 'Overshoot scale pop with multi-stage keyframes',
  animates: ['scale'],

  resolve(params: MotionPatternParams): KeyframeTrack[] {
    const dur = params.durationInFrames;
    const offset = params.offsetFrames ?? 0;
    const intensity = params.intensity ?? 1;
    const overshoot = params.overshoot ?? 0.15;

    // Multi-stage keyframe: undershoot → overshoot → settle → rest
    const undershoot = 1 - (0.15 * intensity);
    const peak = 1 + (overshoot * intensity * 0.8);
    const settle = 1 - (overshoot * intensity * 0.15);

    const f1 = offset;
    const f2 = offset + Math.round(dur * 0.4);
    const f3 = offset + Math.round(dur * 0.75);
    const f4 = offset + dur;

    return [
      {
        property: 'scale',
        keyframes: [
          { id: uid(), frame: f1, value: undershoot, easing: 'easeOut' },
          { id: uid(), frame: f2, value: peak, easing: 'easeOut' },
          { id: uid(), frame: f3, value: settle, easing: 'easeInOut' },
          { id: uid(), frame: f4, value: 1.0 },
        ],
      },
    ];
  },
};
