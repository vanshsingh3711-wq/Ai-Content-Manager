import { AnchorPoint, LayoutElement, SafeZoneDefinition } from '../layout/layout.types';

export interface PlacementRequest {
  assetId: string; // The resolved asset ID from Asset Selection
  anchor?: AnchorPoint;
  position?: { x?: number; y?: number };
  size?: { width?: number; height?: number; scale?: number };
  alignment?: { horizontal?: 'start' | 'center' | 'end'; vertical?: 'start' | 'center' | 'end' };
  containerId?: string;
  positionMode?: 'absolute' | 'auto';
  margin?: number;
  preferredZoneId?: string;
  
  // High-level relations
  relativeTo?: string;
  relation?: 'above' | 'below' | 'left' | 'right' | 'center' | 'inside';
  gap?: number;
}

export interface PlacementDiagnostic {
  severity: 'info' | 'warning' | 'error';
  reason: 'missing-intrinsic-size' | 'invalid-anchor' | 'unresolved-relative-target' | 'restricted-overlap' | 'collision';
  message: string;
}

export interface ResolvedPlacement extends LayoutElement {
  assetId: string;
  diagnostics?: PlacementDiagnostic[];
}
