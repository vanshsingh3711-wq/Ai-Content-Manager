import React from 'react';
import { NumberChangeEffectProps } from './NumberChangeEffect.types';
import { interpolate, easeOutCubic, easeInOutCubic } from './NumberChangeEffect.utils';

export const NumberChangeEffect: React.FC<NumberChangeEffectProps> = ({
  from,
  to,
  durationInFrames = 30,
  delayInFrames = 0,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = true,
  locale = 'en-US',
  easing = 'easeOut',
  color,
  fontSize,
  fontWeight,
  align = 'left',
  currentFrame = 0,
  className = '',
  style = {},
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

  // Calculate current numeric value
  const currentValue = interpolate(progress, [0, 1], [from, to], 'clamp');

  // Format the value deterministically
  const isNegative = currentValue < 0;
  // If the number is effectively zero after rounding, treat it as positive to avoid "-0"
  const absValue = Math.abs(currentValue);

  const formattedAbs = new Intl.NumberFormat(locale, {
    useGrouping: separator,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(absValue);

  // If formattedAbs is exactly "0" or "0.00", we don't want a negative sign
  const isZero = parseFloat(formattedAbs) === 0;
  const sign = (isNegative && !isZero) ? '-' : '';
  
  const displayString = `${sign}${prefix}${formattedAbs}${suffix}`;

  return (
    <div
      data-testid="number-change-effect"
      className={className}
      style={{
        color,
        fontSize,
        fontWeight,
        textAlign: align,
        whiteSpace: 'nowrap',
        fontVariantNumeric: 'tabular-nums', // keeps numbers from jumping around
        ...style,
      }}
    >
      {displayString}
    </div>
  );
};
