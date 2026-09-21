import { CharacterAdapter } from './character.adapter';
import { PresenterInstruction, ResolvedPresenterInstruction, CharacterCapabilities, PresenterAction } from '../presenter.types';
import { CompositionDiagnostic } from '../../validation/validation.types';
import { SceneResolutionContext } from '../../scene/scene.types';

const RIVE_SUPPORTED_ACTIONS: PresenterAction[] = [
  "idle",
  "talk",
  "blink",
  "smile",
  "surprised",
  "pointLeft",
  "pointRight",
  "pointUp",
  "pointDown",
  "present",
  "emphasize",
  "wave",
  "nod",
  "lookAt"
];

export class RiveCharacterAdapter implements CharacterAdapter {
  getCapabilities(): CharacterCapabilities {
    return {
      supportedActions: RIVE_SUPPORTED_ACTIONS,
      supportsIntensity: true, // Rive can handle blended states via number inputs
      supportsTargets: false // Current asset does not support look-at IK constraints
    };
  }

  validate(instruction: PresenterInstruction): CompositionDiagnostic[] {
    const diagnostics: CompositionDiagnostic[] = [];
    
    if (!RIVE_SUPPORTED_ACTIONS.includes(instruction.action)) {
      diagnostics.push({
        type: 'UNSUPPORTED_PRESENTER_ACTION',
        severity: 'warning',
        elementIds: [instruction.presenterId],
        message: `Rive character does not support action: ${instruction.action}. Falling back to idle.`,
        details: { action: instruction.action, supported: RIVE_SUPPORTED_ACTIONS }
      });
    }
    
    if (instruction.targetId && !this.getCapabilities().supportsTargets) {
      diagnostics.push({
        type: 'UNSUPPORTED_PRESENTER_TARGET',
        severity: 'info',
        elementIds: [instruction.presenterId, instruction.targetId],
        message: `Rive character does not support targeting. The targetId will be ignored.`,
      });
    }

    if (instruction.durationInFrames <= 0) {
      diagnostics.push({
        type: 'INVALID_PRESENTER_DURATION',
        severity: 'error',
        elementIds: [instruction.presenterId],
        message: 'Presenter duration must be greater than 0.'
      });
    }

    return diagnostics;
  }

  resolveAction(
    instruction: PresenterInstruction,
    context: SceneResolutionContext,
    targetGeometry?: { x: number; y: number; width: number; height: number },
    presenterGeometry?: { x: number; y: number; width: number; height: number }
  ): ResolvedPresenterInstruction {
    
    // Auto-repair fallback logic
    let resolvedAction = RIVE_SUPPORTED_ACTIONS.includes(instruction.action) 
      ? instruction.action 
      : 'idle';

    // Target-aware directional gesture validation/override
    if (
      ['pointLeft', 'pointRight', 'pointUp', 'pointDown'].includes(resolvedAction) &&
      targetGeometry &&
      presenterGeometry
    ) {
      const pX = presenterGeometry.x + presenterGeometry.width / 2;
      const pY = presenterGeometry.y + presenterGeometry.height / 2;
      const tX = targetGeometry.x + targetGeometry.width / 2;
      const tY = targetGeometry.y + targetGeometry.height / 2;

      const dx = tX - pX;
      const dy = tY - pY;
      
      // Determine dominant direction (x vs y)
      if (Math.abs(dx) > Math.abs(dy)) {
        resolvedAction = dx > 0 ? 'pointRight' : 'pointLeft';
      } else {
        resolvedAction = dy > 0 ? 'pointDown' : 'pointUp';
      }
    }

    return {
      ...instruction,
      action: resolvedAction,
      resolvedTargetGeometry: targetGeometry
    };
  }
}
