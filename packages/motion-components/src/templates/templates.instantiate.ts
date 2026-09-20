import { SceneDefinition, SceneElementDefinition } from '../scene/scene.types';
import { templateRegistry } from './templates.registry';
import { TemplateDiagnostic, TemplateInput, TemplateInstantiationResult } from './templates.types';
import { CompositionRelationship } from '../relationships/relationships.types';

/**
 * Instantiates a template into a raw SceneDefinition.
 *
 * 1. Looks up the template factory by ID.
 * 2. Invokes the factory with the provided `config` to generate dynamic slots/relationships.
 * 3. Maps the user-provided `slots` to the template's defined slots.
 * 4. Generates missing diagnostics for required slots.
 * 5. Purges relationships that depend on missing optional slots.
 * 6. Returns the pure SceneDefinition.
 */
export function instantiateTemplate(input: TemplateInput): TemplateInstantiationResult {
  const diagnostics: TemplateDiagnostic[] = [];
  
  const factory = templateRegistry.getFactory(input.templateId);
  if (!factory) {
    diagnostics.push({
      severity: 'error',
      reason: 'template-not-found',
      message: `Template with ID '${input.templateId}' not found in registry.`
    });
    return { diagnostics };
  }

  // 1. Generate the structural template with the provided config
  const template = factory(input.config || {});
  
  const elements: SceneElementDefinition[] = [];
  const activeSlotIds = new Set<string>();

  // 2. Map inputs to slots
  for (const slotDef of template.slots) {
    const providedInput = input.slots[slotDef.id];

    if (!providedInput) {
      if (slotDef.required) {
        diagnostics.push({
          severity: 'error',
          reason: 'missing-required-slot',
          message: `Required slot '${slotDef.id}' (${slotDef.role}) was not provided.`,
          slotId: slotDef.id
        });
      }
      // If optional and missing, we just don't create an element for it
      continue;
    }

    // 3. Construct the element using the provided input, falling back to template defaults
    const element: SceneElementDefinition = {
      id: slotDef.id, // The slot ID acts as the stable element ID in the layout
      assetRequest: providedInput.assetRequest || slotDef.defaultAssetRequest,
      placement: providedInput.placement || slotDef.defaultPlacement,
      timing: providedInput.timing || slotDef.defaultTiming
    };

    elements.push(element);
    activeSlotIds.add(slotDef.id);
  }

  // 4. Resolve Relationships
  const validRelationships: CompositionRelationship[] = [];
  if (template.relationships) {
    for (const rel of template.relationships) {
      // If a relationship depends on a slot that was optional and missing, we must drop it cleanly
      if (activeSlotIds.has(rel.sourceId) && activeSlotIds.has(rel.targetId)) {
        validRelationships.push(rel);
      }
    }
  }

  // 5. Construct Scene Definition
  const scene: SceneDefinition = {
    id: `scene_${template.id}_${Date.now()}`, // Could be provided from outside, but generating a stable-ish ID
    elements,
    relationships: validRelationships,
  };

  return { scene, diagnostics };
}
