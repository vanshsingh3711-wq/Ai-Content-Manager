import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

interface CandleData {
  open: number;
  close: number;
  high: number;
  low: number;
  vol: number;
}

interface Props {
  symbol?: string;
  timeframe?: string;
  startingPrice?: number;
  endingPrice?: number;
  percentageGain?: string;
  trend?: 'bullish' | 'bearish';
  headline?: string;
}

const DEFAULT_CANDLES: CandleData[] = [
  { open: 48, close: 52, high: 55, low: 46, vol: 35 },
  { open: 52, close: 50, high: 54, low: 48, vol: 28 },
  { open: 50, close: 58, high: 61, low: 49, vol: 62 },
  { open: 58, close: 56, high: 60, low: 53, vol: 40 },
  { open: 56, close: 64, high: 67, low: 55, vol: 75 },
  { open: 64, close: 69, high: 72, low: 62, vol: 85 },
  { open: 69, close: 66, high: 71, low: 64, vol: 45 },
  { open: 66, close: 76, high: 79, low: 65, vol: 92 },
  { open: 76, close: 84, high: 88, low: 74, vol: 110 },
  { open: 84, close: 92, high: 96, low: 81, vol: 125 },
];

export const CandlestickHUD: React.FC<Props> = ({
  symbol = 'BTC / USD',
  timeframe = '4H BREAKOUT • HIGH VOLUME',
  startingPrice = 48250,
  endingPrice = 64180,
  percentageGain = '+32.8%',
  trend = 'bullish',
  headline = 'INSTITUTIONAL LIQUIDITY SURGE',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 14);

  // Staggered entrances
  const hudSpring = spring({ frame, fps, config: { damping: 14, mass: 0.6, stiffness: 150 } });
  const lineSpring = spring({ frame: frame - 12, fps, config: { damping: 12, mass: 0.8, stiffness: 110 } });
  const badgeSpring = spring({ frame: frame - 22, fps, config: { damping: 10, mass: 0.5, stiffness: 180 } });

  // Interpolated price odometer
  const currentPrice = Math.round(
    interpolate(lineSpring, [0, 1], [startingPrice, endingPrice], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  const isBull = trend === 'bullish';
  const accentColor = isBull ? '#22C55E' : '#EF4444';
  const accentGlow = isBull ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)';

  const chartW = 780;
  const chartH = 340;
  const candleSpacing = chartW / DEFAULT_CANDLES.length;

  // Build SVG path for trendline
  const points = DEFAULT_CANDLES.map((c, i) => {
    const x = i * candleSpacing + candleSpacing / 2;
    const y = chartH - (c.close / 100) * (chartH - 40) - 20;
    return `${x},${y}`;
  });
  const trendPath = `M ${points.join(' L ')}`;

  return (
    <AbsoluteFill
      style={{
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 30px',
        ...exit,
      }}
    >
      <div
        style={{
          ...glassStyle,
          width: '100%',
          maxWidth: 960,
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          background: 'rgba(8, 12, 22, 0.92)',
          border: '1.5px solid rgba(255, 255, 255, 0.14)',
          boxShadow: `0 30px 100px rgba(0,0,0,0.85), 0 0 60px ${accentGlow}`,
          fontFamily: FONT.display,
        }}
      >
        {/* Header HUD Bar */}
        <div
          style={{
            transform: `scale(${Math.min(1, hudSpring)}) translateY(${(1 - hudSpring) * -20}px)`,
            opacity: hudSpring,
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.10)',
            paddingBottom: 20,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: accentColor,
                  boxShadow: `0 0 12px ${accentColor}`,
                }}
              />
              <span style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.05em' }}>
                {symbol}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  background: 'rgba(255,255,255,0.10)',
                  color: '#CBD5E1',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontFamily: FONT.mono,
                }}
              >
                {timeframe}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4, fontWeight: 600 }}>
              {headline}
            </div>
          </div>

          {/* Real-time Ticker Counter */}
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 900,
                color: '#FFFFFF',
                fontFamily: FONT.mono,
                letterSpacing: '-0.02em',
                textShadow: `0 0 20px ${accentGlow}`,
              }}
            >
              ${currentPrice.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 4,
              }}
            >
              <span>{isBull ? '▲' : '▼'}</span>
              <span>{percentageGain}</span>
            </div>
          </div>
        </div>

        {/* Candlestick & Volume Chart Area */}
        <div
          style={{
            width: '100%',
            position: 'relative',
            height: chartH + 70,
            opacity: hudSpring,
          }}
        >
          {/* Subtle Grid Lines */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              pointerEvents: 'none',
              opacity: 0.15,
            }}
          >
            {[0, 1, 2, 3].map((g) => (
              <div key={g} style={{ borderBottom: '1px dashed #FFFFFF', width: '100%' }} />
            ))}
          </div>

          <svg
            width="100%"
            height={chartH}
            viewBox={`0 0 ${chartW} ${chartH}`}
            style={{ overflow: 'visible' }}
          >
            {/* Candlesticks */}
            {DEFAULT_CANDLES.map((c, i) => {
              const candleSpring = spring({
                frame: frame - 4 - i * 2,
                fps,
                config: { damping: 14, mass: 0.5, stiffness: 140 },
              });
              const cIsBull = c.close >= c.open;
              const color = cIsBull ? '#22C55E' : '#EF4444';
              const x = i * candleSpacing + candleSpacing / 2;

              const yHigh = chartH - (c.high / 100) * (chartH - 40) - 20;
              const yLow = chartH - (c.low / 100) * (chartH - 40) - 20;
              const yOpen = chartH - (c.open / 100) * (chartH - 40) - 20;
              const yClose = chartH - (c.close / 100) * (chartH - 40) - 20;

              const bodyY = Math.min(yOpen, yClose);
              const bodyH = Math.max(4, Math.abs(yClose - yOpen));
              const scale = Math.max(0, Math.min(1, candleSpring));

              return (
                <g key={i} style={{ opacity: scale, transform: `scaleY(${scale})`, transformOrigin: `${x}px ${chartH}px` }}>
                  {/* Wick */}
                  <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth={2} opacity={0.8} />
                  {/* Body */}
                  <rect
                    x={x - 14}
                    y={bodyY}
                    width={28}
                    height={bodyH}
                    fill={color}
                    rx={3}
                    style={{
                      filter: `drop-shadow(0 0 8px ${color}88)`,
                    }}
                  />
                </g>
              );
            })}

            {/* Glowing Moving Average Trendline */}
            <path
              d={trendPath}
              fill="none"
              stroke="#38BDF8"
              strokeWidth={4}
              strokeDasharray={1000}
              strokeDashoffset={1000 * (1 - Math.min(1, lineSpring))}
              style={{
                filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.8))',
              }}
            />
          </svg>

          {/* Volume Histogram (Lower 50px) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: 50,
              marginTop: 14,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: 8,
            }}
          >
            {DEFAULT_CANDLES.map((c, i) => {
              const volH = (c.vol / 125) * 40 * Math.min(1, lineSpring);
              return (
                <div
                  key={i}
                  style={{
                    width: 28,
                    height: volH,
                    background: c.close >= c.open ? 'rgba(34, 197, 94, 0.45)' : 'rgba(239, 68, 68, 0.45)',
                    borderRadius: '2px 2px 0 0',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Milestone Footer Badge */}
        <div
          style={{
            transform: `scale(${Math.min(1, badgeSpring)})`,
            opacity: badgeSpring,
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            padding: '12px 24px',
            borderRadius: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 0 24px rgba(34, 197, 94, 0.20)',
          }}
        >
          <span style={{ fontSize: 18 }}>⚡</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#E2E8F0', letterSpacing: '0.04em' }}>
            BREAKOUT CONFIRMED: BUYING VOLUME REACHES 30-DAY RECORD HIGH
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
