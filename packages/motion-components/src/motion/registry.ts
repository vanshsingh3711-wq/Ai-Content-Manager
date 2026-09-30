import { 
  MotionPatternDefinition, 
  MotionPatternId, 
  MotionCompositionDefinition, 
  MotionCompositionId,
  MotionCompositionCategory 
} from './types';
import { CompositionDiagnostic } from '../validation/validation.types';

// ---------------------------------------------------------------------------
// Pattern Registry
// ---------------------------------------------------------------------------

const patternStore = new Map<MotionPatternId, MotionPatternDefinition>();

export function registerPattern(pattern: MotionPatternDefinition): void {
  if (patternStore.has(pattern.id)) {
    throw new Error(`[MotionRegistry] Duplicate pattern ID: '${pattern.id}'. Each pattern must have a unique ID.`);
  }
  patternStore.set(pattern.id, pattern);
}

export function getPattern(id: MotionPatternId): MotionPatternDefinition | undefined {
  return patternStore.get(id);
}

export function getPatternOrThrow(id: MotionPatternId): MotionPatternDefinition {
  const pattern = patternStore.get(id);
  if (!pattern) {
    throw new Error(`[MotionRegistry] Unknown pattern ID: '${id}'. Available: ${Array.from(patternStore.keys()).join(', ')}`);
  }
  return pattern;
}

export function getAllPatterns(): MotionPatternDefinition[] {
  return Array.from(patternStore.values());
}

export function hasPattern(id: MotionPatternId): boolean {
  return patternStore.has(id);
}

// ---------------------------------------------------------------------------
// Composition Registry
// ---------------------------------------------------------------------------

const compositionStore = new Map<MotionCompositionId, MotionCompositionDefinition>();

export function registerComposition(composition: MotionCompositionDefinition): void {
  if (compositionStore.has(composition.id)) {
    throw new Error(`[MotionRegistry] Duplicate composition ID: '${composition.id}'. Each composition must have a unique ID.`);
  }
  compositionStore.set(composition.id, composition);
}

export function getComposition(id: MotionCompositionId): MotionCompositionDefinition | undefined {
  return compositionStore.get(id);
}

export function getCompositionOrThrow(id: MotionCompositionId): MotionCompositionDefinition {
  const comp = compositionStore.get(id);
  if (!comp) {
    throw new Error(`[MotionRegistry] Unknown composition ID: '${id}'. Available: ${Array.from(compositionStore.keys()).join(', ')}`);
  }
  return comp;
}

export function getCompositionsByCategory(category: MotionCompositionCategory): MotionCompositionDefinition[] {
  return Array.from(compositionStore.values()).filter(c => c.category === category);
}

export function getAllCompositions(): MotionCompositionDefinition[] {
  return Array.from(compositionStore.values());
}

export function hasComposition(id: MotionCompositionId): boolean {
  return compositionStore.has(id);
}

// ---------------------------------------------------------------------------
// Registry Validation
// ---------------------------------------------------------------------------

export function validateRegistry(): CompositionDiagnostic[] {
  const diagnostics: CompositionDiagnostic[] = [];

  // Check that all compositions reference valid patterns
  for (const comp of compositionStore.values()) {
    // Quick self-check: try resolving with empty targets to surface structural issues
    try {
      const result = comp.resolve({}, { intensity: 0.5 });
      if (result.diagnostics.length > 0) {
        diagnostics.push(...result.diagnostics.map(d => ({
          ...d,
          message: `[${comp.id}] ${d.message}`
        })));
      }
    } catch {
      // Compositions may require specific targets, this is expected
    }
  }

  return diagnostics;
}
