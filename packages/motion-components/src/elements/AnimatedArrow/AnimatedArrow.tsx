import React, { useMemo } from 'react';
import { AnimatedArrowProps } from './AnimatedArrow.types';
import { interpolate } from './AnimatedArrow.utils';

export const AnimatedArrow: React.FC<AnimatedArrowProps> = ({
  size = 200,
  thickness = 4,
  curvature = 0,
  rotation = 0,
  color = '#ffffff',
  headSize = 15,
  animation = {},
  currentFrame = 0,
  fps = 30, // Default for API consistency
}) => {
  const {
    type = 'draw',
    durationInFrames = 30,
    delayInFrames = 0,
  } = animation;

  // Progress
  let progress = 1;
  let opacity = 1;

  if (type === 'draw') {
    progress = interpolate(currentFrame, [delayInFrames, delayInFrames + durationInFrames], [0, 1]);
  } else if (type === 'fade') {
    opacity = interpolate(currentFrame, [delayInFrames, delayInFrames + durationInFrames], [0, 1]);
  }

  // Curve points
  const startX = 0;
  const startY = 0;
  const endX = size;
  const endY = 0;
  
  const cpX = size / 2;
  const cpY = curvature;

  const pathD = `M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`;
  
  // Approximate path length for stroke dash animation
  const straightLength = size;
  const pathLength = curvature === 0 ? straightLength : straightLength + (Math.abs(curvature) * 1.5); 

  // Calculate exact position and tangent for the arrowhead on the quadratic bezier
  const t = progress;
  const currentX = Math.pow(1 - t, 2) * startX + 2 * (1 - t) * t * cpX + Math.pow(t, 2) * endX;
  const currentY = Math.pow(1 - t, 2) * startY + 2 * (1 - t) * t * cpY + Math.pow(t, 2) * endY;

  const dx = 2 * (1 - t) * (cpX - startX) + 2 * t * (endX - cpX);
  const dy = 2 * (1 - t) * (cpY - startY) + 2 * t * (endY - cpY);
  
  const currentAngleRad = Math.atan2(dy, dx);
  const currentAngleDeg = currentAngleRad * (180 / Math.PI);

  const headPath = `M 0 0 L ${-headSize} ${-headSize/2} L ${-headSize} ${headSize/2} Z`;

  const padding = thickness + headSize + Math.abs(curvature);
  const vWidth = size + padding * 2;
  const vHeight = padding * 2;

  return (
    <svg 
      width={vWidth} 
      height={vHeight} 
      viewBox={`0 0 ${vWidth} ${vHeight}`}
      style={{ overflow: 'visible', transform: `rotate(${rotation}deg)` }}
      opacity={opacity}
    >
      <g transform={`translate(${padding}, ${padding})`}>
        {/* Main Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength * (1 - progress)}
          data-testid="arrow-line"
        />
        
        {/* Arrow Head (rides the tip of the line) */}
        {progress > 0 && (
          <path
            d={headPath}
            fill={color}
            transform={`translate(${currentX}, ${currentY}) rotate(${currentAngleDeg})`}
            data-testid="arrow-head"
          />
        )}
      </g>
    </svg>
  );
};
