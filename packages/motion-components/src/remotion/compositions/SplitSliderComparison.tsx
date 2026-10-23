import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

export interface SplitSliderComparisonProps {
  title?: string;
  badge?: string;
  leftTag?: string;
  leftTitle?: string;
  leftMetric?: string;
  leftDetail?: string;
  leftIcon?: string;
  rightTag?: string;
  rightTitle?: string;
  rightMetric?: string;
  rightDetail?: string;
  rightIcon?: string;
  sliderStart?: number; // e.g. 25 (%)
  sliderEnd?: number;   // e.g. 60 (%)
  synthesis?: string;
}

export const SplitSliderComparison: React.FC<SplitSliderComparisonProps> = ({
  title = 'THE SYSTEMIC EFFICIENCY LEAP',
  badge = '⚖️ BEFORE VS AFTER TRANSFORMATION',
  leftTag = 'MANUAL PROCESS',
  leftTitle = 'Manual Agency Workflow',
  leftMetric = '18.5 HOURS',
  leftDetail = 'Manual keyframing, timeline cut bloat, asset hunting, and high human fatigue.',
  leftIcon = '⏳',
  rightTag = 'AI PIPELINE ENGINE',
  rightTitle = 'Autonomous AI Pipeline',
  rightMetric = '4.2 MINUTES',
  rightDetail = 'Algorithmic storyboarding, Remotion rendering, automated B-roll, and instant audio ducking.',
  rightIcon = '⚡',
  sliderStart = 80,
  sliderEnd = 50,
  synthesis = 'TRANSFORMATION: Autonomous AI pipeline unlocks 260x production velocity with zero retention loss.',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 12);

  // Entrance spring for main card container
  const enterSpring = spring({ frame, fps, config: { damping: 14, mass: 0.7, stiffness: 160 } });

  // Slider glide progress: smoothly slides from sliderStart (80%) to sliderEnd (50%)
  const sliderProgress = interpolate(frame, [15, 48], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Smooth sinusoidal easing for the slider travel + subtle breathing hover after landing
  const smoothT = Math.sin((sliderProgress * Math.PI) / 2);
  const idleHover = frame > 48 ? Math.sin(((frame - 48) / fps) * 4) * 1.2 : 0;
  const currentSliderPos = sliderStart + (sliderEnd - sliderStart) * smoothT + idleHover;

  // Pulse & glow calculations
  const pulse = Math.sin((frame / fps) * 6) * 0.05 + 1;
  const greenGlow = Math.sin((frame / fps) * 5) * 15 + 30;

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
      {/* Container Card */}
      <div
        style={{
          ...glassStyle,
          width: '100%',
          maxWidth: 960,
          padding: '38px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 22,
          background: 'rgba(10, 14, 28, 0.96)',
          backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.16) 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
          border: '1.5px solid rgba(16, 185, 129, 0.35)',
          boxShadow: `0 40px 100px rgba(0,0,0,0.85), 0 0 ${greenGlow}px rgba(16, 185, 129, 0.20)`,
          transform: `scale(${Math.min(1, enterSpring)}) translateY(${(1 - enterSpring) * 40}px)`,
          opacity: enterSpring,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Header & Tag */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: 16,
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.15))',
              border: '1px solid rgba(16, 185, 129, 0.55)',
              color: '#6EE7B7',
              fontFamily: FONT.mono,
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: 2.5,
              padding: '6px 16px',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)',
            }}
          >
            <span>●</span> {badge}
          </div>

          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: 2.5,
              color: '#F8FAFC',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </div>
        </div>

        {/* Dual-State Comparison Stage with Interactive Wipe Divider */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 480,
            borderRadius: 20,
            overflow: 'hidden',
            border: '2px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          }}
        >
          {/* STATE A (LEFT / BEFORE / THE OLD WAY) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(30, 20, 25, 0.98), rgba(15, 20, 32, 0.98))',
            }}
          >
            {/* Top Row: Tag & Icon */}
            <div
              style={{
                position: 'absolute',
                top: 32,
                left: 28,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.18)',
                  border: '1.5px solid rgba(239, 68, 68, 0.5)',
                  color: '#FCA5A5',
                  fontFamily: FONT.mono,
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 2,
                  padding: '6px 14px',
                  borderRadius: 12,
                }}
              >
                {leftTag}
              </div>
              <span style={{ fontSize: 24 }}>{leftIcon}</span>
            </div>

            {/* Middle: Title & Giant Metric */}
            <div
              style={{
                position: 'absolute',
                top: 155,
                left: 28,
                width: 350,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <span style={{ fontFamily: FONT.display, fontSize: 20, fontWeight: 800, color: '#E2E8F0', letterSpacing: -0.2 }}>
                {leftTitle}
              </span>
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 42,
                  fontWeight: 900,
                  color: '#EF4444',
                  letterSpacing: -1,
                  textShadow: '0 0 25px rgba(239, 68, 68, 0.4)',
                }}
              >
                {leftMetric}
              </span>
            </div>

            {/* Bottom Detail */}
            <div
              style={{
                position: 'absolute',
                bottom: 32,
                left: 28,
                width: 350,
              }}
            >
              <span style={{ fontFamily: FONT.display, fontSize: 14, color: '#94A3B8', lineHeight: 1.45 }}>
                {leftDetail}
              </span>
            </div>
          </div>

          {/* STATE B (RIGHT / AFTER / THE NEW WAY) — Clipped by currentSliderPos */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(6, 44, 34, 0.98), rgba(10, 30, 45, 0.98))',
              clipPath: `inset(0 0 0 ${currentSliderPos}%)`,
            }}
          >
            {/* Top Row: Tag & Icon */}
            <div
              style={{
                position: 'absolute',
                top: 32,
                right: 28,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 24 }}>{rightIcon}</span>
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.22)',
                  border: '1.5px solid rgba(16, 185, 129, 0.65)',
                  color: '#6EE7B7',
                  fontFamily: FONT.mono,
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 2,
                  padding: '6px 14px',
                  borderRadius: 12,
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
                }}
              >
                {rightTag}
              </div>
            </div>

            {/* Middle: Title & Giant Metric */}
            <div
              style={{
                position: 'absolute',
                top: 155,
                right: 28,
                width: 350,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                textAlign: 'right',
                gap: 8,
              }}
            >
              <span style={{ fontFamily: FONT.display, fontSize: 20, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.2 }}>
                {rightTitle}
              </span>
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 42,
                  fontWeight: 900,
                  color: '#10B981',
                  letterSpacing: -1,
                  textShadow: '0 0 35px rgba(16, 185, 129, 0.6)',
                }}
              >
                {rightMetric}
              </span>
            </div>

            {/* Bottom Detail */}
            <div
              style={{
                position: 'absolute',
                bottom: 32,
                right: 28,
                width: 350,
                textAlign: 'right',
              }}
            >
              <span style={{ fontFamily: FONT.display, fontSize: 14, color: '#CBD5E1', lineHeight: 1.45 }}>
                {rightDetail}
              </span>
            </div>
          </div>

          {/* Glowing Vertical Slider Line & Double-Arrow Handle */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${currentSliderPos}%`,
              transform: 'translateX(-50%)',
              width: 4,
              background: 'linear-gradient(180deg, #38BDF8 0%, #10B981 100%)',
              boxShadow: '0 0 15px #10B981, 0 0 30px #38BDF8',
              zIndex: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            {/* Slider Handle Thumb */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981, #06B6D4)',
                border: '3px solid #FFFFFF',
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.9), 0 8px 25px rgba(0,0,0,0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${pulse})`,
                fontFamily: FONT.mono,
                fontSize: 14,
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: 2,
              }}
            >
              ◀▶
            </div>
          </div>
        </div>

        {/* Bottom Takeaway Synthesis Bar */}
        <div
          style={{
            width: '100%',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontFamily: FONT.mono, fontSize: 13, fontWeight: 900, color: '#34D399', letterSpacing: 2 }}>
            SYSTEM SYNTHESIS:
          </span>
          <span style={{ fontFamily: FONT.display, fontSize: 16, fontWeight: 600, color: '#CBD5E1' }}>
            {synthesis}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
