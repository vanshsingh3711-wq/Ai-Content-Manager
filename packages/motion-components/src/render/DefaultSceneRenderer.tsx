import React from 'react';
import { ResolvedSequenceScene } from '../sequence/sequence.types';
import { Typography } from '../elements/Typography';
import { getAnchorOffset } from '../layout/layout.utils';

export const renderDefaultScene = (sceneData: ResolvedSequenceScene, localFrame: number) => {
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: sceneData.scene.theme?.colors?.background || '#0f172a', position: 'relative' }}>
      {sceneData.scene.elements.map((el) => {
        const offset = getAnchorOffset(el.geometry.width, el.geometry.height, el.anchor as any);
        
        return (
          <div
            key={el.id}
            style={{
              position: 'absolute',
              left: el.geometry.x + offset.x,
              top: el.geometry.y + offset.y,
              width: el.geometry.width,
              height: el.geometry.height,
              transformOrigin: 'center center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {el.type === 'text' && (
              <Typography
                element={el}
                tokens={sceneData.scene.tokens}
              />
            )}
            {/* Add Image, Video, etc here later */}
          </div>
        );
      })}
    </div>
  );
};
