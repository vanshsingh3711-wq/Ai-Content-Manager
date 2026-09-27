import { KeyframeTrack } from '../../keyframes/keyframes.types';
import { MotionPatternDefinition, MotionPatternParams } from '../types';

let _uid = 0;
function uid(): string { return `kf_br_${_uid++}`; }

/**
 * BlurReveal: Element starts blurred and sharpens into focus.
 * Often combined with scale for a premium "focus pull" effect.
 */
export const blurRevealPattern: MotionPatternDefinition = {
  id: 'blur_reveal',
  name: 'Blur Reveal',
  description: 'Blur-to-sharp focus pull with optional scale',
  animates: ['blur', 'opacity', 'scale'],

  resolve(params: MotionPatternParams): KeyframeTrack[] {
    const dur = params.durationInFrames;
    const offset = params.offsetFrames ?? 0;
    const intensity = params.intensity ?? 1;
    const easing = params.easing ?? 'easeOut';

    const blurAmount = 12 * intensity;

    return [
      {
        property: 'blur',
        keyframes: [
          { id: uid(), frame: offset, value: blurAmount, easing },
          { id: uid(), frame: offset + dur, value: 0 },
        ],
      },
      {
        property: 'opacity',
        keyframes: [
          { id: uid(), frame: offset, value: 0.3, easing },
          { id: uid(), frame: offset + Math.round(dur * 0.5), value: 1 },
        ],
      },
      {
        property: 'scale',
        keyframes: [
          { id: uid(), frame: offset, value: 1 + (0.1 * intensity), easing },
          { id: uid(), frame: offset + dur, value: 1 },
        ],
      },
    ];
  },
};
