import React from 'react';
import { CircleHighlightEffectProps } from './CircleHighlightEffect.types';
import { interpolate, easeOutCubic } from './CircleHighlightEffect.utils';

export const CircleHighlightEffect: React.FC<CircleHighlightEffectProps> = ({
  x,
  y,
  width,
  height,
  color = '#ef4444',
  opacity = 1,
  strokeWidth = 6,
  padding = 12,
  durationInFrames = 45,
  delayInFrames = 0,
  animation = 'draw',
  style: shapeStyle = 'hand-drawn',
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
    const fadeProgress = interpolate(progress, [0, 0.5], [0, 1], 'clamp');
    currentOpacity = fadeProgress * opacity;
  }

  if (currentFrame < delayInFrames) {
    return null;
  }

  const rx = width / 2 + padding;
  const ry = height / 2 + padding;
  
  // Total SVG dimensions to ensure no clipping
  const svgWidth = rx * 2 + strokeWidth * 3;
  const svgHeight = ry * 2 + strokeWidth * 3;

  // Center coordinate of the SVG box
  const cx = svgWidth / 2;
  const cy = svgHeight / 2;

  let shapeElement;

  if (shapeStyle === 'ellipse') {
    shapeElement = (
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray="100"
        strokeDashoffset={currentDashoffset}
        opacity={currentOpacity}
        data-testid="circle-highlight-ellipse"
      />
    );
  } else {
    // Hand-drawn deterministic path
    // We use the standard bezier approximation of an ellipse (kappa = 0.55228)
    // and apply subtle perturbations to make it look organic without breaking the shape.
    const k = 0.55228;
    const kx = rx * k;
    const ky = ry * k;

    // Start slightly high on the right side
    const p0x = cx + rx;
    const p0y = cy - ry * 0.1;

    // Bottom
    const p1x = cx;
    const p1y = cy + ry;

    // Left
    const p2x = cx - rx;
    const p2y = cy;

    // Top
    const p3x = cx;
    const p3y = cy - ry;

    // End slightly low and slightly inside on the right side, creating a natural overlap
    const p4x = cx + rx * 0.95;
    const p4y = cy + ry * 0.15; 

    // Control points based on kappa with slight randomness-free offsets
    const c1x = cx + rx;
    const c1y = cy + ky * 0.9;
    const c2x = cx + kx * 1.1;
    const c2y = cy + ry;

    const c3x = cx - kx * 0.9;
    const c3y = cy + ry;
    const c4x = cx - rx;
    const c4y = cy + ky * 1.1;

    const c5x = cx - rx;
    const c5y = cy - ky * 0.9;
    const c6x = cx - kx * 1.1;
    const c6y = cy - ry;

    const c7x = cx + kx * 0.9;
    const c7y = cy - ry;
    const c8x = cx + rx * 1.05;
    const c8y = cy - ky * 0.5;

    const pathData = `M ${p0x},${p0y} C ${c1x},${c1y} ${c2x},${c2y} ${p1x},${p1y} C ${c3x},${c3y} ${c4x},${c4y} ${p2x},${p2y} C ${c5x},${c5y} ${c6x},${c6y} ${p3x},${p3y} C ${c7x},${c7y} ${c8x},${c8y} ${p4x},${p4y}`;

    shapeElement = (
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="100"
        strokeDasharray="100"
        strokeDashoffset={currentDashoffset}
        opacity={currentOpacity}
        data-testid="circle-highlight-path"
      />
    );
  }

  return (
    <div
      data-testid="circle-highlight-effect"
      className={className}
      style={{
        position: 'absolute',
        // (x, y) is the center, so we shift by half the SVG size to center it perfectly
        left: x - cx,
        top: y - cy,
        width: svgWidth,
        height: svgHeight,
        pointerEvents: 'none',
        zIndex: 40,
        ...containerStyle,
      }}
    >
      <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
        {shapeElement}
      </svg>
    </div>
  );
};
