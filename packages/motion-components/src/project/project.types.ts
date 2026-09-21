import { SceneDefinition } from '../scene/scene.types';

export interface ProjectFileMetadata {
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectFile {
  format: 'ai-video-editor-project';
  version: number;
  project: SceneDefinition;
  metadata?: ProjectFileMetadata;
}
