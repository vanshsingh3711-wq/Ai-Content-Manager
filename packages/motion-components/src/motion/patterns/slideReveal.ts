import { KeyframeTrack } from '../../keyframes/keyframes.types';
import { MotionPatternDefinition, MotionPatternParams } from '../types';

let _uid = 0;
function uid(): string { return `kf_slr_${_uid++}`; }

/**
 * SlideReveal: Directional slide with fade.
 * Element slides in from a direction while fading in.
 */
export const slideRevealPattern: MotionPatternDefinition = {
  id: 'slide_reveal',
  name: 'Slide Reveal',
  description: 'Directional slide-in with fade',
  animates: ['opacity', 'translateX', 'translateY'],

  resolve(params: MotionPatternParams): KeyframeTrack[] {
    const dur = params.durationInFrames;
    const offset = params.offsetFrames ?? 0;
    const intensity = params.intensity ?? 1;
    const easing = params.easing ?? 'easeOutBack';
    const direction = params.direction ?? 'left';

    const distance = 60 * intensity;
    const tracks: KeyframeTrack[] = [
      {
        property: 'opacity',
        keyframes: [
          { id: uid(), frame: offset, value: 0, easing: 'easeOut' },
          { id: uid(), frame: offset + Math.round(dur * 0.6), value: 1 },
        ],
      },
    ];

    if (direction === 'left' || direction === 'right') {
      const startX = direction === 'left' ? -distance : distance;
      tracks.push({
        property: 'translateX',
        keyframes: [
          { id: uid(), frame: offset, value: startX, easing },
          { id: uid(), frame: offset + dur, value: 0 },
        ],
      });
    } else {
      const startY = direction === 'up' ? -distance : distance;
      tracks.push({
        property: 'translateY',
        keyframes: [
          { id: uid(), frame: offset, value: startY, easing },
          { id: uid(), frame: offset + dur, value: 0 },
        ],
      });
    }

    return tracks;
  },
};
