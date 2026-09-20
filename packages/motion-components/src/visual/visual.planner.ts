import { StoryPlan, StoryBeatPlan } from '../story/story.types';
import { VisualPlanner, VisualPlan, VisualScenePlan, VisualType, VisualElementIntent } from './visual.types';
import { validateVisualPlan } from './visual.validation';

export class DeterministicVisualPlanner implements VisualPlanner {
  plan(storyPlan: StoryPlan): VisualPlan {
    const scenes: VisualScenePlan[] = [];

    let sceneCounter = 1;
    for (const beat of storyPlan.beats) {
      const scene = this.mapBeatToScene(beat, sceneCounter++);
      scenes.push(scene);
    }

    const visualPlan: VisualPlan = {
      id: `visual_plan_${storyPlan.id}`,
      storyPlanId: storyPlan.id,
      scenes
    };

    const diagnostics = validateVisualPlan(visualPlan);
    if (diagnostics.some(d => d.severity === 'error')) {
      throw new Error(`Generated invalid visual plan: ${diagnostics.map(d => d.message).join(', ')}`);
    }

    return visualPlan;
  }

  private mapBeatToScene(beat: StoryBeatPlan, index: number): VisualScenePlan {
    let visualType: VisualType = 'custom';
    let visualDescription = '';
    const elements: VisualElementIntent[] = [];

    // Map narrative beats to semantic templates deterministically
    switch (beat.type) {
      case 'hook':
        visualType = 'hero';
        visualDescription = 'Bold introductory statement grabbing the viewer’s attention.';
        elements.push({
          id: `elem_${index}_1`,
          role: 'primary',
          semanticType: 'text',
          description: beat.message,
          importance: 'high'
        });
        break;

      case 'setup':
        visualType = 'single_focus';
        visualDescription = 'Introduce the core concept visually with a single focused object.';
        elements.push({
          id: `elem_${index}_1`,
          role: 'primary',
          semanticType: 'object',
          description: 'A visual representation of the main topic.',
          importance: 'high'
        });
        elements.push({
          id: `elem_${index}_2`,
          role: 'supporting',
          semanticType: 'text',
          description: beat.message,
          importance: 'medium'
        });
        break;

      case 'problem':
        visualType = 'text_visual';
        visualDescription = 'Juxtapose the problem statement with a conceptual visual.';
        elements.push({
          id: `elem_${index}_1`,
          role: 'primary',
          semanticType: 'text',
          description: beat.message,
          importance: 'high'
        });
        elements.push({
          id: `elem_${index}_2`,
          role: 'secondary',
          semanticType: 'illustration',
          description: 'Illustration showing the conflict or difficulty.',
          importance: 'high'
        });
        break;

      case 'explanation':
        visualType = 'chart'; // Maps to chart_insight
        visualDescription = 'A chart or data visualization explaining the mechanism.';
        elements.push({
          id: `elem_${index}_1`,
          role: 'primary',
          semanticType: 'chart',
          description: 'Data trend visualization showing the explained concept.',
          importance: 'high'
        });
        elements.push({
          id: `elem_${index}_2`,
          role: 'supporting',
          semanticType: 'text',
          description: beat.message,
          importance: 'medium'
        });
        break;

      case 'comparison':
        visualType = 'comparison';
        visualDescription = 'Side-by-side comparison of two entities.';
        elements.push({
          id: `elem_${index}_1`,
          role: 'primary',
          semanticType: 'object',
          description: 'The first entity or approach.',
          importance: 'high'
        });
        elements.push({
          id: `elem_${index}_2`,
          role: 'secondary',
          semanticType: 'object',
          description: 'The second entity or approach.',
          importance: 'high'
        });
        elements.push({
          id: `elem_${index}_3`,
          role: 'label',
          semanticType: 'text',
          description: beat.message,
          importance: 'low'
        });
        break;

      case 'example':
      case 'evidence':
        // Let's use before/after for examples or evidence for diversity
        visualType = 'before_after';
        visualDescription = 'Demonstrate the practical effect.';
        elements.push({
          id: `elem_${index}_1`,
          role: 'primary',
          semanticType: 'image',
          description: 'The starting state.',
          importance: 'medium'
        });
        elements.push({
          id: `elem_${index}_2`,
          role: 'secondary',
          semanticType: 'image',
          description: 'The ending state.',
          importance: 'medium'
        });
        break;

      case 'reveal':
        visualType = 'kpi';
        visualDescription = 'A large number or key metric revealing the insight.';
        elements.push({
          id: `elem_${index}_1`,
          role: 'primary',
          semanticType: 'kpi',
          description: 'The shocking or important number.',
          importance: 'high'
        });
        elements.push({
          id: `elem_${index}_2`,
          role: 'supporting',
          semanticType: 'text',
          description: beat.message,
          importance: 'medium'
        });
        break;

      case 'conclusion':
      case 'cta':
        visualType = 'quote'; // Maps to full_screen_quote
        visualDescription = 'A strong, centralized final statement.';
        elements.push({
          id: `elem_${index}_1`,
          role: 'primary',
          semanticType: 'text',
          description: beat.message,
          importance: 'high'
        });
        break;

      default:
        visualType = 'single_focus';
        visualDescription = 'A standard focused scene.';
        elements.push({
          id: `elem_${index}_1`,
          role: 'primary',
          semanticType: 'text',
          description: beat.message,
          importance: 'high'
        });
        break;
    }

    const scene: VisualScenePlan = {
      id: `visual_scene_${beat.id}`,
      beatId: beat.id,
      purpose: beat.purpose,
      visualType,
      visualDescription,
      elements
    };

    // Add deterministic attention intent if it's a 'reveal' or 'problem'
    if (beat.type === 'reveal' || beat.type === 'problem') {
      scene.attention = [
        {
          id: `attention_${index}`,
          targetId: `elem_${index}_1`, // Highlight the primary element
          type: 'highlight',
          intensity: 1.0,
          priority: 10
        }
      ];
    }

    return scene;
  }
}
