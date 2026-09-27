import { KeyframeTrack } from '../../keyframes/keyframes.types';
import { MotionPatternDefinition, MotionPatternParams } from '../types';

let _uid = 0;
function uid(): string { return `kf_dr_${_uid++}`; }

/**
 * DrawReveal: Animates an SVG line/underline/border from 0% to 100%.
 * Uses the 'width' property to simulate stroke-dashoffset progression.
 * The renderer should map this to SVG stroke or border-width animation.
 */
export const drawRevealPattern: MotionPatternDefinition = {
  id: 'draw_reveal',
  name: 'Draw Reveal',
  description: 'SVG stroke drawing animation from 0 to full',
  animates: ['width', 'opacity'],

  resolve(params: MotionPatternParams): KeyframeTrack[] {
    const dur = params.durationInFrames;
    const offset = params.offsetFrames ?? 0;
    const easing = params.easing ?? 'easeInOut';

    return [
      {
        property: 'width',
        keyframes: [
          { id: uid(), frame: offset, value: 0, easing },
          { id: uid(), frame: offset + dur, value: 100 },
        ],
      },
      {
        property: 'opacity',
        keyframes: [
          { id: uid(), frame: offset, value: 0, easing: 'easeOut' },
          { id: uid(), frame: offset + Math.round(dur * 0.2), value: 1 },
        ],
      },
    ];
  },
};
