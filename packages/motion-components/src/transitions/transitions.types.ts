import { CompositionDiagnostic } from '../validation/validation.types';

export type TransitionType = 
  | 'cut'
  | 'fade'
  | 'crossfade'
  | 'slide'
  | 'push'
  | 'wipe'
  | 'zoom';

export type TransitionDirection = 'left' | 'right' | 'up' | 'down' | 'in' | 'out';

export interface SceneTransition {
  type: TransitionType;
  durationInFrames?: number; // Optional on input, resolved later
  easing?: string; // Standard remotion Easing mapping key if needed
  direction?: TransitionDirection;
  intensity?: number;
}

export interface ResolvedSceneTransition {
  type: TransitionType;
  durationInFrames: number; // Always resolved
  direction?: TransitionDirection; // Kept if relevant
  intensity?: number;
}

export interface TransitionState {
  sceneAStyle: React.CSSProperties;
  sceneBStyle: React.CSSProperties;
}

export interface TransitionImplementation {
  (progress: number, transition: ResolvedSceneTransition): TransitionState;
}

export interface TransitionDiagnostic extends CompositionDiagnostic {
  reason: 'unknown-transition-type' | 'invalid-duration' | 'invalid-direction';
}
