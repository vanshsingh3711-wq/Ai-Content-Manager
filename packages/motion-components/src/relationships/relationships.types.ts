import { ResolvedPlacement } from '../placement/placement.types';

export type CompositionRelation = 
  | 'above' | 'below' | 'left' | 'right' | 'center' | 'inside'
  | 'align-left' | 'align-right' | 'align-top' | 'align-bottom' 
  | 'center-horizontal' | 'center-vertical';

export interface CompositionRelationship {
  sourceId: string;
  targetId: string;
  relation: CompositionRelation;
  gap?: number;
  strength?: 'required' | 'preferred'; // Defaults to required
}

export interface RelationshipDiagnostic {
  severity: 'info' | 'warning' | 'error';
  reason: 'circular-dependency' | 'unresolved-target' | 'missing-source' | 'impossible-constraint';
  message: string;
  elements: string[];
}

export interface RelationshipResolutionResult {
  placements: ResolvedPlacement[];
  diagnostics: RelationshipDiagnostic[];
  resolvedOrder: string[]; // Output the order of resolution for debugging
}
