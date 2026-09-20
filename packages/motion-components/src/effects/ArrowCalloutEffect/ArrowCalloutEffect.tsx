import React from 'react';
import { ArrowCalloutEffectProps } from './ArrowCalloutEffect.types';
import { interpolate, easeInOutCubic } from './ArrowCalloutEffect.utils';

export const ArrowCalloutEffect: React.FC<ArrowCalloutEffectProps> = ({
  fromX,
  fromY,
  toX,
  toY,
  color = '#ef4444',
  opacity = 1,
  strokeWidth = 4,
  headSize = 16,
  curvature = 0.2,
  durationInFrames = 30,
  delayInFrames = 0,
  animation = 'draw',
  style: lineStyle = 'straight',
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
    progress = easeInOutCubic(rawProgress);
  }

  // Animation Values
  let currentT = 1;
  let currentOpacity = opacity;

  if (animation === 'draw') {
    currentT = progress;
    currentOpacity = progress > 0 ? opacity : 0;
  } else if (animation === 'fade') {
    currentOpacity = interpolate(progress, [0, 1], [0, opacity]);
  } else if (animation === 'draw-fade') {
    currentT = progress;
    const fadeProgress = interpolate(progress, [0, 0.5], [0, 1], 'clamp');
    currentOpacity = fadeProgress * opacity;
  }

  if (currentFrame < delayInFrames) {
    return null;
  }

  // Geometry
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const p0 = { x: fromX, y: fromY };
  const p2 = { x: toX, y: toY };
  let p1 = { x: (fromX + toX) / 2, y: (fromY + toY) / 2 };

  if (lineStyle === 'curved' && curvature !== 0 && distance > 0) {
    // Calculate orthogonal offset for control point
    const nx = -dy / distance;
    const ny = dx / distance;
    p1 = {
      x: p1.x + nx * distance * curvature,
      y: p1.y + ny * distance * curvature,
    };
  }

  // Use De Casteljau's algorithm to compute the exact visible portion of the curve at `t`
  const t = Math.max(0.001, currentT); // Prevent division/atan errors exactly at 0

  const p0_1 = { x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t };
  const p1_2 = { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
  const pt = { x: p0_1.x + (p1_2.x - p0_1.x) * t, y: p0_1.y + (p1_2.y - p0_1.y) * t };

  const angleRad = Math.atan2(p1_2.y - p0_1.y, p1_2.x - p0_1.x);
  const angleDeg = angleRad * (180 / Math.PI);

  const pathData = `M ${p0.x},${p0.y} Q ${p0_1.x},${p0_1.y} ${pt.x},${pt.y}`;
  const arrowheadData = `M ${-headSize},${-headSize * 0.6} L 0,0 L ${-headSize},${headSize * 0.6}`;

  return (
    <div
      data-testid="arrow-callout-effect"
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 40,
        ...containerStyle,
      }}
    >
      <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={currentOpacity}
          data-testid="arrow-line-path"
        />
        
        {/* Only draw arrowhead if we have some progress so it doesn't look like a floating dot at frame 0 */}
        {progress > 0 && (
          <g transform={`translate(${pt.x}, ${pt.y}) rotate(${angleDeg})`}>
            <path
              d={arrowheadData}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={currentOpacity}
              data-testid="arrow-head-path"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
