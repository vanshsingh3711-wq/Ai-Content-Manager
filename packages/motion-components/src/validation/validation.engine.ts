import { ResolvedPlacement } from '../placement/placement.types';
import { SafeZoneDefinition, BoundingBox } from '../layout/layout.types';
import { getAnchorOffset } from '../layout/layout.utils';
import { checkSafeZoneOverlap, resolveSafeZoneBounds } from '../layout/layout.safezone';
import { autoRepairComposition } from './validation.repair';
import { 
  CompositionDiagnostic, 
  CompositionValidationConfig, 
  CompositionValidationResult, 
  UpstreamDiagnostic 
} from './validation.types';

function getAbsoluteBounds(element: ResolvedPlacement): BoundingBox {
  const offset = getAnchorOffset(element.width, element.height, element.anchor);
  return {
    id: element.id,
    x: element.x + offset.x,
    y: element.y + offset.y,
    width: element.width,
    height: element.height
  };
}

export function validateComposition(
  placements: ResolvedPlacement[],
  canvas: { width: number; height: number },
  config?: CompositionValidationConfig,
  upstreamDiagnostics: UpstreamDiagnostic[] = [],
  safeZones: SafeZoneDefinition[] = []
): CompositionValidationResult {
  
  let currentPlacements = placements.map(p => ({ ...p }));
  let repairs: any[] = [];
  
  // 1. Auto-Repair Pass
  if (config?.autoRepair) {
    const repairResult = autoRepairComposition(currentPlacements, canvas, config);
    currentPlacements = repairResult.placements;
    repairs = repairResult.repairs;
  }

  const diagnostics: CompositionDiagnostic[] = [];

  // Map upstream diagnostics
  for (const ud of upstreamDiagnostics) {
    let elements: string[] = [];
    if ('elementId' in ud && typeof ud.elementId === 'string') elements = [ud.elementId];
    if ('elements' in ud && Array.isArray(ud.elements)) elements = ud.elements;
    
    // We map severity natively, except SafeZoneDiagnostic which doesn't have severity out-of-the-box
    let severity: 'error' | 'warning' | 'info' = 'warning';
    if ('severity' in ud) {
      severity = ud.severity;
    } else if (ud.reason === 'restricted-zone-overlap' || ud.reason === 'no-valid-position') {
      severity = 'error';
    }

    // Default message fallback if missing
    let message = 'Validation issue found';
    if ('message' in ud && typeof ud.message === 'string') {
      message = ud.message;
    } else if ((ud as any).reason === 'restricted-zone-overlap') {
      message = `Element restricted safe zone overlap: ${(ud as any).zoneId}`;
    }

    diagnostics.push({
      type: (ud as any).type || (ud as any).reason || 'upstream-diagnostic',
      severity,
      message,
      elementIds: elements
    });
  }

  // 2. ID Validation
  const idCounts = new Map<string, number>();
  for (const p of currentPlacements) {
    if (!p.id || p.id.trim() === '') {
      diagnostics.push({ type: 'missing-id', severity: 'error', message: 'Element has no ID' });
      continue;
    }
    idCounts.set(p.id, (idCounts.get(p.id) || 0) + 1);
  }

  for (const [id, count] of idCounts.entries()) {
    if (count > 1) {
      diagnostics.push({ 
        type: 'duplicate-id', 
        severity: 'error', 
        message: `Duplicate ID found: ${id}`,
        elementIds: [id]
      });
    }
  }

  // 3. Geometry & Overflow Validation
  for (const p of currentPlacements) {
    if (isNaN(p.x) || isNaN(p.y) || isNaN(p.width) || isNaN(p.height)) {
      diagnostics.push({
        type: 'invalid-geometry',
        severity: 'error',
        message: `Element ${p.id} has NaN geometry.`,
        elementIds: [p.id]
      });
      continue;
    }

    if (p.width < 0 || p.height < 0) {
      diagnostics.push({
        type: 'negative-dimension',
        severity: 'error',
        message: `Element ${p.id} has negative dimensions.`,
        elementIds: [p.id]
      });
      continue;
    }
    
    // Note: We allow zero width/height, some assets (like dividers) might technically be zero depending on implementation, but warning is better.
    if (p.width === 0 || p.height === 0) {
      diagnostics.push({
        type: 'zero-dimension',
        severity: 'warning',
        message: `Element ${p.id} has a zero dimension.`,
        elementIds: [p.id]
      });
    }

    const bounds = getAbsoluteBounds(p);
    
    // Canvas Overflow
    const overflows: string[] = [];
    let overflowAmt = 0;
    
    if (bounds.x < 0) { overflows.push('left'); overflowAmt += Math.abs(bounds.x); }
    if (bounds.y < 0) { overflows.push('top'); overflowAmt += Math.abs(bounds.y); }
    if (bounds.x + bounds.width > canvas.width) { overflows.push('right'); overflowAmt += (bounds.x + bounds.width - canvas.width); }
    if (bounds.y + bounds.height > canvas.height) { overflows.push('bottom'); overflowAmt += (bounds.y + bounds.height - canvas.height); }

    if (overflows.length > 0) {
      diagnostics.push({
        type: `overflow-${overflows.join('-')}`,
        severity: 'warning',
        message: `Element ${p.id} overflows canvas bounds.`,
        elementIds: [p.id],
        details: { overflowAmount: overflowAmt }
      });
    }
  }

  // 4. Collision Detection
  // Naive O(N^2) for small layouts is fine, typical video scenes have < 50 items.
  for (let i = 0; i < currentPlacements.length; i++) {
    for (let j = i + 1; j < currentPlacements.length; j++) {
      const a = getAbsoluteBounds(currentPlacements[i]);
      const b = getAbsoluteBounds(currentPlacements[j]);

      const intersectX = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
      const intersectY = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));

      if (intersectX > 0 && intersectY > 0) {
        diagnostics.push({
          type: 'collision',
          severity: 'warning',
          message: `Elements ${a.id} and ${b.id} overlap.`,
          elementIds: [a.id, b.id]
        });
      }
    }
  }

  // 5. Safe Zones Validation
  for (const p of currentPlacements) {
    const bounds = getAbsoluteBounds(p);
    for (const zone of safeZones) {
      const zoneBounds = resolveSafeZoneBounds(zone, canvas.width, canvas.height);
      const overlap = checkSafeZoneOverlap(bounds, zoneBounds);

      if (zone.type === 'restricted' && overlap.intersecting) {
        diagnostics.push({
          type: 'restricted-zone-overlap',
          severity: 'error',
          message: `Element ${p.id} overlaps restricted safe zone ${zone.id}`,
          elementIds: [p.id]
        });
      }
    }
  }
  
  // Aggregate repairs as Info diagnostics to keep track
  for (const r of repairs) {
    diagnostics.push({
      type: 'auto-repair-applied',
      severity: 'info',
      message: `Repair applied to ${r.elementId}: ${r.reason}`,
      elementIds: [r.elementId],
      details: { repairType: r.type }
    });
  }

  const hasErrors = diagnostics.some(d => d.severity === 'error');
  const hasWarnings = diagnostics.some(d => d.severity === 'warning');

  return {
    valid: !hasErrors,
    hasErrors,
    hasWarnings,
    placements: currentPlacements,
    diagnostics,
    repairs
  };
}
