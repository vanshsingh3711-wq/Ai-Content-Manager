import { describe, it, expect } from 'vitest';
import { serializeProject, deserializeProject } from './project.io';
import { SceneDefinition } from '../scene/scene.types';

describe('Project Save/Load IO', () => {
  const validProject: SceneDefinition = {
    id: 'test-project-1',
    durationInFrames: 300,
    themeId: 'premium_dark',
    elements: [
      {
        id: 'element-1',
        type: 'text',
        textContent: 'Hello Save/Load',
        placement: { position: { x: 50, y: 50 }, positionMode: 'absolute' }
      }
    ]
  };

  it('serializes a valid project safely', () => {
    const jsonString = serializeProject(validProject);
    const parsed = JSON.parse(jsonString);
    
    expect(parsed.format).toBe('ai-video-editor-project');
    expect(parsed.version).toBe(1);
    expect(parsed.project.id).toBe('test-project-1');
  });

  it('deserializes a valid project JSON safely', () => {
    const jsonString = serializeProject(validProject);
    const loadedFile = deserializeProject(jsonString);

    expect(loadedFile.project.id).toBe('test-project-1');
    expect(loadedFile.project.durationInFrames).toBe(300);
    expect(loadedFile.project.elements[0].textContent).toBe('Hello Save/Load');
  });

  it('throws an error on invalid version', () => {
    const invalidVersionJSON = JSON.stringify({
      format: 'ai-video-editor-project',
      version: 999,
      project: validProject
    });

    expect(() => deserializeProject(invalidVersionJSON)).toThrow(/Unsupported project version/);
  });

  it('throws an error on missing element ID', () => {
    const invalidProject = { ...validProject, elements: [{ type: 'text', textContent: 'No ID' }] };
    const invalidJSON = JSON.stringify({
      format: 'ai-video-editor-project',
      version: 1,
      project: invalidProject
    });

    expect(() => deserializeProject(invalidJSON)).toThrow(/An element in the project is missing an ID/);
  });

  it('throws an error on duplicate element ID', () => {
    const duplicateProject: SceneDefinition = {
      ...validProject,
      elements: [
        { id: 'duplicate-1', type: 'text' },
        { id: 'duplicate-1', type: 'image' } // duplicate ID
      ]
    };
    
    const invalidJSON = JSON.stringify({
      format: 'ai-video-editor-project',
      version: 1,
      project: duplicateProject
    });

    expect(() => deserializeProject(invalidJSON)).toThrow(/Duplicate element ID found: duplicate-1/);
  });
});
