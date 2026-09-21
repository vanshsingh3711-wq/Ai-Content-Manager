import { CompositionDiagnostic } from '../validation/validation.types';
import { ProjectFile } from './project.types';
import { SceneDefinition } from '../scene/scene.types';

export function validateProjectFile(file: unknown): CompositionDiagnostic[] {
  const diagnostics: CompositionDiagnostic[] = [];

  if (!file || typeof file !== 'object') {
    return [{
      severity: 'error',
      type: 'missing-metadata',
      message: 'Project file must be a JSON object.'
    }];
  }

  const projectFile = file as any;

  if (projectFile.format !== 'ai-video-editor-project') {
    diagnostics.push({
      severity: 'error',
      type: 'missing-metadata',
      message: `Unsupported project format: ${projectFile.format}`
    });
  }

  if (typeof projectFile.version !== 'number') {
    diagnostics.push({
      severity: 'error',
      type: 'missing-metadata',
      message: 'Project file is missing a valid version number.'
    });
  }

  if (!projectFile.project || typeof projectFile.project !== 'object') {
    diagnostics.push({
      severity: 'error',
      type: 'missing-metadata',
      message: 'Project file is missing the project payload.'
    });
    return diagnostics; // Cannot proceed without project payload
  }

  const project = projectFile.project as SceneDefinition;

  if (!project.id) {
    diagnostics.push({
      severity: 'error',
      type: 'missing-metadata',
      message: 'Project is missing an ID.'
    });
  }

  if (project.durationInFrames !== undefined && project.durationInFrames <= 0) {
    diagnostics.push({
      severity: 'error',
      type: 'invalid-bounds',
      message: 'Project durationInFrames must be a positive number.'
    });
  }

  if (!project.elements || !Array.isArray(project.elements)) {
    diagnostics.push({
      severity: 'error',
      type: 'missing-metadata',
      message: 'Project elements must be an array.'
    });
  } else {
    const elementIds = new Set<string>();
    for (const element of project.elements) {
      if (!element.id) {
        diagnostics.push({
          severity: 'error',
          type: 'missing-metadata',
          message: 'An element in the project is missing an ID.'
        });
      } else {
        if (elementIds.has(element.id)) {
          diagnostics.push({
            severity: 'error',
            type: 'invalid-bounds',
            message: `Duplicate element ID found: ${element.id}`
          });
        }
        elementIds.add(element.id);
      }
      
      // Validate keyframes format
      if (element.keyframes && !Array.isArray(element.keyframes)) {
        diagnostics.push({
          severity: 'error',
          type: 'invalid-bounds',
          message: `Element ${element.id} has invalid keyframes format.`
        });
      }
    }

    // Validate relationships
    if (project.relationships && Array.isArray(project.relationships)) {
      for (const rel of project.relationships) {
        if (!elementIds.has(rel.sourceId)) {
          diagnostics.push({
            severity: 'error',
            type: 'invalid-bounds',
            message: `Relationship references non-existent sourceId: ${rel.sourceId}`
          });
        }
        if (rel.targetId && !elementIds.has(rel.targetId)) {
          diagnostics.push({
            severity: 'error',
            type: 'invalid-bounds',
            message: `Relationship references non-existent targetId: ${rel.targetId}`
          });
        }
      }
    }
  }

  return diagnostics;
}
