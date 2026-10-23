import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

interface Props {
  title?: string;
  subtitle?: string;
  leftLabel?: string;
  leftSub?: string;
  rightLabel?: string;
  rightSub?: string;
  currentValue?: number; // 0 to 100
  markerTitle?: string;
  markerDesc?: string;
  accentColor?: string;
}

export const SpectrumContinuum: React.FC<Props> = ({
  title = 'THE ARCHITECTURE SPECTRUM',
  subtitle = 'FINDING THE PRAGMATIC ENGINEERING BALANCE',
  leftLabel = '100% MONOLITH',
  leftSub = 'Simple Deployment • Single DB',
  rightLabel = '100% MICROSERVICES',
  rightSub = 'High Complexity • Event-Driven',
  currentValue = 68,
  markerTitle = 'MODULAR MONOLITH',
  markerDesc = 'The Optimal Sweet Spot for 99% of Startups',
  accentColor = '#38BDF8',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 14);

  const headerSpring = spring({ frame, fps, config: { damping: 14, mass: 0.7, stiffness: 140 } });
  const trackSpring = spring({ frame: frame - 12, fps, config: { damping: 13, mass: 0.8, stiffness: 120 } });
  const sliderSpring = spring({ frame: frame - 24, fps, config: { damping: 12, mass: 0.7, stiffness: 100 } });
  const cardSpring = spring({ frame: frame - 36, fps, config: { damping: 10, mass: 0.5, stiffness: 160 } });

  // Interpolate marker position (0 to 100%)
  const interpolatedValue = interpolate(sliderSpring, [0, 1], [0, currentValue], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Track width in pixels
  const TRACK_WIDTH = 860;
  const markerX = (interpolatedValue / 100) * TRACK_WIDTH;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#030712',
        fontFamily: FONT.display,
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '110px 48px',
        opacity: exit.opacity,
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 820,
          height: 820,
          background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, rgba(168,85,247,0.08) 50%, transparent 70%)',
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
          marginBottom: 60,
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
            CONTINUOUS SPECTRUM
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

      {/* Polar Endcaps Row */}
      <div
        style={{
          width: TRACK_WIDTH,
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 32,
          opacity: trackSpring,
        }}
      >
        {/* Left Polar Card */}
        <div
          style={{
            ...glassStyle,
            padding: '18px 24px',
            borderRadius: 20,
            border: '1px solid rgba(56,189,248,0.4)',
            maxWidth: 360,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: '#38BDF8', letterSpacing: 1.5 }}>
            LEFT EXTREME
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#FFFFFF', marginTop: 2 }}>
            {leftLabel}
          </div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
            {leftSub}
          </div>
        </div>

        {/* Right Polar Card */}
        <div
          style={{
            ...glassStyle,
            padding: '18px 24px',
            borderRadius: 20,
            border: '1px solid rgba(192,132,252,0.4)',
            maxWidth: 360,
            textAlign: 'right',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: '#C084FC', letterSpacing: 1.5 }}>
            RIGHT EXTREME
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#FFFFFF', marginTop: 2 }}>
            {rightLabel}
          </div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
            {rightSub}
          </div>
        </div>
      </div>

      {/* Horizontal Spectrum Bar with Sliding Indicator */}
      <div
        style={{
          width: TRACK_WIDTH,
          position: 'relative',
          marginTop: 40,
          opacity: trackSpring,
        }}
      >
        {/* Glowing Gradient Track Bar */}
        <div
          style={{
            width: '100%',
            height: 24,
            borderRadius: 999,
            background: 'linear-gradient(to right, #0284C7 0%, #38BDF8 30%, #818CF8 60%, #A855F7 100%)',
            boxShadow: '0 0 30px rgba(56,189,248,0.3)',
            position: 'relative',
          }}
        />

        {/* Tick Marks along Track */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 6px',
            marginTop: 14,
            fontSize: 14,
            fontFamily: FONT.mono,
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>

        {/* Sliding Pointer Indicator */}
        <div
          style={{
            position: 'absolute',
            left: markerX - 22,
            top: -10,
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: `4px solid ${accentColor}`,
            boxShadow: `0 0 30px ${accentColor}`,
            zIndex: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: '#0284C7',
            }}
          />
        </div>

        {/* Target Indicator Card Floating Above/Below */}
        <div
          style={{
            ...glassStyle,
            position: 'absolute',
            left: Math.max(0, Math.min(TRACK_WIDTH - 420, markerX - 210)),
            top: 90,
            width: 420,
            padding: '28px 32px',
            borderRadius: 24,
            border: `2px solid ${accentColor}`,
            background: 'linear-gradient(135deg, rgba(2,132,199,0.25) 0%, rgba(15,15,22,0.95) 100%)',
            boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 40px ${accentColor}30`,
            opacity: cardSpring,
            transform: `scale(${0.85 + cardSpring * 0.15}) translateY(${(1 - cardSpring) * 20}px)`,
            zIndex: 20,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              padding: '6px 14px',
              borderRadius: 8,
              backgroundColor: `${accentColor}30`,
              fontSize: 14,
              fontWeight: 900,
              color: accentColor,
              letterSpacing: 2,
              marginBottom: 8,
            }}
          >
            INDEX: {Math.round(interpolatedValue)}%
          </div>

          <h3 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 8px 0', color: '#FFFFFF' }}>
            {markerTitle}
          </h3>

          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.4 }}>
            {markerDesc}
          </p>
        </div>
      </div>

      {/* Bottom Nuance Principle */}
      <div
        style={{
          marginTop: 'auto',
          padding: '18px 36px',
          borderRadius: 24,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
          maxWidth: 860,
          opacity: cardSpring,
          transform: `translateY(${(1 - cardSpring) * 20}px)`,
        }}
      >
        <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
          💡 Nuanced operators reject binary dogmas and optimize along the continuum.
        </span>
      </div>
    </AbsoluteFill>
  );
};
