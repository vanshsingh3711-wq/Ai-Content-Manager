import React, { useEffect } from 'react';
import { useRive } from '@rive-app/react-canvas';
import { AbsoluteFill } from 'remotion';

export interface RiveCharacterProps {
  action?: string;
}

export const RiveCharacter: React.FC<RiveCharacterProps> = ({ action = 'idle' }) => {
  const { rive, RiveComponent } = useRive({
    src: '/28195-53259-character-builder.riv',
    autoplay: true,
    // stateMachines: "State Machine 1" // You can enable this once the state machine name is known
  });

  // If you know the state machine input names, you can trigger them here:
  // const triggerInput = useStateMachineInput(rive, "State Machine 1", "ActionTrigger");
  // useEffect(() => { if (triggerInput) triggerInput.fire(); }, [action, triggerInput]);

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
      <div style={{ width: 1000, height: 1000 }}>
        <RiveComponent />
      </div>
    </AbsoluteFill>
  );
};
