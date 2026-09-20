import React from 'react';
import { ResolvedSceneElement } from '../../scene/scene.types';
import { DesignTokens } from '../../themes/tokens.types';
import { Typography } from '../Typography/Typography';

export interface CaptionMediaProps {
  element: ResolvedSceneElement;
  localFrame: number;
  tokens: DesignTokens;
}

export const CaptionMedia: React.FC<CaptionMediaProps> = ({ element, localFrame, tokens }) => {
  if (element.type !== 'caption' || !element.captionConfig) return null;

  const { captionConfig } = element;

  if (!captionConfig.enabled) return null;

  // Find the active cue
  const activeCue = captionConfig.cues.find(
    c => localFrame >= c.startFrame && localFrame < c.endFrame
  );

  if (!activeCue) return null;

  // Convert the active cue into a mock text element to pass to Typography
  // We need to inject textSegments for active word highlighting
  let textSegments = undefined;

  if (activeCue.words && activeCue.words.length > 0) {
    textSegments = activeCue.words.map(w => ({
      text: w.text,
      style: {
        emphasis: localFrame >= w.startFrame && localFrame < w.endFrame
      }
    }));
  }

  const mockTextElement: ResolvedSceneElement = {
    ...element,
    type: 'text',
    textContent: activeCue.text,
    textSegments: textSegments
  };

  // Note: the layout/measurement for 'caption' type elements in scene.resolve.ts
  // guarantees that the element geometry bounding box is large enough for the largest cue.
  // The alignment properties (top/center/bottom etc) in typography configuration
  // will natively align the generated text within this safe bounding box.

  return <Typography element={mockTextElement} tokens={tokens} />;
};
