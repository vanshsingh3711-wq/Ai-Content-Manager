import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { COLORS, FONT, glassStyle, useExitFade } from '../shared';

interface Props {
  title?: string;
  subtitle?: string;
  sp500Label?: string;
  sp500Return?: number;
  hedgeLabel?: string;
  hedgeReturn?: number;
  deltaLabel?: string;
  side1Sub?: string;
  side1FooterLabel?: string;
  side1FooterVal?: string;
  side2Sub?: string;
  side2FooterLabel?: string;
  side2FooterVal?: string;
  deltaSub?: string;
  personality?: string;
}

export const BattleChart: React.FC<Props> = ({
  title = '10-YEAR RESULTS: THE VERDICT',
  subtitle = 'BUFFETT $1,000,000 CHALLENGE',
  sp500Label = 'S&P 500 INDEX FUND',
  sp500Return = 126,
  hedgeLabel = 'TOP 5 HEDGE FUNDS',
  hedgeReturn = 36,
  deltaLabel = '+90% S&P 500 ADVANTAGE',
  side1Sub = 'Warren Buffett • Low Cost (0.03% Fee)',
  side1FooterLabel = '$1,000,000 Wager grew to:',
  side1FooterVal,
  side2Sub = 'High Fees (2% Mgmt + 20% Performance Fee)',
  side2FooterLabel = '$1,000,000 Wager grew to:',
  side2FooterVal,
  deltaSub = 'Index Generated 3.5x More Net Wealth Than Wall Street Elites',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 14);

  // Staggered spring entrances
  const headerSpring = spring({ frame, fps, config: { damping: 14, mass: 0.6, stiffness: 160 } });
  const spBarSpring = spring({ frame: frame - 6, fps, config: { damping: 12, mass: 0.8, stiffness: 100 } });
  const hedgeBarSpring = spring({ frame: frame - 14, fps, config: { damping: 14, mass: 0.8, stiffness: 110 } });
  const badgeSpring = spring({ frame: frame - 24, fps, config: { damping: 10, mass: 0.5, stiffness: 200 } });

  // Animated counters
  const spValue = Math.min(
    sp500Return,
    Math.round(interpolate(spBarSpring, [0, 1], [0, sp500Return]))
  );
  const hedgeValue = Math.min(
    hedgeReturn,
    Math.round(interpolate(hedgeBarSpring, [0, 1], [0, hedgeReturn]))
  );

  // Bar widths (scaled so S&P is 100% of available bar width)
  const spWidth = Math.min(100, (sp500Return / 126) * 100 * Math.min(1, spBarSpring));
  const hedgeWidth = Math.min(100, (hedgeReturn / 126) * 100 * Math.min(1, hedgeBarSpring));

  // Pulse effects
  const pulse = Math.sin((frame / fps) * 6) * 0.05 + 1;
  const winnerGlow = Math.sin((frame / fps) * 5) * 15 + 30;

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
          padding: '44px 38px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 32,
          background: 'rgba(10, 12, 22, 0.90)',
          border: '1.5px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 30px 100px rgba(0,0,0,0.85), 0 0 60px rgba(16, 185, 129, 0.20)',
        }}
      >
        {/* Header Badge */}
        <div
          style={{
            transform: `scale(${Math.min(1, headerSpring)}) translateY(${(1 - headerSpring) * -20}px)`,
            opacity: headerSpring,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: '#FFFFFF',
              fontFamily: FONT.display,
              fontWeight: 900,
              fontSize: 20,
              letterSpacing: 3,
              padding: '6px 22px',
              borderRadius: 20,
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.6)',
              textTransform: 'uppercase',
            }}
          >
            📊 {subtitle}
          </div>
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 36,
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: 1.5,
              textAlign: 'center',
            }}
          >
            {title}
          </div>
        </div>

        {/* Visual Comparison Area */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 28 }}>
          
          {/* Winner Row: S&P 500 */}
          <div
            style={{
              transform: `translateX(${(1 - spBarSpring) * -40}px)`,
              opacity: spBarSpring,
              background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.14) 0%, rgba(6, 78, 59, 0.25) 100%)',
              border: '2px solid rgba(16, 185, 129, 0.55)',
              borderRadius: 24,
              padding: '24px 26px',
              boxShadow: `0 0 ${winnerGlow}px rgba(16, 185, 129, 0.35)`,
            }}
          >
            {/* Top row: Label + Return Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>👑</span>
                <div>
                  <div style={{ fontFamily: FONT.display, fontSize: 24, fontWeight: 900, color: '#34D399' }}>
                    {sp500Label}
                  </div>
                  <div style={{ fontFamily: FONT.mono, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                    {side1Sub}
                  </div>
                </div>
              </div>

              {/* Animated Big Number */}
              <div
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 48,
                  fontWeight: 900,
                  color: '#10B981',
                  textShadow: '0 0 30px rgba(16, 185, 129, 0.9)',
                  transform: `scale(${spBarSpring > 0.9 ? pulse : 1})`,
                }}
              >
                +{spValue}%
              </div>
            </div>

            {/* Glowing Growth Bar */}
            <div
              style={{
                width: '100%',
                height: 28,
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <div
                style={{
                  width: `${spWidth}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #059669 0%, #10B981 60%, #6EE7B7 100%)',
                  borderRadius: 14,
                  boxShadow: '0 0 25px rgba(16, 185, 129, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: 12,
                }}
              >
                <div style={{ width: 6, height: 16, background: '#FFFFFF', borderRadius: 3, opacity: 0.8 }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: FONT.mono, fontSize: 13, color: '#A7F3D0' }}>
              <span>{side1FooterLabel}</span>
              <span style={{ fontWeight: 800 }}>{side1FooterVal || `$2,258,000 (+${spValue}%)`}</span>
            </div>
          </div>

          {/* Loser Row: 5 Hedge Funds */}
          <div
            style={{
              transform: `translateX(${(1 - hedgeBarSpring) * 40}px)`,
              opacity: hedgeBarSpring,
              background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.12) 0%, rgba(127, 29, 29, 0.22) 100%)',
              border: '2px solid rgba(239, 68, 68, 0.45)',
              borderRadius: 24,
              padding: '24px 26px',
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.2)',
            }}
          >
            {/* Top row: Label + Return Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>📉</span>
                <div>
                  <div style={{ fontFamily: FONT.display, fontSize: 24, fontWeight: 900, color: '#F87171' }}>
                    {hedgeLabel}
                  </div>
                  <div style={{ fontFamily: FONT.mono, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                    {side2Sub}
                  </div>
                </div>
              </div>

              {/* Animated Stalled Number */}
              <div
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 44,
                  fontWeight: 900,
                  color: '#EF4444',
                  textShadow: '0 0 25px rgba(239, 68, 68, 0.8)',
                }}
              >
                +{hedgeValue}%
              </div>
            </div>

            {/* Stalled Growth Bar */}
            <div
              style={{
                width: '100%',
                height: 28,
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <div
                style={{
                  width: `${hedgeWidth}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #991B1B 0%, #DC2626 70%, #EF4444 100%)',
                  borderRadius: 14,
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: 12,
                }}
              >
                <div style={{ width: 6, height: 16, background: '#FFFFFF', borderRadius: 3, opacity: 0.6 }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: FONT.mono, fontSize: 13, color: '#FECACA' }}>
              <span>{side2FooterLabel}</span>
              <span style={{ fontWeight: 800 }}>{side2FooterVal || `$1,363,000 (+${hedgeValue}%)`}</span>
            </div>
          </div>
        </div>

        {/* Massive Outperformance Callout */}
        <div
          style={{
            transform: `scale(${Math.min(1, badgeSpring)})`,
            opacity: badgeSpring,
            width: '100%',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.32) 100%)',
            border: '2px solid rgba(245, 158, 11, 0.7)',
            borderRadius: 20,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            boxShadow: '0 0 40px rgba(245, 158, 11, 0.4)',
          }}
        >
          <span style={{ fontSize: 26 }}>⚡</span>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: FONT.display,
                fontSize: 22,
                fontWeight: 900,
                color: '#FCD34D',
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              {deltaLabel}
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
              {deltaSub}
            </div>
          </div>
          <span style={{ fontSize: 26 }}>⚡</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
