import { ResolvedPlacement, PlacementDiagnostic } from '../placement/placement.types';
import { RelationshipDiagnostic } from '../relationships/relationships.types';
import { SafeZoneDiagnostic } from '../layout/layout.safezone';

export type CompositionSeverity = 'error' | 'warning' | 'info';

export interface CompositionDiagnostic {
  type: string;
  severity: CompositionSeverity;
  elementIds?: string[];
  message: string;
  details?: Record<string, unknown>;
}

export interface CompositionRepair {
  type: string;
  elementId: string;
  before: { x: number; y: number; width: number; height: number };
  after: { x: number; y: number; width: number; height: number };
  reason: string;
}

export interface CompositionValidationConfig {
  autoRepair?: boolean;
  repairOverflow?: boolean;
  allowClamping?: boolean;
}

export interface CompositionValidationResult {
  valid: boolean; // false if severity === 'error' exists
  hasErrors: boolean;
  hasWarnings: boolean;
  placements: ResolvedPlacement[];
  diagnostics: CompositionDiagnostic[];
  repairs: CompositionRepair[];
}

// Union of all upstream diagnostic types for aggregation
export type UpstreamDiagnostic = PlacementDiagnostic | RelationshipDiagnostic | SafeZoneDiagnostic | CompositionDiagnostic;
