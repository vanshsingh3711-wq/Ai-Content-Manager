import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

interface Props {
  title?: string;
  monthlyDeposit?: string;
  annualRate?: string;
  timeframeYears?: number;
  terminalCompound?: number;
  terminalCash?: number;
  inflectionYear?: number;
}

export const CompoundGrowthCurve: React.FC<Props> = ({
  title = 'THE EXPONENTIAL SNOWBALL EFFECT',
  monthlyDeposit = '$500 / Month',
  annualRate = '10% S&P 500 Historical',
  timeframeYears = 30,
  terminalCompound = 1130240,
  terminalCash = 180000,
  inflectionYear = 15,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 14);

  // Staggered animation springs
  const headerSpring = spring({ frame, fps, config: { damping: 14, mass: 0.6, stiffness: 150 } });
  const linearSpring = spring({ frame: frame - 10, fps, config: { damping: 14, mass: 0.8, stiffness: 100 } });
  const compoundSpring = spring({ frame: frame - 18, fps, config: { damping: 12, mass: 0.8, stiffness: 90 } });
  const sparkSpring = spring({ frame: frame - 32, fps, config: { damping: 8, mass: 0.4, stiffness: 220 } });

  // Current counter values
  const currentCompoundVal = Math.round(
    interpolate(compoundSpring, [0, 1], [0, terminalCompound], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const currentCashVal = Math.round(
    interpolate(linearSpring, [0, 1], [0, terminalCash], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  const chartW = 760;
  const chartH = 340;

  // Build points for linear savings line: (0,0) -> (chartW, 20% height)
  const linearYEnd = chartH - (terminalCash / terminalCompound) * (chartH - 40) - 20;
  const linearPath = `M 0,${chartH - 20} L ${chartW},${linearYEnd}`;

  // Build smooth cubic bezier exponential compound curve: (0,0) -> starts flat, accelerates upward
  const compPath = `M 0,${chartH - 20} C ${chartW * 0.45},${chartH - 30} ${chartW * 0.75},${chartH * 0.45} ${chartW},20`;
  const areaFillPath = `${compPath} L ${chartW},${chartH - 20} L 0,${chartH - 20} Z`;

  // Inflection point coordinates (around Year 15)
  const inflectX = chartW * 0.52;
  const inflectY = chartH * 0.62;

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
          padding: '42px 38px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          background: 'rgba(8, 14, 24, 0.94)',
          border: '1.5px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 30px 100px rgba(0,0,0,0.85), 0 0 60px rgba(16, 185, 129, 0.25)',
          fontFamily: FONT.display,
        }}
      >
        {/* Header Title & Badges */}
        <div
          style={{
            transform: `scale(${Math.min(1, headerSpring)}) translateY(${(1 - headerSpring) * -16}px)`,
            opacity: headerSpring,
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid rgba(255, 255, 255, 0.10)',
            paddingBottom: 20,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  background: 'linear-gradient(135deg, #10B981, #FACC15)',
                  color: '#000000',
                  fontSize: 12,
                  fontWeight: 900,
                  padding: '4px 10px',
                  borderRadius: 6,
                  letterSpacing: '0.08em',
                }}
              >
                WEALTH MULTIPLIER
              </span>
              <span style={{ fontSize: 13, color: '#94A3B8', fontFamily: FONT.mono, fontWeight: 700 }}>
                {annualRate}
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF', marginTop: 6, letterSpacing: '-0.01em' }}>
              {title}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
              Year {timeframeYears} Wealth Net
            </div>
            <div
              style={{
                fontSize: 38,
                fontWeight: 900,
                color: '#10B981',
                fontFamily: FONT.mono,
                letterSpacing: '-0.03em',
                textShadow: '0 0 24px rgba(16, 185, 129, 0.6)',
              }}
            >
              ${currentCompoundVal.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Dual Trajectory Chart */}
        <div style={{ width: '100%', position: 'relative', height: chartH }}>
          {/* Timeline Year Markers */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              fontWeight: 800,
              color: '#64748B',
              fontFamily: FONT.mono,
              borderTop: '1px dashed rgba(255,255,255,0.12)',
              paddingTop: 8,
            }}
          >
            <span>YEAR 0</span>
            <span>YEAR 10</span>
            <span>YEAR 20</span>
            <span>YEAR 30</span>
          </div>

          <svg
            width="100%"
            height={chartH - 24}
            viewBox={`0 0 ${chartW} ${chartH}`}
            style={{ overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="snowballGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#FACC15" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Glowing Gradient Area Under Compound Curve */}
            <path
              d={areaFillPath}
              fill="url(#snowballGrad)"
              opacity={Math.min(1, compoundSpring)}
            />

            {/* Linear Cash Savings Line */}
            <path
              d={linearPath}
              fill="none"
              stroke="#64748B"
              strokeWidth={3}
              strokeDasharray="6 6"
              strokeDashoffset={1000 * (1 - Math.min(1, linearSpring))}
            />

            {/* Exponential S&P 500 Compound Curve */}
            <path
              d={compPath}
              fill="none"
              stroke="url(#snowballStroke)"
              strokeWidth={5}
              strokeDasharray={1200}
              strokeDashoffset={1200 * (1 - Math.min(1, compoundSpring))}
              style={{
                filter: 'drop-shadow(0 0 16px rgba(16, 185, 129, 0.9))',
              }}
            />

            <linearGradient id="snowballStroke" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#FACC15" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>

            {/* Inflection Sparkle (Year 15 Milestone) */}
            {sparkSpring > 0.05 && (
              <g
                transform={`translate(${inflectX}, ${inflectY}) scale(${Math.min(1, sparkSpring)})`}
                style={{ opacity: sparkSpring }}
              >
                <circle r={12} fill="#FACC15" opacity={0.3} style={{ filter: 'blur(4px)' }} />
                <circle r={6} fill="#FFFFFF" />
                <rect x={-80} y={-42} width={160} height={30} rx={6} fill="rgba(15, 23, 42, 0.90)" stroke="#FACC15" strokeWidth={1} />
                <text x={0} y={-22} fill="#FDE047" fontSize={11} fontWeight={800} textAnchor="middle" fontFamily={FONT.mono}>
                  INFLECTION POINT
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Comparison Footers */}
        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 18,
            opacity: compoundSpring,
          }}
        >
          {/* Card 1: Linear Cash */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: '16px 20px',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>
              Cash Saved Under Mattress ({monthlyDeposit})
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#E2E8F0', fontFamily: FONT.mono, marginTop: 4 }}>
              ${currentCashVal.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4, fontWeight: 700 }}>
              ❌ Zero growth • Subject to inflation erosion
            </div>
          </div>

          {/* Card 2: Compounded Wealth */}
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: 16,
              padding: '16px 20px',
              boxShadow: '0 0 24px rgba(16, 185, 129, 0.15)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#34D399' }}>
              Invested in S&P 500 Index Fund
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#10B981', fontFamily: FONT.mono, marginTop: 4 }}>
              ${currentCompoundVal.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#FACC15', marginTop: 4, fontWeight: 700 }}>
              ⚡ +$950,240 Pure Compound Alpha (6.3x Return)
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
