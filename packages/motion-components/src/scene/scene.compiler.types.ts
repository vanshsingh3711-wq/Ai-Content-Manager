import { SceneDefinition } from './scene.types';
import { SceneJSON } from './scene-json.types';

export interface SceneGraphCompileContext {
  theme?: string;
  viewport?: {
    width: number;
    height: number;
  };
  fps?: number;
  metadata?: Record<string, unknown>;
}

export interface SceneGraphCompiler {
  compile(
    scene: SceneJSON,
    context?: SceneGraphCompileContext
  ): SceneDefinition;
}
