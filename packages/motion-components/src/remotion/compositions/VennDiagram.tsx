import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

interface Props {
  title?: string;
  subtitle?: string;
  circle1Label?: string;
  circle1Sub?: string;
  circle2Label?: string;
  circle2Sub?: string;
  circle3Label?: string;
  circle3Sub?: string;
  centerLabel?: string;
  centerSub?: string;
  accentColor?: string;
}

export const VennDiagram: React.FC<Props> = ({
  title = 'THE SWEET SPOT',
  subtitle = 'WHERE PASSION MEETS PROFIT & MASTERY',
  circle1Label = 'PASSION',
  circle1Sub = 'What You Love',
  circle2Label = 'MASTERY',
  circle2Sub = 'What You Excel At',
  circle3Label = 'MARKET',
  circle3Sub = 'What They Pay For',
  centerLabel = 'IKIGAI',
  centerSub = 'The Unfair Advantage',
  accentColor = '#38BDF8',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width = 1080, height = 1920 } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 14);
  const scale = Math.min(width / 1080, height / 1920);

  // Staggered entrances
  const headerSpring = spring({ frame, fps, config: { damping: 14, mass: 0.7, stiffness: 140 } });
  const c1Spring = spring({ frame: frame - 10, fps, config: { damping: 13, mass: 0.8, stiffness: 120 } });
  const c2Spring = spring({ frame: frame - 18, fps, config: { damping: 13, mass: 0.8, stiffness: 120 } });
  const c3Spring = spring({ frame: frame - 26, fps, config: { damping: 13, mass: 0.8, stiffness: 120 } });
  const centerSpring = spring({ frame: frame - 38, fps, config: { damping: 10, mass: 0.5, stiffness: 180 } });

  // Floating ambient breathing
  const breathe = Math.sin(frame * 0.08) * 6;
  const pulseScale = 1 + Math.sin(frame * 0.12) * 0.04;

  // Circle geometric centers (W=1080, H=1920)
  // Center of diagram at X=540, Y=1040
  const CX = 540;
  const CY = 1040;
  const RADIUS = 280;
  const OFFSET = 145; // circle center distance from CX, CY

  // Circle 1: Top (Passion - Cyan)
  const c1X = CX;
  const c1Y = CY - OFFSET + (1 - c1Spring) * -120;

  // Circle 2: Bottom-Left (Mastery - Purple)
  const c2X = CX - OFFSET * 1.05 + (1 - c2Spring) * -120;
  const c2Y = CY + OFFSET * 0.75 + (1 - c2Spring) * 100;

  // Circle 3: Bottom-Right (Market - Amber/Green)
  const c3X = CX + OFFSET * 1.05 + (1 - c3Spring) * 120;
  const c3Y = CY + OFFSET * 0.75 + (1 - c3Spring) * 100;

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
      {/* Background radial atmosphere */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 820,
          height: 820,
          background: `radial-gradient(circle, ${accentColor}18 0%, rgba(124,58,237,0.12) 45%, transparent 70%)`,
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
          marginBottom: 30,
          zIndex: 10,
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
            border: `1px solid ${accentColor}40`,
            backdropFilter: 'blur(20px)',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: accentColor,
              boxShadow: `0 0 14px ${accentColor}`,
            }}
          />
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2.5, color: accentColor }}>
            SYNTHESIS ARCHITECTURE
          </span>
        </div>

        <h1
          style={{
            fontSize: 56,
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

      {/* SVG Canvas for Overlapping Venn Circles */}
      <div
        style={{
          position: 'relative',
          width: 960,
          height: 1000,
          marginTop: 20,
        }}
      >
        <svg
          width="960"
          height="1000"
          viewBox="0 0 960 1000"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <defs>
            {/* Circle 1 Gradient (Cyan) */}
            <radialGradient id="grad-c1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#0284C7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.05" />
            </radialGradient>

            {/* Circle 2 Gradient (Purple/Indigo) */}
            <radialGradient id="grad-c2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#A855F7" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#7C3AED" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6D28D9" stopOpacity="0.05" />
            </radialGradient>

            {/* Circle 3 Gradient (Emerald/Amber) */}
            <radialGradient id="grad-c3" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#059669" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.05" />
            </radialGradient>

            {/* Center Sweet Spot Glow */}
            <radialGradient id="grad-center" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Circle 1: Top */}
          <g style={{ opacity: c1Spring }}>
            <circle
              cx={c1X - 60}
              cy={c1Y - 540 + breathe}
              r={RADIUS}
              fill="url(#grad-c1)"
              stroke="#38BDF8"
              strokeWidth="3.5"
              strokeDasharray="6 4"
            />
          </g>

          {/* Circle 2: Bottom-Left */}
          <g style={{ opacity: c2Spring }}>
            <circle
              cx={c2X - 60}
              cy={c2Y - 540 - breathe * 0.5}
              r={RADIUS}
              fill="url(#grad-c2)"
              stroke="#C084FC"
              strokeWidth="3.5"
              strokeDasharray="6 4"
            />
          </g>

          {/* Circle 3: Bottom-Right */}
          <g style={{ opacity: c3Spring }}>
            <circle
              cx={c3X - 60}
              cy={c3Y - 540 + breathe * 0.5}
              r={RADIUS}
              fill="url(#grad-c3)"
              stroke="#34D399"
              strokeWidth="3.5"
              strokeDasharray="6 4"
            />
          </g>

          {/* Pulsing Intersection Sweet Spot */}
          {centerSpring > 0.05 && (
            <g style={{ opacity: centerSpring }}>
              <circle
                cx={CX - 60}
                cy={CY - 540}
                r={85 * pulseScale}
                fill="url(#grad-center)"
                filter="blur(4px)"
              />
              <circle
                cx={CX - 60}
                cy={CY - 540}
                r={52}
                fill="#F59E0B"
                fillOpacity="0.28"
                stroke="#FBBF24"
                strokeWidth="3"
              />
            </g>
          )}
        </svg>

        {/* Outer Label Pill 1 (Top / Passion) */}
        <div
          style={{
            ...glassStyle,
            position: 'absolute',
            left: c1X - 60 - 150,
            top: c1Y - 540 - RADIUS + 40 + breathe,
            width: 300,
            padding: '16px 20px',
            textAlign: 'center',
            border: '1px solid rgba(56,189,248,0.4)',
            boxShadow: '0 8px 32px rgba(6,182,212,0.2)',
            opacity: c1Spring,
            transform: `scale(${0.8 + c1Spring * 0.2})`,
            zIndex: 15,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 900, color: '#38BDF8', letterSpacing: 1.5 }}>
            {circle1Label}
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
            {circle1Sub}
          </div>
        </div>

        {/* Outer Label Pill 2 (Bottom-Left / Mastery) */}
        <div
          style={{
            ...glassStyle,
            position: 'absolute',
            left: c2X - 60 - RADIUS - 40,
            top: c2Y - 540 + 70 - breathe * 0.5,
            width: 290,
            padding: '16px 20px',
            textAlign: 'center',
            border: '1px solid rgba(192,132,252,0.4)',
            boxShadow: '0 8px 32px rgba(168,85,247,0.2)',
            opacity: c2Spring,
            transform: `scale(${0.8 + c2Spring * 0.2})`,
            zIndex: 15,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 900, color: '#C084FC', letterSpacing: 1.5 }}>
            {circle2Label}
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
            {circle2Sub}
          </div>
        </div>

        {/* Outer Label Pill 3 (Bottom-Right / Market) */}
        <div
          style={{
            ...glassStyle,
            position: 'absolute',
            left: c3X - 60 + RADIUS - 250,
            top: c3Y - 540 + 70 + breathe * 0.5,
            width: 290,
            padding: '16px 20px',
            textAlign: 'center',
            border: '1px solid rgba(52,211,153,0.4)',
            boxShadow: '0 8px 32px rgba(16,185,129,0.2)',
            opacity: c3Spring,
            transform: `scale(${0.8 + c3Spring * 0.2})`,
            zIndex: 15,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 900, color: '#34D399', letterSpacing: 1.5 }}>
            {circle3Label}
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
            {circle3Sub}
          </div>
        </div>

        {/* Center Sweet Spot Card */}
        <div
          style={{
            ...glassStyle,
            position: 'absolute',
            left: CX - 60 - 150,
            top: CY - 540 - 55,
            width: 300,
            padding: '18px 24px',
            textAlign: 'center',
            background: 'rgba(15,15,22,0.92)',
            border: '2px solid #F59E0B',
            boxShadow: '0 0 50px rgba(245,158,11,0.45)',
            borderRadius: 24,
            opacity: centerSpring,
            transform: `scale(${0.7 + centerSpring * 0.3 * pulseScale})`,
            zIndex: 25,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: 2,
              color: '#F59E0B',
              marginBottom: 4,
            }}
          >
            ★ INTERSECTION ★
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: 1.5, color: '#FFFFFF' }}>
            {centerLabel}
          </div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: 600 }}>
            {centerSub}
          </div>
        </div>
      </div>

      {/* Bottom Takeaway Badge */}
      <div
        style={{
          marginTop: 'auto',
          padding: '18px 36px',
          borderRadius: 24,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
          maxWidth: 820,
          opacity: centerSpring,
          transform: `translateY(${(1 - centerSpring) * 20}px)`,
        }}
      >
        <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
          💡 When all 3 domains align, competition becomes completely irrevelant.
        </span>
      </div>
      </div>
    </AbsoluteFill>
  );
};
