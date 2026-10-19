import React, { useMemo } from 'react';
import { ResolvedSceneTransition } from '../../transitions/transitions.types';
import { transitionRegistry } from '../../transitions/transitions.registry';

// Basic clamp and interpolate for pure React compatibility without Remotion context
function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

function interpolate(val: number, inputRange: [number, number], outputRange: [number, number]) {
  const [inMin, inMax] = inputRange;
  const [outMin, outMax] = outputRange;
  
  if (inMin === inMax) return outMin;
  
  const percentage = (val - inMin) / (inMax - inMin);
  const clamped = clamp(percentage, 0, 1);
  return outMin + clamped * (outMax - outMin);
}

export interface SceneTransitionProps {
  transition: ResolvedSceneTransition;
  sceneA: React.ReactNode;
  sceneB: React.ReactNode;
  localFrame: number;
}

export const SceneTransition: React.FC<SceneTransitionProps> = ({
  transition,
  sceneA,
  sceneB,
  localFrame
}) => {
  const progress = useMemo(() => {
    if (transition.durationInFrames <= 0) {
      return localFrame >= 0 ? 1 : 0;
    }
    
    return interpolate(
      localFrame,
      [0, transition.durationInFrames],
      [0, 1]
    );
  }, [localFrame, transition.durationInFrames]);

  const implementation = transitionRegistry[transition.type] || transitionRegistry.cut;
  
  const { sceneAStyle, sceneBStyle } = useMemo(() => {
    return implementation(progress, transition);
  }, [implementation, progress, transition]);

  return (
    <div style={{ position: 'absolute', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Render Scene A behind or alongside Scene B */}
      <div style={{ position: 'absolute', width: '100%', height: '100%', ...sceneAStyle }}>
        {sceneA}
      </div>
      
      {/* Render Scene B */}
      <div style={{ position: 'absolute', width: '100%', height: '100%', ...sceneBStyle }}>
        {sceneB}
      </div>
    </div>
  );
};
