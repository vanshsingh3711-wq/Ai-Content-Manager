import React from 'react';
import { ResolvedSequence, ResolvedSequenceScene } from '../../sequence/sequence.types';
import { SceneTransition } from '../Transition/SceneTransition';
import { AttentionRenderer } from '../../attention/AttentionRenderer';
import { useCurrentFrame } from 'remotion';

export interface SequenceRendererProps {
  sequence: ResolvedSequence;
  renderScene: (scene: ResolvedSequenceScene, localFrame: number) => React.ReactNode;
  forceFrame?: number;
}

export const SequenceRenderer: React.FC<SequenceRendererProps> = ({ sequence, renderScene, forceFrame }) => {
  let frame = forceFrame || 0;

  // Try to use Remotion's frame if we are inside a Player/Composition
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const remotionFrame = useCurrentFrame();
    if (forceFrame === undefined) {
      frame = remotionFrame;
    }
  } catch (e) {
    // We are not inside a Remotion Composition, fallback to forceFrame
  }

  // Handle empty sequence
  if (!sequence || !sequence.scenes || sequence.scenes.length === 0) {
    return <div style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: '#000' }} />;
  }

  // 1. Find which scene(s) are active
  const activeScenes = sequence.scenes.filter(s => 
    frame >= s.globalStartFrame && frame < s.globalEndFrame
  );

  if (activeScenes.length === 0) {
    return null; // Output black/nothing if out of bounds
  }

  // 2. If only one scene is active, render it directly
  if (activeScenes.length === 1) {
    const active = activeScenes[0];
    const localFrame = frame - active.globalStartFrame;
    const sceneNode = renderScene(active, localFrame);
    
    return (
      <div style={{ position: 'absolute', width: '100%', height: '100%', overflow: 'hidden' }}>
        <AttentionRenderer 
          sequence={active.scene.attention} 
          localFrame={localFrame} 
          viewportWidth={active.scene.width} 
          viewportHeight={active.scene.height}
        >
          {sceneNode}
        </AttentionRenderer>
      </div>
    );
  }

  // 3. If two scenes are active, they are overlapping due to a transition
  // By convention, we only support transitioning between adjacent scenes (A -> B).
  if (activeScenes.length >= 2) {
    const sceneA = activeScenes[0];
    const sceneB = activeScenes[1];
    
    const localFrameA = frame - sceneA.globalStartFrame;
    const localFrameB = frame - sceneB.globalStartFrame;
    
    // The transition belongs to sceneB
    const transition = sceneB.transitionIn;
    
    if (!transition) {
      // Malformed sequence with overlap but no transition, fallback to cut
      const sceneNodeB = renderScene(sceneB, localFrameB);
      return (
        <div style={{ position: 'absolute', width: '100%', height: '100%', overflow: 'hidden' }}>
          <AttentionRenderer 
            sequence={sceneB.scene.attention} 
            localFrame={localFrameB} 
            viewportWidth={sceneB.scene.width} 
            viewportHeight={sceneB.scene.height}
          >
            {sceneNodeB}
          </AttentionRenderer>
        </div>
      );
    }
    
    // The transition local frame is simply the local frame of sceneB
    // because sceneB's globalStartFrame is exactly when the transition begins!
    const transitionLocalFrame = localFrameB;

    const sceneNodeA = renderScene(sceneA, localFrameA);
    const sceneNodeB = renderScene(sceneB, localFrameB);

    return (
      <SceneTransition 
        transition={transition}
        sceneA={
          <AttentionRenderer 
            sequence={sceneA.scene.attention} 
            localFrame={localFrameA} 
            viewportWidth={sceneA.scene.width} 
            viewportHeight={sceneA.scene.height}
          >
            {sceneNodeA}
          </AttentionRenderer>
        }
        sceneB={
          <AttentionRenderer 
            sequence={sceneB.scene.attention} 
            localFrame={localFrameB} 
            viewportWidth={sceneB.scene.width} 
            viewportHeight={sceneB.scene.height}
          >
            {sceneNodeB}
          </AttentionRenderer>
        }
        localFrame={transitionLocalFrame}
      />
    );
  }
  
  return null;
};
