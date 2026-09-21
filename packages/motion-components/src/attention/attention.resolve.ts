import { 
  AttentionInstruction, 
  ResolvedAttentionInstruction, 
  ResolvedAttentionSequence, 
  AttentionDiagnostic 
} from './attention.types';
import { ResolvedSceneGraph } from '../scene/scene.types';
import { getAnchorOffset } from '../layout/layout.utils';

export interface AttentionResolutionContext {
  mode?: 'exclusive' | 'additive';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function resolveAttentionInstructions(
  instructions: AttentionInstruction[],
  sceneGraph: ResolvedSceneGraph,
  context: AttentionResolutionContext = { mode: 'exclusive' }
): ResolvedAttentionSequence {
  const diagnostics: AttentionDiagnostic[] = [];
  const resolved: ResolvedAttentionInstruction[] = [];

  for (const instruction of instructions) {
    // 1. Gather Targets
    const targetIds = instruction.targetIds || (instruction.targetId ? [instruction.targetId] : []);
    
    if (targetIds.length === 0) {
      diagnostics.push({
        instructionId: instruction.id,
        severity: 'error',
        message: 'attention target missing: no targetId or targetIds provided'
      });
      continue;
    }

    // 2. Validate Targets against Scene Graph
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let foundValidTarget = false;

    for (const tid of targetIds) {
      const element = sceneGraph.elements.find(e => e.id === tid);
      if (!element) {
        diagnostics.push({
          instructionId: instruction.id,
          severity: 'warning',
          message: `Target element '${tid}' not found in scene graph. Skipping this target.`
        });
        continue;
      }

      foundValidTarget = true;
      const { x, y, width, height } = element.geometry;
      const offset = getAnchorOffset(width, height, element.anchor as any);
      
      const absX = x + offset.x;
      const absY = y + offset.y;
      
      if (absX < minX) minX = absX;
      if (absY < minY) minY = absY;
      if (absX + width > maxX) maxX = absX + width;
      if (absY + height > maxY) maxY = absY + height;
    }

    if (!foundValidTarget) {
      diagnostics.push({
        instructionId: instruction.id,
        severity: 'error',
        message: 'attention target missing: none of the specified targets exist in the scene.'
      });
      continue;
    }

    // 3. Resolve Timings
    const startFrame = instruction.startFrame ?? 0;
    // Default duration to remainder of scene if not specified
    const durationInFrames = instruction.durationInFrames ?? (sceneGraph.durationInFrames - startFrame);

    if (durationInFrames <= 0) {
      diagnostics.push({
        instructionId: instruction.id,
        severity: 'error',
        message: 'invalid timing: durationInFrames must be greater than 0'
      });
      continue;
    }

    // 4. Resolve Identity & Priority
    const intensity = clamp(instruction.intensity ?? 1, 0, 1);
    const priority = instruction.priority ?? 0;
    
    const combinedWidth = maxX - minX;
    const combinedHeight = maxY - minY;

    resolved.push({
      ...instruction,
      targetIds,
      intensity,
      priority,
      startFrame,
      durationInFrames,
      geometry: {
        x: minX,
        y: minY,
        width: combinedWidth,
        height: combinedHeight,
        centerX: minX + combinedWidth / 2,
        centerY: minY + combinedHeight / 2,
      }
    });
  }

  // 5. Handle Modes (Exclusive vs Additive)
  // In exclusive mode, if multiple effects overlap in time, only the highest priority effect should play.
  // We'll filter the resolved array if in exclusive mode.
  let finalResolved = [...resolved];

  if (context.mode === 'exclusive') {
    // For simplicity: If there's an overlap, keep the highest priority. 
    // This is a naive frame-by-frame simulation to find dominating instructions.
    const maxFrames = sceneGraph.durationInFrames;
    const activePerFrame = new Array(maxFrames).fill(null).map(() => [] as ResolvedAttentionInstruction[]);
    
    for (const res of resolved) {
      const end = Math.min(res.startFrame + res.durationInFrames, maxFrames);
      for (let f = res.startFrame; f < end; f++) {
        activePerFrame[f].push(res);
      }
    }

    const winningIds = new Set<string>();
    
    for (let f = 0; f < maxFrames; f++) {
      const active = activePerFrame[f];
      if (active.length > 0) {
        // Find highest priority
        let highest = active[0];
        for (let i = 1; i < active.length; i++) {
          if (active[i].priority > highest.priority) {
            highest = active[i];
          } else if (active[i].priority === highest.priority) {
            // deterministic tie-breaker: alphabetical by ID
            if (active[i].id.localeCompare(highest.id) > 0) {
              highest = active[i];
            }
          }
        }
        winningIds.add(highest.id);
      }
    }
    
    // Filter to only those that won at least one frame
    finalResolved = resolved.filter(r => winningIds.has(r.id));
  }

  return {
    instructions: finalResolved,
    diagnostics
  };
}
