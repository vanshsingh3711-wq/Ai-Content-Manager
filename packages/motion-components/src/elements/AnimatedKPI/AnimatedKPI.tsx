import React from 'react';
import { AnimatedKPIProps } from './AnimatedKPI.types';
import { interpolate, formatValue } from './AnimatedKPI.utils';

export const AnimatedKPI: React.FC<AnimatedKPIProps> = ({
  tokens,
  title,
  value,
  startValue = 0,
  format = 'number',
  currencySymbol = '$',
  decimals = 0,
  prefix = '',
  suffix = '',
  changeValue,
  changeFormat = 'percentage',
  showTrend = true,
  width = 400,
  height = 200,
  animation = {},
  typography = {},
  style = {},
  currentFrame = 0,
  fps = 30, // Default for API consistency
}) => {
  const {
    type = 'fade',
    durationInFrames = 30,
    delayInFrames = 0,
    staggerInFrames = 10,
  } = animation;

  const {
    background = tokens ? tokens.colors.surface : 'transparent',
    titleColor = tokens ? tokens.colors.textSecondary : '#9ca3af',
    valueColor = tokens ? tokens.colors.textPrimary : '#ffffff',
    positiveColor = tokens ? tokens.colors.success : '#10b981',
    negativeColor = tokens ? tokens.colors.danger : '#ef4444',
    neutralColor = tokens ? tokens.colors.textMuted : '#6b7280',
  } = style;

  const {
    titleSize = 20, // Typography scale should eventually come from tokens if desired, but we keep it simple here
    valueSize = 56,
    changeSize = 24,
    fontFamily = 'sans-serif',
  } = typography;

  // Title Animation
  const titleDelay = delayInFrames;
  const titleOpacity = interpolate(currentFrame, [titleDelay, titleDelay + 10], [0, 1]);
  const titleYOffset = type === 'slideUp' ? interpolate(currentFrame, [titleDelay, titleDelay + 10], [10, 0]) : 0;

  // Value Animation
  const valueDelay = delayInFrames + staggerInFrames;
  const valueOpacity = interpolate(currentFrame, [valueDelay, valueDelay + 10], [0, 1]);
  const valueYOffset = type === 'slideUp' ? interpolate(currentFrame, [valueDelay, valueDelay + 10], [10, 0]) : 0;
  
  const currentValue = interpolate(
    currentFrame,
    [valueDelay, valueDelay + durationInFrames],
    [startValue, value]
  );
  const displayString = formatValue(currentValue, format, decimals, currencySymbol, prefix, suffix);

  // Change Animation
  const changeDelay = delayInFrames + (staggerInFrames * 2);
  const changeOpacity = interpolate(currentFrame, [changeDelay, changeDelay + 10], [0, 1]);
  const changeYOffset = type === 'slideUp' ? interpolate(currentFrame, [changeDelay, changeDelay + 10], [10, 0]) : 0;
  
  let changeColor = neutralColor;
  let trendSymbol = '';
  
  if (changeValue !== undefined) {
    if (changeValue > 0) {
      changeColor = positiveColor;
      trendSymbol = showTrend ? '▲' : '';
    } else if (changeValue < 0) {
      changeColor = negativeColor;
      trendSymbol = showTrend ? '▼' : '';
    }
  }

  const changeString = changeValue !== undefined 
    ? `${trendSymbol} ${formatValue(Math.abs(changeValue), changeFormat, changeFormat === 'percentage' ? 1 : decimals, currencySymbol, '', '')}`
    : '';

  const centerY = height / 2;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ background, fontFamily }}>
      {/* Title */}
      <text
        x={width / 2}
        y={centerY - (valueSize / 2) - 10 + titleYOffset}
        fill={titleColor}
        fontSize={titleSize}
        fontWeight="600"
        textAnchor="middle"
        opacity={titleOpacity}
        data-testid="kpi-title"
      >
        {title.toUpperCase()}
      </text>

      {/* Main Metric */}
      {valueOpacity > 0 && (
        <text
          x={width / 2}
          y={centerY + (valueSize / 4) + valueYOffset}
          fill={valueColor}
          fontSize={valueSize}
          fontWeight="bold"
          textAnchor="middle"
          opacity={valueOpacity}
          data-testid="kpi-value"
        >
          {displayString}
        </text>
      )}

      {/* Change Metric */}
      {changeValue !== undefined && changeOpacity > 0 && (
        <text
          x={width / 2}
          y={centerY + (valueSize / 2) + 30 + changeYOffset}
          fill={changeColor}
          fontSize={changeSize}
          fontWeight="bold"
          textAnchor="middle"
          opacity={changeOpacity}
          data-testid="kpi-change"
        >
          {changeString.trim()}
        </text>
      )}
    </svg>
  );
};
