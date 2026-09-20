import React from 'react';
import { ConnectionLineEffectProps } from './ConnectionLineEffect.types';
import { interpolate, easeOutCubic, easeInOutCubic } from './ConnectionLineEffect.utils';

export const ConnectionLineEffect: React.FC<ConnectionLineEffectProps> = ({
  fromX,
  fromY,
  toX,
  toY,
  color = '#9ca3af', // gray-400
  opacity = 1,
  strokeWidth = 2,
  style = 'straight',
  curvature = 50,
  showStartDot = false,
  showEndDot = false,
  showArrow = false,
  arrowSize = 10,
  durationInFrames = 30,
  delayInFrames = 0,
  animation = 'draw',
  easing = 'easeInOut',
  currentFrame = 0,
  className = '',
  styleProp = {},
}) => {
  const endFrame = delayInFrames + durationInFrames;

  let progress = 0;
  if (currentFrame >= endFrame) {
    progress = 1;
  } else if (currentFrame > delayInFrames) {
    const rawProgress = interpolate(currentFrame, [delayInFrames, endFrame], [0, 1], 'clamp');
    if (easing === 'easeOut') {
      progress = easeOutCubic(rawProgress);
    } else if (easing === 'easeInOut') {
      progress = easeInOutCubic(rawProgress);
    } else {
      progress = rawProgress;
    }
  }

  // Calculate Geometry
  let path = '';
  let angle = 0;

  if (style === 'straight') {
    path = `M ${fromX} ${fromY} L ${toX} ${toY}`;
    angle = Math.atan2(toY - fromY, toX - fromX) * (180 / Math.PI);
  } else {
    // curved - quadratic bezier
    const mx = (fromX + toX) / 2;
    const my = (fromY + toY) / 2;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const length = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    const cx = mx + nx * curvature;
    const cy = my + ny * curvature;
    
    path = `M ${fromX} ${fromY} Q ${cx} ${cy} ${toX} ${toY}`;
    
    // Tangent at the end of quadratic bezier points from control point to end point
    angle = Math.atan2(toY - cy, toX - cx) * (180 / Math.PI);
  }

  // Animation values
  let strokeDasharray = 'none';
  let strokeDashoffset = 0;
  let finalOpacity = opacity;

  const pct = progress * 100;

  if (animation === 'draw' || animation === 'draw-fade') {
    strokeDasharray = '100'; // We use pathLength="100" to normalize length!
    strokeDashoffset = 100 - pct;
  }

  if (animation === 'fade' || animation === 'draw-fade') {
    finalOpacity = opacity * progress;
  }

  const dotRadius = strokeWidth * 1.5;

  return (
    <svg
      data-testid="connection-line-effect"
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
        opacity: finalOpacity,
        ...styleProp,
      }}
    >
      {/* Start Dot */}
      {showStartDot && (
        <circle 
          data-testid="start-dot"
          cx={fromX} 
          cy={fromY} 
          r={dotRadius} 
          fill={color} 
        />
      )}

      {/* Main Connection Line */}
      <path
        data-testid="connection-path"
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        pathLength="100"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
      />

      {/* End Dot */}
      {showEndDot && (
        <circle 
          data-testid="end-dot"
          cx={toX} 
          cy={toY} 
          r={dotRadius} 
          fill={color} 
        />
      )}

      {/* Arrowhead */}
      {showArrow && (
        <path
          data-testid="connection-arrow"
          d={`M 0 0 L -${arrowSize} -${arrowSize / 2} L -${arrowSize} ${arrowSize / 2} Z`}
          fill={color}
          transform={`translate(${toX}, ${toY}) rotate(${angle})`}
          opacity={animation === 'draw' || animation === 'draw-fade' ? (progress === 1 ? 1 : 0) : 1}
          style={{ transition: 'opacity 0.1s' }} // prevent arrow flashing midway through draw
        />
      )}
    </svg>
  );
};
