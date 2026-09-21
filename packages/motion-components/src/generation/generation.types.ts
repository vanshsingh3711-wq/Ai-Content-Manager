import { SceneDefinition } from '../scene/scene.types';
import { CompositionDiagnostic } from '../validation/validation.types';
import { StoryPlan } from '../story/story.types';
import { VisualPlan } from '../visual/visual.types';
import { SceneJSON } from '../scene/scene-json.types';

export type GenerationStatus =
  | 'idle'
  | 'planning'
  | 'visual-planning'
  | 'scene-generation'
  | 'compiling'
  | 'validating'
  | 'completed'
  | 'failed';

export interface VideoGenerationRequest {
  topic: string;
  durationInSeconds?: number;
  format?: {
    width: number;
    height: number;
    fps: number;
  };
  themeId?: string;
  presenter?: {
    enabled?: boolean;
    presenterId?: string;
  };
}

export interface VideoGenerationResult {
  success: boolean;
  project?: SceneDefinition;
  diagnostics: CompositionDiagnostic[];
  stages?: {
    story?: StoryPlan;
    visual?: VisualPlan;
    scenes?: SceneJSON[];
  };
}
