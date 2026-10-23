import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { COLORS, FONT, glassStyle, useExitFade } from '../shared';

interface Props {
  title?: string;
  wagerAmount?: string;
  timeframe?: string;
  side1Title?: string;
  side1Sub?: string;
  side1Fee?: string;
  side2Title?: string;
  side2Sub?: string;
  side2Fee?: string;
  personality?: string;
}

export const ShowdownDuel: React.FC<Props> = ({
  title = 'THE $1,000,000 SHOWDOWN',
  wagerAmount = '$1,000,000 WAGER',
  timeframe = '10-YEAR CONTEST • 2007 ➔ 2017',
  side1Title = 'S&P 500 INDEX',
  side1Sub = 'Warren Buffett',
  side1Fee = '0.03% Low Fee • 1 Fund',
  side2Title = '5 HEDGE FUNDS',
  side2Sub = 'Protégé Partners',
  side2Fee = '2% + 20% Fee • Elites',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 14);

  // Entrance spring animations
  const bannerProgress = spring({ frame, fps, config: { damping: 12, mass: 0.6, stiffness: 180 } });
  const card1Progress = spring({ frame: frame - 8, fps, config: { damping: 14, mass: 0.7, stiffness: 140 } });
  const vsProgress = spring({ frame: frame - 16, fps, config: { damping: 10, mass: 0.5, stiffness: 220 } });
  const card2Progress = spring({ frame: frame - 22, fps, config: { damping: 14, mass: 0.7, stiffness: 140 } });
  const footerProgress = spring({ frame: frame - 28, fps, config: { damping: 12, mass: 0.8, stiffness: 120 } });

  // Pulsing energy for VS
  const pulse = Math.sin((frame / fps) * 8) * 0.08 + 1;

  return (
    <AbsoluteFill
      style={{
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 32px',
        ...exit,
      }}
    >
      <div
        style={{
          ...glassStyle,
          width: '100%',
          maxWidth: 960,
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          background: 'rgba(10, 12, 22, 0.88)',
          border: '1.5px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 30px 100px rgba(0,0,0,0.85), 0 0 60px rgba(245, 158, 11, 0.25)',
        }}
      >
        {/* Top Glowing Wager Badge */}
        <div
          style={{
            transform: `scale(${Math.min(1, bannerProgress)}) translateY(${(1 - bannerProgress) * -30}px)`,
            opacity: bannerProgress,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              color: '#000000',
              fontFamily: FONT.display,
              fontWeight: 900,
              fontSize: 22,
              letterSpacing: 3,
              padding: '8px 24px',
              borderRadius: 20,
              boxShadow: '0 0 30px rgba(245, 158, 11, 0.6)',
              textTransform: 'uppercase',
            }}
          >
            🏆 {wagerAmount}
          </div>
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 34,
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: 1,
              textAlign: 'center',
            }}
          >
            {title}
          </div>
        </div>

        {/* Combatants Grid */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          {/* Side 1: S&P 500 (Vanguard / Buffett) */}
          <div
            style={{
              flex: 1,
              transform: `translateX(${(1 - card1Progress) * -50}px)`,
              opacity: card1Progress,
              background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.16) 0%, rgba(6, 78, 59, 0.28) 100%)',
              border: '2px solid rgba(16, 185, 129, 0.5)',
              borderRadius: 24,
              padding: '28px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: '0 0 40px rgba(16, 185, 129, 0.25)',
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 8 }}>📈</div>
            <div
              style={{
                fontFamily: FONT.display,
                fontSize: 28,
                fontWeight: 900,
                color: '#34D399',
                marginBottom: 4,
              }}
            >
              {side1Title}
            </div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 16,
                color: 'rgba(255,255,255,0.7)',
                marginBottom: 16,
              }}
            >
              {side1Sub}
            </div>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#A7F3D0',
                fontFamily: FONT.mono,
                fontSize: 14,
                fontWeight: 700,
                padding: '6px 14px',
                borderRadius: 12,
                border: '1px solid rgba(16, 185, 129, 0.4)',
              }}
            >
              {side1Fee}
            </div>
          </div>

          {/* VS Divider */}
          <div
            style={{
              transform: `scale(${vsProgress * pulse})`,
              opacity: vsProgress,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                background: 'linear-gradient(135deg, #EF4444, #F59E0B)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 35px rgba(239, 68, 68, 0.8)',
                fontFamily: FONT.display,
                fontWeight: 900,
                fontSize: 24,
                color: '#FFFFFF',
              }}
            >
              VS
            </div>
          </div>

          {/* Side 2: Hedge Funds */}
          <div
            style={{
              flex: 1,
              transform: `translateX(${(1 - card2Progress) * 50}px)`,
              opacity: card2Progress,
              background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.16) 0%, rgba(127, 29, 29, 0.28) 100%)',
              border: '2px solid rgba(239, 68, 68, 0.5)',
              borderRadius: 24,
              padding: '28px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: '0 0 40px rgba(239, 68, 68, 0.25)',
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 8 }}>💼</div>
            <div
              style={{
                fontFamily: FONT.display,
                fontSize: 28,
                fontWeight: 900,
                color: '#F87171',
                marginBottom: 4,
              }}
            >
              {side2Title}
            </div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 16,
                color: 'rgba(255,255,255,0.7)',
                marginBottom: 16,
              }}
            >
              {side2Sub}
            </div>
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#FECACA',
                fontFamily: FONT.mono,
                fontSize: 14,
                fontWeight: 700,
                padding: '6px 14px',
                borderRadius: 12,
                border: '1px solid rgba(239, 68, 68, 0.4)',
              }}
            >
              {side2Fee}
            </div>
          </div>
        </div>

        {/* Bottom Timeframe Bar */}
        <div
          style={{
            transform: `translateY(${(1 - footerProgress) * 20}px)`,
            opacity: footerProgress,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: 16,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <span style={{ fontSize: 20 }}>⏳</span>
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 17,
              fontWeight: 700,
              color: '#FCD34D',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            {timeframe}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
