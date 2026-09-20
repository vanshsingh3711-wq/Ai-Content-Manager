import React from 'react';
import { UnderlineEffectProps } from './UnderlineEffect.types';
import { interpolate, easeOutCubic } from './UnderlineEffect.utils';

export const UnderlineEffect: React.FC<UnderlineEffectProps> = ({
  x,
  y,
  width,
  height = 12,
  color = '#ef4444',
  opacity = 1,
  strokeWidth = 6,
  borderRadius = 0,
  durationInFrames = 30,
  delayInFrames = 0,
  animation = 'draw',
  style: lineStyle = 'solid',
  currentFrame = 0,
  className = '',
  containerStyle = {},
}) => {
  const endFrame = delayInFrames + durationInFrames;

  let progress = 0;
  if (currentFrame >= endFrame) {
    progress = 1;
  } else if (currentFrame > delayInFrames) {
    const rawProgress = interpolate(currentFrame, [delayInFrames, endFrame], [0, 1], 'clamp');
    progress = easeOutCubic(rawProgress);
  }

  // Animation Values
  let currentDashoffset = 0;
  let currentOpacity = opacity;

  if (animation === 'draw') {
    currentDashoffset = interpolate(progress, [0, 1], [100, 0]);
    currentOpacity = progress > 0 ? opacity : 0;
  } else if (animation === 'fade') {
    currentOpacity = interpolate(progress, [0, 1], [0, opacity]);
  } else if (animation === 'draw-fade') {
    currentDashoffset = interpolate(progress, [0, 1], [100, 0]);
    // Fade in over the first 50% of the draw
    const fadeProgress = interpolate(progress, [0, 0.5], [0, 1], 'clamp');
    currentOpacity = fadeProgress * opacity;
  }

  if (currentFrame < delayInFrames) {
    return null;
  }

  const effectiveStrokeWidth = lineStyle === 'marker' ? strokeWidth * 1.5 : strokeWidth;
  const strokeLinecap = lineStyle === 'marker' ? 'square' : 'round';
  const blendMode = lineStyle === 'marker' ? 'multiply' : 'normal';
  const fill = 'none';

  // Y bounding box expansion so strokes don't get cut off
  const svgHeight = height + effectiveStrokeWidth * 2;
  const svgYOffset = svgHeight / 2;

  let pathData = '';
  if (lineStyle === 'solid' || lineStyle === 'marker') {
    pathData = `M 0,${svgYOffset} L ${width},${svgYOffset}`;
  } else if (lineStyle === 'hand-drawn') {
    // Deterministic organic curve
    const c1x = width * 0.3;
    const c1y = svgYOffset + height * 0.8;
    const c2x = width * 0.7;
    const c2y = svgYOffset - height * 0.2;
    pathData = `M 0,${svgYOffset} C ${c1x},${c1y} ${c2x},${c2y} ${width},${svgYOffset}`;
  }

  return (
    <div
      data-testid="underline-effect"
      className={className}
      style={{
        position: 'absolute',
        left: x,
        // Shift up by half the svg height so that y points to the exact center of the stroke visually
        top: y - svgYOffset,
        width,
        height: svgHeight,
        pointerEvents: 'none',
        zIndex: 40,
        mixBlendMode: blendMode as any,
        ...containerStyle,
      }}
    >
      <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
        <path
          d={pathData}
          stroke={color}
          strokeWidth={effectiveStrokeWidth}
          strokeLinecap={strokeLinecap}
          fill={fill}
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset={currentDashoffset}
          opacity={currentOpacity}
          rx={borderRadius}
          data-testid="underline-path"
        />
      </svg>
    </div>
  );
};
