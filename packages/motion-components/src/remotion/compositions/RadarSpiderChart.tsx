import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate } from 'remotion';
import { FONT, useExitFade } from '../shared';

export interface RadarSpiderChartProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  synthesis?: string;
  axis1?: string;
  axis2?: string;
  axis3?: string;
  axis4?: string;
  axis5?: string;
  entity1Name?: string;
  entity1Score1?: number;
  entity1Score2?: number;
  entity1Score3?: number;
  entity1Score4?: number;
  entity1Score5?: number;
  entity1Badge?: string;
  entity1Color?: string;
  entity2Name?: string;
  entity2Score1?: number;
  entity2Score2?: number;
  entity2Score3?: number;
  entity2Score4?: number;
  entity2Score5?: number;
  entity2Badge?: string;
  entity2Color?: string;
  accentColor?: string;
  [key: string]: any;
}

export const RadarSpiderChart: React.FC<RadarSpiderChartProps> = ({
  title = 'FRONTIER MODEL BENCHMARK',
  subtitle = 'MULTI-DIMENSIONAL PERFORMANCE & ARCHITECTURAL TRADEOFF MATRIX',
  badge = 'POLYGONAL RADAR BENCHMARK',
  synthesis = 'Radar evaluations reveal asymmetric trade-offs: cognitive swarms sacrifice raw inference speed for epistemic accuracy.',
  axis1 = 'Reasoning Depth',
  axis2 = 'Inference Speed',
  axis3 = 'Context Coherence',
  axis4 = 'Cost Efficiency',
  axis5 = 'Autonomous Agency',
  entity1Name = 'Autonomous Agent System',
  entity1Score1 = 96,
  entity1Score2 = 72,
  entity1Score3 = 98,
  entity1Score4 = 86,
  entity1Score5 = 94,
  entity1Badge = 'STATEFUL SWARM',
  entity1Color = '#00E5FF', // Cyan
  entity2Name = 'Monolithic Base LLM',
  entity2Score1 = 68,
  entity2Score2 = 94,
  entity2Score3 = 70,
  entity2Score4 = 64,
  entity2Score5 = 52,
  entity2Badge = 'ZERO-SHOT PROMPT',
  entity2Color = '#F59E0B', // Amber
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

  // Radar grid draw entrance (frame 0-25)
  const gridSpring = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 16, stiffness: 90 },
  });

  // Entity 1 Polygon expansion spring (frame 18-48)
  const entity1Spring = spring({
    frame: Math.max(0, frame - 18),
    fps,
    config: { damping: 14, stiffness: 85, mass: 1.0 },
  });

  // Entity 2 Polygon expansion spring (frame 32-62)
  const entity2Spring = spring({
    frame: Math.max(0, frame - 32),
    fps,
    config: { damping: 14, stiffness: 85, mass: 1.0 },
  });

  // Right HUD cards entrance (frame 38-68)
  const cardsSpring = spring({
    frame: Math.max(0, frame - 38),
    fps,
    config: { damping: 16, stiffness: 90 },
  });

  // Bottom synthesis axiom entrance
  const axiomSpring = spring({
    frame: Math.max(0, frame - 52),
    fps,
    config: { damping: 16, stiffness: 95 },
  });

  // Rotating radar sweep beam
  const sweepAngle = (frame * 3.5) % 360;

  // Geometry: 5-Axis Pentagon Radar
  // Center: (cx = 480, cy = 460), Max Radius R = 230
  const cx = 490;
  const cy = 460;
  const R = 230;
  const numAxes = 5;
  const axes = [axis1, axis2, axis3, axis4, axis5];

  // Calculate vertex coordinates at a given radius ratio (0 to 1)
  const getVertex = (index: number, ratio: number) => {
    // Start top (-pi/2) and rotate clockwise
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / numAxes;
    const r = R * Math.max(0, Math.min(1, ratio));
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  // Concentric pentagon rings
  const ringRatios = [0.25, 0.5, 0.75, 1.0];

  // Helper to build SVG polygon points string
  const buildPolygonPath = (scores: number[], animSpring: number) => {
    return scores
      .map((score, i) => {
        const v = getVertex(i, (score / 100) * animSpring);
        return `${v.x},${v.y}`;
      })
      .join(' ');
  };

  const entity1Scores = [entity1Score1, entity1Score2, entity1Score3, entity1Score4, entity1Score5];
  const entity2Scores = [entity2Score1, entity2Score2, entity2Score3, entity2Score4, entity2Score5];

  const avg1 = Math.round(entity1Scores.reduce((a, b) => a + b, 0) / 5);
  const avg2 = Math.round(entity2Scores.reduce((a, b) => a + b, 0) / 5);

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
          background: `radial-gradient(circle, ${entity1Color}12 0%, ${entity2Color}08 40%, transparent 75%)`,
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
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

          {/* Top Right Legend Pills */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 10,
                backgroundColor: `${entity1Color}15`,
                border: `1px solid ${entity1Color}40`,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: entity1Color,
                  boxShadow: `0 0 10px ${entity1Color}`,
                }}
              />
              <span style={{ fontFamily: FONT.mono, fontSize: 12, fontWeight: 800, color: '#FFFFFF' }}>
                {entity1Name}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 10,
                backgroundColor: `${entity2Color}15`,
                border: `1px solid ${entity2Color}40`,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: entity2Color,
                  boxShadow: `0 0 10px ${entity2Color}`,
                }}
              />
              <span style={{ fontFamily: FONT.mono, fontSize: 12, fontWeight: 800, color: '#FFFFFF' }}>
                {entity2Name}
              </span>
            </div>
          </div>
        </div>

        {/* Center Section: Spider Web on Left, Comparative HUD on Right */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            position: 'relative',
            minHeight: 0,
            gap: 40,
          }}
        >
          {/* LEFT: SVG Radar Spider Web Canvas (Width: 980px) */}
          <div
            style={{
              flex: '0 0 980px',
              position: 'relative',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                overflow: 'visible',
              }}
            >
              <defs>
                <radialGradient id="sweepGrad" cx="0%" cy="0%" r="100%">
                  <stop offset="0%" stopColor={accentColor} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
                </radialGradient>
                <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Concentric Pentagon Rings */}
              {ringRatios.map((ratio, rIdx) => {
                const ringPoints = Array.from({ length: numAxes })
                  .map((_, i) => {
                    const pt = getVertex(i, ratio * gridSpring);
                    return `${pt.x},${pt.y}`;
                  })
                  .join(' ');
                return (
                  <polygon
                    key={rIdx}
                    points={ringPoints}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="1"
                    strokeDasharray={ratio < 1.0 ? '4 4' : undefined}
                  />
                );
              })}

              {/* Radial Axis Spokes */}
              {Array.from({ length: numAxes }).map((_, i) => {
                const endPt = getVertex(i, 1.0 * gridSpring);
                return (
                  <line
                    key={i}
                    x1={cx}
                    y1={cy}
                    x2={endPt.x}
                    y2={endPt.y}
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="1.2"
                  />
                );
              })}

              {/* ENTITY 2 (Base LLM - Amber) Polygon Fill */}
              {entity2Spring > 0.05 && (
                <polygon
                  points={buildPolygonPath(entity2Scores, entity2Spring)}
                  fill={`${entity2Color}25`}
                  stroke={entity2Color}
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
              )}

              {/* ENTITY 1 (Autonomous Agent - Cyan) Polygon Fill */}
              {entity1Spring > 0.05 && (
                <polygon
                  points={buildPolygonPath(entity1Scores, entity1Spring)}
                  fill={`${entity1Color}35`}
                  stroke={entity1Color}
                  strokeWidth="3"
                  strokeLinejoin="round"
                  filter="url(#radarGlow)"
                />
              )}

              {/* Entity 1 Vertex Marker Dots */}
              {entity1Spring > 0.2 &&
                entity1Scores.map((score, i) => {
                  const pt = getVertex(i, (score / 100) * entity1Spring);
                  return (
                    <g key={i}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={6}
                        fill="#050505"
                        stroke={entity1Color}
                        strokeWidth="2.5"
                        boxShadow={`0 0 10px ${entity1Color}`}
                      />
                      <circle cx={pt.x} cy={pt.y} r={2.5} fill="#FFFFFF" />
                    </g>
                  );
                })}

              {/* Entity 2 Vertex Marker Dots */}
              {entity2Spring > 0.2 &&
                entity2Scores.map((score, i) => {
                  const pt = getVertex(i, (score / 100) * entity2Spring);
                  return (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r={4.5}
                      fill={entity2Color}
                      boxShadow={`0 0 8px ${entity2Color}`}
                    />
                  );
                })}
            </svg>

            {/* Axis Label Tags Positioned Around the Perimeter */}
            {axes.map((label, i) => {
              const labelPt = getVertex(i, 1.18);
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: labelPt.x,
                    top: labelPt.y,
                    transform: 'translate(-50%, -50%)',
                    fontFamily: FONT.mono,
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#E2E8F0',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    whiteSpace: 'nowrap',
                    opacity: gridSpring,
                  }}
                >
                  {label}
                </div>
              );
            })}
          </div>

          {/* RIGHT: Comparative Dimension Breakdown HUD Cards */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 16,
              transform: `translateX(${interpolate(cardsSpring, [0, 1], [30, 0])}px)`,
              opacity: cardsSpring,
            }}
          >
            {/* Entity 1 Breakdown Card (Cyan) */}
            <div
              style={{
                backgroundColor: 'rgba(10, 25, 35, 0.65)',
                borderRadius: 18,
                border: `1px solid ${entity1Color}50`,
                boxShadow: `0 0 35px ${entity1Color}15, inset 0 0 15px ${entity1Color}08`,
                padding: '20px 24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    padding: '3px 8px',
                    borderRadius: 6,
                    backgroundColor: `${entity1Color}20`,
                    color: entity1Color,
                    border: `1px solid ${entity1Color}40`,
                  }}
                >
                  {entity1Badge}
                </span>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 20,
                    fontWeight: 900,
                    color: entity1Color,
                  }}
                >
                  {avg1}% AVG
                </span>
              </div>

              <div style={{ fontSize: 19, fontWeight: 900, color: '#FFFFFF', marginBottom: 10 }}>
                {entity1Name}
              </div>

              {/* Progress bars for dimensions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {axes.slice(0, 3).map((ax, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: FONT.mono, fontSize: 11, color: '#94A3B8', width: 140 }}>
                      {ax}
                    </span>
                    <div style={{ flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${entity1Scores[idx] * entity1Spring}%`,
                          backgroundColor: entity1Color,
                          borderRadius: 3,
                          boxShadow: `0 0 8px ${entity1Color}`,
                        }}
                      />
                    </div>
                    <span style={{ fontFamily: FONT.mono, fontSize: 11, fontWeight: 800, color: '#FFFFFF', width: 35 }}>
                      {entity1Scores[idx]}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Entity 2 Breakdown Card (Amber) */}
            <div
              style={{
                backgroundColor: 'rgba(30, 20, 10, 0.65)',
                borderRadius: 18,
                border: `1px solid ${entity2Color}50`,
                boxShadow: `0 0 35px ${entity2Color}15, inset 0 0 15px ${entity2Color}08`,
                padding: '20px 24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    padding: '3px 8px',
                    borderRadius: 6,
                    backgroundColor: `${entity2Color}20`,
                    color: entity2Color,
                    border: `1px solid ${entity2Color}40`,
                  }}
                >
                  {entity2Badge}
                </span>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 20,
                    fontWeight: 900,
                    color: entity2Color,
                  }}
                >
                  {avg2}% AVG
                </span>
              </div>

              <div style={{ fontSize: 19, fontWeight: 900, color: '#FFFFFF', marginBottom: 10 }}>
                {entity2Name}
              </div>

              {/* Progress bars for dimensions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {axes.slice(0, 3).map((ax, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: FONT.mono, fontSize: 11, color: '#94A3B8', width: 140 }}>
                      {ax}
                    </span>
                    <div style={{ flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${entity2Scores[idx] * entity2Spring}%`,
                          backgroundColor: entity2Color,
                          borderRadius: 3,
                          boxShadow: `0 0 8px ${entity2Color}`,
                        }}
                      />
                    </div>
                    <span style={{ fontFamily: FONT.mono, fontSize: 11, fontWeight: 800, color: '#FFFFFF', width: 35 }}>
                      {entity2Scores[idx]}%
                    </span>
                  </div>
                ))}
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
            EVALUATION LAW
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
