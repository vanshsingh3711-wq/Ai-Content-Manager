import { KeyframeTrack } from '../../keyframes/keyframes.types';
import { MotionPatternDefinition, MotionPatternParams } from '../types';

let _uid = 0;
function uid(): string { return `kf_fr_${_uid++}`; }

/**
 * FocusReveal: Subtle zoom + brightness shift.
 * Used when drawing attention to an important element without flashy animation.
 * scale: 0.95 → 1.0, opacity: 0.6 → 1.0
 */
export const focusRevealPattern: MotionPatternDefinition = {
  id: 'focus_reveal',
  name: 'Focus Reveal',
  description: 'Subtle zoom-in with brightness shift for drawing attention',
  animates: ['scale', 'opacity'],

  resolve(params: MotionPatternParams): KeyframeTrack[] {
    const dur = params.durationInFrames;
    const offset = params.offsetFrames ?? 0;
    const intensity = params.intensity ?? 1;
    const easing = params.easing ?? 'easeInOut';

    return [
      {
        property: 'scale',
        keyframes: [
          { id: uid(), frame: offset, value: 1 - (0.05 * intensity), easing },
          { id: uid(), frame: offset + dur, value: 1.0 },
        ],
      },
      {
        property: 'opacity',
        keyframes: [
          { id: uid(), frame: offset, value: 1 - (0.4 * intensity), easing },
          { id: uid(), frame: offset + dur, value: 1.0 },
        ],
      },
    ];
  },
};
