import { TransitionType, TransitionImplementation, SceneTransition } from './transitions.types';
import { 
  cutTransition, 
  fadeTransition, 
  crossfadeTransition, 
  slideTransition, 
  pushTransition, 
  wipeTransition, 
  zoomTransition 
} from './transitions.implementations';

export const transitionRegistry: Record<TransitionType, TransitionImplementation> = {
  cut: cutTransition,
  fade: fadeTransition,
  crossfade: crossfadeTransition,
  slide: slideTransition,
  push: pushTransition,
  wipe: wipeTransition,
  zoom: zoomTransition,
};

export const transitionPresets: Record<string, SceneTransition> = {
  quick_cut: { type: 'cut', durationInFrames: 0 },
  soft_fade: { type: 'fade', durationInFrames: 30 },
  smooth_slide: { type: 'slide', direction: 'left', durationInFrames: 20 },
  editorial_wipe: { type: 'wipe', direction: 'right', durationInFrames: 24 },
  subtle_zoom: { type: 'zoom', direction: 'in', durationInFrames: 45 }
};

export function getTransitionPreset(presetId: string): SceneTransition | undefined {
  return transitionPresets[presetId];
}
