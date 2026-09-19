import React from 'react';
import { AnimatedBarChartProps } from './AnimatedBarChart.types';
import { getMaxValue, interpolate } from './AnimatedBarChart.utils';

export const AnimatedBarChart: React.FC<AnimatedBarChartProps> = ({
  data,
  title,
  subtitle,
  width,
  height,
  maxValue,
  animation = {},
  showValues = true,
  showLabels = true,
  showGrid = true,
  showAxis = true,
  barRadius = 4,
  typography = {},
  style = {},
  currentFrame = 0,
  fps = 30, // Default fps provided if needed
}) => {
  const {
    type = 'grow',
    durationInFrames = 30,
    delayInFrames = 0,
    staggerInFrames = 0,
  } = animation;

  const {
    background = 'transparent',
    barColor = '#3b82f6',
    textColor = '#ffffff',
    secondaryTextColor = '#9ca3af',
    gridColor = '#374151',
  } = style;

  const {
    titleSize = 32,
    labelSize = 16,
    valueSize = 16,
    fontFamily = 'sans-serif',
  } = typography;

  // Chart area calculations
  const padding = { top: 80, right: 40, bottom: 60, left: 80 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const maxVal = getMaxValue(data, maxValue);
  
  // Bar calculations
  const barCount = data.length;
  const barSpacing = chartWidth * 0.2 / (barCount || 1); // 20% of width for spacing
  const availableBarWidth = chartWidth - (barSpacing * (barCount - 1));
  const barWidth = barCount > 0 ? availableBarWidth / barCount : 0;

  // Grid lines
  const gridLines = 5;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ background, fontFamily }}>
      {/* Background & Title */}
      {title && (
        <text x={padding.left} y={padding.top / 2} fill={textColor} fontSize={titleSize} fontWeight="bold">
          {title}
        </text>
      )}
      {subtitle && (
        <text x={padding.left} y={padding.top / 2 + titleSize} fill={secondaryTextColor} fontSize={titleSize * 0.6}>
          {subtitle}
        </text>
      )}

      {/* Grid Lines & Axis Values */}
      {showGrid && (
        Array.from({ length: gridLines + 1 }).map((_, i) => {
          const y = padding.top + (chartHeight / gridLines) * i;
          const val = maxVal - (maxVal / gridLines) * i;
          return (
            <g key={`grid-${i}`}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={gridColor} strokeWidth={1} />
              {showAxis && (
                <text x={padding.left - 10} y={y + 5} fill={secondaryTextColor} fontSize={labelSize} textAnchor="end">
                  {val.toFixed(0)}
                </text>
              )}
            </g>
          );
        })
      )}

      {/* Bars */}
      {data.map((item, index) => {
        const itemDelay = delayInFrames + (index * staggerInFrames);
        const itemDuration = durationInFrames;
        
        let progress = 1;
        let opacity = 1;

        if (type === 'grow') {
          progress = interpolate(
            currentFrame,
            [itemDelay, itemDelay + itemDuration],
            [0, 1]
          );
        } else if (type === 'fade') {
          opacity = interpolate(
            currentFrame,
            [itemDelay, itemDelay + itemDuration],
            [0, 1]
          );
        } else if (type === 'slideUp') {
            progress = interpolate(
                currentFrame,
                [itemDelay, itemDelay + itemDuration],
                [0, 1]
            );
            opacity = progress;
        }

        const targetHeight = (item.value / maxVal) * chartHeight;
        const actualHeight = Math.max(0, targetHeight * progress);
        
        const x = padding.left + (index * (barWidth + barSpacing));
        const y = padding.top + chartHeight - actualHeight;

        // Ensure we don't render invalid rects
        if (actualHeight === 0 && opacity === 1) return null; // Or render tiny bit? Actually it's fine.

        return (
          <g key={`bar-${index}`} opacity={opacity}>
            {/* Bar shape */}
            {actualHeight > 0 && (
               <rect
                 data-testid={`bar-${index}`}
                 x={x}
                 y={y}
                 width={barWidth}
                 height={actualHeight}
                 fill={barColor}
                 rx={barRadius}
                 ry={barRadius}
               />
            )}
            
            {/* Bottom Label */}
            {showLabels && (
              <text
                x={x + barWidth / 2}
                y={padding.top + chartHeight + 25}
                fill={secondaryTextColor}
                fontSize={labelSize}
                textAnchor="middle"
              >
                {item.label}
              </text>
            )}

            {/* Top Value */}
            {showValues && progress > 0.1 && (
              <text
                x={x + barWidth / 2}
                y={y - 10}
                fill={textColor}
                fontSize={valueSize}
                textAnchor="middle"
                opacity={interpolate(progress, [0.5, 1], [0, 1])}
              >
                {item.displayValue || item.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
