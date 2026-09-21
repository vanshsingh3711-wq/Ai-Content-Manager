import { StoryPlan, StoryBeatPlan, StoryBeatType } from '../story/story.types';
import { VisualPlan, VisualScenePlan, VisualElementIntent } from '../visual/visual.types';
import { SceneJSON, SceneJsonPresenterInteraction } from '../scene/scene-json.types';
import { PresenterAction } from '../character/presenter.types';
import { PresenterActionIntent } from './choreography.types';

export class DeterministicChoreographyPlanner {
  
  // Track last action to avoid repetitive choreography
  private lastAction: PresenterAction = 'idle';

  /**
   * Applies choreography to a sequence of scenes deterministically.
   * Modifies and returns the updated SceneJSON array.
   */
  public applyChoreography(
    scenes: SceneJSON[], 
    storyPlan: StoryPlan, 
    visualPlan: VisualPlan
  ): SceneJSON[] {
    const updatedScenes: SceneJSON[] = [];
    
    // Reset state for new run to ensure determinism
    this.lastAction = 'idle';

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const visualScene = visualPlan.scenes.find(vs => vs.beatId === scene.beatId);
      const beat = storyPlan.beats.find(b => b.id === scene.beatId);

      if (!visualScene || !beat) {
        updatedScenes.push(scene); // skip if missing metadata
        continue;
      }

      const updatedScene = this.choreographScene(scene, beat, visualScene);
      updatedScenes.push(updatedScene);
    }

    return updatedScenes;
  }

  private choreographScene(scene: SceneJSON, beat: StoryBeatPlan, visualScene: VisualScenePlan): SceneJSON {
    const updatedScene = { ...scene };
    
    // 1. Explicit Override Check
    // If scene already has manual interactions defined, respect them and skip automated choreography.
    if (updatedScene.interactions && updatedScene.interactions.length > 0) {
      // Record the last action from override to inform future repetition avoidance
      this.lastAction = updatedScene.interactions[updatedScene.interactions.length - 1].action;
      return updatedScene;
    }

    // 2. Visibility Check
    // e.g. Full screen visuals might hide the presenter
    const visible = this.determineVisibility(visualScene);
    if (!visible) {
      return updatedScene;
    }

    // 3. Action and Expression Selection
    let { action, expression } = this.selectBaseActionAndExpression(beat);

    // 4. Target Selection
    let targetId: string | undefined = undefined;
    
    // Target inference based on semantic intent
    const chart = visualScene.elements.find(e => e.semanticType === 'chart');
    const kpi = visualScene.elements.find(e => e.semanticType === 'kpi');
    const comparison = visualScene.elements.find(e => e.semanticType === 'object' && e.role === 'primary'); // proxy for comparison/object

    if (kpi) {
      action = 'emphasize';
      targetId = kpi.id;
    } else if (chart) {
      action = 'pointRight'; // Will auto-correct to pointLeft in adapter if needed
      targetId = chart.id;
    } else if (comparison) {
      action = 'present';
      targetId = comparison.id;
    }

    // 5. Repetition Avoidance
    if (this.lastAction === action) {
      action = this.rotateAction(action);
    }

    this.lastAction = action;

    // 6. Add Presenter Element if not exists
    const presenterId = 'main-presenter';
    if (!updatedScene.elements.find(e => e.id === presenterId)) {
      updatedScene.elements = [
        ...updatedScene.elements,
        {
          id: presenterId,
          type: 'presenter',
          role: 'primary'
        }
      ];
    }

    // 7. Inject Interaction
    const interaction: SceneJsonPresenterInteraction = {
      presenterId,
      action,
      targetId,
      startFrame: 0,
      durationInFrames: updatedScene.durationInFrames || 60,
    };
    
    if (expression) {
      interaction.metadata = { expression };
    }

    updatedScene.interactions = [interaction];

    return updatedScene;
  }

  private determineVisibility(visualScene: VisualScenePlan): boolean {
    if (visualScene.visualType === 'hero' || visualScene.visualType === 'quote') {
      return false; // hide presenter on pure full screen texts
    }
    return true;
  }

  private selectBaseActionAndExpression(beat: StoryBeatPlan): { action: PresenterAction, expression: string } {
    let action: PresenterAction = 'talk';
    let expression = 'neutral';

    switch (beat.type) {
      case 'hook':
        action = 'talk';
        expression = 'happy';
        break;
      case 'setup':
        action = 'talk';
        expression = 'neutral';
        break;
      case 'problem':
        action = 'talk';
        expression = 'thinking';
        break;
      case 'explanation':
        action = 'present';
        expression = 'neutral';
        break;
      case 'evidence':
        action = 'pointRight';
        expression = 'neutral';
        break;
      case 'example':
        action = 'pointRight';
        expression = 'neutral';
        break;
      case 'comparison':
        action = 'present';
        expression = 'neutral';
        break;
      case 'reveal':
        action = 'emphasize';
        expression = 'surprised';
        break;
      case 'conclusion':
        action = 'emphasize';
        expression = 'happy';
        break;
      case 'cta':
        action = 'wave';
        expression = 'happy';
        break;
    }

    return { action, expression };
  }

  private rotateAction(action: PresenterAction): PresenterAction {
    if (action === 'talk') return 'present';
    if (action === 'pointRight' || action === 'pointLeft') return 'present';
    if (action === 'present') return 'talk';
    if (action === 'emphasize') return 'talk';
    return 'talk';
  }
}
