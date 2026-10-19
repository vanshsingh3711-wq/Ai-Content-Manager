import React from 'react';
import { useCurrentFrame } from 'remotion';
import { ResolvedSceneElement } from '../scene/scene.types';
import { RiveCharacter } from './RiveCharacter';
import { SvgCharacter } from './SvgCharacter';
import { ResolvedPresenterInstruction } from './presenter.types';

interface PresenterRendererProps {
  element: ResolvedSceneElement;
}

export const PresenterRenderer: React.FC<PresenterRendererProps> = ({ element }) => {
  const frame = useCurrentFrame();

  if (element.type !== 'presenter' || !element.presenterTimeline || element.presenterTimeline.length === 0) {
    return null; // Not a presenter element
  }

  // Calculate local frame relative to this element's start
  const localFrame = frame - element.timing.startFrame;

  // Find all active instructions for the current frame, preserving original index for tie-breaking
  const activeInstructions = element.presenterTimeline
    .map((inst, index) => ({ ...inst, originalIndex: index }))
    .filter(
      (inst) => localFrame >= inst.startFrame && localFrame < inst.startFrame + inst.durationInFrames
    )
    .sort((a, b) => {
      // Deterministic conflict resolution:
      // 1. Later start frame takes precedence (interrupts earlier actions)
      // 2. If same start frame, later in declaration array takes precedence
      if (a.startFrame !== b.startFrame) return a.startFrame - b.startFrame;
      return a.originalIndex - b.originalIndex;
    });

  // Precedence rules for state resolution
  let isTalking = false;
  let isBlinking = false;
  let isNodding = false;
  let expression = 'neutral';
  let gesture = 'none';
  let pointerRotation = 0;
  
  // Use the first instruction's characterAssetId as the definitive one for the element
  const characterAssetId = element.presenterTimeline[0].characterAssetId;

  // Resolve state combinations
  for (const inst of activeInstructions) {
    if (inst.action === 'talk') isTalking = true;
    if (inst.action === 'blink') isBlinking = true;
    
    // Last instruction in array with an expression overrides previous expressions
    if (inst.expression) expression = inst.expression;

    if (inst.action === 'nod') isNodding = true;

    if (['pointLeft', 'pointRight', 'pointUp', 'pointDown', 'present', 'emphasize', 'wave'].includes(inst.action)) {
      gesture = inst.action;

      if ((inst.action === 'pointRight' || inst.action === 'pointLeft' || inst.action === 'pointUp' || inst.action === 'pointDown') && inst.resolvedTargetGeometry) {
        const presenterCenter = {
          x: element.geometry.x + element.geometry.width / 2,
          y: element.geometry.y + element.geometry.height / 2,
        };
        const targetCenter = {
          x: inst.resolvedTargetGeometry.x + inst.resolvedTargetGeometry.width / 2,
          y: inst.resolvedTargetGeometry.y + inst.resolvedTargetGeometry.height / 2,
        };

        const dy = targetCenter.y - presenterCenter.y;
        const dx = targetCenter.x - presenterCenter.x;
        pointerRotation = Math.atan2(dy, dx) * (180 / Math.PI);
      }
    }
  }

  // Derive the legacy action state for adapters that need a single string
  let primaryAction = 'idle';
  if (gesture !== 'none') primaryAction = gesture;
  if (isTalking) primaryAction = 'talk';

  // Render the appropriate underlying component based on the asset ID
  if (characterAssetId === 'rive-presenter') {
    return (
      <RiveCharacter
        width={element.geometry.width}
        height={element.geometry.height}
        state={primaryAction as 'idle' | 'talking'}
        isTalking={isTalking}
        isBlinking={isBlinking}
        isNodding={isNodding}
        expression={expression}
        gesture={gesture}
      />
    );
  }

  if (characterAssetId === 'svg-presenter') {
    return (
      <SvgCharacter
        width={element.geometry.width}
        height={element.geometry.height}
        state={primaryAction as 'idle' | 'talking'}
        isTalking={isTalking}
        isBlinking={isBlinking}
        isNodding={isNodding}
        expression={expression}
        gesture={gesture}
        pointerRotation={pointerRotation}
      />
    );
  }

  // Fallback for unknown character asset
  return (
    <div
      style={{
        width: element.geometry.width,
        height: element.geometry.height,
        backgroundColor: '#ff0000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff'
      }}
    >
      Unsupported Character Asset
    </div>
  );
};
