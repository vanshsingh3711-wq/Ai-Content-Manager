import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

interface Props {
  headline?: string;
  source?: string;
  depositAmount?: number;
  newNetWorth?: number;
  appTitle?: string;
  badge?: string;
}

export const BankingNotification: React.FC<Props> = ({
  headline = 'Direct Deposit Received',
  source = 'VOO Quarterly Dividend Payout • Vanguard',
  depositAmount = 4250,
  newNetWorth = 89450,
  appTitle = 'FINANCE WALLET',
  badge = '100% PASSIVE CASHFLOW',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 14);

  // Staggered spring animations
  const dropSpring = spring({ frame, fps, config: { damping: 12, mass: 0.7, stiffness: 140 } });
  const rollSpring = spring({ frame: frame - 10, fps, config: { damping: 14, mass: 0.8, stiffness: 100 } });
  const netWorthSpring = spring({ frame: frame - 20, fps, config: { damping: 10, mass: 0.5, stiffness: 160 } });

  const currentDeposit = Math.round(
    interpolate(rollSpring, [0, 1], [0, depositAmount], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

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
          background: 'rgba(8, 14, 22, 0.94)',
          border: '1.5px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 30px 100px rgba(0,0,0,0.85), 0 0 60px rgba(16, 185, 129, 0.25)',
          fontFamily: FONT.display,
        }}
      >
        {/* iOS-Style Push Notification Card */}
        <div
          style={{
            transform: `translateY(${(1 - dropSpring) * -60}px) scale(${0.9 + dropSpring * 0.1})`,
            opacity: dropSpring,
            width: '100%',
            maxWidth: 720,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(30px)',
            border: '1.5px solid rgba(255, 255, 255, 0.18)',
            borderRadius: 24,
            padding: '24px 28px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(16, 185, 129, 0.20)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* Notification Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  color: '#FFFFFF',
                  fontWeight: 900,
                  boxShadow: '0 0 12px rgba(16, 185, 129, 0.5)',
                }}
              >
                $
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#E2E8F0', letterSpacing: '0.04em' }}>
                  {appTitle}
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>JUST NOW • AUTOMATED DEPOSIT</div>
              </div>
            </div>

            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#10B981',
                background: 'rgba(16, 185, 129, 0.15)',
                padding: '4px 10px',
                borderRadius: 9999,
                border: '1px solid rgba(16, 185, 129, 0.35)',
              }}
            >
              {badge}
            </span>
          </div>

          {/* Core Payout Amount */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF' }}>
                {headline}
              </div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4, fontWeight: 600 }}>
                {source}
              </div>
            </div>

            <div
              style={{
                fontSize: 44,
                fontWeight: 900,
                color: '#10B981',
                fontFamily: FONT.mono,
                letterSpacing: '-0.02em',
                textShadow: '0 0 24px rgba(16, 185, 129, 0.6)',
              }}
            >
              +${currentDeposit.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Total Net Worth Card (Revealed below) */}
        <div
          style={{
            transform: `scale(${Math.min(1, netWorthSpring)})`,
            opacity: netWorthSpring,
            width: '100%',
            maxWidth: 720,
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
            borderRadius: 18,
            padding: '20px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
              Total Compounded Portfolio Valuation
            </div>
            <div style={{ fontSize: 13, color: '#CBD5E1', marginTop: 2, fontWeight: 600 }}>
              Auto-reinvested via DRIP protocol • Zero human effort
            </div>
          </div>

          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: '#FACC15',
              fontFamily: FONT.mono,
              textShadow: '0 0 16px rgba(250, 204, 21, 0.4)',
            }}
          >
            ${newNetWorth.toLocaleString()}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
