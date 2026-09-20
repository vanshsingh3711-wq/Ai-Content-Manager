import { CompositionDiagnostic } from '../validation/validation.types';
import { SceneJSON, SceneJsonVisualType, SceneJsonRole } from './scene-json.types';

const VALID_SCENE_JSON_TYPES: Set<SceneJsonVisualType> = new Set([
  'text', 'object', 'icon', 'illustration', 'chart', 'kpi', 'image', 'video', 'diagram', 'shape', 'media', 'character'
]);

const VALID_SCENE_JSON_ROLES: Set<SceneJsonRole> = new Set([
  'primary', 'secondary', 'supporting', 'background', 'label', 'data', 'emphasis'
]);

export function validateSceneJson(sceneJson: SceneJSON): CompositionDiagnostic[] {
  const diagnostics: CompositionDiagnostic[] = [];

  if (!sceneJson.id) {
    diagnostics.push({
      severity: 'error',
      type: 'missing-metadata',
      message: 'SceneJSON is missing an ID.'
    });
  }

  if (!sceneJson.beatId) {
    diagnostics.push({
      severity: 'error',
      type: 'missing-metadata',
      message: `SceneJSON ${sceneJson.id} must reference a beatId.`
    });
  }

  if (!sceneJson.elements || !Array.isArray(sceneJson.elements) || sceneJson.elements.length === 0) {
    diagnostics.push({
      severity: 'error',
      type: 'invalid-bounds',
      message: `SceneJSON ${sceneJson.id} must contain at least one element.`
    });
    return diagnostics; // cannot validate elements if missing
  }

  const elementIds = new Set<string>();

  for (const element of sceneJson.elements) {
    if (!element.id) {
      diagnostics.push({
        severity: 'error',
        type: 'missing-metadata',
        message: `An element in SceneJSON ${sceneJson.id} is missing an ID.`
      });
    } else if (elementIds.has(element.id)) {
      diagnostics.push({
        severity: 'error',
        type: 'invalid-bounds',
        message: `Duplicate element ID found: ${element.id} in SceneJSON ${sceneJson.id}`
      });
    } else {
      elementIds.add(element.id);
    }

    if (!VALID_SCENE_JSON_TYPES.has(element.type)) {
      diagnostics.push({
        severity: 'error',
        type: 'missing-metadata',
        message: `Element ${element.id} has invalid semantic type: ${element.type}`
      });
    }

    if (element.role && !VALID_SCENE_JSON_ROLES.has(element.role)) {
      diagnostics.push({
        severity: 'error',
        type: 'missing-metadata',
        message: `Element ${element.id} has invalid role: ${element.role}`
      });
    }

    // Checking if an object request has a basic request payload if defined
    if (['object', 'icon', 'illustration', 'image', 'video', 'media', 'character'].includes(element.type) && !element.assetRequest) {
      // It's possible the element doesn't *need* an assetRequest if it resolves to something custom, 
      // but usually an object implies an asset. We will just issue an info/warning if missing.
      if (!element.content) {
        diagnostics.push({
          severity: 'warning',
          type: 'missing-metadata',
          message: `Element ${element.id} of type ${element.type} lacks both assetRequest and content.`
        });
      }
    }
  }

  // Validate Relationship constraints (source and target must exist)
  if (sceneJson.relationships) {
    for (const rel of sceneJson.relationships) {
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

  // Validate Attention targets
  if (sceneJson.attention) {
    for (const att of sceneJson.attention) {
      if (att.targetId && !elementIds.has(att.targetId)) {
        diagnostics.push({
          severity: 'warning',
          type: 'invalid-bounds',
          message: `Attention intent references non-existent targetId: ${att.targetId}`
        });
      }
      if (att.targetIds) {
        for (const tId of att.targetIds) {
          if (!elementIds.has(tId)) {
            diagnostics.push({
              severity: 'warning',
              type: 'invalid-bounds',
              message: `Attention intent references non-existent targetId: ${tId}`
            });
          }
        }
      }
    }
  }

  return diagnostics;
}
