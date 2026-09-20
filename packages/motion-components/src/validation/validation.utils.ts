import { CompositionValidationResult } from './validation.types';

/**
 * Render Gate: Determines if the resolved composition is safe to hand off to the rendering engine.
 */
export function canRenderComposition(result: CompositionValidationResult): boolean {
  return result.valid && !result.hasErrors;
}
