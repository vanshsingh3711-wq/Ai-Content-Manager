import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

interface Props {
  title?: string;
  subtitle?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  q1Title?: string;
  q1Desc?: string;
  q2Title?: string;
  q2Desc?: string;
  q3Title?: string;
  q3Desc?: string;
  q4Title?: string;
  q4Desc?: string;
  activeQuadrant?: number; // 1, 2, 3, or 4
}

export const QuadrantMatrix: React.FC<Props> = ({
  title = 'EISENHOWER DECISION MATRIX',
  subtitle = 'URGENCY VS IMPORTANCE FRAMEWORK',
  xAxisLabel = 'IMPORTANCE ➔',
  yAxisLabel = 'URGENCY ➔',
  q1Title = 'DO FIRST',
  q1Desc = 'Critical Crises & Deadlines',
  q2Title = 'SCHEDULE',
  q2Desc = 'High-Value Strategic Growth',
  q3Title = 'DELEGATE',
  q3Desc = 'Interruptions & Busywork',
  q4Title = 'ELIMINATE',
  q4Desc = 'Mindless Time Wasters',
  activeQuadrant = 2,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width = 1080, height = 1920 } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 14);
  const scale = Math.min(width / 1080, height / 1920);

  const headerSpring = spring({ frame, fps, config: { damping: 14, mass: 0.7, stiffness: 140 } });
  const gridSpring = spring({ frame: frame - 12, fps, config: { damping: 13, mass: 0.8, stiffness: 120 } });
  const beaconSpring = spring({ frame: frame - 28, fps, config: { damping: 10, mass: 0.5, stiffness: 180 } });

  const pulseScale = 1 + Math.sin(frame * 0.16) * 0.05;

  const quadrants = [
    { num: 1, title: q1Title, desc: q1Desc, color: '#EF4444', label: 'URGENT & IMPORTANT' },
    { num: 2, title: q2Title, desc: q2Desc, color: '#38BDF8', label: 'IMPORTANT • NOT URGENT' },
    { num: 3, title: q3Title, desc: q3Desc, color: '#F59E0B', label: 'URGENT • NOT IMPORTANT' },
    { num: 4, title: q4Title, desc: q4Desc, color: '#6B7280', label: 'NEITHER' },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#030712',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        opacity: exit.opacity,
      }}
    >
      <div
        style={{
          width: 1080,
          height: 1920,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          fontFamily: FONT.display,
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '110px 48px',
          position: 'relative',
          flexShrink: 0,
        }}
      >
      {/* Background ambient lighting */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 820,
          height: 820,
          background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, rgba(239,68,68,0.08) 50%, transparent 70%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      {/* Header Container */}
      <div
        style={{
          textAlign: 'center',
          transform: `translateY(${(1 - headerSpring) * -30}px)`,
          opacity: headerSpring,
          marginBottom: 36,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 24px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(56,189,248,0.4)',
            backdropFilter: 'blur(20px)',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#38BDF8',
              boxShadow: '0 0 14px #38BDF8',
            }}
          />
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2.5, color: '#38BDF8' }}>
            2×2 DECISION MATRIX
          </span>
        </div>

        <h1
          style={{
            fontSize: 54,
            fontWeight: 900,
            letterSpacing: -1.5,
            margin: '0 0 12px 0',
            textShadow: '0 4px 24px rgba(0,0,0,0.8)',
          }}
        >
          {title}
        </h1>

        <p style={{ fontSize: 24, color: 'rgba(255,255,255,0.65)', fontWeight: 500, margin: 0 }}>
          {subtitle}
        </p>
      </div>

      {/* Axis Labels */}
      <div
        style={{
          width: 900,
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 12,
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: 2,
          color: 'rgba(255,255,255,0.5)',
          opacity: gridSpring,
        }}
      >
        <span>LOW {xAxisLabel}</span>
        <span>HIGH {xAxisLabel}</span>
      </div>

      {/* 2x2 Matrix Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 440px)',
          gridTemplateRows: 'repeat(2, 380px)',
          gap: 20,
          opacity: gridSpring,
          transform: `scale(${0.9 + gridSpring * 0.1})`,
          position: 'relative',
        }}
      >
        {quadrants.map((q) => {
          const isActive = q.num === activeQuadrant;

          return (
            <div
              key={q.num}
              style={{
                ...glassStyle,
                padding: '32px 32px',
                borderRadius: 28,
                border: isActive
                  ? `2px solid ${q.color}`
                  : '1px solid rgba(255,255,255,0.1)',
                background: isActive
                  ? `linear-gradient(135deg, ${q.color}25 0%, rgba(15,15,22,0.95) 100%)`
                  : 'rgba(15,15,22,0.8)',
                boxShadow: isActive ? `0 16px 48px ${q.color}35` : 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                transform: isActive ? `scale(${pulseScale})` : 'none',
              }}
            >
              {/* Active Quadrant Highlight Banner */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    padding: '6px 14px',
                    borderRadius: 8,
                    backgroundColor: q.color,
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 1.5,
                    color: '#000000',
                  }}
                >
                  TARGET ZONE
                </div>
              )}

              {/* Quadrant Badge & Tag */}
              <div>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: 8,
                    backgroundColor: `${q.color}20`,
                    border: `1px solid ${q.color}60`,
                    fontSize: 13,
                    fontWeight: 800,
                    color: q.color,
                    letterSpacing: 1.5,
                    marginBottom: 16,
                  }}
                >
                  {q.label}
                </div>

                <h2 style={{ fontSize: 36, fontWeight: 900, color: '#FFFFFF', margin: '0 0 10px 0' }}>
                  {q.title}
                </h2>

                <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4, margin: 0 }}>
                  {q.desc}
                </p>
              </div>

              {/* Bottom Quadrant Index Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  paddingTop: 16,
                }}
              >
                <span style={{ fontSize: 16, fontFamily: FONT.mono, color: 'rgba(255,255,255,0.4)' }}>
                  QUADRANT 0{q.num}
                </span>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    backgroundColor: q.color,
                    boxShadow: isActive ? `0 0 16px ${q.color}` : 'none',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Takeaway Insight */}
      <div
        style={{
          marginTop: 'auto',
          padding: '18px 36px',
          borderRadius: 24,
          background: 'rgba(56,189,248,0.12)',
          border: '1px solid rgba(56,189,248,0.3)',
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
          maxWidth: 900,
          opacity: beaconSpring,
          transform: `translateY(${(1 - beaconSpring) * 20}px)`,
        }}
      >
        <span style={{ fontSize: 20, color: '#38BDF8', fontWeight: 700 }}>
          🎯 High performers spend 70%+ of their creative energy in Quadrant 2.
        </span>
      </div>
      </div>
    </AbsoluteFill>
  );
};
