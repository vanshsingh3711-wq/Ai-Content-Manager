import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { RiveCharacter } from './character/RiveCharacter';
import { SvgCharacter } from './character/SvgCharacter';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="RiveCharacterPreview"
        component={RiveCharacter}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          action: 'surprised'
        }}
      />
      
      <Composition
        id="SvgCharacterPreview"
        component={SvgCharacter}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          isTalking: true
        }}
      />
    </>
  );
};

registerRoot(RemotionRoot);
