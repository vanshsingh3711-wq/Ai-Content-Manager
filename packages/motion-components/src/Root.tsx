import React from 'react';
import { Composition, registerRoot, getInputProps } from 'remotion';
import { RiveCharacter } from './character/RiveCharacter';
import { SvgCharacter } from './character/SvgCharacter';
import { SequenceRenderer } from './elements/Sequence/SequenceRenderer';
import { ResolvedSequence } from './sequence/sequence.types';
import { RenderErrorBoundary } from './render/RenderErrorBoundary';
import { renderDefaultScene } from './render/DefaultSceneRenderer';
import { MotionGraphicsPreview } from './elements/Typography/MotionGraphicsPreview';

export const RemotionRoot: React.FC = () => {
  const inputProps = getInputProps();
  const sequence = inputProps.sequence as ResolvedSequence | undefined;
  
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
        id="MotionGraphicsPreview"
        component={MotionGraphicsPreview}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          text: 'Default Text'
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
      
      <Composition
        id="EditorComposition"
        component={EditorCompositionWrapper}
        durationInFrames={sequence?.durationInFrames || 300}
        fps={sequence?.fps || 30}
        width={sequence?.width || 1080}
        height={sequence?.height || 1920}
        defaultProps={{
          sequence
        }}
      />
    </>
  );
};

const EditorCompositionWrapper: React.FC<{ sequence?: ResolvedSequence }> = ({ sequence }) => {
  if (!sequence) {
    return <div style={{ backgroundColor: 'red', color: 'white', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Sequence Provided in Props</div>;
  }
  
  return (
    <RenderErrorBoundary>
      <SequenceRenderer 
        sequence={sequence}
        renderScene={renderDefaultScene}
      />
    </RenderErrorBoundary>
  );
};

registerRoot(RemotionRoot);
