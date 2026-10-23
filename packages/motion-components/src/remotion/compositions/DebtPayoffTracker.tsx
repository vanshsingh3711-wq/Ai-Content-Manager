import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

interface DebtItem {
  name: string;
  balance: string;
  apr: string;
  isPaid?: boolean;
}

interface Props {
  title?: string;
  strategy?: string;
  totalDebt?: string;
  freedCashflow?: string;
}

const DEFAULT_DEBTS: DebtItem[] = [
  { name: 'Credit Card Debt', balance: '$4,200', apr: '26.99% APR', isPaid: true },
  { name: 'Personal Loan', balance: '$9,800', apr: '14.50% APR' },
  { name: 'Auto Loan', balance: '$21,400', apr: '6.20% APR' },
];

export const DebtPayoffTracker: React.FC<Props> = ({
  title = 'THE DEBT AVALANCHE ACCELERATOR',
  strategy = 'MATHEMATICAL HIGHEST-APR DESTROYER',
  totalDebt = '$35,400 TOTAL DEBT',
  freedCashflow = '+$650 / MONTH FREED CAPITAL',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 14);

  const headerSpring = spring({ frame, fps, config: { damping: 14, mass: 0.6, stiffness: 150 } });
  const cardSpring = spring({ frame: frame - 10, fps, config: { damping: 14, mass: 0.8, stiffness: 120 } });
  const stampSpring = spring({ frame: frame - 22, fps, config: { damping: 8, mass: 0.4, stiffness: 220 } });
  const siphonSpring = spring({ frame: frame - 30, fps, config: { damping: 12, mass: 0.6, stiffness: 140 } });

  const progress = Math.min(100, Math.round(interpolate(cardSpring, [0, 1], [0, 100])));

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
          background: 'rgba(10, 12, 22, 0.94)',
          border: '1.5px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 30px 100px rgba(0,0,0,0.85), 0 0 60px rgba(239, 68, 68, 0.20)',
          fontFamily: FONT.display,
        }}
      >
        {/* Header */}
        <div
          style={{
            transform: `scale(${Math.min(1, headerSpring)}) translateY(${(1 - headerSpring) * -16}px)`,
            opacity: headerSpring,
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.10)',
            paddingBottom: 18,
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-block',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#EF4444',
                fontSize: 12,
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 6,
                letterSpacing: '0.08em',
                fontFamily: FONT.mono,
              }}
            >
              {strategy}
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF', marginTop: 6 }}>
              {title}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>INITIAL BALANCE</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#EF4444', fontFamily: FONT.mono }}>
              {totalDebt}
            </div>
          </div>
        </div>

        {/* Debt Stack */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            opacity: cardSpring,
          }}
        >
          {DEFAULT_DEBTS.map((d, i) => {
            const isTarget = i === 0;
            return (
              <div
                key={i}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 24px',
                  background: isTarget ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1.5px solid ${isTarget ? '#10B981' : 'rgba(255, 255, 255, 0.10)'}`,
                  borderRadius: 16,
                  boxShadow: isTarget ? '0 0 30px rgba(16, 185, 129, 0.20)' : 'none',
                  overflow: 'hidden',
                }}
              >
                {/* Progress bar fill for active target */}
                {isTarget && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      width: `${progress}%`,
                      background: 'rgba(16, 185, 129, 0.18)',
                      borderRight: '2px solid #10B981',
                      transition: 'width 0.1s ease',
                    }}
                  />
                )}

                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#FFFFFF' }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: '#EF4444', fontFamily: FONT.mono, fontWeight: 800 }}>
                    {d.apr}
                  </div>
                </div>

                <div style={{ textAlign: 'right', position: 'relative', zIndex: 2 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: isTarget ? '#10B981' : '#E2E8F0', fontFamily: FONT.mono }}>
                    {isTarget ? '$0.00' : d.balance}
                  </div>
                  <div style={{ fontSize: 11, color: isTarget ? '#34D399' : '#94A3B8', fontWeight: 700 }}>
                    {isTarget ? '100% ELIMINATED' : 'NEXT TARGET IN QUEUE'}
                  </div>
                </div>

                {/* Rubber Stamp on Paid Off Card */}
                {isTarget && stampSpring > 0.1 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '38%',
                      transform: `rotate(-8deg) scale(${Math.min(1, stampSpring)})`,
                      opacity: stampSpring,
                      border: '3px solid #10B981',
                      borderRadius: 10,
                      padding: '6px 20px',
                      background: 'rgba(16, 185, 129, 0.20)',
                      color: '#10B981',
                      fontSize: 22,
                      fontWeight: 900,
                      letterSpacing: '0.12em',
                      fontFamily: FONT.mono,
                      textShadow: '0 0 16px rgba(16, 185, 129, 0.8)',
                    }}
                  >
                    PAID IN FULL
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Siphon Freed Cashflow Footer */}
        <div
          style={{
            transform: `scale(${Math.min(1, siphonSpring)})`,
            opacity: siphonSpring,
            width: '100%',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 14,
            padding: '14px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 600 }}>
            Snowball unlocked: Monthly payment automatically cascades into Loan #2.
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#10B981', fontFamily: FONT.mono }}>
            {freedCashflow}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
