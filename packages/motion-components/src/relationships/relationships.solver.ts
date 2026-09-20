import { ResolvedPlacement } from '../placement/placement.types';
import { getAnchorOffset } from '../layout/layout.utils';
import { BoundingBox } from '../layout/layout.types';
import { 
  CompositionRelationship, 
  RelationshipDiagnostic, 
  RelationshipResolutionResult 
} from './relationships.types';
import { calculateRelationshipGeometry } from './relationships.math';

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

export function resolveRelationships(
  initialPlacements: ResolvedPlacement[],
  relationships: CompositionRelationship[]
): RelationshipResolutionResult {
  
  const diagnostics: RelationshipDiagnostic[] = [];
  const placementMap = new Map<string, ResolvedPlacement>(
    initialPlacements.map(p => [p.id, { ...p }]) // deep copy to mutate
  );
  
  // 1. Build Adjacency List for Topological Sort (Source -> depends on -> Target)
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  
  // Initialize nodes
  for (const p of initialPlacements) {
    adjacency.set(p.id, []);
    inDegree.set(p.id, 0);
  }

  // Populate edges
  for (const rel of relationships) {
    if (!placementMap.has(rel.sourceId)) {
      diagnostics.push({
        severity: 'warning',
        reason: 'missing-source',
        message: `Relationship source ${rel.sourceId} not found in placements.`,
        elements: [rel.sourceId]
      });
      continue;
    }
    if (!placementMap.has(rel.targetId)) {
      diagnostics.push({
        severity: 'warning',
        reason: 'unresolved-target',
        message: `Relationship target ${rel.targetId} not found in placements.`,
        elements: [rel.targetId]
      });
      continue;
    }

    // Edge: Target -> Source (because Source must be resolved AFTER Target)
    adjacency.get(rel.targetId)!.push(rel.sourceId);
    inDegree.set(rel.sourceId, inDegree.get(rel.sourceId)! + 1);
  }

  // 2. Topological Sort (Kahn's Algorithm)
  const queue: string[] = [];
  for (const [node, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(node);
    }
  }

  const resolvedOrder: string[] = [];
  
  while (queue.length > 0) {
    // To ensure determinism when multiple nodes have 0 in-degree, sort alphabetically
    queue.sort(); 
    const current = queue.shift()!;
    resolvedOrder.push(current);

    for (const neighbor of adjacency.get(current)!) {
      inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  // 3. Cycle Detection
  if (resolvedOrder.length !== placementMap.size) {
    // Find nodes with in-degree > 0
    const cyclicNodes = Array.from(inDegree.entries())
      .filter(([_, degree]) => degree > 0)
      .map(([node, _]) => node);

    diagnostics.push({
      severity: 'error',
      reason: 'circular-dependency',
      message: `Circular relationship detected involving: ${cyclicNodes.join(', ')}`,
      elements: cyclicNodes
    });
    
    // We append cyclic nodes to the end just to process them with whatever stale data they have
    for (const node of cyclicNodes) {
      resolvedOrder.push(node);
    }
  }

  // 4. Evaluate Geometries Deterministically
  // Because resolvedOrder ensures Targets are processed before Sources, 
  // when we evaluate a Source, its Target has already been fully positioned.
  
  // We need to map which relationships apply to which source
  const relationshipsBySource = new Map<string, CompositionRelationship[]>();
  for (const rel of relationships) {
    if (!relationshipsBySource.has(rel.sourceId)) {
      relationshipsBySource.set(rel.sourceId, []);
    }
    relationshipsBySource.get(rel.sourceId)!.push(rel);
  }

  for (const elementId of resolvedOrder) {
    const activeRels = relationshipsBySource.get(elementId);
    if (!activeRels) continue;

    const sourcePlacement = placementMap.get(elementId)!;

    for (const rel of activeRels) {
      // In cases of cycles, target might not be fully accurate, but we resolve safely anyway
      const targetPlacement = placementMap.get(rel.targetId)!;
      
      const sourceOriginalBounds = getAbsoluteBounds(sourcePlacement);
      const targetBounds = getAbsoluteBounds(targetPlacement);

      const newGeom = calculateRelationshipGeometry(
        { ...sourceOriginalBounds, anchor: sourcePlacement.anchor },
        targetBounds,
        rel.relation,
        rel.gap
      );

      // Mutate the placement in our active map so downstream dependents see the new position
      sourcePlacement.x = newGeom.x;
      sourcePlacement.y = newGeom.y;
      sourcePlacement.anchor = newGeom.anchor;
    }
  }

  return {
    placements: Array.from(placementMap.values()),
    diagnostics,
    resolvedOrder
  };
}
