import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

interface Props {
  title?: string;
  badge?: string;
  perceivedLabel?: string;
  perceivedValue?: number;
  perceivedSub?: string;
  actualLabel?: string;
  actualValue?: number;
  actualSub?: string;
  deltaLabel?: string;
  deltaSub?: string;
  personality?: string;
}

export const PerceptionGauge: React.FC<Props> = ({
  title = 'CORNELL SPOTLIGHT STUDY',
  badge = '🔬 EMPIRICAL PSYCHOLOGY',
  perceivedLabel = 'PERCEIVED NOTICED',
  perceivedValue = 54,
  perceivedSub = "Subject's Fear: 'Everyone is judging me'",
  actualLabel = 'ACTUALLY NOTICED',
  actualValue = 18,
  actualSub = 'Reality: Less than 20% even glanced',
  deltaLabel = '⚡ 3X OVERESTIMATION GAP ⚡',
  deltaSub = 'Nobody is watching you. Everyone is trapped in their own ego.',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 10);

  // Springs
  const headerSpring = spring({ frame, fps, config: { damping: 12, mass: 0.5, stiffness: 200 } });
  const perceivedSpring = spring({ frame: Math.max(0, frame - 4), fps, config: { damping: 12, mass: 0.7, stiffness: 140 } });
  const actualSpring = spring({ frame: Math.max(0, frame - 16), fps, config: { damping: 12, mass: 0.7, stiffness: 160 } });
  const stampSpring = spring({ frame: Math.max(0, frame - 28), fps, config: { damping: 9, mass: 0.4, stiffness: 240 } });

  // Animated counters
  const perceivedCount = Math.round(interpolate(perceivedSpring, [0, 1], [0, perceivedValue]));
  const actualCount = Math.round(interpolate(actualSpring, [0, 1], [0, actualValue]));

  // Bar progress widths
  const perceivedWidth = interpolate(perceivedSpring, [0, 1], [0, perceivedValue]);
  const actualWidth = interpolate(actualSpring, [0, 1], [0, actualValue]);

  const pulse = Math.sin((frame / fps) * 8) * 0.04 + 1;

  return (
    <AbsoluteFill
      style={{
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 24px',
        ...exit,
      }}
    >
      <div
        style={{
          ...glassStyle,
          width: '100%',
          maxWidth: 960,
          padding: '36px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          background: 'rgba(8, 10, 18, 0.94)',
          border: '1.5px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 30px 100px rgba(0,0,0,0.9), 0 0 60px rgba(16, 185, 129, 0.20)',
        }}
      >
        {/* Header */}
        <div
          style={{
            transform: `scale(${Math.min(1, headerSpring)})`,
            opacity: headerSpring,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
              color: '#FFFFFF',
              fontFamily: FONT.display,
              fontWeight: 900,
              fontSize: 16,
              letterSpacing: 3,
              padding: '6px 20px',
              borderRadius: 16,
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.7)',
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
            {title}
          </div>
        </div>

        {/* Dual Comparison Cards */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
          
          {/* Card 1: Perceived (Red/Fear) */}
          <div
            style={{
              transform: `translateX(${(1 - perceivedSpring) * -40}px)`,
              opacity: perceivedSpring,
              background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.16) 0%, rgba(127, 29, 29, 0.28) 100%)',
              border: '2px solid rgba(239, 68, 68, 0.55)',
              borderRadius: 20,
              padding: '20px 24px',
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>😰</span>
                <div>
                  <div style={{ fontFamily: FONT.display, fontSize: 20, fontWeight: 900, color: '#F87171' }}>
                    {perceivedLabel}
                  </div>
                  <div style={{ fontFamily: FONT.mono, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                    {perceivedSub}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 42,
                  fontWeight: 900,
                  color: '#EF4444',
                  textShadow: '0 0 25px rgba(239, 68, 68, 0.8)',
                }}
              >
                {perceivedCount}%
              </div>
            </div>

            {/* Glowing Progress Bar */}
            <div
              style={{
                width: '100%',
                height: 22,
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 11,
                overflow: 'hidden',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <div
                style={{
                  width: `${perceivedWidth}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #991B1B 0%, #DC2626 70%, #EF4444 100%)',
                  borderRadius: 11,
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.7)',
                }}
              />
            </div>
          </div>

          {/* Card 2: Actual Reality (Emerald/Calm) */}
          <div
            style={{
              transform: `translateX(${(1 - actualSpring) * 40}px)`,
              opacity: actualSpring,
              background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.16) 0%, rgba(6, 78, 59, 0.28) 100%)',
              border: '2px solid rgba(16, 185, 129, 0.6)',
              borderRadius: 20,
              padding: '20px 24px',
              boxShadow: '0 0 35px rgba(16, 185, 129, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>👀</span>
                <div>
                  <div style={{ fontFamily: FONT.display, fontSize: 20, fontWeight: 900, color: '#34D399' }}>
                    {actualLabel}
                  </div>
                  <div style={{ fontFamily: FONT.mono, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                    {actualSub}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 42,
                  fontWeight: 900,
                  color: '#10B981',
                  textShadow: '0 0 30px rgba(16, 185, 129, 0.9)',
                  transform: `scale(${actualSpring > 0.9 ? pulse : 1})`,
                }}
              >
                {actualCount}%
              </div>
            </div>

            {/* Glowing Reality Bar */}
            <div
              style={{
                width: '100%',
                height: 22,
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 11,
                overflow: 'hidden',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <div
                style={{
                  width: `${actualWidth}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #059669 0%, #10B981 70%, #6EE7B7 100%)',
                  borderRadius: 11,
                  boxShadow: '0 0 25px rgba(16, 185, 129, 0.8)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Slamming Gap Stamp */}
        {stampSpring > 0.05 && (
          <div
            style={{
              transform: `scale(${Math.min(1, stampSpring)})`,
              opacity: Math.min(1, stampSpring * 2),
              width: '100%',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.35) 100%)',
              border: '2px solid rgba(245, 158, 11, 0.8)',
              borderRadius: 18,
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              boxShadow: '0 0 35px rgba(245, 158, 11, 0.5)',
            }}
          >
            <span style={{ fontSize: 26 }}>⚡</span>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: FONT.display,
                  fontSize: 20,
                  fontWeight: 900,
                  color: '#FCD34D',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                }}
              >
                {deltaLabel}
              </div>
              <div style={{ fontFamily: FONT.mono, fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                {deltaSub}
              </div>
            </div>
            <span style={{ fontSize: 26 }}>⚡</span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
