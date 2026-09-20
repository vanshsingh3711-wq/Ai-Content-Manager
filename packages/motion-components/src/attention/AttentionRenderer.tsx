import React from 'react';
import { ResolvedAttentionSequence } from './attention.types';
import { HighlightEffect } from '../effects/HighlightEffect/HighlightEffect';
import { SpotlightEffect } from '../effects/SpotlightEffect/SpotlightEffect';
import { UnderlineEffect } from '../effects/UnderlineEffect/UnderlineEffect';
import { ZoomEffect } from '../effects/ZoomEffect/ZoomEffect';
import { ArrowCalloutEffect } from '../effects/ArrowCalloutEffect/ArrowCalloutEffect';
// import FocusEffect etc if needed, but the prompt asks to reuse existing primitives.
// Since some might not be exported from index yet, we import directly or assume they exist.

export interface AttentionRendererProps {
  sequence: ResolvedAttentionSequence;
  localFrame: number;
  viewportWidth?: number;
  viewportHeight?: number;
  children: React.ReactNode;
}

export const AttentionRenderer: React.FC<AttentionRendererProps> = ({
  sequence,
  localFrame,
  viewportWidth = 1080,
  viewportHeight = 1920,
  children
}) => {
  if (!sequence || !sequence.instructions) {
    return <>{children}</>;
  }

  const activeInstructions = sequence.instructions.filter(
    inst => localFrame >= inst.startFrame && localFrame <= inst.startFrame + inst.durationInFrames
  );

  let wrappedContent = <>{children}</>;
  const overlays: React.ReactNode[] = [];

  for (const inst of sequence.instructions) {
    const { type, geometry, intensity, startFrame, durationInFrames, id } = inst;
    const { x, y, width, height, centerX, centerY } = geometry;
    
    // Scale properties based on intensity (0-1) where applicable
    const opacity = intensity;
    
    // Calculate local frame relative to this instruction
    // Wait, the effects take `delayInFrames` as their starting point, or we can just pass `currentFrame={localFrame - startFrame}`
    // If the effect expects `currentFrame` to be global, and `delayInFrames` to be the start, we pass localFrame as currentFrame and startFrame as delayInFrames.
    const effectFrame = localFrame;
    const delayInFrames = startFrame;

    switch (type) {
      case 'highlight':
        overlays.push(
          <HighlightEffect
            key={id}
            x={x}
            y={y}
            width={width}
            height={height}
            opacity={opacity}
            durationInFrames={durationInFrames}
            delayInFrames={delayInFrames}
            currentFrame={effectFrame}
          />
        );
        break;

      case 'spotlight':
      case 'dimOthers':
        overlays.push(
          <SpotlightEffect
            key={id}
            x={centerX}
            y={centerY}
            radius={Math.max(width, height) / 2 + 20}
            overlayOpacity={opacity * 0.8} // Dim amount
            durationInFrames={durationInFrames}
            delayInFrames={delayInFrames}
            currentFrame={effectFrame}
          />
        );
        break;

      case 'underline':
        overlays.push(
          <UnderlineEffect
            key={id}
            x={x}
            y={y + height} // Place at bottom of bounds
            width={width}
            opacity={opacity}
            durationInFrames={durationInFrames}
            delayInFrames={delayInFrames}
            currentFrame={effectFrame}
            style="hand-drawn"
          />
        );
        break;

      case 'outline':
        overlays.push(
          <HighlightEffect
            key={id}
            animation="box"
            x={x - 10}
            y={y - 10}
            width={width + 20}
            height={height + 20}
            opacity={opacity}
            durationInFrames={durationInFrames}
            delayInFrames={delayInFrames}
            currentFrame={effectFrame}
          />
        );
        break;
        
      case 'callout':
        overlays.push(
          <ArrowCalloutEffect
            key={id}
            toX={centerX}
            toY={y} // Point to top of element
            fromX={centerX - 150}
            fromY={y - 150} // Origin offsets
            opacity={opacity}
            durationInFrames={durationInFrames}
            delayInFrames={delayInFrames}
            currentFrame={effectFrame}
          />
        );
        break;

      case 'zoom':
        // Zoom wraps the content
        wrappedContent = (
          <ZoomEffect
            key={id}
            centerX={centerX}
            centerY={centerY}
            viewportWidth={viewportWidth}
            viewportHeight={viewportHeight}
            mode="in-out"
            toScale={1 + (0.5 * intensity)} // Scale based on intensity
            durationInFrames={durationInFrames}
            delayInFrames={delayInFrames}
            currentFrame={effectFrame}
          >
            {wrappedContent}
          </ZoomEffect>
        );
        break;

      case 'pulse':
        // Wrap content in a subtle scale transform
        // Pulse isn't a dedicated storytelling effect yet, so we map it to a subtle ZoomInOut or manual transform.
        wrappedContent = (
          <ZoomEffect
            key={id}
            mode="in-out"
            centerX={centerX}
            centerY={centerY}
            viewportWidth={viewportWidth}
            viewportHeight={viewportHeight}
            toScale={1 + (0.1 * intensity)} // Very subtle scale for pulse
            durationInFrames={durationInFrames}
            delayInFrames={delayInFrames}
            currentFrame={effectFrame}
          >
            {wrappedContent}
          </ZoomEffect>
        );
        break;

      case 'focus':
        // A generic focus might be a subtle glow + outline
        overlays.push(
          <HighlightEffect
            key={`${id}-glow`}
            animation="glow"
            x={x}
            y={y}
            width={width}
            height={height}
            opacity={opacity * 0.5}
            durationInFrames={durationInFrames}
            delayInFrames={delayInFrames}
            currentFrame={effectFrame}
          />
        );
        break;
    }
  }

  return (
    <>
      {wrappedContent}
      {overlays}
    </>
  );
};
