import { StoryPlan } from '../story/story.types';
import { VisualPlan, VisualScenePlan, VisualElementIntent } from '../visual/visual.types';
import { SceneJSON, SceneElementJSON } from './scene-json.types';
import { validateSceneJson } from './scene-json.validation';

export class DeterministicSceneJsonGenerator {
  
  public generate(storyPlan: StoryPlan, visualPlan: VisualPlan): SceneJSON[] {
    const scenes: SceneJSON[] = [];

    // Assuming a 1:1 mapping from VisualPlan Scenes
    for (const visualScene of visualPlan.scenes) {
      const scene = this.mapVisualSceneToSceneJson(visualScene, storyPlan);
      scenes.push(scene);
    }

    return scenes;
  }

  private mapVisualSceneToSceneJson(visualScene: VisualScenePlan, storyPlan: StoryPlan): SceneJSON {
    const elements: SceneElementJSON[] = [];

    // Map template name based on visualType. We will use the exact identifiers 
    // from core.templates.ts:
    // 'hero' -> 'hero_statement'
    // 'single_focus' -> 'single_focus'
    // 'text_visual' -> 'text_visual'
    // 'chart' -> 'chart_insight'
    // 'comparison' -> 'comparison'
    // 'before_after' -> 'before_after'
    // 'steps' -> 'step_by_step'
    // 'timeline' -> 'timeline'
    // 'kpi' -> 'kpi_visual'
    // 'quote' -> 'full_screen_quote'
    let template = 'single_focus';
    
    switch (visualScene.visualType) {
      case 'hero': template = 'hero_statement'; break;
      case 'chart': template = 'chart_insight'; break;
      case 'steps': template = 'step_by_step'; break;
      case 'kpi': template = 'kpi_visual'; break;
      case 'quote': template = 'full_screen_quote'; break;
      case 'single_focus':
      case 'text_visual':
      case 'comparison':
      case 'before_after':
      case 'timeline':
        template = visualScene.visualType;
        break;
      default:
        template = 'single_focus';
        break;
    }

    for (const intent of visualScene.elements) {
      elements.push(this.mapElementIntent(intent));
    }

    const beat = storyPlan.beats.find(b => b.id === visualScene.beatId);
    
    const sceneJson: SceneJSON = {
      id: `scene_${visualScene.beatId}`, // Deterministic based on beat
      beatId: visualScene.beatId,
      template,
      durationInFrames: beat?.suggestedDurationInFrames, // Get precise duration from TTS/StoryPlan
      elements,
      attention: visualScene.attention,
      transition: visualScene.transition
    };

    const diagnostics = validateSceneJson(sceneJson);
    if (diagnostics.some(d => d.severity === 'error')) {
      throw new Error(`Generated invalid SceneJSON for beat ${visualScene.beatId}: ${diagnostics.map(d => d.message).join(', ')}`);
    }

    return sceneJson;
  }

  private mapElementIntent(intent: VisualElementIntent): SceneElementJSON {
    const el: SceneElementJSON = {
      id: intent.id,
      type: intent.semanticType, // Since we kept them synchronized
      role: intent.role,
      description: intent.description
    };

    // If it's text or KPI, provide basic semantic content payload
    if (intent.semanticType === 'text') {
      el.content = { text: intent.description };
    } else if (intent.semanticType === 'kpi') {
      el.content = { value: intent.description, label: 'Insight' }; // The compiler will parse this
    } else if (intent.semanticType === 'chart') {
      el.content = { kind: 'line', title: intent.description }; 
    } else {
      // It's a visual media type, construct a generic AssetRequest
      el.assetRequest = {
        capabilities: [intent.semanticType], // e.g. 'object', 'illustration'
        tags: intent.description.split(' ').map(s => s.toLowerCase()).filter(s => s.length > 3) // basic deterministic tagging
      };
    }

    return el;
  }
}
