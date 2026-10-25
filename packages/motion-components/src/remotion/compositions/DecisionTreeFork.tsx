import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate } from 'remotion';
import { FONT, useExitFade } from '../shared';

export interface DecisionTreeForkProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  synthesis?: string;
  rootTitle?: string;
  rootDesc?: string;
  rootBadge?: string;
  branch1Title?: string;
  branch1Desc?: string;
  branch1Badge?: string;
  branch1Metric?: string;
  branch1Color?: string;
  branch2Title?: string;
  branch2Desc?: string;
  branch2Badge?: string;
  branch2Metric?: string;
  branch2Color?: string;
  accentColor?: string;
  [key: string]: any;
}

export const DecisionTreeFork: React.FC<DecisionTreeForkProps> = ({
  title = 'THE ARCHITECTURAL BIFURCATION',
  subtitle = 'HOW EARLY TECHNICAL DECISIONS LOCK IN IRREVERSIBLE SYSTEMIC TRAJECTORIES',
  badge = 'BIFURCATION DECISION FORK',
  synthesis = 'Path dependency is the silent killer in technology: choices made at the root dictate limits at the leaves.',
  rootTitle = 'FOUNDATION MODEL ARCHITECTURE',
  rootDesc = 'Initial engineering fork between proprietary API lock-in vs open-weights autonomous infrastructure.',
  rootBadge = 'DECISION FORK // T=0',
  branch1Title = 'Path A: Proprietary Closed API',
  branch1Desc = 'Vendor lock-in, recurring token marginal costs, and strict upstream rate limit constraints.',
  branch1Badge = 'WALLED GARDEN',
  branch1Metric = 'HIGH INITIAL MARGIN // ZERO MIGRATION FLEXIBILITY',
  branch1Color = '#F43F5E', // Rose / Amber
  branch2Title = 'Path B: Open-Weights Swarm',
  branch2Desc = 'Self-hosted distilled models, zero marginal API taxes, and deterministic horizontal scale.',
  branch2Badge = 'AUTONOMOUS SWARM',
  branch2Metric = 'INFINITE SCALING // 100% OWNED INFRASTRUCTURE',
  branch2Color = '#10B981', // Emerald / Cyan
  accentColor = '#00E5FF',
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

  // Root node entrance (frame 0-25)
  const rootSpring = spring({
    frame: Math.max(0, frame - 4),
    fps,
    config: { damping: 16, stiffness: 90 },
  });

  // Fork beam propagation (frame 18-45)
  const beamSpring = spring({
    frame: Math.max(0, frame - 18),
    fps,
    config: { damping: 16, stiffness: 85 },
  });

  // Branch 1 Card entrance (frame 32-60)
  const branch1Spring = spring({
    frame: Math.max(0, frame - 32),
    fps,
    config: { damping: 15, stiffness: 90 },
  });

  // Branch 2 Card entrance (frame 42-70)
  const branch2Spring = spring({
    frame: Math.max(0, frame - 42),
    fps,
    config: { damping: 15, stiffness: 90 },
  });

  // Bottom synthesis axiom entrance
  const axiomSpring = spring({
    frame: Math.max(0, frame - 55),
    fps,
    config: { damping: 16, stiffness: 95 },
  });

  // Traveling pulses along the branches
  const pulseOffset = (frame * 12) % 600;
  const radarWave = Math.sin((frame / fps) * 2 * Math.PI * 2) * 0.5 + 0.5;

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
          background: `radial-gradient(circle, ${accentColor}12 0%, ${branch1Color}08 30%, ${branch2Color}08 60%, transparent 80%)`,
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
          padding: '44px 54px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          transform: `scale(${containerEntrance})`,
          opacity: containerEntrance,
        }}
      >
        {/* Top Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
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
                fontSize: 36,
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

          {/* Top Right Systemic Indicator */}
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
              DIALECTICAL FORK MATRIX
            </div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 13,
                fontWeight: 800,
                color: accentColor,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ color: branch1Color }}>PATH A [CLOSED]</span>
              <span style={{ color: '#475569' }}>vs</span>
              <span style={{ color: branch2Color }}>PATH B [OPEN]</span>
            </div>
          </div>
        </div>

        {/* Center Decision Fork Stage */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            minHeight: 0,
          }}
        >
          {/* SVG Vector Connector Canvas for Fork Branches */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              overflow: 'visible',
            }}
          >
            <defs>
              <linearGradient id="trunkGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={accentColor} stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="branch1Gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                <stop offset="100%" stopColor={branch1Color} stopOpacity="1" />
              </linearGradient>
              <linearGradient id="branch2Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                <stop offset="100%" stopColor={branch2Color} stopOpacity="1" />
              </linearGradient>
              <filter id="branchGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Geometry Coordinates (based on card layout):
                Root socket center: (390, 275)
                Fork bifurcation node: (560, 275)
                Branch 1 card target socket: (880, 135)
                Branch 2 card target socket: (880, 415)
            */}

            {/* Trunk: Root Socket -> Fork Point (X=390 to 560, Y=275) */}
            <line
              x1="390"
              y1="275"
              x2={390 + (560 - 390) * beamSpring}
              y2="275"
              stroke={accentColor}
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#branchGlow)"
            />
            <line
              x1="390"
              y1="275"
              x2={390 + (560 - 390) * beamSpring}
              y2="275"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Fork Bifurcation Hub Circle at (560, 275) */}
            {beamSpring > 0.4 && (
              <g transform="translate(560, 275)">
                <circle r={14 * beamSpring} fill="rgba(8, 10, 15, 0.9)" stroke={accentColor} strokeWidth="2.5" />
                <circle r={6 * beamSpring} fill="#FFFFFF" boxShadow={`0 0 15px ${accentColor}`} />
                <circle
                  r={22 * (0.8 + 0.4 * radarWave)}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="1"
                  opacity={1 - radarWave}
                />
              </g>
            )}

            {/* Branch 1 Curve: Fork (560, 275) -> Path A Socket (880, 135) */}
            {beamSpring > 0.4 && (
              <>
                {/* Outer Glow Path */}
                <path
                  d="M 560 275 C 700 275, 730 135, 880 135"
                  fill="none"
                  stroke={branch1Color}
                  strokeWidth="4"
                  strokeLinecap="round"
                  filter="url(#branchGlow)"
                  strokeDasharray="450"
                  strokeDashoffset={450 * (1 - interpolate(beamSpring, [0.4, 1], [0, 1], { extrapolateRight: 'clamp' }))}
                />
                {/* Inner Crisp Filament */}
                <path
                  d="M 560 275 C 700 275, 730 135, 880 135"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray="450"
                  strokeDashoffset={450 * (1 - interpolate(beamSpring, [0.4, 1], [0, 1], { extrapolateRight: 'clamp' }))}
                />
              </>
            )}

            {/* Branch 2 Curve: Fork (560, 275) -> Path B Socket (880, 415) */}
            {beamSpring > 0.4 && (
              <>
                {/* Outer Glow Path */}
                <path
                  d="M 560 275 C 700 275, 730 415, 880 415"
                  fill="none"
                  stroke={branch2Color}
                  strokeWidth="4"
                  strokeLinecap="round"
                  filter="url(#branchGlow)"
                  strokeDasharray="450"
                  strokeDashoffset={450 * (1 - interpolate(beamSpring, [0.4, 1], [0, 1], { extrapolateRight: 'clamp' }))}
                />
                {/* Inner Crisp Filament */}
                <path
                  d="M 560 275 C 700 275, 730 415, 880 415"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray="450"
                  strokeDashoffset={450 * (1 - interpolate(beamSpring, [0.4, 1], [0, 1], { extrapolateRight: 'clamp' }))}
                />
              </>
            )}
          </svg>

          {/* LEFT: Root Decision Node Card */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              width: 390,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              borderRadius: 22,
              border: `1px solid ${accentColor}50`,
              boxShadow: `0 0 45px ${accentColor}18, inset 0 0 20px ${accentColor}08`,
              padding: '28px 26px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              transform: `scale(${rootSpring})`,
              opacity: rootSpring,
            }}
          >
            {/* Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 6,
                backgroundColor: `${accentColor}15`,
                border: `1px solid ${accentColor}40`,
                width: 'fit-content',
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  fontWeight: 800,
                  color: accentColor,
                  letterSpacing: '0.1em',
                }}
              >
                {rootBadge}
              </span>
            </div>

            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
                color: '#FFFFFF',
                marginBottom: 10,
                textTransform: 'uppercase',
              }}
            >
              {rootTitle}
            </div>

            <p
              style={{
                fontSize: 13,
                color: '#94A3B8',
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {rootDesc}
            </p>

            {/* Socket Pin Indicator on Right Edge */}
            <div
              style={{
                position: 'absolute',
                right: -10,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: '#050505',
                border: `3px solid ${accentColor}`,
                boxShadow: `0 0 15px ${accentColor}`,
              }}
            />
          </div>

          {/* RIGHT: Two Diverging Consequence Cards */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              width: 770,
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
          >
            {/* CARD 1: Path A (Closed / High Friction) */}
            <div
              style={{
                position: 'relative',
                backgroundColor: 'rgba(25, 12, 18, 0.65)',
                borderRadius: 20,
                border: `1px solid ${branch1Color}60`,
                boxShadow: `0 0 45px ${branch1Color}20, inset 0 0 20px ${branch1Color}08`,
                padding: '24px 28px',
                boxSizing: 'border-box',
                transform: `translateX(${interpolate(branch1Spring, [0, 1], [40, 0])}px)`,
                opacity: branch1Spring,
              }}
            >
              {/* Left Socket Pin */}
              <div
                style={{
                  position: 'absolute',
                  left: -10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  backgroundColor: '#050505',
                  border: `3px solid ${branch1Color}`,
                  boxShadow: `0 0 15px ${branch1Color}`,
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    padding: '3px 8px',
                    borderRadius: 6,
                    backgroundColor: `${branch1Color}20`,
                    color: branch1Color,
                    border: `1px solid ${branch1Color}40`,
                  }}
                >
                  {branch1Badge}
                </span>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 11,
                    fontWeight: 800,
                    color: branch1Color,
                  }}
                >
                  {branch1Metric}
                </span>
              </div>

              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                {branch1Title}
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: '#FDA4AF',
                  lineHeight: 1.45,
                }}
              >
                {branch1Desc}
              </div>
            </div>

            {/* CARD 2: Path B (Open / Compounding) */}
            <div
              style={{
                position: 'relative',
                backgroundColor: 'rgba(8, 26, 20, 0.65)',
                borderRadius: 20,
                border: `1px solid ${branch2Color}60`,
                boxShadow: `0 0 45px ${branch2Color}20, inset 0 0 20px ${branch2Color}08`,
                padding: '24px 28px',
                boxSizing: 'border-box',
                transform: `translateX(${interpolate(branch2Spring, [0, 1], [40, 0])}px)`,
                opacity: branch2Spring,
              }}
            >
              {/* Left Socket Pin */}
              <div
                style={{
                  position: 'absolute',
                  left: -10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  backgroundColor: '#050505',
                  border: `3px solid ${branch2Color}`,
                  boxShadow: `0 0 15px ${branch2Color}`,
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    padding: '3px 8px',
                    borderRadius: 6,
                    backgroundColor: `${branch2Color}20`,
                    color: branch2Color,
                    border: `1px solid ${branch2Color}40`,
                  }}
                >
                  {branch2Badge}
                </span>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 11,
                    fontWeight: 800,
                    color: branch2Color,
                  }}
                >
                  {branch2Metric}
                </span>
              </div>

              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                {branch2Title}
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: '#A7F3D0',
                  lineHeight: 1.45,
                }}
              >
                {branch2Desc}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Axiom Banner */}
        <div
          style={{
            marginTop: 20,
            padding: '14px 22px',
            borderRadius: 14,
            backgroundColor: 'rgba(2, 6, 23, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            transform: `translateY(${interpolate(axiomSpring, [0, 1], [15, 0])}px)`,
            opacity: axiomSpring,
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
            SYSTEM LAW
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
