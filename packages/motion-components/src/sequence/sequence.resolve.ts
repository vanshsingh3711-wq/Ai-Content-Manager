import { SequenceDefinition, ResolvedSequence, ResolvedSequenceScene } from './sequence.types';
import { SceneResolutionContext, resolveSceneGraph } from '../scene';
import { resolveTransition } from '../transitions/transitions.resolver';
import { CompositionDiagnostic } from '../validation/validation.types';

export function resolveSequence(
  sequence: SequenceDefinition,
  context: SceneResolutionContext
): ResolvedSequence {
  
  const resolvedScenes: ResolvedSequenceScene[] = [];
  const diagnostics: CompositionDiagnostic[] = [];
  
  let currentGlobalFrame = 0;

  for (let i = 0; i < sequence.scenes.length; i++) {
    const sceneDef = sequence.scenes[i];
    
    // Resolve the internal scene
    const resolvedScene = resolveSceneGraph(sceneDef, context);
    if (resolvedScene.diagnostics) {
      diagnostics.push(...resolvedScene.diagnostics);
    }

    let transitionIn = undefined;
    
    // If not the first scene, resolve transition and apply overlap math
    if (i > 0) {
      const { resolved, diagnostics: transitionDiagnostics } = resolveTransition(sceneDef.transitionIn);
      transitionIn = resolved;
      diagnostics.push(...transitionDiagnostics);
      
      // Calculate overlap:
      // If previous scene ends at global frame X, and transition takes Y frames,
      // the new scene starts at X - Y, so they overlap for Y frames.
      // But wait: if the new scene duration is smaller than transition duration, it's invalid.
      if (resolved.durationInFrames > resolvedScene.durationInFrames) {
        diagnostics.push({
          severity: 'warning',
          reason: 'invalid-duration', // Co-opt for now
          message: `Transition duration (${resolved.durationInFrames}) exceeds scene duration (${resolvedScene.durationInFrames}). Clamping.`
        } as any);
        resolved.durationInFrames = resolvedScene.durationInFrames;
      }
      
      const previousScene = resolvedScenes[i - 1];
      if (resolved.durationInFrames > previousScene.scene.durationInFrames) {
        diagnostics.push({
          severity: 'warning',
          reason: 'invalid-duration', // Co-opt for now
          message: `Transition duration (${resolved.durationInFrames}) exceeds previous scene duration (${previousScene.scene.durationInFrames}). Clamping.`
        } as any);
        resolved.durationInFrames = previousScene.scene.durationInFrames;
      }

      currentGlobalFrame -= resolved.durationInFrames;
    }

    const globalStartFrame = currentGlobalFrame;
    const globalEndFrame = globalStartFrame + resolvedScene.durationInFrames;
    
    resolvedScenes.push({
      id: sceneDef.id,
      scene: resolvedScene,
      globalStartFrame,
      globalEndFrame,
      transitionIn
    });

    currentGlobalFrame = globalEndFrame;
  }

  return {
    id: sequence.id,
    scenes: resolvedScenes,
    durationInFrames: currentGlobalFrame,
    fps: context.fps,
    width: context.canvas.width,
    height: context.canvas.height,
    diagnostics
  };
}
