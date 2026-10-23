import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

interface Props {
  monthlyIncome?: string;
  needsAmount?: string;
  wantsAmount?: string;
  investAmount?: string;
  title?: string;
}

export const BudgetWaterfall: React.FC<Props> = ({
  monthlyIncome = '$5,000 Net Income',
  needsAmount = '$2,500 (Rent, Food, Health)',
  wantsAmount = '$1,500 (Dining, Trips, Tech)',
  investAmount = '$1,000 (Index Funds & Wealth)',
  title = 'THE 50 / 30 / 20 WATERFALL SYSTEM',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 14);

  const headerSpring = spring({ frame, fps, config: { damping: 14, mass: 0.6, stiffness: 150 } });
  const streamSpring = spring({ frame: frame - 10, fps, config: { damping: 12, mass: 0.8, stiffness: 110 } });
  const jarsSpring = spring({ frame: frame - 18, fps, config: { damping: 14, mass: 0.8, stiffness: 120 } });

  const streamProgress = Math.min(1, streamSpring);

  const jars = [
    { label: '50% ESSENTIALS', title: 'Needs & Survival', amount: needsAmount, color: '#64748B', fillPct: 0.5 },
    { label: '30% LIFESTYLE', title: 'Wants & Guilt-Free', amount: wantsAmount, color: '#F43F5E', fillPct: 0.3 },
    { label: '20% FREEDOM', title: 'Future Wealth Fund', amount: investAmount, color: '#10B981', fillPct: 0.85, isHighlight: true },
  ];

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
          border: '1.5px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 30px 100px rgba(0,0,0,0.85), 0 0 60px rgba(16, 185, 129, 0.20)',
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
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38BDF8',
              fontSize: 12,
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: 6,
              letterSpacing: '0.08em',
              fontFamily: FONT.mono,
              marginBottom: 8,
            }}
          >
            CASHFLOW ARCHITECTURE
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
            {title}
          </div>
          <div style={{ fontSize: 14, color: '#34D399', marginTop: 4, fontWeight: 800, fontFamily: FONT.mono }}>
            Allocating {monthlyIncome}
          </div>
        </div>

        {/* 3 Cylindrical Jars / Buckets */}
        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
            opacity: jarsSpring,
            transform: `translateY(${(1 - jarsSpring) * 20}px)`,
          }}
        >
          {jars.map((j, i) => {
            const currentFill = j.fillPct * streamProgress;
            return (
              <div
                key={i}
                style={{
                  background: j.isHighlight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1.5px solid ${j.isHighlight ? '#10B981' : 'rgba(255, 255, 255, 0.12)'}`,
                  borderRadius: 20,
                  padding: '24px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: j.isHighlight ? '0 0 30px rgba(16, 185, 129, 0.25)' : 'none',
                }}
              >
                {/* Fluid Fill Level */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: `${currentFill * 100}%`,
                    background: `linear-gradient(to top, ${j.color}40, ${j.color}15)`,
                    borderTop: `2px solid ${j.color}`,
                    transition: 'height 0.2s ease-out',
                  }}
                />

                <div
                  style={{
                    background: `${j.color}25`,
                    color: j.color,
                    fontSize: 11,
                    fontWeight: 900,
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontFamily: FONT.mono,
                    letterSpacing: '0.06em',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  {j.label}
                </div>

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: '#FFFFFF',
                    marginTop: 12,
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  {j.title}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: '#CBD5E1',
                    marginTop: 8,
                    textAlign: 'center',
                    fontWeight: 600,
                    fontFamily: FONT.mono,
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  {j.amount}
                </div>

                {j.isHighlight && (
                  <div
                    style={{
                      marginTop: 16,
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#FACC15',
                      background: 'rgba(250, 204, 21, 0.15)',
                      padding: '4px 8px',
                      borderRadius: 6,
                      position: 'relative',
                      zIndex: 2,
                    }}
                  >
                    ⚡ COMPOUNDING ENGINE
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Rule */}
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
          Automate the 20% on the day your paycheck arrives. Never budget what is left after spending; spend what is left after investing.
        </div>
      </div>
    </AbsoluteFill>
  );
};
