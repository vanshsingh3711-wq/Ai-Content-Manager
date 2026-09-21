import { SceneGraphCompileContext, SceneGraphCompiler } from './scene.compiler.types';
import { SceneJSON, SceneElementJSON } from './scene-json.types';
import { SceneDefinition, SceneElementDefinition } from './scene.types';
import { validateSceneJson } from './scene-json.validation';
import { templateRegistry } from '../templates/templates.registry';
import { instantiateTemplate } from '../templates/templates.instantiate';
import { TemplateInput } from '../templates/templates.types';
import { CompositionDiagnostic } from '../validation/validation.types';

export class DeterministicSceneCompiler implements SceneGraphCompiler {
  
  compile(scene: SceneJSON, context?: SceneGraphCompileContext): SceneDefinition {
    // 1. Validation
    const diagnostics = validateSceneJson(scene);
    if (diagnostics.some((d: CompositionDiagnostic) => d.severity === 'error')) {
      throw new Error(`Cannot compile invalid SceneJSON: ${diagnostics.map((d: CompositionDiagnostic) => d.message).join(', ')}`);
    }

    let compiledScene: SceneDefinition;

    // 2. Resolve Template (if requested)
    if (scene.template && templateRegistry.getFactory(scene.template)) {
      compiledScene = this.compileWithTemplate(scene, context);
    } else {
      // 3. Compile manually without template
      compiledScene = this.compileManually(scene, context);
    }

    // 4. Attach Context
    compiledScene.durationInFrames = scene.durationInFrames;
    if (scene.attention) {
      compiledScene.attention = [...scene.attention];
    }
    if (scene.transition) {
      compiledScene.transitionIn = { ...scene.transition };
    }
    if (context?.theme) {
      compiledScene.themeId = context.theme;
    }
    if (scene.interactions) {
      this.attachInteractions(compiledScene, scene);
    }

    return compiledScene;
  }

  private attachInteractions(compiledScene: SceneDefinition, scene: SceneJSON) {
    if (!scene.interactions || scene.interactions.length === 0) return;

    for (const interaction of scene.interactions) {
      let presenterElement = compiledScene.elements.find(e => e.id === interaction.presenterId);
      
      if (!presenterElement) {
        // If the compiler hasn't created a presenter, we could create one or throw.
        // For strict mapping, we assume the presenter element exists.
        throw new Error(`Presenter interaction references missing presenterId: ${interaction.presenterId}`);
      }
      
      if (presenterElement.type !== 'presenter') {
        throw new Error(`Element ${interaction.presenterId} is not a presenter, but has an interaction.`);
      }

      if (!presenterElement.presenterTimeline) {
        presenterElement.presenterTimeline = [];
      }

      presenterElement.presenterTimeline.push({
        presenterId: interaction.presenterId,
        // The compiler doesn't know the exact character asset ID yet, but the resolution pass uses the first one.
        // If there's an existing timeline item, use its characterAssetId, otherwise default to a safe value or rely on the scene definition.
        characterAssetId: presenterElement.presenterTimeline[0]?.characterAssetId || 'svg-presenter',
        action: interaction.action,
        targetId: interaction.targetId,
        startFrame: interaction.startFrame,
        durationInFrames: interaction.durationInFrames || 60,
      });
    }
  }

  private compileWithTemplate(scene: SceneJSON, context?: SceneGraphCompileContext): SceneDefinition {
    const factory = templateRegistry.getFactory(scene.template!);
    const templateDef = factory!(); // Get structural data for slot mapping

    const templateInput: TemplateInput = {
      templateId: scene.template!,
      slots: {}
    };

    // Attempt to match JSON elements to template slots
    const unmappedElements: SceneElementJSON[] = [];

    for (const el of scene.elements) {
      let mapped = false;
      const inferredRole = this.inferTemplateRole(el);

      for (const slot of templateDef.slots) {
        if (slot.role === inferredRole && !templateInput.slots[slot.id]) {
          templateInput.slots[slot.id] = {
            assetRequest: el.assetRequest,
            timing: el.timing
          };
          mapped = true;
          // We must remember how we mapped it to attach content later since template logic 
          // drops 'textContent' during instantiation
          el.id = slot.id; 
          break;
        }
      }

      if (!mapped) {
        unmappedElements.push(el);
      }
    }

    const { scene: instantiated, diagnostics } = instantiateTemplate(templateInput);
    
    if (diagnostics.some((d) => d.severity === 'error') || !instantiated) {
      throw new Error(`Template instantiation failed for ${scene.template}`);
    }

    // Hydrate instantiated elements with content
    for (const def of instantiated.elements) {
      const originalEl = scene.elements.find(e => e.id === def.id);
      if (originalEl) {
        this.hydrateElementDefinition(def, originalEl);
      }
    }

    // Append unmapped elements manually
    for (const unmapped of unmappedElements) {
      instantiated.elements.push(this.mapElementManually(unmapped));
    }

    // Append explicit JSON relationships
    if (scene.relationships) {
      instantiated.relationships = [
        ...(instantiated.relationships || []),
        ...scene.relationships
      ];
    }

    return instantiated;
  }

  private compileManually(scene: SceneJSON, context?: SceneGraphCompileContext): SceneDefinition {
    const elements: SceneElementDefinition[] = [];
    
    for (const el of scene.elements) {
      elements.push(this.mapElementManually(el));
    }

    return {
      id: `compiled_${scene.id}`,
      elements,
      relationships: scene.relationships ? [...scene.relationships] : []
    };
  }

  private mapElementManually(jsonEl: SceneElementJSON): SceneElementDefinition {
    const def: SceneElementDefinition = {
      id: jsonEl.id,
      assetRequest: jsonEl.assetRequest,
      timing: jsonEl.timing
    };
    this.hydrateElementDefinition(def, jsonEl);
    return def;
  }

  private hydrateElementDefinition(def: SceneElementDefinition, jsonEl: SceneElementJSON): void {
    if (jsonEl.type === 'text') {
      def.type = 'text';
      def.textContent = typeof jsonEl.content?.text === 'string' ? jsonEl.content.text : undefined;
    } else if (jsonEl.type === 'image') {
      def.type = 'image';
      // Hydrate via imageConfig if content provided
    } else if (jsonEl.type === 'video') {
      def.type = 'video';
    } else if (jsonEl.type === 'presenter') {
      def.type = 'presenter';
    } else {
      def.type = 'asset';
      // For charts, KPIs, etc, the assetRequest is present or we construct a generic one
      if (!def.assetRequest && jsonEl.content) {
        // Semantic fallback if missing from JSON
        def.assetRequest = { capabilities: [jsonEl.type] };
      }
    }

    // Explicit layout injection is bypassed, relying strictly on template/auto positioning!
    // Animation is passed completely transparently
    if (jsonEl.animation) {
      def.animation = { ...jsonEl.animation };
    }
    if (jsonEl.keyframes) {
      def.keyframes = [...jsonEl.keyframes];
    }
  }

  private inferTemplateRole(el: SceneElementJSON): string {
    // Basic heuristic converting JSON semantic rules to Template semantic rules
    if (el.role === 'primary' && el.type === 'text') return 'primary_text';
    if (el.role === 'primary' && el.type === 'chart') return 'data_visual';
    if (el.role === 'primary') return 'primary_visual';
    
    if (el.role === 'supporting' && el.type === 'text') return 'supporting_text';
    if (el.role === 'supporting') return 'supporting_visual';

    if (el.role === 'secondary') return 'secondary_visual';

    return 'supporting_visual';
  }
}
