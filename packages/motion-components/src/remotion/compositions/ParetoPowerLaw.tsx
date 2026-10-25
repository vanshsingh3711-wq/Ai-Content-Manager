import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate } from 'remotion';
import { FONT, useExitFade } from '../shared';

export interface ParetoPowerLawProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  synthesis?: string;
  vitalPct?: string;
  vitalLabel?: string;
  vitalDesc?: string;
  vitalReturn?: string;
  vitalColor?: string;
  trivialPct?: string;
  trivialLabel?: string;
  trivialDesc?: string;
  trivialReturn?: string;
  trivialColor?: string;
  accentColor?: string;
  [key: string]: any;
}

export const ParetoPowerLaw: React.FC<ParetoPowerLawProps> = ({
  title = 'THE PARETO PRINCIPLE',
  subtitle = '80/20 POWER LAW DISTRIBUTION & ASYMMETRIC SYSTEMIC LEVERAGE',
  badge = 'POWER LAW DYNAMICS',
  synthesis = 'In nonlinear complex systems, 80% of systemic yield is driven by 20% of critical architectural primitives.',
  vitalPct = '20%',
  vitalLabel = 'THE VITAL FEW',
  vitalDesc = 'Core architectural primitives, foundational models & automated CI/CD pipelines',
  vitalReturn = '80% SYSTEM IMPACT',
  vitalColor = '#00E5FF', // Cyan
  trivialPct = '80%',
  trivialLabel = 'THE TRIVIAL MANY (LONG TAIL)',
  trivialDesc = 'Marginal feature edge-cases, manual configuration toil & vanity optimizations',
  trivialReturn = '20% RESIDUAL VALUE',
  trivialColor = '#F59E0B', // Amber
  accentColor = '#00E5FF',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exitOpacity = useExitFade(frame, durationInFrames, 15);

  // Global entrance spring
  const containerEntrance = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 95, mass: 0.9 },
  });

  // Curve draw spring (frame 12-45)
  const curveSpring = spring({
    frame: Math.max(0, frame - 12),
    fps,
    config: { damping: 20, stiffness: 80, mass: 1.0 },
  });

  // 20% divider laser drop spring (frame 28-55)
  const dividerSpring = spring({
    frame: Math.max(0, frame - 28),
    fps,
    config: { damping: 14, stiffness: 90, mass: 0.8 },
  });

  // Shaded area & callout badge entrance (frame 38-65)
  const calloutSpring = spring({
    frame: Math.max(0, frame - 38),
    fps,
    config: { damping: 14, stiffness: 95 },
  });

  // Right HUD cards entrance (frame 42-70)
  const cardsSpring = spring({
    frame: Math.max(0, frame - 42),
    fps,
    config: { damping: 16, stiffness: 90 },
  });

  // Chart coordinate geometry (SVG viewBox: 0 0 980 500)
  const x0 = 90;
  const y0 = 430;
  const chartW = 820;
  const chartH = 350;

  // 20% cutoff position
  const cutoffX = x0 + chartW * 0.20; // 90 + 164 = 254

  // Pareto Power Law function: f(t) = 1 / (1 + 22*t)^1.55 where t in [0, 1]
  const sampleCount = 60;
  const curvePoints: [number, number][] = [];
  const vitalPoints: [number, number][] = [];
  const tailPoints: [number, number][] = [];

  for (let i = 0; i <= sampleCount; i++) {
    const t = i / sampleCount;
    const yVal = 1 / Math.pow(1 + 22 * t, 1.55);
    const px = x0 + t * chartW;
    const py = y0 - yVal * chartH;
    curvePoints.push([px, py]);

    if (t <= 0.2001) {
      vitalPoints.push([px, py]);
    } else {
      if (vitalPoints.length > 0 && tailPoints.length === 0) {
        // bridge the cutoff point
        const tCut = 0.20;
        const yCut = 1 / Math.pow(1 + 22 * tCut, 1.55);
        tailPoints.push([cutoffX, y0 - yCut * chartH]);
      }
      tailPoints.push([px, py]);
    }
  }

  // Generate SVG path for the curve
  const curvePathD = curvePoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

  // SVG path for Vital 20% shaded area under curve
  const vitalAreaD = [
    `M ${vitalPoints[0][0].toFixed(1)} ${vitalPoints[0][1].toFixed(1)}`,
    ...vitalPoints.slice(1).map(p => `L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`),
    `L ${cutoffX.toFixed(1)} ${y0}`,
    `L ${x0} ${y0}`,
    'Z'
  ].join(' ');

  // SVG path for Trivial 80% shaded area under tail
  const tailAreaD = [
    `M ${tailPoints[0][0].toFixed(1)} ${tailPoints[0][1].toFixed(1)}`,
    ...tailPoints.slice(1).map(p => `L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`),
    `L ${(x0 + chartW).toFixed(1)} ${y0}`,
    `L ${cutoffX.toFixed(1)} ${y0}`,
    'Z'
  ].join(' ');

  // Rough estimate of path length for stroke dash animation
  const approxPathLength = 1100;
  const strokeDashoffset = interpolate(curveSpring, [0, 1], [approxPathLength, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Animated laser divider line height
  const dividerYTop = interpolate(dividerSpring, [0, 1], [y0, 60], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#050505',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT.display,
        color: '#FFFFFF',
        opacity: exitOpacity,
        overflow: 'hidden',
      }}
    >
      {/* Background Subtle Ambient Glows */}
      <div
        style={{
          position: 'absolute',
          width: 850,
          height: 650,
          left: 100,
          top: 150,
          background: `radial-gradient(circle, ${vitalColor}14 0%, transparent 70%)`,
          filter: 'blur(75px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 500,
          right: 150,
          top: 250,
          background: `radial-gradient(circle, ${trivialColor}10 0%, transparent 70%)`,
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      {/* Main High-Tech Container Card */}
      <div
        style={{
          width: 1780,
          height: 980,
          borderRadius: 28,
          backgroundColor: 'rgba(8, 10, 15, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          boxShadow: `0 0 80px rgba(0, 0, 0, 0.9), 0 0 45px ${accentColor}12, inset 0 1px 2px rgba(255, 255, 255, 0.15)`,
          display: 'flex',
          flexDirection: 'column',
          padding: '40px 48px',
          boxSizing: 'border-box',
          position: 'relative',
          opacity: containerEntrance,
          transform: `scale(${interpolate(containerEntrance, [0, 1], [0.96, 1])})`,
        }}
      >
        {/* Top Glowing Edge Filament */}
        <div
          style={{
            position: 'absolute',
            top: -1,
            left: 80,
            right: 80,
            height: 2,
            background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
            boxShadow: `0 0 14px ${accentColor}`,
          }}
        />

        {/* ── HEADER ROW ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 14px',
                  borderRadius: 999,
                  backgroundColor: `${accentColor}15`,
                  border: `1px solid ${accentColor}40`,
                  fontSize: 12,
                  fontFamily: FONT.mono,
                  fontWeight: 900,
                  letterSpacing: '0.12em',
                  color: accentColor,
                  textTransform: 'uppercase',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: accentColor,
                    boxShadow: `0 0 10px ${accentColor}`,
                  }}
                />
                <span>{badge}</span>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: FONT.mono,
                  color: 'rgba(255, 255, 255, 0.45)',
                  letterSpacing: '0.08em',
                }}
              >
                // ASYMMETRIC DISTRIBUTION LAW
              </span>
            </div>

            <h1
              style={{
                fontSize: 38,
                fontWeight: 900,
                letterSpacing: '-0.03em',
                margin: 0,
                color: '#FFFFFF',
                textTransform: 'uppercase',
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: 13,
                fontFamily: FONT.mono,
                color: 'rgba(255, 255, 255, 0.55)',
                margin: '5px 0 0 0',
                letterSpacing: '0.08em',
              }}
            >
              {subtitle}
            </p>
          </div>

          {/* Top-Right Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                padding: '8px 18px',
                borderRadius: 12,
                backgroundColor: `${vitalColor}15`,
                border: `1px solid ${vitalColor}40`,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: vitalColor }} />
              <span style={{ fontSize: 13, fontFamily: FONT.mono, fontWeight: 900, color: vitalColor }}>
                20% EFFORT
              </span>
            </div>
            <div
              style={{
                padding: '8px 18px',
                borderRadius: 12,
                backgroundColor: `${trivialColor}15`,
                border: `1px solid ${trivialColor}40`,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: trivialColor }} />
              <span style={{ fontSize: 13, fontFamily: FONT.mono, fontWeight: 900, color: trivialColor }}>
                80% TAIL
              </span>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT (CHART + BREAKDOWN HUD) ── */}
        <div style={{ display: 'flex', flex: 1, gap: 36, minHeight: 0 }}>
          {/* LEFT: Power Law Decay Curve Chart */}
          <div
            style={{
              flex: '1.4',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              borderRadius: 22,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Chart Subheader */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontFamily: FONT.mono, fontWeight: 900, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em' }}>
                  VALUE DENSITY INTEGRAL // ASYMPTOTIC CURVE
                </span>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: FONT.mono,
                  color: accentColor,
                  backgroundColor: `${accentColor}12`,
                  padding: '3px 10px',
                  borderRadius: 6,
                  border: `1px solid ${accentColor}30`,
                }}
              >
                P(x) ~ x^(-α)
              </span>
            </div>

            {/* SVG Plot Area */}
            <div style={{ flex: 1, position: 'relative' }}>
              <svg
                viewBox="0 0 980 480"
                style={{ width: '100%', height: '100%', overflow: 'visible' }}
              >
                <defs>
                  {/* Vital 20% Gradient Fill */}
                  <linearGradient id="vitalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={vitalColor} stopOpacity={0.42} />
                    <stop offset="100%" stopColor={vitalColor} stopOpacity={0.08} />
                  </linearGradient>

                  {/* Tail 80% Gradient Fill */}
                  <linearGradient id="tailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={trivialColor} stopOpacity={0.16} />
                    <stop offset="100%" stopColor={trivialColor} stopOpacity={0.03} />
                  </linearGradient>

                  {/* Laser Divider Gradient */}
                  <linearGradient id="laserGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
                    <stop offset="40%" stopColor={vitalColor} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={vitalColor} stopOpacity={0.2} />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0.25, 0.5, 0.75, 1.0].map((frac, idx) => (
                  <line
                    key={`hgrid-${idx}`}
                    x1={x0}
                    y1={y0 - frac * chartH}
                    x2={x0 + chartW}
                    y2={y0 - frac * chartH}
                    stroke="rgba(255, 255, 255, 0.06)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}

                {[0.20, 0.40, 0.60, 0.80, 1.0].map((frac, idx) => (
                  <line
                    key={`vgrid-${idx}`}
                    x1={x0 + frac * chartW}
                    y1={60}
                    x2={x0 + frac * chartW}
                    y2={y0}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* X and Y Axes */}
                <line x1={x0} y1={y0} x2={x0 + chartW + 20} y2={y0} stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" />
                <line x1={x0} y1={y0} x2={x0} y2={50} stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" />

                {/* Axis Labels */}
                <text x={x0 - 15} y={y0} fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily={FONT.mono} textAnchor="end">
                  0%
                </text>
                <text x={x0 - 15} y={y0 - chartH * 0.8} fill={vitalColor} fontSize="11" fontFamily={FONT.mono} fontWeight="bold" textAnchor="end">
                  80%
                </text>
                <text x={x0 - 15} y={y0 - chartH} fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily={FONT.mono} textAnchor="end">
                  100%
                </text>

                <text x={x0} y={y0 + 24} fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily={FONT.mono} textAnchor="middle">
                  0%
                </text>
                <text x={cutoffX} y={y0 + 24} fill={vitalColor} fontSize="12" fontFamily={FONT.mono} fontWeight="bold" textAnchor="middle">
                  20% (VITAL)
                </text>
                <text x={x0 + chartW * 0.6} y={y0 + 24} fill={trivialColor} fontSize="11" fontFamily={FONT.mono} textAnchor="middle">
                  60%
                </text>
                <text x={x0 + chartW} y={y0 + 24} fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily={FONT.mono} textAnchor="middle">
                  100%
                </text>

                {/* Shaded Area: Trivial 80% Tail */}
                <path
                  d={tailAreaD}
                  fill="url(#tailGrad)"
                  opacity={interpolate(dividerSpring, [0, 1], [0, 0.95])}
                />

                {/* Shaded Area: Vital 20% (The 80% Value Core) */}
                <path
                  d={vitalAreaD}
                  fill="url(#vitalGrad)"
                  opacity={interpolate(dividerSpring, [0, 1], [0, 1])}
                />

                {/* The Asymptotic Power Law Curve Stroke */}
                <path
                  d={curvePathD}
                  fill="none"
                  stroke={vitalColor}
                  strokeWidth="4"
                  strokeDasharray={approxPathLength}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  filter="drop-shadow(0 0 10px rgba(0, 229, 255, 0.7))"
                />

                {/* Vertical Laser Divider Line at 20% */}
                {dividerSpring > 0.05 && (
                  <g>
                    <line
                      x1={cutoffX}
                      y1={dividerYTop}
                      x2={cutoffX}
                      y2={y0}
                      stroke="url(#laserGrad)"
                      strokeWidth="2.5"
                      strokeDasharray="5 3"
                    />
                    {/* Glowing point at divider top */}
                    <circle
                      cx={cutoffX}
                      cy={dividerYTop}
                      r="4"
                      fill="#FFFFFF"
                      filter={`drop-shadow(0 0 8px ${vitalColor})`}
                    />
                  </g>
                )}
              </svg>

              {/* Shaded Area Callout 1: "80% OF VALUE" (Pill on 20% Integral) */}
              <div
                style={{
                  position: 'absolute',
                  left: 140,
                  top: 150,
                  padding: '10px 18px',
                  borderRadius: 14,
                  backgroundColor: 'rgba(0, 229, 255, 0.18)',
                  border: `1.5px solid ${vitalColor}`,
                  boxShadow: `0 0 25px ${vitalColor}35`,
                  backdropFilter: 'blur(12px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  opacity: calloutSpring,
                  transform: `scale(${calloutSpring}) translateY(${interpolate(calloutSpring, [0, 1], [15, 0])}px)`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: vitalColor }} />
                  <span style={{ fontSize: 10, fontFamily: FONT.mono, fontWeight: 900, color: vitalColor, letterSpacing: '0.1em' }}>
                    CONCENTRATED MASS
                  </span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                  80% OF VALUE
                </span>
                <span style={{ fontSize: 10, fontFamily: FONT.mono, color: 'rgba(255, 255, 255, 0.65)' }}>
                  Compressed inside 20% input boundary
                </span>
              </div>

              {/* Shaded Area Callout 2: "LONG TAIL: 20% RESIDUAL" */}
              <div
                style={{
                  position: 'absolute',
                  left: 480,
                  top: 310,
                  padding: '8px 16px',
                  borderRadius: 12,
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  border: `1px solid ${trivialColor}50`,
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  opacity: interpolate(calloutSpring, [0, 1], [0, 0.9]),
                  transform: `translateY(${interpolate(calloutSpring, [0, 1], [10, 0])}px)`,
                }}
              >
                <span style={{ fontSize: 9, fontFamily: FONT.mono, fontWeight: 900, color: trivialColor, letterSpacing: '0.08em' }}>
                  DIMINISHING RETURNS
                </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>
                  LONG TAIL: 20% RESIDUAL
                </span>
                <span style={{ fontSize: 9, fontFamily: FONT.mono, color: 'rgba(255, 255, 255, 0.55)' }}>
                  80% inputs produce only 20% marginal yield
                </span>
              </div>
            </div>

            {/* Bottom X-Axis Explanatory Legend */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 8,
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                marginTop: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: vitalColor }} />
                <span style={{ fontSize: 11, fontFamily: FONT.mono, color: 'rgba(255, 255, 255, 0.7)' }}>
                  Critical 20% Inputs (Core Leverage)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: trivialColor }} />
                <span style={{ fontSize: 11, fontFamily: FONT.mono, color: 'rgba(255, 255, 255, 0.7)' }}>
                  Exhaustive 80% Inputs (Long Tail Toil)
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Analytical Breakdown Cards HUD */}
          <div
            style={{
              flex: '1.0',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              opacity: cardsSpring,
              transform: `translateX(${interpolate(cardsSpring, [0, 1], [25, 0])}px)`,
            }}
          >
            {/* Card 1: The Vital Few 20% */}
            <div
              style={{
                flex: 1,
                padding: '24px 28px',
                borderRadius: 20,
                backgroundColor: 'rgba(0, 229, 255, 0.05)',
                border: `1px solid ${vitalColor}45`,
                boxShadow: `0 0 35px ${vitalColor}12`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 4,
                  height: '100%',
                  backgroundColor: vitalColor,
                  boxShadow: `0 0 12px ${vitalColor}`,
                }}
              />
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: FONT.mono,
                      fontWeight: 900,
                      color: vitalColor,
                      backgroundColor: `${vitalColor}20`,
                      padding: '4px 10px',
                      borderRadius: 6,
                      letterSpacing: '0.1em',
                    }}
                  >
                    {vitalLabel} // {vitalPct}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: FONT.mono, color: 'rgba(255,255,255,0.4)' }}>
                    TOP TIER
                  </span>
                </div>
                <h2
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    margin: '4px 0 8px 0',
                    color: '#FFFFFF',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {vitalReturn}
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.45, margin: 0 }}>
                  {vitalDesc}
                </p>
              </div>

              {/* Progress Bar (80% full) */}
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: FONT.mono, marginBottom: 5 }}>
                  <span style={{ color: vitalColor, fontWeight: 'bold' }}>Yield Share</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 900 }}>80.0%</span>
                </div>
                <div style={{ height: 7, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: '80%',
                      backgroundColor: vitalColor,
                      borderRadius: 4,
                      boxShadow: `0 0 10px ${vitalColor}`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Card 2: The Trivial Many 80% */}
            <div
              style={{
                flex: 1,
                padding: '24px 28px',
                borderRadius: 20,
                backgroundColor: 'rgba(245, 158, 11, 0.04)',
                border: `1px solid ${trivialColor}35`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 4,
                  height: '100%',
                  backgroundColor: trivialColor,
                }}
              />
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: FONT.mono,
                      fontWeight: 900,
                      color: trivialColor,
                      backgroundColor: `${trivialColor}18`,
                      padding: '4px 10px',
                      borderRadius: 6,
                      letterSpacing: '0.1em',
                    }}
                  >
                    {trivialLabel} // {trivialPct}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: FONT.mono, color: 'rgba(255,255,255,0.4)' }}>
                    ASYMPTOTE
                  </span>
                </div>
                <h2
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    margin: '4px 0 8px 0',
                    color: '#FFFFFF',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {trivialReturn}
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.70)', lineHeight: 1.45, margin: 0 }}>
                  {trivialDesc}
                </p>
              </div>

              {/* Progress Bar (20% full) */}
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: FONT.mono, marginBottom: 5 }}>
                  <span style={{ color: trivialColor, fontWeight: 'bold' }}>Yield Share</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 900 }}>20.0%</span>
                </div>
                <div style={{ height: 7, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: '20%',
                      backgroundColor: trivialColor,
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Asymmetric Leverage Multiplier Callout */}
            <div
              style={{
                padding: '16px 22px',
                borderRadius: 16,
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: 10, fontFamily: FONT.mono, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  LEVERAGE MULTIPLIER
                </span>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', marginTop: 2 }}>
                  16x Higher Return
                </div>
              </div>
              <div
                style={{
                  padding: '6px 14px',
                  borderRadius: 10,
                  backgroundColor: `${vitalColor}20`,
                  border: `1px solid ${vitalColor}50`,
                  fontSize: 14,
                  fontFamily: FONT.mono,
                  fontWeight: 900,
                  color: vitalColor,
                }}
              >
                4.0 / 0.25 = 16.0x
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER SYSTEM LAW BANNER ── */}
        <div
          style={{
            marginTop: 18,
            padding: '12px 22px',
            borderRadius: 14,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              backgroundColor: `${accentColor}18`,
              border: `1px solid ${accentColor}40`,
              fontSize: 10,
              fontFamily: FONT.mono,
              fontWeight: 900,
              color: accentColor,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            POWER LAW
          </span>
          <span
            style={{
              fontSize: 13,
              fontFamily: FONT.mono,
              color: 'rgba(255, 255, 255, 0.8)',
              letterSpacing: '0.02em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {synthesis}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
