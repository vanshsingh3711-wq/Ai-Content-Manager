import { SceneDefinition } from '../scene/scene.types';
import { ProjectFile, ProjectFileMetadata } from './project.types';
import { validateProjectFile } from './project.validation';

const CURRENT_PROJECT_VERSION = 1;

/**
 * Serializes a SceneDefinition into a standardized, portable JSON format.
 * Strips transient runtime state if any accidentally leaked in.
 */
export function serializeProject(project: SceneDefinition, metadata?: ProjectFileMetadata): string {
  const projectFile: ProjectFile = {
    format: 'ai-video-editor-project',
    version: CURRENT_PROJECT_VERSION,
    project: project,
    metadata: {
      ...metadata,
      updatedAt: new Date().toISOString()
    }
  };

  // We use JSON.stringify to safely dump it.
  // In a real application, you might want a custom replacer to strip specific fields,
  // but since we are relying on the strict typings, JSON.stringify is sufficient.
  return JSON.stringify(projectFile, null, 2);
}

/**
 * Parses and deserializes a JSON string into a ProjectFile.
 * It runs migration and validation steps safely.
 * Returns the ProjectFile if successful, throws an Error with details otherwise.
 */
export function deserializeProject(jsonString: string): ProjectFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error: any) {
    throw new Error(`Failed to parse project JSON: ${error.message}`);
  }

  // Basic format check
  if (!parsed || typeof parsed !== 'object' || (parsed as any).format !== 'ai-video-editor-project') {
    throw new Error('File does not appear to be a valid ai-video-editor-project.');
  }

  // Migrate
  const migratedProject = migrateProject(parsed);

  // Validate
  const diagnostics = validateProjectFile(migratedProject);
  const errors = diagnostics.filter(d => d.severity === 'error');

  if (errors.length > 0) {
    const errorMessages = errors.map(e => `- ${e.message}`).join('\n');
    throw new Error(`Project validation failed with errors:\n${errorMessages}`);
  }

  return migratedProject;
}

/**
 * Migrates a parsed project file to the latest version.
 */
export function migrateProject(data: any): ProjectFile {
  if (data.version === CURRENT_PROJECT_VERSION) {
    return data as ProjectFile;
  }

  // Future migrations can be implemented here:
  // if (data.version === 1) { 
  //   data = migrateV1toV2(data); 
  // }
  // if (data.version === 2) { 
  //   data = migrateV2toV3(data); 
  // }

  throw new Error(`Unsupported project version: ${data.version}. Expected version ${CURRENT_PROJECT_VERSION}.`);
}
