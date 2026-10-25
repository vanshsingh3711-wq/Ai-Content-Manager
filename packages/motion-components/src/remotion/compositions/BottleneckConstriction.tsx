import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate } from 'remotion';
import { FONT, useExitFade } from '../shared';

export interface BottleneckConstrictionProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  inputLabel?: string;
  inputMetric?: string;
  inputDesc?: string;
  chokeLabel?: string;
  chokeMetric?: string;
  chokeDesc?: string;
  restrictionPct?: string;
  outputLabel?: string;
  outputMetric?: string;
  outputDesc?: string;
  efficiency?: string;
  synthesis?: string;
  accentColor?: string;
  warningColor?: string;
  colorTheme?: string;
  [key: string]: any;
}

export const BottleneckConstriction: React.FC<BottleneckConstrictionProps> = ({
  title = 'THE COMPUTE MEMORY WALL',
  subtitle = 'WHY RAW FLOP CAPACITY IS CONSTRAINED BY INTERCONNECT BANDWIDTH',
  badge = 'THROUGHPUT CAPACITY FUNNEL',
  inputLabel = 'INCOMING CAPACITY',
  inputMetric = '1,000 TFLOPS',
  inputDesc = 'Peak GPU arithmetic core saturation',
  chokeLabel = 'HBM INTERCONNECT BANDWIDTH',
  chokeMetric = 'CHOKE POINT: 3.2 TB/S',
  chokeDesc = 'Off-chip pin density & memory bus limit',
  restrictionPct = '-98.8%',
  outputLabel = 'EFFECTIVE OUTPUT',
  outputMetric = '12 TFLOPS',
  outputDesc = 'Sustained throughput under starvation',
  efficiency = '1.2% YIELD',
  synthesis = "Amdahl's Law in practice: Scaling raw processing power yields zero benefit when the communication bus cannot feed the execution units.",
  accentColor = '#00E5FF', // Cyan
  warningColor = '#F43F5E', // Rose/Amber hazard
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exitOpacity = useExitFade(frame, durationInFrames, 15);

  // Global entrance animation
  const containerEntrance = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 95, mass: 0.9 },
  });

  // Choke clamp constriction spring (frame 14 onwards)
  const clampSpring = spring({
    frame: Math.max(0, frame - 16),
    fps,
    config: { damping: 14, stiffness: 85, mass: 1.1 },
  });

  // Hotspot pulse at the choke throat
  const chokePulse = Math.sin((frame / fps) * 2 * Math.PI * 2.5) * 0.25 + 0.75;

  // Stat cards entrance
  const statCardSpring = spring({
    frame: Math.max(0, frame - 32),
    fps,
    config: { damping: 16, stiffness: 95 },
  });

  // Synthesis bar entrance
  const synthesisSpring = spring({
    frame: Math.max(0, frame - 46),
    fps,
    config: { damping: 16, stiffness: 100 },
  });

  // Funnel Geometry
  // Left wide pipe: height = 220px (top = 130, bottom = 350, center = 240)
  // Center choke throat: animated from 220px down to 32px
  const throatHeight = interpolate(clampSpring, [0, 1], [220, 34]);
  const centerY = 220;
  const topJawY = centerY - throatHeight / 2;
  const bottomJawY = centerY + throatHeight / 2;

  // Coordinates along horizontal conduit:
  // x: 0 to 440 -> Wide entrance (Y: 110 to 330)
  // x: 440 to 860 -> Funnel constriction slope down to throat
  // x: 860 to 980 -> Throat straight section (tight gap)
  // x: 980 to 1400 -> Narrow output pipe (tight gap continues)

  // Incoming High-Density Stream Particles (8 fast parallel lanes)
  const incomingParticles = Array.from({ length: 48 }).map((_, i) => {
    const lane = i % 8;
    const laneY = 125 + lane * 26;
    const speed = 7.5 + (i % 3) * 1.5;
    const xProgress = ((frame * speed + i * 35) % 440);
    return { id: `in-${i}`, x: xProgress, y: laneY, size: 4 + (i % 3) };
  });

  // Jammed / Crowded Particles at the Funnel Throat Entrance (x: 440 to 860)
  const jammedParticles = Array.from({ length: 24 }).map((_, i) => {
    const t = (i / 24);
    const px = 440 + t * 400;
    // Tapered Y boundary at px
    const localHalfHeight = interpolate(px, [440, 840], [105, throatHeight / 2]);
    const pLaneY = centerY + (Math.sin(i * 1.7) * (localHalfHeight - 8));
    const speed = 2.2 + (i % 2) * 0.8;
    const pxAnim = 440 + ((frame * speed + i * 28) % 400);
    return { id: `jam-${i}`, x: pxAnim, y: pLaneY };
  });

  // Trickling Output Particles (Only 1 sparse lane exiting slowly)
  const tricklingParticles = Array.from({ length: 8 }).map((_, i) => {
    const speed = 3.2;
    const xProgress = 900 + ((frame * speed + i * 75) % 500);
    return { id: `out-${i}`, x: xProgress, y: centerY + (Math.sin(i) * 6) };
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#050505',
        opacity: exitOpacity,
        fontFamily: FONT.sans,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background Ambient Aura */}
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 600,
          left: 150,
          top: 150,
          background: 'radial-gradient(circle, rgba(0, 229, 255, 0.08) 0%, transparent 70%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 600,
          left: 650,
          top: 180,
          background: `radial-gradient(circle, ${warningColor}15 0%, transparent 65%)`,
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Obsidian Glass Card Frame (16:9 Canvas) */}
      <div
        style={{
          position: 'relative',
          width: 1760,
          height: 940,
          borderRadius: 24,
          background: 'linear-gradient(145deg, rgba(12, 14, 20, 0.96) 0%, rgba(6, 7, 11, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          transform: `scale(${interpolate(containerEntrance, [0, 1], [0.96, 1])})`,
          opacity: containerEntrance,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: '36px 48px',
          boxSizing: 'border-box',
        }}
      >
        {/* Subtle Tech Header Bar */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            right: 32,
            fontSize: 10,
            fontFamily: FONT.mono,
            color: 'rgba(255, 255, 255, 0.3)',
            letterSpacing: 2,
          }}
        >
          HYDRODYNAMIC THROUGHPUT MODEL // CONSTRICTION RATIO 83:1
        </div>

        {/* TOP HEADER */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 12px',
                borderRadius: 20,
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                fontSize: 11,
                fontFamily: FONT.mono,
                fontWeight: 700,
                color: warningColor,
                letterSpacing: 1.5,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: warningColor,
                  boxShadow: `0 0 10px ${warningColor}`,
                }}
              />
              {badge.toUpperCase()}
            </div>

            <div
              style={{
                fontSize: 11,
                fontFamily: FONT.mono,
                color: 'rgba(255, 255, 255, 0.45)',
                letterSpacing: 2,
              }}
            >
              SYSTEM EFFICIENCY &nbsp;|&nbsp; <span style={{ color: warningColor, fontWeight: 800 }}>{efficiency}</span>
            </div>
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 42,
              fontWeight: 900,
              fontFamily: FONT.display,
              letterSpacing: -0.5,
              lineHeight: 1.1,
              color: '#FFFFFF',
              textShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
            }}
          >
            {title}
          </h1>

          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              fontFamily: FONT.mono,
              color: 'rgba(255, 255, 255, 0.6)',
              letterSpacing: 2,
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* MAIN INTERACTIVE CONDUIT STAGE (SVG Fluid Dynamics) */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 440,
            background: 'rgba(8, 10, 16, 0.85)',
            borderRadius: 18,
            border: '1px solid rgba(255, 255, 255, 0.06)',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.8)',
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1664 440"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <filter id="chokeGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="intenseWarning" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="12" result="blur1" />
                <feGaussianBlur stdDeviation="4" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur1" />
                  <feMergeNode in="blur2" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Hazard Stripes Pattern for Caliper Jaws */}
              <pattern
                id="hazardStripes"
                width="20"
                height="20"
                patternTransform="rotate(45 0 0)"
                patternUnits="userSpaceOnUse"
              >
                <line x1="0" y1="0" x2="0" y2="20" stroke={warningColor} strokeWidth="8" strokeOpacity="0.4" />
                <line x1="10" y1="0" x2="10" y2="20" stroke="#000000" strokeWidth="8" />
              </pattern>
            </defs>

            {/* Stage Labels Across Top of Conduit */}
            {/* 1. Input Stage Header */}
            <text x="60" y="44" fill={accentColor} fontSize="11" fontFamily={FONT.mono} fontWeight="800" letterSpacing="2">
              01 // {inputLabel.toUpperCase()}
            </text>
            <text x="60" y="76" fill="#FFFFFF" fontSize="26" fontFamily={FONT.display} fontWeight="900">
              {inputMetric}
            </text>

            {/* 2. Choke Stage Header */}
            <text x="730" y="44" fill={warningColor} fontSize="11" fontFamily={FONT.mono} fontWeight="800" letterSpacing="2" textAnchor="middle">
              02 // CRITICAL CONSTRICTION
            </text>
            <text x="730" y="76" fill={warningColor} fontSize="22" fontFamily={FONT.mono} fontWeight="900" textAnchor="middle" filter="url(#chokeGlow)">
              {chokeMetric}
            </text>

            {/* 3. Output Stage Header */}
            <text x="1380" y="44" fill="#34D399" fontSize="11" fontFamily={FONT.mono} fontWeight="800" letterSpacing="2">
              03 // {outputLabel.toUpperCase()}
            </text>
            <text x="1380" y="76" fill="#34D399" fontSize="26" fontFamily={FONT.display} fontWeight="900">
              {outputMetric}
            </text>

            {/* Fluid Conduit Geometry Paths */}
            {/* Upper Boundary Line */}
            <path
              d={`M 0,110 L 440,110 Q 640,110 730,${topJawY} L 870,${topJawY} Q 960,${topJawY} 1020,${topJawY} L 1664,${topJawY}`}
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="2"
            />
            {/* Lower Boundary Line */}
            <path
              d={`M 0,330 L 440,330 Q 640,330 730,${bottomJawY} L 870,${bottomJawY} Q 960,${bottomJawY} 1020,${bottomJawY} L 1664,${bottomJawY}`}
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="2"
            />

            {/* Conduit Shading Background Fill */}
            <path
              d={`M 0,110 L 440,110 Q 640,110 730,${topJawY} L 870,${topJawY} L 1664,${topJawY} L 1664,${bottomJawY} L 870,${bottomJawY} Q 730,${bottomJawY} 640,330 L 0,330 Z`}
              fill="rgba(15, 23, 42, 0.45)"
            />

            {/* Top Caliper / Constriction Clamp Jaw */}
            <polygon
              points={`660,90 870,90 870,${topJawY} 730,${topJawY} 660,110`}
              fill="url(#hazardStripes)"
              stroke={warningColor}
              strokeWidth="1.5"
            />
            {/* Bottom Caliper / Constriction Clamp Jaw */}
            <polygon
              points={`660,350 870,350 870,${bottomJawY} 730,${bottomJawY} 660,330`}
              fill="url(#hazardStripes)"
              stroke={warningColor}
              strokeWidth="1.5"
            />

            {/* Glowing Hotspot Pressure Aura at Choke Entrance */}
            <ellipse
              cx="730"
              cy={centerY}
              rx={40}
              ry={throatHeight + 15}
              fill={warningColor}
              fillOpacity={0.25 * chokePulse}
              filter="url(#intenseWarning)"
            />

            {/* INCOMING PARTICLES (Left - Fast & Dense) */}
            {incomingParticles.map((p) => (
              <circle
                key={p.id}
                cx={p.x}
                cy={p.y}
                r={p.size}
                fill={accentColor}
                filter="url(#chokeGlow)"
                opacity={0.85}
              />
            ))}

            {/* JAMMED PARTICLES (Middle Funnel - Decelerating & Squeezing) */}
            {jammedParticles.map((p) => (
              <circle
                key={p.id}
                cx={p.x}
                cy={p.y}
                r={4}
                fill={p.x > 680 ? warningColor : '#F59E0B'}
                filter="url(#chokeGlow)"
                opacity={0.9}
              />
            ))}

            {/* TRICKLING PARTICLES (Right - Constrained & Slow) */}
            {tricklingParticles.map((p) => (
              <circle
                key={p.id}
                cx={p.x}
                cy={p.y}
                r={3.5}
                fill="#34D399"
                filter="url(#chokeGlow)"
                opacity={0.95}
              />
            ))}

            {/* Dynamic Restriction Ratio Badge at Center Throats */}
            <g transform="translate(800, 395)">
              <rect
                x="-80"
                y="-16"
                width="160"
                height="32"
                rx="16"
                fill="rgba(10, 10, 16, 0.95)"
                stroke={warningColor}
                strokeWidth="1.5"
                filter="url(#chokeGlow)"
              />
              <text
                x="0"
                y="5"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="12"
                fontFamily={FONT.mono}
                fontWeight="900"
                letterSpacing="1"
              >
                {restrictionPct} CHOKED
              </text>
            </g>

            {/* Center Vertical Target Crosshair Line */}
            <line
              x1="730"
              y1="90"
              x2="730"
              y2="350"
              stroke={warningColor}
              strokeWidth="1"
              strokeDasharray="3 3"
              strokeOpacity="0.6"
            />
          </svg>
        </div>

        {/* BOTTOM THREE COMPARATIVE METRIC CARDS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 20,
            marginTop: 18,
            transform: `translateY(${interpolate(statCardSpring, [0, 1], [20, 0])}px)`,
            opacity: statCardSpring,
          }}
        >
          {/* Card 1: Theoretical Capacity */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(14, 18, 28, 0.95) 0%, rgba(9, 12, 20, 0.98) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderLeft: `4px solid ${accentColor}`,
            }}
          >
            <div style={{ fontSize: 10, fontFamily: FONT.mono, color: 'rgba(255, 255, 255, 0.5)', letterSpacing: 1.5, fontWeight: 700, marginBottom: 4 }}>
              THEORETICAL CEILING
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: FONT.display, color: '#FFFFFF', marginBottom: 4 }}>
              {inputMetric}
            </div>
            <div style={{ fontSize: 12, fontFamily: FONT.sans, color: 'rgba(255, 255, 255, 0.65)' }}>
              {inputDesc}
            </div>
          </div>

          {/* Card 2: Constriction Point */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(28, 14, 20, 0.95) 0%, rgba(20, 9, 14, 0.98) 100%)',
              border: `1px solid ${warningColor}40`,
              borderLeft: `4px solid ${warningColor}`,
              boxShadow: `0 0 25px ${warningColor}15`,
            }}
          >
            <div style={{ fontSize: 10, fontFamily: FONT.mono, color: warningColor, letterSpacing: 1.5, fontWeight: 800, marginBottom: 4 }}>
              CRITICAL CONSTRICTION FACTOR
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: FONT.display, color: warningColor, marginBottom: 4 }}>
              {chokeMetric.replace('CHOKE POINT: ', '')}
            </div>
            <div style={{ fontSize: 12, fontFamily: FONT.sans, color: 'rgba(255, 255, 255, 0.7)' }}>
              {chokeDesc}
            </div>
          </div>

          {/* Card 3: Realized Output */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(14, 28, 20, 0.95) 0%, rgba(9, 20, 14, 0.98) 100%)',
              border: '1px solid rgba(52, 211, 153, 0.25)',
              borderLeft: '4px solid #34D399',
            }}
          >
            <div style={{ fontSize: 10, fontFamily: FONT.mono, color: '#34D399', letterSpacing: 1.5, fontWeight: 700, marginBottom: 4 }}>
              REALIZED SYSTEM YIELD
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: FONT.display, color: '#FFFFFF', marginBottom: 4 }}>
              {outputMetric} <span style={{ fontSize: 14, color: warningColor, fontWeight: 700 }}>({efficiency})</span>
            </div>
            <div style={{ fontSize: 12, fontFamily: FONT.sans, color: 'rgba(255, 255, 255, 0.65)' }}>
              {outputDesc}
            </div>
          </div>
        </div>

        {/* BOTTOM SYNTHESIS / AMDAHL'S LAW BAR */}
        <div
          style={{
            marginTop: 18,
            height: 48,
            borderRadius: 14,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            gap: 16,
            transform: `translateY(${interpolate(synthesisSpring, [0, 1], [15, 0])}px)`,
            opacity: synthesisSpring,
          }}
        >
          <div
            style={{
              padding: '3px 10px',
              borderRadius: 6,
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              fontSize: 10,
              fontFamily: FONT.mono,
              fontWeight: 800,
              color: warningColor,
              letterSpacing: 1.5,
              whiteSpace: 'nowrap',
            }}
          >
            AMDAHL'S AXIOM
          </div>

          <div
            style={{
              fontSize: 13,
              fontFamily: FONT.mono,
              color: 'rgba(255, 255, 255, 0.75)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: 0.5,
            }}
          >
            {synthesis}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
