export type AnimatableProperty = 'x' | 'y' | 'scale' | 'rotation' | 'opacity' | 'width' | 'height';

export interface Keyframe<T = number> {
  id: string;
  frame: number;
  value: T;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export interface KeyframeTrack<T = number> {
  property: AnimatableProperty;
  keyframes: Keyframe<T>[];
}

export type ElementKeyframeState = {
  [K in AnimatableProperty]?: number;
};
