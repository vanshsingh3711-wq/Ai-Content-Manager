import { CharacterAdapter } from './character.adapter';
import { PresenterInstruction, ResolvedPresenterInstruction, CharacterCapabilities, PresenterAction } from '../presenter.types';
import { CompositionDiagnostic } from '../../validation/validation.types';
import { SceneResolutionContext } from '../../scene/scene.types';

const SVG_SUPPORTED_ACTIONS: PresenterAction[] = [
  "idle",
  "talk",
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

export class SvgCharacterAdapter implements CharacterAdapter {
  getCapabilities(): CharacterCapabilities {
    return {
      supportedActions: SVG_SUPPORTED_ACTIONS,
      supportsIntensity: false,
      supportsTargets: true // SVG arms can be procedurally rotated towards targets
    };
  }

  validate(instruction: PresenterInstruction): CompositionDiagnostic[] {
    const diagnostics: CompositionDiagnostic[] = [];
    
    if (!SVG_SUPPORTED_ACTIONS.includes(instruction.action)) {
      diagnostics.push({
        type: 'UNSUPPORTED_PRESENTER_ACTION',
        severity: 'warning',
        elementIds: [instruction.presenterId],
        message: `SVG character does not support action: ${instruction.action}. Falling back to idle.`,
        details: { action: instruction.action, supported: SVG_SUPPORTED_ACTIONS }
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
    let resolvedAction = SVG_SUPPORTED_ACTIONS.includes(instruction.action) 
      ? instruction.action 
      : 'idle';

    if (resolvedAction === 'lookAt') {
      // SVG adapter does not support lookAt independently, fallback to idle deterministically
      resolvedAction = 'idle';
    }

    // Target-aware directional gesture validation/override
    if (
      (resolvedAction === 'pointRight' || resolvedAction === 'pointLeft' || resolvedAction === 'pointUp' || resolvedAction === 'pointDown') 
      && targetGeometry 
      && presenterGeometry
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
