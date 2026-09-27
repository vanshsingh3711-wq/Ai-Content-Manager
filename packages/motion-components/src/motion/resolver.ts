import { MotionIntent, ResolvedMotionComposition } from './types';
import { getCompositionOrThrow } from './registry';
import { SceneDefinition } from '../scene/scene.types';
import { CompositionDiagnostic } from '../validation/validation.types';

export interface MotionResolutionResult {
  scene: SceneDefinition;
  diagnostics: CompositionDiagnostic[];
}

/**
 * Applies a set of semantic MotionIntents to a SceneDefinition.
 * 
 * This bridges the gap between high-level AI requests and the
 * low-level deterministic Remotion graph.
 * 
 * 1. Looks up the requested composition.
 * 2. Resolves it into layers (keyframe tracks + attention).
 * 3. Injects the keyframe tracks into the specific SceneElements.
 * 4. Pushes attention instructions to the Scene level.
 */
export function resolveMotionIntents(
  scene: SceneDefinition,
  intents: MotionIntent[]
): MotionResolutionResult {
  // Deep clone to avoid mutating the original
  const updatedScene: SceneDefinition = JSON.parse(JSON.stringify(scene));
  const diagnostics: CompositionDiagnostic[] = [];

  // Ensure attention array exists
  if (!updatedScene.attention) {
    updatedScene.attention = [];
  }

  for (const intent of intents) {
    try {
      const composition = getCompositionOrThrow(intent.type);
      
      // Resolve the composition into tracks and attention
      const resolved: ResolvedMotionComposition = composition.resolve(
        intent.targets,
        {
          intensity: intent.intensity,
          energy: intent.energy === 'high' ? 1.0 : intent.energy === 'low' ? 0.3 : 0.6,
          personality: intent.personality,
          durationInFrames: intent.durationInFrames,
        }
      );

      // Collect any diagnostics from the composition itself
      diagnostics.push(...resolved.diagnostics);

      // Apply the resolved layers to the scene elements
      for (const layer of resolved.layers) {
        const element = updatedScene.elements.find(e => e.id === layer.targetElementId);
        
        if (!element) {
          diagnostics.push({
            type: 'missing_target',
            severity: 'warning',
            message: `Motion intent target '${layer.targetElementId}' (role: ${layer.role}) not found in scene.`,
            elementIds: [layer.targetElementId]
          });
          continue;
        }

        // Initialize keyframes array if missing
        if (!element.keyframes) {
          element.keyframes = [];
        }

        // Shift keyframes by the intent's requested startFrame
        const startFrameShift = intent.startFrame || 0;
        const shiftedTracks = layer.keyframeTracks.map(track => ({
          ...track,
          keyframes: track.keyframes.map(kf => ({
            ...kf,
            frame: kf.frame + startFrameShift
          }))
        }));

        // Inject the shifted keyframe tracks
        element.keyframes.push(...shiftedTracks);

        // Inject attention instruction if present
        if (layer.attention) {
          updatedScene.attention!.push({
            ...layer.attention,
            startFrame: (layer.attention.startFrame || 0) + startFrameShift
          });
        }
      }
    } catch (err: any) {
      diagnostics.push({
        type: 'resolution_error',
        severity: 'error',
        message: `Failed to resolve motion intent '${intent.type}': ${err.message}`
      });
    }
  }

  return {
    scene: updatedScene,
    diagnostics
  };
}
