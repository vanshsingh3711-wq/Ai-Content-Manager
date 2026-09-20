import { CompositionDiagnostic } from '../validation/validation.types';
import { VisualPlan, VisualType, VisualSemanticType, VisualRole } from './visual.types';

const VALID_VISUAL_TYPES: Set<VisualType> = new Set([
  'hero', 'single_focus', 'text_visual', 'chart', 'comparison', 
  'before_after', 'steps', 'timeline', 'kpi', 'quote', 'process', 'diagram', 'media', 'custom'
]);

const VALID_ROLES: Set<VisualRole> = new Set([
  'primary', 'secondary', 'supporting', 'background', 'label', 'data', 'emphasis'
]);

const VALID_SEMANTIC_TYPES: Set<VisualSemanticType> = new Set([
  'text', 'object', 'icon', 'illustration', 'chart', 'kpi', 'image', 'video', 'diagram', 'shape', 'character', 'media'
]);

export function validateVisualPlan(plan: VisualPlan): CompositionDiagnostic[] {
  const diagnostics: CompositionDiagnostic[] = [];

  if (!plan.id) {
    diagnostics.push({
      severity: 'error',
      type: 'missing-metadata',
      message: 'Visual Plan is missing an ID.'
    });
  }

  if (!plan.storyPlanId) {
    diagnostics.push({
      severity: 'error',
      type: 'missing-metadata',
      message: 'Visual Plan must reference a Story Plan ID.'
    });
  }

  if (!plan.scenes || !Array.isArray(plan.scenes) || plan.scenes.length === 0) {
    diagnostics.push({
      severity: 'error',
      type: 'invalid-bounds',
      message: 'Visual Plan must contain at least one scene.'
    });
    return diagnostics;
  }

  const sceneIds = new Set<string>();

  for (let i = 0; i < plan.scenes.length; i++) {
    const scene = plan.scenes[i];

    if (!scene.id) {
      diagnostics.push({
        severity: 'error',
        type: 'missing-metadata',
        message: `Scene at index ${i} is missing an ID.`
      });
    } else if (sceneIds.has(scene.id)) {
      diagnostics.push({
        severity: 'error',
        type: 'invalid-bounds',
        message: `Duplicate scene ID found: ${scene.id}`
      });
    } else {
      sceneIds.add(scene.id);
    }

    if (!scene.beatId) {
      diagnostics.push({
        severity: 'error',
        type: 'missing-metadata',
        message: `Scene ${scene.id || i} must reference a beatId.`
      });
    }

    if (!VALID_VISUAL_TYPES.has(scene.visualType)) {
      diagnostics.push({
        severity: 'error',
        type: 'missing-metadata',
        message: `Scene ${scene.id || i} has an invalid visual type: ${scene.visualType}`
      });
    }

    if (!scene.purpose || scene.purpose.trim() === '') {
      diagnostics.push({
        severity: 'error',
        type: 'missing-metadata',
        message: `Scene ${scene.id || i} is missing a purpose.`
      });
    }

    if (!scene.visualDescription || scene.visualDescription.trim() === '') {
      diagnostics.push({
        severity: 'error',
        type: 'missing-metadata',
        message: `Scene ${scene.id || i} is missing a visual description.`
      });
    }

    if (!scene.elements || scene.elements.length === 0) {
      diagnostics.push({
        severity: 'error',
        type: 'missing-metadata',
        message: `Scene ${scene.id || i} has no elements.`
      });
    } else {
      const elementIds = new Set<string>();
      for (const element of scene.elements) {
        if (!element.id) {
          diagnostics.push({
            severity: 'error',
            type: 'missing-metadata',
            message: `An element in scene ${scene.id || i} is missing an ID.`
          });
        } else if (elementIds.has(element.id)) {
          diagnostics.push({
            severity: 'error',
            type: 'invalid-bounds',
            message: `Duplicate element ID found: ${element.id} in scene ${scene.id || i}`
          });
        } else {
          elementIds.add(element.id);
        }

        if (!VALID_ROLES.has(element.role)) {
          diagnostics.push({
            severity: 'error',
            type: 'missing-metadata',
            message: `Element ${element.id} has invalid role: ${element.role}`
          });
        }

        if (!VALID_SEMANTIC_TYPES.has(element.semanticType)) {
          diagnostics.push({
            severity: 'error',
            type: 'missing-metadata',
            message: `Element ${element.id} has invalid semanticType: ${element.semanticType}`
          });
        }

        if (!element.description || element.description.trim() === '') {
          diagnostics.push({
            severity: 'error',
            type: 'missing-metadata',
            message: `Element ${element.id} is missing a description.`
          });
        }
      }
    }
  }

  return diagnostics;
}
