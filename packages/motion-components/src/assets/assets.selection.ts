import { AssetRequest, AssetSelectionResult, AssetDiagnostic, AssetDefinition } from './assets.types';
import { getAsset, getAllAssets } from './assets.registry';

/**
 * Deterministically evaluates an AssetRequest against the global registry and returns the optimal match.
 */
export function selectAsset(request: AssetRequest, manualAssetId?: string): AssetSelectionResult {
  const diagnostics: AssetDiagnostic[] = [];
  const excludeSet = new Set(request.excludeIds || []);
  const count = request.count && request.count > 0 ? request.count : 1;

  // 1. Manual Editor Override Priority
  if (manualAssetId) {
    const manualAsset = getAsset(manualAssetId);
    if (manualAsset) {
      return { asset: manualAsset, matches: [manualAsset], diagnostics };
    }
    diagnostics.push({
      reason: 'manual-override-failed',
      message: `Manual asset ID '${manualAssetId}' not found in registry.`
    });
  }

  // 2. Exact Requested ID Match
  if (request.id) {
    if (excludeSet.has(request.id)) {
      diagnostics.push({ reason: 'excluded', message: `Requested exact ID '${request.id}' is explicitly excluded.` });
    } else {
      const exactAsset = getAsset(request.id);
      if (exactAsset) {
        return { asset: exactAsset, matches: [exactAsset], diagnostics };
      }
      diagnostics.push({ reason: 'exact-id-not-found', message: `Exact ID '${request.id}' not found in registry.` });
    }
  }

  // 3. Preferred IDs Pipeline
  if (request.preferredIds && request.preferredIds.length > 0) {
    for (const prefId of request.preferredIds) {
      if (!excludeSet.has(prefId)) {
        const prefAsset = getAsset(prefId);
        if (prefAsset) {
          // In a multiple count scenario, if preferred IDs are given, we might just return the first one as primary. 
          // For simplicity, we'll return immediately if a preferred ID hits.
          return { asset: prefAsset, matches: [prefAsset], diagnostics };
        }
      }
    }
  }

  // 4. Algorithmic Search
  const allAssets = getAllAssets();
  const candidates: Array<{ asset: AssetDefinition; score: number }> = [];

  for (const asset of allAssets) {
    if (excludeSet.has(asset.id)) continue;

    // Hard Requirement: Capabilities
    let missingCapability = false;
    if (request.capabilities && request.capabilities.length > 0) {
      const assetCaps = new Set(asset.capabilities || []);
      for (const cap of request.capabilities) {
        if (!assetCaps.has(cap)) {
          missingCapability = true;
          break;
        }
      }
    }
    if (missingCapability) continue; // Must satisfy ALL requested capabilities

    // Hard Requirement: Type (with fallback awareness)
    let isTypeMatch = true;
    if (request.type && asset.type !== request.type) {
      isTypeMatch = false;
    }

    // Soft Scoring
    let score = asset.priority || 0;
    
    // Massive score boost for matching type explicitly. If it doesn't match type, it is a fallback candidate.
    if (isTypeMatch) {
      score += 1000;
    }

    const intersectCount = (requested?: string[], available?: string[]) => {
      if (!requested || !available) return 0;
      const set = new Set(available);
      return requested.filter(i => set.has(i)).length;
    };

    score += intersectCount(request.categories, asset.categories);
    score += intersectCount(request.tags, asset.tags);
    score += intersectCount(request.styles, asset.styles);

    candidates.push({ asset, score });
  }

  // 5. Deterministic Tie-Breaker Sort
  candidates.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score; // Highest score first
    }
    // Stable ID fallback
    return a.asset.id.localeCompare(b.asset.id);
  });

  if (candidates.length === 0) {
    diagnostics.push({ reason: 'no-match', message: 'No assets found matching the hard capabilities and constraints.' });
    return { diagnostics };
  }

  // Determine if we used a fallback (the highest scored asset didn't match the requested type)
  const topAsset = candidates[0].asset;
  if (request.type && topAsset.type !== request.type) {
    diagnostics.push({ reason: 'fallback-used', message: `Requested type '${request.type}' not available, fell back to '${topAsset.type}'.` });
  }

  // 6. Return top N results
  const matches = candidates.slice(0, count).map(c => c.asset);
  return {
    asset: matches[0],
    matches,
    diagnostics
  };
}
