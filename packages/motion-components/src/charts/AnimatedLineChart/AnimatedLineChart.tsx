import React, { useMemo } from 'react';
import { AnimatedLineChartProps } from './AnimatedLineChart.types';
import { getMaxValue, interpolate } from './AnimatedLineChart.utils';

export const AnimatedLineChart: React.FC<AnimatedLineChartProps> = ({
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
  showPoints = true,
  lineThickness = 4,
  pointSize = 6,
  typography = {},
  style = {},
  currentFrame = 0,
  fps = 30,
}) => {
  const {
    type = 'draw',
    durationInFrames = 30,
    delayInFrames = 0,
    staggerInFrames = 0,
  } = animation;

  const {
    background = 'transparent',
    lineColor = '#3b82f6',
    pointColor = '#3b82f6',
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
  const dataCount = data.length;

  const xStep = dataCount > 1 ? chartWidth / (dataCount - 1) : 0;
  
  // Calculate points
  const points = useMemo(() => {
    return data.map((item, index) => {
      const x = padding.left + (index * xStep);
      const y = padding.top + chartHeight - ((item.value / maxVal) * chartHeight);
      return { x, y, item, index };
    });
  }, [data, padding.left, padding.top, chartHeight, maxVal, xStep]);

  // Generate SVG Path
  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((acc, point, index) => {
      return index === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
    }, '');
  }, [points]);

  // Calculate total path length approximately for stroke-dasharray
  const pathLength = useMemo(() => {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length > 0 ? length : 1; // avoid 0 length
  }, [points]);

  // Animation Progress
  let pathProgress = 1;
  let chartOpacity = 1;

  if (type === 'draw') {
    pathProgress = interpolate(
      currentFrame,
      [delayInFrames, delayInFrames + durationInFrames],
      [0, 1]
    );
  } else if (type === 'fade') {
    chartOpacity = interpolate(
      currentFrame,
      [delayInFrames, delayInFrames + durationInFrames],
      [0, 1]
    );
  }

  const gridLines = 5;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ background, fontFamily }} opacity={chartOpacity}>
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

      {/* The Line */}
      {points.length > 0 && (
        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth={lineThickness}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength * (1 - pathProgress)}
          data-testid="chart-line"
        />
      )}

      {/* Points, Labels, and Values */}
      {points.map(({ x, y, item, index }) => {
        const itemDelay = delayInFrames + (index * staggerInFrames);
        const pointExpectedProgress = dataCount > 1 ? index / (dataCount - 1) : 1;
        const lineHasReachedPoint = pathProgress >= pointExpectedProgress;
        
        let pointScale = 1;
        let elementOpacity = 1;

        if (type === 'draw') {
           if (lineHasReachedPoint) {
              const timeLineReached = delayInFrames + (pointExpectedProgress * durationInFrames);
              pointScale = interpolate(currentFrame, [timeLineReached, timeLineReached + (fps/3)], [0, 1]);
              elementOpacity = interpolate(currentFrame, [timeLineReached, timeLineReached + (fps/3)], [0, 1]);
           } else {
              pointScale = 0;
              elementOpacity = 0;
           }
        } else if (type === 'fade') {
           elementOpacity = interpolate(
             currentFrame,
             [itemDelay, itemDelay + durationInFrames],
             [0, 1]
           );
           pointScale = elementOpacity;
        }

        return (
          <g key={`point-${index}`} opacity={elementOpacity} data-testid={`point-group-${index}`}>
            {/* Data Point */}
            {showPoints && pointScale > 0 && (
              <circle
                cx={x}
                cy={y}
                r={pointSize * pointScale}
                fill={background === 'transparent' ? '#000' : background}
                stroke={pointColor}
                strokeWidth={lineThickness > 0 ? lineThickness : 2}
              />
            )}

            {/* Bottom Label */}
            {showLabels && (
              <text
                x={x}
                y={padding.top + chartHeight + 25}
                fill={secondaryTextColor}
                fontSize={labelSize}
                textAnchor="middle"
              >
                {item.label}
              </text>
            )}

            {/* Top Value */}
            {showValues && (
              <text
                x={x}
                y={y - 15 - (pointSize * pointScale)}
                fill={textColor}
                fontSize={valueSize}
                textAnchor="middle"
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
