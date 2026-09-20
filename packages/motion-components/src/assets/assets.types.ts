export interface AssetDefinition {
  id: string;
  type: string;
  component?: unknown;
  categories?: string[];
  tags?: string[];
  capabilities?: string[];
  styles?: string[];
  priority?: number; // Base registry priority for tie-breaking
  intrinsicSize?: { width: number; height: number }; // Optional base dimensions
}

export interface AssetRequest {
  id?: string;
  type?: string;
  categories?: string[];
  tags?: string[];
  capabilities?: string[];
  styles?: string[];
  preferredIds?: string[];
  excludeIds?: string[];
  count?: number; // Number of unique assets to return, defaults to 1
}

export interface AssetDiagnostic {
  reason: 'no-match' | 'missing-capability' | 'fallback-used' | 'exact-id-not-found' | 'excluded' | 'manual-override-failed';
  message: string;
}

export interface AssetSelectionResult {
  asset?: AssetDefinition; 
  matches?: AssetDefinition[]; // Populated if multiple assets matched
  diagnostics?: AssetDiagnostic[];
}
