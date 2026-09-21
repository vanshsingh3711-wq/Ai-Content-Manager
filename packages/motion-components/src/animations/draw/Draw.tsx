import React, { useId } from 'react';
import { DrawProps } from './Draw.types';
import { interpolate, getEasingFunction } from '../utils/math';

export const Draw: React.FC<DrawProps> = ({
  mode = 'path',
  direction = 'forward',
  from = 0,
  to = 1,
  delayInFrames = 0,
  durationInFrames = 30,
  easing = 'easeInOut',
  hand = {
    wobble: 0.1,
    speedVariation: 0.1,
    strokeVariation: 0.1,
  },
  currentFrame,
  children,
  style = {},
  testId = 'draw-animation-wrapper',
}) => {
  const ease = getEasingFunction(easing);
  const endFrame = delayInFrames + durationInFrames;

  let progress = 0;

  if (currentFrame >= delayInFrames) {
    if (currentFrame >= endFrame) {
      progress = 1;
    } else {
      let rawProgress = interpolate(currentFrame, [delayInFrames, endFrame], [0, 1], 'clamp');
      
      // Inject deterministic speed variation for hand mode
      if (mode === 'hand' && hand.speedVariation && hand.speedVariation > 0) {
        // Use a sine wave to create a stop-and-go pacing effect.
        // We use Math.max/min to ensure it never goes backwards or exceeds bounds.
        const speedWobble = Math.sin(rawProgress * Math.PI * 4) * (hand.speedVariation * 0.1);
        rawProgress = Math.max(0, Math.min(1, rawProgress + speedWobble));
      }
      
      progress = ease(rawProgress);
    }
  }

  // Calculate actual reveal percentage based on from/to
  let revealPercentage = interpolate(progress, [0, 1], [from, to], 'clamp');

  // Handle direction
  // dashoffset 1 = completely hidden, 0 = completely revealed
  // forward: we want to draw it ONTO the screen, so dashoffset goes 1 -> 0
  // reverse: we want to erase it, so dashoffset goes 0 -> 1
  let strokeDashoffset = direction === 'forward' ? 1 - revealPercentage : revealPercentage;

  // A unique ID for the hand-draw SVG filter so it doesn't collide if there are multiple
  const filterId = useId() + '-hand-draw-filter';

  // Recursive function to inject pathLength and stroke dash properties into SVG children
  const injectDrawProps = (node: React.ReactNode): React.ReactNode => {
    if (!React.isValidElement(node)) return node;

    const isShape = ['path', 'line', 'circle', 'rect', 'polyline', 'polygon'].includes(
      typeof node.type === 'string' ? node.type : ''
    );

    let newProps: any = { ...(node.props as any) };

    if (isShape) {
      newProps = {
        ...newProps,
        pathLength: 1,
        strokeDasharray: '1 1',
        strokeDashoffset,
      };
    }

    if (newProps.children) {
      newProps.children = React.Children.map(newProps.children, injectDrawProps);
    }

    return React.cloneElement(node, newProps);
  };

  const styledChildren = React.Children.map(children, injectDrawProps);

  const wobbleScale = (hand.wobble || 0.1) * 20;

  return (
    <div
      data-testid={testId}
      style={{
        ...style,
        ...(mode === 'hand' ? { filter: `url(#${filterId})` } : {}),
      }}
    >
      {mode === 'hand' && (
        <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
          <defs>
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              {/* Fractal noise creates the deterministic wobble base */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.05"
                numOctaves="3"
                result="noise"
                seed="1" // Deterministic seed
              />
              {/* Displacement maps the noise to the graphic, creating organic wobble and stroke width variation */}
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={wobbleScale}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}
      {styledChildren}
    </div>
  );
};
