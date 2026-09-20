import { SceneDefinition, ResolvedSceneGraph, SceneResolutionContext } from '../scene/scene.types';
import { ResolvedSceneTransition } from '../transitions/transitions.types';
import { CompositionDiagnostic } from '../validation/validation.types';

export interface SequenceDefinition {
  id: string;
  scenes: SceneDefinition[];
}

export interface ResolvedSequenceScene {
  id: string;
  scene: ResolvedSceneGraph;
  globalStartFrame: number;
  globalEndFrame: number;
  transitionIn?: ResolvedSceneTransition;
}

export interface ResolvedSequence {
  id: string;
  scenes: ResolvedSequenceScene[];
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  diagnostics: CompositionDiagnostic[];
}
