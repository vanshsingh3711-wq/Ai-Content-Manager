import { KeyframeTrack } from '../../keyframes/keyframes.types';
import { MotionPatternDefinition, MotionPatternParams } from '../types';

let _uid = 0;
function uid(): string { return `kf_ef_${_uid++}`; }

/**
 * ExitFade: Clean exit animation — fade + slight scale down + slide.
 * The universal "leave" pattern.
 */
export const exitFadePattern: MotionPatternDefinition = {
  id: 'exit_fade',
  name: 'Exit Fade',
  description: 'Clean exit with fade-out, slight scale reduction, and optional slide',
  animates: ['opacity', 'scale', 'translateY'],

  resolve(params: MotionPatternParams): KeyframeTrack[] {
    const dur = params.durationInFrames;
    const offset = params.offsetFrames ?? 0;
    const intensity = params.intensity ?? 1;
    const easing = params.easing ?? 'easeIn';

    return [
      {
        property: 'opacity',
        keyframes: [
          { id: uid(), frame: offset, value: 1, easing },
          { id: uid(), frame: offset + dur, value: 0 },
        ],
      },
      {
        property: 'scale',
        keyframes: [
          { id: uid(), frame: offset, value: 1, easing },
          { id: uid(), frame: offset + dur, value: 1 - (0.05 * intensity) },
        ],
      },
      {
        property: 'translateY',
        keyframes: [
          { id: uid(), frame: offset, value: 0, easing },
          { id: uid(), frame: offset + dur, value: -(10 * intensity) },
        ],
      },
    ];
  },
};
