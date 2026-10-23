import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { COLORS, FONT, glassStyle, useExitFade } from '../shared';

interface Props {
  headline?: string;
  badge?: string;
  source?: string;
  failureRate?: number;
  label?: string;
  failLabel?: string;
  passLabel?: string;
  bottomStamp?: string;
  stampEmoji?: string;
  personality?: string;
}

export const WallStreetFailureHook: React.FC<Props> = ({
  headline = 'WALL STREET FAILURE RATE',
  badge = '⚠️ SPIVA 15-YEAR SCORECARD',
  source = 'Active Fund Managers vs S&P 500',
  failureRate = 92,
  label = 'FAIL RATE',
  failLabel = 'Failed to Beat S&P 500',
  passLabel = 'Beat S&P 500',
  bottomStamp,
  stampEmoji = '🚨',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 14);

  // Springs
  const enterSpring = spring({ frame, fps, config: { damping: 14, mass: 0.6, stiffness: 180 } });
  const stampSpring = spring({ frame: frame - 40, fps, config: { damping: 10, mass: 0.5, stiffness: 240 } });

  // Fast count-up ticker from 0 to 92%
  const countProgress = interpolate(frame, [4, 42], [0, failureRate], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const currentCount = Math.round(countProgress);

  // Pulse
  const pulse = Math.sin((frame / fps) * 8) * 0.04 + 1;
  const redGlow = Math.sin((frame / fps) * 6) * 20 + 40;

  // 100 icons grid (10 x 10)
  const totalIcons = 100;
  const failedCount = Math.round((currentCount / 100) * totalIcons);

  return (
    <AbsoluteFill
      style={{
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 28px',
        ...exit,
      }}
    >
      <div
        style={{
          ...glassStyle,
          width: '100%',
          maxWidth: 960,
          padding: '42px 34px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          background: 'rgba(10, 12, 22, 0.92)',
          border: '1.5px solid rgba(239, 68, 68, 0.35)',
          boxShadow: `0 30px 100px rgba(0,0,0,0.85), 0 0 ${redGlow}px rgba(239, 68, 68, 0.25)`,
        }}
      >
        {/* Top Warning Badge */}
        <div
          style={{
            transform: `scale(${Math.min(1, enterSpring)}) translateY(${(1 - enterSpring) * -20}px)`,
            opacity: enterSpring,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
              color: '#FFFFFF',
              fontFamily: FONT.display,
              fontWeight: 900,
              fontSize: 18,
              letterSpacing: 3,
              padding: '6px 20px',
              borderRadius: 16,
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.7)',
              textTransform: 'uppercase',
            }}
          >
            {badge}
          </div>
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 32,
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: 1.5,
              textAlign: 'center',
            }}
          >
            {headline}
          </div>
        </div>

        {/* Big Kinetic Counter Hero */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
            transform: `scale(${currentCount >= 92 ? pulse : 1})`,
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 110,
              fontWeight: 900,
              color: '#EF4444',
              lineHeight: 1,
              textShadow: '0 0 50px rgba(239, 68, 68, 0.9), 0 0 20px rgba(255, 255, 255, 0.3)',
            }}
          >
            {currentCount}%
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontFamily: FONT.display,
                fontSize: 28,
                fontWeight: 900,
                color: '#FCA5A5',
                letterSpacing: 2,
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 14,
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              {source}
            </span>
          </div>
        </div>

        {/* Actionable 100 Fund Managers Visual Grid */}
        <div
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 20,
            padding: '20px 22px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              fontFamily: FONT.mono,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <span style={{ color: '#F87171' }}>
              ❌ {failedCount} {failLabel}
            </span>
            <span style={{ color: '#34D399' }}>
              ✅ {Math.max(0, 100 - failedCount)} {passLabel}
            </span>
          </div>

          {/* 10 x 10 Dot / Icon Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(10, 1fr)',
              gap: 8,
              width: '100%',
              justifyItems: 'center',
            }}
          >
            {Array.from({ length: totalIcons }).map((_, i) => {
              const isFailed = i < failedCount;
              return (
                <div
                  key={i}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: isFailed
                      ? 'linear-gradient(135deg, #DC2626, #991B1B)'
                      : 'linear-gradient(135deg, #10B981, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 900,
                    color: '#FFFFFF',
                    boxShadow: isFailed
                      ? '0 0 10px rgba(220, 38, 38, 0.5)'
                      : '0 0 10px rgba(16, 185, 129, 0.7)',
                    transform: isFailed ? 'scale(1)' : 'scale(1.1)',
                    transition: 'all 0.1s ease',
                  }}
                >
                  {isFailed ? '✕' : '✓'}
                </div>
              );
            })}
          </div>
        </div>

        {/* Slamming Stamp when 92% is reached */}
        {stampSpring > 0.05 && (
          <div
            style={{
              transform: `scale(${Math.min(1, stampSpring)}) rotate(-3deg)`,
              opacity: Math.min(1, stampSpring * 2),
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.35) 100%)',
              border: '2px dashed #EF4444',
              borderRadius: 16,
              padding: '12px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.5)',
            }}
          >
            <span style={{ fontSize: 24 }}>{stampEmoji}</span>
            <span
              style={{
                fontFamily: FONT.display,
                fontSize: 19,
                fontWeight: 900,
                color: '#FECACA',
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              {bottomStamp || `${failureRate} OF 100 MANAGERS LOSE TO PASSIVE INDEX`}
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
