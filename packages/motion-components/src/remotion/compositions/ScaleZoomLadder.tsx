import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate } from 'remotion';
import { FONT, useExitFade } from '../shared';

export interface ScaleZoomLadderProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  synthesis?: string;
  step1Value?: string;
  step1Label?: string;
  step1Desc?: string;
  step1Metric?: string;
  step2Value?: string;
  step2Label?: string;
  step2Desc?: string;
  step2Metric?: string;
  step3Value?: string;
  step3Label?: string;
  step3Desc?: string;
  step3Metric?: string;
  accentColor?: string;
  step1Color?: string;
  step2Color?: string;
  step3Color?: string;
  [key: string]: any;
}

export const ScaleZoomLadder: React.FC<ScaleZoomLadderProps> = ({
  title = 'THE ILLUSION OF SCALE',
  subtitle = 'HOW HUMAN INTUITION FAILS AT ORDERS OF MAGNITUDE EXPANSION',
  badge = 'EXPONENTIAL MAGNITUDE LADDER',
  synthesis = 'The difference between a million and a billion is approximately one billion. Intuition flattens exponential scale.',
  step1Value = '$1 MILLION',
  step1Label = '11.5 DAYS',
  step1Desc = '1 Million seconds elapsed in real time',
  step1Metric = '1x (BASE UNIT)',
  step2Value = '$1 BILLION',
  step2Label = '31.7 YEARS',
  step2Desc = '1 Billion seconds elapsed (entire career)',
  step2Metric = '1,000x MULTIPLIER',
  step3Value = '$1 TRILLION',
  step3Label = '31,700 YEARS',
  step3Desc = '1 Trillion seconds (before recorded civilization)',
  step3Metric = '1,000,000x MONOLITH',
  accentColor = '#00E5FF',
  step1Color = '#38BDF8',
  step2Color = '#818CF8',
  step3Color = '#F43F5E',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exitOpacity = useExitFade(frame, durationInFrames, 15);

  // Global container entrance
  const containerEntrance = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 95, mass: 0.9 },
  });

  // Zoom progression springs
  // Stage 1 (0 to 30) - Baseline unit
  const stage1Entrance = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 16, stiffness: 90 },
  });

  // Stage 2 (25 to 55) - 1,000x expansion zoom out
  const stage2Entrance = spring({
    frame: Math.max(0, frame - 28),
    fps,
    config: { damping: 16, stiffness: 90 },
  });

  // Stage 3 (55 to 85) - 1,000,000x monolithic scale zoom out
  const stage3Entrance = spring({
    frame: Math.max(0, frame - 54),
    fps,
    config: { damping: 15, stiffness: 85 },
  });

  // Bottom synthesis banner entrance
  const synthesisEntrance = spring({
    frame: Math.max(0, frame - 68),
    fps,
    config: { damping: 16, stiffness: 95 },
  });

  // Animated laser scanline sweeping across the active tier
  const scanlineY = (frame * 6) % 360;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#050505',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: exitOpacity,
        fontFamily: FONT.display,
        color: '#FFFFFF',
      }}
    >
      {/* Ambient background glow layers */}
      <div
        style={{
          position: 'absolute',
          width: 1200,
          height: 700,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${step3Color}12 0%, ${step2Color}08 40%, transparent 70%)`,
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Glassmorphic Card Container */}
      <div
        style={{
          position: 'relative',
          width: 1760,
          height: 940,
          backgroundColor: 'rgba(8, 10, 15, 0.96)',
          borderRadius: 28,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          padding: '48px 56px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          transform: `scale(${containerEntrance})`,
          opacity: containerEntrance,
        }}
      >
        {/* Top Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 999,
                backgroundColor: 'rgba(0, 229, 255, 0.08)',
                border: '1px solid rgba(0, 229, 255, 0.25)',
                width: 'fit-content',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: accentColor,
                  boxShadow: `0 0 10px ${accentColor}`,
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontFamily: FONT.mono,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: accentColor,
                  textTransform: 'uppercase',
                }}
              >
                {badge}
              </span>
            </div>

            <h1
              style={{
                fontSize: 38,
                fontWeight: 900,
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1.1,
                textTransform: 'uppercase',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #CBD5E1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {title}
            </h1>

            <p
              style={{
                fontSize: 14,
                fontFamily: FONT.mono,
                color: '#64748B',
                margin: 0,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {subtitle}
            </p>
          </div>

          {/* Top Right Scale Ratio Indicator */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 4,
            }}
          >
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 12,
                color: '#64748B',
                letterSpacing: '0.1em',
              }}
            >
              LOGARITHMIC EXPANSION RATIO
            </div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 22,
                fontWeight: 900,
                color: step3Color,
                textShadow: `0 0 20px ${step3Color}60`,
              }}
            >
              1 : 1,000 : 1,000,000
            </div>
          </div>
        </div>

        {/* Center Graphic & Multi-Stage Ladder Grid */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 24,
            alignItems: 'stretch',
            position: 'relative',
            minHeight: 0,
          }}
        >
          {/* TIER 1: $1 MILLION (Base Scale) */}
          <div
            style={{
              position: 'relative',
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
              borderRadius: 20,
              border: `1px solid ${stage1Entrance > 0.5 ? step1Color + '50' : 'rgba(255, 255, 255, 0.08)'}`,
              boxShadow: stage1Entrance > 0.5 ? `0 0 40px ${step1Color}15, inset 0 0 20px ${step1Color}08` : 'none',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transform: `scale(${stage1Entrance})`,
              opacity: stage1Entrance,
              transition: 'border-color 0.3s ease',
              overflow: 'hidden',
            }}
          >
            {/* Top Tag & Metric */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    padding: '4px 10px',
                    borderRadius: 6,
                    backgroundColor: `${step1Color}15`,
                    color: step1Color,
                    border: `1px solid ${step1Color}40`,
                  }}
                >
                  TIER 01 // BASE
                </span>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#94A3B8',
                  }}
                >
                  {step1Metric}
                </span>
              </div>

              <div
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  color: '#FFFFFF',
                  lineHeight: 1.1,
                  marginBottom: 6,
                }}
              >
                {step1Value}
              </div>

              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: step1Color,
                  fontFamily: FONT.mono,
                  marginBottom: 10,
                }}
              >
                = {step1Label}
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: '#94A3B8',
                  lineHeight: 1.45,
                }}
              >
                {step1Desc}
              </div>
            </div>

            {/* Visual Box Simulation: 1 Single Precision Pixel / Unit Block */}
            <div
              style={{
                position: 'relative',
                height: 190,
                backgroundColor: 'rgba(2, 6, 23, 0.7)',
                borderRadius: 14,
                border: '1px dashed rgba(56, 189, 248, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {/* Animated Unit Cube */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: step1Color,
                  borderRadius: 6,
                  boxShadow: `0 0 25px ${step1Color}, 0 0 50px ${step1Color}80`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONT.mono,
                  fontSize: 11,
                  fontWeight: 900,
                  color: '#050505',
                }}
              >
                1x
              </div>

              {/* Dimension measurement lines */}
              <div
                style={{
                  marginTop: 14,
                  fontFamily: FONT.mono,
                  fontSize: 11,
                  color: step1Color,
                  letterSpacing: '0.08em',
                }}
              >
                1 UNIT BLOCK (11.5 DAYS)
              </div>
            </div>
          </div>

          {/* TIER 2: $1 BILLION (1,000x Expansion) */}
          <div
            style={{
              position: 'relative',
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
              borderRadius: 20,
              border: `1px solid ${stage2Entrance > 0.5 ? step2Color + '60' : 'rgba(255, 255, 255, 0.08)'}`,
              boxShadow: stage2Entrance > 0.5 ? `0 0 45px ${step2Color}20, inset 0 0 20px ${step2Color}08` : 'none',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transform: `scale(${stage2Entrance})`,
              opacity: stage2Entrance,
              transition: 'border-color 0.3s ease',
              overflow: 'hidden',
            }}
          >
            {/* Top Tag & Metric */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    padding: '4px 10px',
                    borderRadius: 6,
                    backgroundColor: `${step2Color}18`,
                    color: step2Color,
                    border: `1px solid ${step2Color}45`,
                  }}
                >
                  TIER 02 // 1,000x EXPANSION
                </span>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 12,
                    fontWeight: 700,
                    color: step2Color,
                  }}
                >
                  {step2Metric}
                </span>
              </div>

              <div
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  color: '#FFFFFF',
                  lineHeight: 1.1,
                  marginBottom: 6,
                }}
              >
                {step2Value}
              </div>

              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: step2Color,
                  fontFamily: FONT.mono,
                  marginBottom: 10,
                }}
              >
                = {step2Label}
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: '#94A3B8',
                  lineHeight: 1.45,
                }}
              >
                {step2Desc}
              </div>
            </div>

            {/* Visual Box Simulation: 1,000-cell dense cluster with tiny 1x dot */}
            <div
              style={{
                position: 'relative',
                height: 190,
                backgroundColor: 'rgba(2, 6, 23, 0.7)',
                borderRadius: 14,
                border: '1px solid rgba(129, 140, 248, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 12,
                boxSizing: 'border-box',
                overflow: 'hidden',
              }}
            >
              {/* Matrix of tiny dots simulating 1,000 blocks */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(20, 1fr)',
                  gap: 3,
                  width: '100%',
                  height: 130,
                  opacity: 0.75,
                }}
              >
                {Array.from({ length: 100 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: i === 0 ? step1Color : `${step2Color}50`,
                      borderRadius: 1.5,
                      boxShadow: i === 0 ? `0 0 10px ${step1Color}` : 'none',
                    }}
                  />
                ))}
              </div>

              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '100%',
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  color: step2Color,
                  letterSpacing: '0.06em',
                }}
              >
                <span>1,000 BLOCKS</span>
                <span style={{ color: step1Color }}>1x DOT INCLUDED</span>
              </div>
            </div>
          </div>

          {/* TIER 3: $1 TRILLION (1,000,000x Monolith) */}
          <div
            style={{
              position: 'relative',
              backgroundColor: 'rgba(20, 10, 18, 0.55)',
              borderRadius: 20,
              border: `1px solid ${stage3Entrance > 0.5 ? step3Color + '70' : 'rgba(255, 255, 255, 0.08)'}`,
              boxShadow: stage3Entrance > 0.5 ? `0 0 50px ${step3Color}25, inset 0 0 25px ${step3Color}10` : 'none',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transform: `scale(${stage3Entrance})`,
              opacity: stage3Entrance,
              transition: 'border-color 0.3s ease',
              overflow: 'hidden',
            }}
          >
            {/* Top Tag & Metric */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: '0.1em',
                    padding: '4px 10px',
                    borderRadius: 6,
                    backgroundColor: `${step3Color}20`,
                    color: step3Color,
                    border: `1px solid ${step3Color}60`,
                  }}
                >
                  TIER 03 // 1,000,000x MONOLITH
                </span>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 12,
                    fontWeight: 800,
                    color: step3Color,
                  }}
                >
                  {step3Metric}
                </span>
              </div>

              <div
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  color: '#FFFFFF',
                  lineHeight: 1.1,
                  marginBottom: 6,
                }}
              >
                {step3Value}
              </div>

              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: step3Color,
                  fontFamily: FONT.mono,
                  marginBottom: 10,
                }}
              >
                = {step3Label}
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: '#FDA4AF',
                  lineHeight: 1.45,
                }}
              >
                {step3Desc}
              </div>
            </div>

            {/* Visual Box Simulation: Monolithic Skyscraper Pillar */}
            <div
              style={{
                position: 'relative',
                height: 190,
                backgroundColor: 'rgba(2, 6, 23, 0.7)',
                borderRadius: 14,
                border: '1px solid rgba(244, 63, 94, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {/* Laser scanline */}
              <div
                style={{
                  position: 'absolute',
                  top: scanlineY % 190,
                  left: 0,
                  right: 0,
                  height: 2,
                  backgroundColor: step3Color,
                  boxShadow: `0 0 15px ${step3Color}`,
                  opacity: 0.8,
                }}
              />

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    fontFamily: FONT.mono,
                    color: step3Color,
                    textShadow: `0 0 25px ${step3Color}80`,
                  }}
                >
                  1,000,000x
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: FONT.mono,
                    color: '#CBD5E1',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  BEYOND HUMAN WORKING LIFESPAN
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Synthesis Axiom Bar */}
        <div
          style={{
            marginTop: 24,
            padding: '16px 24px',
            borderRadius: 14,
            backgroundColor: 'rgba(2, 6, 23, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            transform: `translateY(${interpolate(synthesisEntrance, [0, 1], [20, 0])}px)`,
            opacity: synthesisEntrance,
          }}
        >
          <div
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              backgroundColor: `${accentColor}18`,
              border: `1px solid ${accentColor}40`,
              color: accentColor,
              fontFamily: FONT.mono,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            SCALE LAW
          </div>

          <div
            style={{
              fontSize: 14,
              color: '#CBD5E1',
              lineHeight: 1.4,
              letterSpacing: '0.01em',
            }}
          >
            {synthesis}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
