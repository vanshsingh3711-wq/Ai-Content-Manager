import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

interface Slice {
  name: string;
  ticker: string;
  pct: number;
  color: string;
  sub: string;
}

interface Props {
  title?: string;
  totalValuation?: number;
  subtitle?: string;
}

const DEFAULT_SLICES: Slice[] = [
  { name: 'S&P 500 Index', ticker: 'VOO / SPY', pct: 50, color: '#3B82F6', sub: 'Low-cost core wealth' },
  { name: 'Real Estate REITs', ticker: 'VNQ / Real Assets', pct: 20, color: '#10B981', sub: 'Passive cashflow yield' },
  { name: 'Short-Term Treasuries', ticker: 'SGOV / Cash Eq', pct: 20, color: '#F59E0B', sub: 'Downside risk armor' },
  { name: 'Asymmetric Growth', ticker: 'BTC / Tech', pct: 10, color: '#8B5CF6', sub: 'Exponential upside' },
];

export const PortfolioDonut: React.FC<Props> = ({
  title = 'THE ALL-WEATHER ASSET ALLOCATION',
  totalValuation = 250000,
  subtitle = 'RAY DALIO & BOGLEHEAD DIVERSIFICATION BLUEPRINT',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 14);

  const headerSpring = spring({ frame, fps, config: { damping: 14, mass: 0.6, stiffness: 150 } });
  const wheelSpring = spring({ frame: frame - 8, fps, config: { damping: 12, mass: 0.8, stiffness: 110 } });
  const cardsSpring = spring({ frame: frame - 16, fps, config: { damping: 14, mass: 0.7, stiffness: 130 } });

  const currentTotal = Math.round(
    interpolate(wheelSpring, [0, 1], [0, totalValuation], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  const size = 320;
  const strokeWidth = 38;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

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
          padding: '40px 38px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          background: 'rgba(8, 12, 22, 0.94)',
          border: '1.5px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 30px 100px rgba(0,0,0,0.85), 0 0 60px rgba(59, 130, 246, 0.20)',
          fontFamily: FONT.display,
        }}
      >
        {/* Header Title */}
        <div
          style={{
            transform: `scale(${Math.min(1, headerSpring)}) translateY(${(1 - headerSpring) * -16}px)`,
            opacity: headerSpring,
            width: '100%',
            textAlign: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.10)',
            paddingBottom: 18,
          }}
        >
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              color: '#60A5FA',
              fontSize: 12,
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: 6,
              letterSpacing: '0.08em',
              fontFamily: FONT.mono,
              marginBottom: 8,
            }}
          >
            PORTFOLIO ARCHITECTURE
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
            {title}
          </div>
          <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4, fontWeight: 600 }}>
            {subtitle}
          </div>
        </div>

        {/* Center Donut + Side Badges Layout */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            gap: 24,
          }}
        >
          {/* Donut Radial Visualizer */}
          <div
            style={{
              position: 'relative',
              width: size,
              height: size,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${Math.min(1, wheelSpring)})`,
              opacity: wheelSpring,
            }}
          >
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
            >
              {DEFAULT_SLICES.map((s, i) => {
                const sliceLength = (s.pct / 100) * circumference;
                const strokeDashoffset = cumulativeOffset;
                cumulativeOffset -= sliceLength;

                return (
                  <circle
                    key={i}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${sliceLength * Math.min(1, wheelSpring)} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    style={{
                      filter: `drop-shadow(0 0 10px ${s.color}66)`,
                      transition: 'stroke-dasharray 0.1s ease',
                    }}
                  />
                );
              })}
            </svg>

            {/* Center Net Worth Odometer */}
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                Total Target Portfolio
              </div>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  fontFamily: FONT.mono,
                  marginTop: 2,
                }}
              >
                ${currentTotal.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#10B981', marginTop: 2 }}>
                100% ALLOCATED
              </div>
            </div>
          </div>

          {/* 4 Asset Class Callout Cards */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              flex: 1,
              opacity: cardsSpring,
              transform: `translateX(${(1 - cardsSpring) * 20}px)`,
            }}
          >
            {DEFAULT_SLICES.map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${s.color}40`,
                  borderRadius: 14,
                  boxShadow: `0 4px 20px rgba(0,0,0,0.3), inset 0 0 12px ${s.color}15`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: s.color,
                      boxShadow: `0 0 10px ${s.color}`,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: FONT.mono }}>
                      {s.ticker} • {s.sub}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: s.color,
                    fontFamily: FONT.mono,
                  }}
                >
                  {s.pct}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div
          style={{
            fontSize: 12,
            color: '#64748B',
            textAlign: 'center',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 14,
            width: '100%',
            fontWeight: 600,
          }}
        >
          Auto-rebalance every 6 months to maintain asymmetric risk protection and harvest market swings.
        </div>
      </div>
    </AbsoluteFill>
  );
};
