import { KeyframeTrack } from '../../keyframes/keyframes.types';
import { MotionPatternDefinition, MotionPatternParams } from '../types';

let _uid = 0;
function uid(): string { return `kf_kp_${_uid++}`; }

/**
 * KeywordPunch: Quick scale punch specifically for inline keyword emphasis.
 * Smaller, faster than ScalePunch — designed for single words within a sentence.
 * scale: 1 → 1.15 → 0.97 → 1.0
 */
export const keywordPunchPattern: MotionPatternDefinition = {
  id: 'keyword_punch',
  name: 'Keyword Punch',
  description: 'Fast, subtle scale punch for inline word emphasis',
  animates: ['scale'],

  resolve(params: MotionPatternParams): KeyframeTrack[] {
    const dur = params.durationInFrames;
    const offset = params.offsetFrames ?? 0;
    const intensity = params.intensity ?? 1;

    const peak = 1 + (0.15 * intensity);
    const settle = 1 - (0.03 * intensity);

    const f1 = offset;
    const f2 = offset + Math.round(dur * 0.35);
    const f3 = offset + Math.round(dur * 0.7);
    const f4 = offset + dur;

    return [
      {
        property: 'scale',
        keyframes: [
          { id: uid(), frame: f1, value: 1.0, easing: 'easeOut' },
          { id: uid(), frame: f2, value: peak, easing: 'easeOut' },
          { id: uid(), frame: f3, value: settle, easing: 'easeInOut' },
          { id: uid(), frame: f4, value: 1.0 },
        ],
      },
    ];
  },
};
