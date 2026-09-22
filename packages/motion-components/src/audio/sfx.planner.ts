import { SceneJSON, SceneElementJSON } from '../scene/scene-json.types';
import { AudioTimeline } from '../generation/generation.types';

export class DeterministicSFXPlanner {
  /**
   * Scans the Visual Scenes and injects sound effects perfectly timed with the visual elements.
   * For this deterministic implementation, we add a "pop" sound when text appears.
   */
  public planSFX(sceneJsons: SceneJSON[], audioTimeline?: AudioTimeline): SceneJSON[] {
    
    // We modify the sceneJsons to include audio elements
    for (const scene of sceneJsons) {
      
      let sfxCounter = 1;
      const sfxElements: SceneElementJSON[] = [];

      for (const element of scene.elements) {
        // If it's a text element, we add a "pop" sound effect
        if (element.type === 'text') {
          sfxElements.push({
            id: `sfx_pop_${scene.id}_${sfxCounter++}`,
            type: 'media', // We treat audio as media in the SceneGraph
            role: 'supporting',
            description: 'Pop sound effect',
            content: {
              src: '/sfx/pop.mp3',
              mediaType: 'audio',
              volume: 0.5
            },
            timing: element.timing || { startFrame: 0, durationInFrames: 30 }
          });
        }
      }

      // Add a whoosh transition sound at the start of the scene if it's not the first one
      if (scene.transition && scene.transition.type !== 'none') {
        sfxElements.push({
          id: `sfx_whoosh_${scene.id}`,
          type: 'media',
          role: 'background',
          description: 'Transition whoosh',
          content: {
            src: '/sfx/whoosh.mp3',
            mediaType: 'audio',
            volume: 0.3
          },
          timing: { startFrame: 0, durationInFrames: 30 }
        });
      }

      scene.elements.push(...sfxElements);
    }

    return sceneJsons;
  }
}
