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
        } else if (
          element.type === 'chart' ||
          element.type === 'kpi' ||
          element.type === 'diagram' ||
          element.type === 'illustration' ||
          element.type === 'object'
        ) {
          // Intelligent sound pairing for motion graphic templates
          const desc = `${element.description || ''} ${element.id || ''}`.toLowerCase();
          let soundSrc = '/sfx/pop.mp3';
          let soundDesc = 'Motion graphic accent';

          if (/candlestick|stock|crypto|trading/i.test(desc)) {
            soundSrc = '/sfx/riser.mp3';
            soundDesc = 'Candlestick HUD riser SFX';
          } else if (/compound|growth|curve/i.test(desc)) {
            soundSrc = '/sfx/whoosh.mp3';
            soundDesc = 'Compound growth whoosh SFX';
          } else if (/portfolio|donut/i.test(desc)) {
            soundSrc = '/sfx/pop.mp3';
            soundDesc = 'Portfolio donut pop SFX';
          } else if (/inflation|burn|cash/i.test(desc)) {
            soundSrc = '/sfx/whoosh.mp3';
            soundDesc = 'Inflation cash burn whoosh SFX';
          } else if (/bank|notification|transfer|wire/i.test(desc)) {
            soundSrc = '/sfx/chime.mp3';
            soundDesc = 'Banking notification chime SFX';
          } else if (/waterfall|budget/i.test(desc)) {
            soundSrc = '/sfx/pop.mp3';
            soundDesc = 'Budget waterfall drop SFX';
          } else if (/debt|payoff|stamp/i.test(desc)) {
            soundSrc = '/sfx/impact.mp3';
            soundDesc = 'Debt payoff stamp impact SFX';
          } else if (/scale|balance|roi/i.test(desc)) {
            soundSrc = '/sfx/pop.mp3';
            soundDesc = 'ROI balance clink SFX';
          } else if (/flywheel|wealth/i.test(desc)) {
            soundSrc = '/sfx/whoosh.mp3';
            soundDesc = 'Wealth flywheel rotation SFX';
          } else if (/battle|versus|duel/i.test(desc)) {
            soundSrc = '/sfx/impact.mp3';
            soundDesc = 'Battle chart clash impact SFX';
          }

          sfxElements.push({
            id: `sfx_mg_${scene.id}_${sfxCounter++}`,
            type: 'media',
            role: 'supporting',
            description: soundDesc,
            content: {
              src: soundSrc,
              mediaType: 'audio',
              volume: 0.6
            },
            timing: element.timing || { startFrame: 0, durationInFrames: 30 }
          });
        }
      }

      // Add a whoosh transition sound at the start of the scene if it's not the first one
      if (scene.transition && (scene.transition.type as string) !== 'none' && scene.transition.type !== 'cut') {
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
