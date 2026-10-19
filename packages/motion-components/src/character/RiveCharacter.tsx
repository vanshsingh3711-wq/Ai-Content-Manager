import React, { useState } from 'react';
import { useRive } from '@rive-app/react-canvas';
import { AbsoluteFill, delayRender, continueRender, staticFile } from 'remotion';

export interface RiveCharacterProps {
  width?: number;
  height?: number;
  state?: 'idle' | 'talking';
  isTalking?: boolean;
  isBlinking?: boolean;
  isNodding?: boolean;
  expression?: string;
  gesture?: string;
  pointerRotation?: number;
}

export const RiveCharacter: React.FC<RiveCharacterProps> = ({ 
  width = 1000, 
  height = 1000, 
  state = 'idle',
  isTalking = false,
  isBlinking = false,
  isNodding = false,
  expression = 'neutral',
  gesture = 'none',
  pointerRotation = 0
}) => {
  const [handle] = useState(() => delayRender("Loading Rive Character"));
  
  const { rive, RiveComponent } = useRive({
    src: staticFile('28195-53259-character-builder.riv'),
    autoplay: true,
    onLoad: () => {
      continueRender(handle);
    }
  });

  // If you know the state machine input names, you can trigger them here:
  // const triggerInput = useStateMachineInput(rive, "State Machine 1", "ActionTrigger");
  // useEffect(() => { if (triggerInput) triggerInput.fire(); }, [action, triggerInput]);

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
      <div style={{ width, height }}>
        <RiveComponent />
      </div>
      {isBlinking && <div style={{position: 'absolute', top: 0, right: 0}}>Blinking</div>}
      {isNodding && <div style={{position: 'absolute', top: 20, right: 0}}>Nodding</div>}
      <div style={{position: 'absolute', bottom: 0, right: 0}}>Exp: {expression}</div>
      <div style={{position: 'absolute', bottom: 20, right: 0}}>Gesture: {gesture}</div>
    </AbsoluteFill>
  );
};
