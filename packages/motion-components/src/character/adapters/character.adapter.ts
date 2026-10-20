import { PresenterInstruction, ResolvedPresenterInstruction, CharacterCapabilities } from '../presenter.types';
import { CompositionDiagnostic } from '../../validation/validation.types';
import { SceneResolutionContext } from '../../scene/scene.types';

export interface CharacterAdapter {
  getCapabilities(): CharacterCapabilities;
  validate(instruction: PresenterInstruction): CompositionDiagnostic[];
  resolveAction(
    instruction: PresenterInstruction,
    context: SceneResolutionContext,
    targetGeometry?: { x: number; y: number; width: number; height: number },
    presenterGeometry?: { x: number; y: number; width: number; height: number }
  ): ResolvedPresenterInstruction;
}

// Simple registry for adapters
const adapters = new Map<string, CharacterAdapter>();

export const registerCharacterAdapter = (assetId: string, adapter: CharacterAdapter) => {
  adapters.set(assetId, adapter);
};

export const getCharacterAdapter = (assetId: string): CharacterAdapter | undefined => {
  return adapters.get(assetId);
};
