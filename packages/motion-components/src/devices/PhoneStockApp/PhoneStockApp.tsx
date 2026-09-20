import React from 'react';
import { PhoneStockAppProps } from './PhoneStockApp.types';
import { interpolate } from './PhoneStockApp.utils';
import { AnimatedLineChart } from '../../charts/AnimatedLineChart';
import { AnimatedCounter } from '../../elements/AnimatedCounter';

export const PhoneStockApp: React.FC<PhoneStockAppProps> = ({
  symbol,
  companyName = '',
  price,
  change = 0,
  changePercent = 0,
  currency = '$',
  chartData = [],
  timeRange = '1D',
  width = '100%',
  height = '100%',
  animation = {},
  currentFrame = 0,
  fps = 30,
  style = {},
}) => {
  const {
    startDelayInFrames = 0,
    durationInFrames = 60,
    chartDurationInFrames = 90,
  } = animation;

  const {
    backgroundColor = 'transparent',
    textColor = '#111827',
    secondaryTextColor = '#6b7280',
    accentColor = '#2563eb',
    positiveColor = '#10b981', // green
    negativeColor = '#ef4444', // red
  } = style;

  const isPositive = changePercent >= 0;
  const statusColor = isPositive ? positiveColor : negativeColor;
  const changeSign = isPositive ? '+' : '';

  // Determine starting price for animation based on the change
  const startPrice = price - change;

  // Chart data format adapter
  const formattedChartData = chartData.map((pt, i) => ({
    label: pt.label || String(i),
    value: pt.value,
  }));

  const uiOpacity = interpolate(currentFrame, [startDelayInFrames, startDelayInFrames + 15], [0, 1]);

  return (
    <div
      data-testid="phone-stock-app"
      style={{
        width,
        height,
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        padding: '24px 16px',
        position: 'relative',
        fontFamily: 'sans-serif',
        opacity: uiOpacity,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: textColor }} data-testid="stock-symbol">
          {symbol}
        </div>
        <div style={{ fontSize: 14, color: secondaryTextColor }} data-testid="stock-company">
          {companyName}
        </div>
      </div>

      {/* Price & Change */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 48, fontWeight: 700, color: textColor, display: 'flex', alignItems: 'baseline' }} data-testid="stock-price">
          <AnimatedCounter 
            startValue={startPrice}
            value={price}
            format="currency"
            currencySymbol={currency}
            decimals={2}
            currentFrame={currentFrame}
            fps={fps}
            animation={{ durationInFrames: durationInFrames, delayInFrames: startDelayInFrames }}
            style={{ textColor }}
          />
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: statusColor, display: 'flex', alignItems: 'center' }} data-testid="stock-change">
          <AnimatedCounter 
            startValue={0}
            value={change}
            format="currency"
            currencySymbol={`${changeSign}${currency}`}
            decimals={2}
            currentFrame={currentFrame}
            fps={fps}
            animation={{ durationInFrames: durationInFrames, delayInFrames: startDelayInFrames }}
            style={{ textColor: statusColor }}
          />
          <span style={{ margin: '0 4px' }}>•</span>
          <AnimatedCounter 
            startValue={0}
            value={changePercent}
            format="percentage"
            decimals={2}
            prefix={changeSign}
            currentFrame={currentFrame}
            fps={fps}
            animation={{ durationInFrames: durationInFrames, delayInFrames: startDelayInFrames }}
            style={{ textColor: statusColor }}
          />
        </div>
      </div>

      {/* Chart */}
      <div style={{ flex: 1, minHeight: 200, width: '100%', margin: '0 -16px 24px -16px' }} data-testid="stock-chart">
        {formattedChartData.length > 0 && (
          <AnimatedLineChart 
            data={formattedChartData}
            width={340} // Will scale inside flex container usually, but we pass a hard number as required by the chart API.
            height={250}
            showValues={false}
            showLabels={false}
            showGrid={false}
            showAxis={false}
            showPoints={false}
            lineThickness={3}
            currentFrame={currentFrame}
            fps={fps}
            animation={{
              type: 'draw',
              durationInFrames: chartDurationInFrames,
              delayInFrames: startDelayInFrames + 15, // Starts slightly after UI appears
            }}
            style={{
              lineColor: statusColor,
            }}
          />
        )}
      </div>

      {/* Time Range Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 16px', marginBottom: 32 }}>
        {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((tr) => (
          <div 
            key={tr}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: tr === timeRange ? textColor : secondaryTextColor,
              backgroundColor: tr === timeRange ? `${secondaryTextColor}20` : 'transparent',
              padding: '6px 12px',
              borderRadius: 16,
            }}
          >
            {tr}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 16, marginTop: 'auto' }}>
        <div style={{ flex: 1, height: 56, backgroundColor: `${accentColor}20`, color: accentColor, borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
          Sell
        </div>
        <div style={{ flex: 1, height: 56, backgroundColor: accentColor, color: 'white', borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
          Buy
        </div>
      </div>

    </div>
  );
};
