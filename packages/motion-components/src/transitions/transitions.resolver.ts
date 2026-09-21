import { SceneTransition, ResolvedSceneTransition, TransitionDiagnostic } from './transitions.types';
import { transitionRegistry } from './transitions.registry';

export function resolveTransition(
  transition?: SceneTransition
): { resolved: ResolvedSceneTransition; diagnostics: TransitionDiagnostic[] } {
  const diagnostics: TransitionDiagnostic[] = [];
  
  if (!transition) {
    return {
      resolved: { type: 'cut', durationInFrames: 0 },
      diagnostics
    };
  }

  const resolved: ResolvedSceneTransition = {
    type: transition.type,
    durationInFrames: transition.durationInFrames ?? 15,
    direction: transition.direction,
    intensity: transition.intensity
  };

  // Validate type
  if (!transitionRegistry[resolved.type]) {
    diagnostics.push({
      type: 'invalid-transition',
      severity: 'error',
      reason: 'unknown-transition-type',
      message: `Unknown transition type: ${resolved.type}. Falling back to cut.`
    });
    resolved.type = 'cut';
    resolved.durationInFrames = 0;
  }

  // Validate duration
  if (resolved.durationInFrames < 0) {
    diagnostics.push({
      type: 'invalid-transition',
      severity: 'warning',
      reason: 'invalid-duration',
      message: `Negative transition duration: ${resolved.durationInFrames}. Clamping to 0.`
    });
    resolved.durationInFrames = 0;
  }
  
  // Cut overrides duration
  if (resolved.type === 'cut' && resolved.durationInFrames > 0) {
    resolved.durationInFrames = 0;
  }

  // Validate directional types
  const directionalTypes = ['slide', 'push', 'wipe', 'zoom'];
  if (directionalTypes.includes(resolved.type) && !resolved.direction) {
    resolved.direction = resolved.type === 'zoom' ? 'in' : 'left'; // default directions
  }

  return { resolved, diagnostics };
}
