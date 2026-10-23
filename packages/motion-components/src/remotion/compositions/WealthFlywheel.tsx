import React from 'react';
import { AbsoluteFill, useVideoConfig, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

interface Props {
  mode?: 'wealth' | 'trap';
  title?: string;
  speedMultiplier?: number;
}

const WEALTH_NODES = [
  '1. High-Income Skills',
  '2. 20% Auto-Invested',
  '3. S&P 500 Compounding',
  '4. Passive Dividends',
  '5. Financial Sovereignty',
];

const TRAP_NODES = [
  '1. 9-to-5 Income',
  '2. Lifestyle Inflation',
  '3. High-Interest Debt',
  '4. Minimum Payments',
  '5. Financial Exhaustion',
];

export const WealthFlywheel: React.FC<Props> = ({
  mode = 'wealth',
  title = 'THE EXPONENTIAL WEALTH FLYWHEEL',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 14);

  const isWealth = mode === 'wealth';
  const nodes = isWealth ? WEALTH_NODES : TRAP_NODES;
  const accentColor = isWealth ? '#10B981' : '#EF4444';
  const accentGlow = isWealth ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';

  const headerSpring = spring({ frame, fps, config: { damping: 14, mass: 0.6, stiffness: 150 } });
  const wheelSpring = spring({ frame: frame - 10, fps, config: { damping: 12, mass: 0.8, stiffness: 100 } });

  // Rotating angle (accelerating over time)
  const rotationDeg = (frame * 1.5) % 360;

  const size = 320;
  const radius = 120;

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
          gap: 26,
          background: 'rgba(8, 12, 22, 0.94)',
          border: `1.5px solid ${accentColor}40`,
          boxShadow: `0 30px 100px rgba(0,0,0,0.85), 0 0 60px ${accentGlow}`,
          fontFamily: FONT.display,
        }}
      >
        {/* Header */}
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
              background: `${accentColor}20`,
              border: `1px solid ${accentColor}50`,
              color: accentColor,
              fontSize: 12,
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: 6,
              letterSpacing: '0.08em',
              fontFamily: FONT.mono,
              marginBottom: 8,
            }}
          >
            {isWealth ? 'VIRTUOUS CAPITAL CYCLE' : 'VICIOUS RAT RACE TRAP'}
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
            {title}
          </div>
        </div>

        {/* Circular Kinetic Ring */}
        <div
          style={{
            width: size + 160,
            height: size + 40,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: wheelSpring,
            transform: `scale(${Math.min(1, wheelSpring)})`,
          }}
        >
          {/* Rotating Ring Track */}
          <div
            style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: '50%',
              border: `2px dashed ${accentColor}60`,
              transform: `rotate(${rotationDeg}deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.05s linear',
            }}
          />

          {/* Center Hub */}
          <div
            style={{
              position: 'absolute',
              width: 130,
              height: 130,
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.95)',
              border: `2px solid ${accentColor}`,
              boxShadow: `0 0 30px ${accentGlow}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              zIndex: 3,
            }}
          >
            <div style={{ fontSize: 28 }}>{isWealth ? '⚡' : '⛓️'}</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#FFFFFF', marginTop: 2 }}>
              {isWealth ? 'FLYWHEEL' : 'THE TRAP'}
            </div>
            <div style={{ fontSize: 10, color: accentColor, fontWeight: 800, fontFamily: FONT.mono }}>
              {isWealth ? 'COMPOUNDING' : 'DRAINING'}
            </div>
          </div>

          {/* 5 Orbital Nodes */}
          {nodes.map((nodeText, i) => {
            const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
            const x = Math.cos(angle) * (radius + 25);
            const y = Math.sin(angle) * (radius + 20);

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  transform: `translate(${x}px, ${y}px)`,
                  background: 'rgba(15, 23, 42, 0.92)',
                  border: `1.5px solid ${accentColor}60`,
                  borderRadius: 12,
                  padding: '8px 14px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  whiteSpace: 'nowrap',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  zIndex: 2,
                }}
              >
                {nodeText}
              </div>
            );
          })}
        </div>

        {/* Footer Insight */}
        <div
          style={{
            fontSize: 12,
            color: '#94A3B8',
            textAlign: 'center',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 14,
            width: '100%',
            fontWeight: 600,
          }}
        >
          Once the wealth flywheel spins, each completed rotation requires less effort while producing exponentially greater financial gravity.
        </div>
      </div>
    </AbsoluteFill>
  );
};
