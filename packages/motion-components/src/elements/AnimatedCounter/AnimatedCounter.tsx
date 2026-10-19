import React from 'react';
import { AnimatedCounterProps } from './AnimatedCounter.types';
import { interpolate, formatValue } from './AnimatedCounter.utils';

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  startValue = 0,
  format = 'number',
  currencySymbol = '$',
  decimals = 0,
  prefix = '',
  suffix = '',
  width = 400,
  height = 100,
  animation = {},
  typography = {},
  style = {},
  currentFrame = 0,
  fps = 30,
}) => {
  const {
    durationInFrames = 30,
    delayInFrames = 0,
  } = animation;

  const {
    textColor = '#ffffff',
    background = 'transparent',
  } = style;

  const {
    size = 48,
    fontFamily = 'sans-serif',
    fontWeight = 'bold',
  } = typography;

  const currentValue = interpolate(
    currentFrame,
    [delayInFrames, delayInFrames + durationInFrames],
    [startValue, value]
  );

  const displayString = formatValue(currentValue, format, decimals, currencySymbol, prefix, suffix);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ background, fontFamily }}>
      <text
        x={width / 2}
        y={height / 2}
        fill={textColor}
        fontSize={size}
        fontWeight={fontWeight}
        textAnchor="middle"
        dominantBaseline="middle"
        data-testid="counter-text"
      >
        {displayString}
      </text>
    </svg>
  );
};
