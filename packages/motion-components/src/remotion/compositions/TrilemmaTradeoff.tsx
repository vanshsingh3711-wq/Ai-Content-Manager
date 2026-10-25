import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate } from 'remotion';
import { FONT, useExitFade } from '../shared';

export interface TrilemmaTradeoffProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  axiom?: string;
  vertex1Title?: string;
  vertex1Desc?: string;
  vertex1Metric?: string;
  vertex2Title?: string;
  vertex2Desc?: string;
  vertex2Metric?: string;
  vertex3Title?: string;
  vertex3Desc?: string;
  vertex3Metric?: string;
  sacrificedVertex?: number; // 1, 2, or 3 (default 3)
  accentColor?: string;
  activeColor?: string;
  sacrificedColor?: string;
  colorTheme?: string;
  [key: string]: any;
}

export const TrilemmaTradeoff: React.FC<TrilemmaTradeoffProps> = ({
  title = 'THE BLOCKCHAIN TRILEMMA',
  subtitle = 'YOU CAN ONLY OPTIMIZE TWO VERTICES. THE THIRD IS INEVITABLY SACRIFICED.',
  badge = 'ARCHITECTURAL TRADE-OFF THEOREM',
  axiom = 'Any attempt to forcefully scale throughput degrades either decentralized trust or consensus integrity.',
  vertex1Title = 'Decentralization',
  vertex1Desc = 'Distributed nodes worldwide with zero central point of failure',
  vertex1Metric = '100% PRESERVED',
  vertex2Title = 'Security',
  vertex2Desc = 'Cryptographic proof-of-work consensus protecting state history',
  vertex2Metric = '100% PRESERVED',
  vertex3Title = 'Scalability',
  vertex3Desc = 'High transaction throughput and low latency confirmation',
  vertex3Metric = '15 TPS (SACRIFICED)',
  sacrificedVertex = 3,
  accentColor = '#00E5FF', // Cyan
  activeColor = '#10B981', // Emerald
  sacrificedColor = '#F43F5E', // Rose/Red
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

  // Triangle draw-in spring
  const triangleDrawSpring = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 16, stiffness: 90 },
  });

  // Selector core migration spring (frame 20 to 50)
  const selectorSpring = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 15, stiffness: 80, mass: 1.1 },
  });

  // Sacrificed apex strike-through stamp spring (frame 42 onwards)
  const sacrificeStampSpring = spring({
    frame: Math.max(0, frame - 42),
    fps,
    config: { damping: 12, stiffness: 120, mass: 0.8 },
  });

  // Bottom axiom bar entrance
  const axiomSpring = spring({
    frame: Math.max(0, frame - 48),
    fps,
    config: { damping: 16, stiffness: 95 },
  });

  // Pulsing energy along the active optimized edge
  const edgePulse = Math.sin((frame / fps) * 2 * Math.PI * 3) * 0.2 + 0.8;

  // Triangle Geometry (Centered in the 1760x940 card, height: 460px)
  // Center of triangle area: cx = 880, cy = 410
  // Equilateral triangle dimensions:
  // Top Apex (V1): (880, 200)
  // Bottom-Left Apex (V2): (620, 560)
  // Bottom-Right Apex (V3): (1140, 560)
  const v1 = { x: 880, y: 195 };
  const v2 = { x: 610, y: 550 };
  const v3 = { x: 1150, y: 550 };
  const centroid = { x: (v1.x + v2.x + v3.x) / 3, y: (v1.y + v2.y + v3.y) / 3 }; // (880, 431)

  // Selector Target: midpoint of the two preserved vertices
  // If sacrificedVertex === 3 -> active edge is V1 to V2, midpoint is (745, 372)
  // If sacrificedVertex === 2 -> active edge is V1 to V3, midpoint is (1015, 372)
  // If sacrificedVertex === 1 -> active edge is V2 to V3, midpoint is (880, 550)
  const activeMidpoint =
    sacrificedVertex === 3
      ? { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 }
      : sacrificedVertex === 2
      ? { x: (v1.x + v3.x) / 2, y: (v1.y + v3.y) / 2 }
      : { x: (v2.x + v3.x) / 2, y: (v2.y + v3.y) / 2 };

  // Animated Selector Position from Centroid to Active Midpoint
  const selectorPos = {
    x: interpolate(selectorSpring, [0, 1], [centroid.x, activeMidpoint.x]),
    y: interpolate(selectorSpring, [0, 1], [centroid.y, activeMidpoint.y]),
  };

  const isV1Sacrificed = sacrificedVertex === 1;
  const isV2Sacrificed = sacrificedVertex === 2;
  const isV3Sacrificed = sacrificedVertex === 3;

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
      {/* Background Ambient Glows */}
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 800,
          left: 540,
          top: 140,
          background: 'radial-gradient(circle, rgba(0, 229, 255, 0.08) 0%, rgba(16, 185, 129, 0.04) 50%, transparent 75%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          right: 200,
          bottom: 100,
          background: `radial-gradient(circle, ${sacrificedColor}15 0%, transparent 65%)`,
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
        {/* Subtle Tech Coordinates / Watermark */}
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
          AXIOMATIC TRIANGLE // PARADOX MATRIX // N=3, K=2
        </div>

        {/* TOP HEADER */}
        <div style={{ marginBottom: 10 }}>
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
                background: 'rgba(0, 229, 255, 0.1)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                fontSize: 11,
                fontFamily: FONT.mono,
                fontWeight: 700,
                color: accentColor,
                letterSpacing: 1.5,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: accentColor,
                  boxShadow: `0 0 10px ${accentColor}`,
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
              SELECT EXACTLY TWO &nbsp;|&nbsp; <span style={{ color: sacrificedColor, fontWeight: 800 }}>1 COMPROMISED APEX</span>
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

        {/* MAIN INTERACTIVE GEOMETRIC STAGE */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 620,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1664 620"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <filter id="triGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="intenseLaser" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="10" result="blur1" />
                <feGaussianBlur stdDeviation="3" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur1" />
                  <feMergeNode in="blur2" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Inner Subdivided Geometry Grid & Coordinate Rings */}
            <circle cx={centroid.x} cy={centroid.y} r="180" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" strokeDasharray="4 6" />
            <circle cx={centroid.x} cy={centroid.y} r="80" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />

            {/* Three Neutral Boundary Edges (Drawn on entrance) */}
            <g opacity={triangleDrawSpring}>
              {/* Edge 1: V1 to V2 */}
              <line
                x1={v1.x}
                y1={v1.y}
                x2={v2.x}
                y2={v2.y}
                stroke={!isV1Sacrificed && !isV2Sacrificed ? activeColor : 'rgba(255, 255, 255, 0.15)'}
                strokeWidth={!isV1Sacrificed && !isV2Sacrificed ? 3.5 : 1.5}
                filter={!isV1Sacrificed && !isV2Sacrificed ? 'url(#intenseLaser)' : undefined}
                strokeOpacity={!isV1Sacrificed && !isV2Sacrificed ? edgePulse : 0.4}
              />
              {/* Edge 2: V2 to V3 */}
              <line
                x1={v2.x}
                y1={v2.y}
                x2={v3.x}
                y2={v3.y}
                stroke={!isV2Sacrificed && !isV3Sacrificed ? activeColor : 'rgba(255, 255, 255, 0.15)'}
                strokeWidth={!isV2Sacrificed && !isV3Sacrificed ? 3.5 : 1.5}
                filter={!isV2Sacrificed && !isV3Sacrificed ? 'url(#intenseLaser)' : undefined}
                strokeOpacity={!isV2Sacrificed && !isV3Sacrificed ? edgePulse : 0.4}
              />
              {/* Edge 3: V1 to V3 */}
              <line
                x1={v1.x}
                y1={v1.y}
                x2={v3.x}
                y2={v3.y}
                stroke={!isV1Sacrificed && !isV3Sacrificed ? activeColor : 'rgba(255, 255, 255, 0.15)'}
                strokeWidth={!isV1Sacrificed && !isV3Sacrificed ? 3.5 : 1.5}
                filter={!isV1Sacrificed && !isV3Sacrificed ? 'url(#intenseLaser)' : undefined}
                strokeOpacity={!isV1Sacrificed && !isV3Sacrificed ? edgePulse : 0.4}
              />

              {/* White Core Filament on the Active Optimized Edge */}
              {isV3Sacrificed && (
                <line x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.9" />
              )}
              {isV2Sacrificed && (
                <line x1={v1.x} y1={v1.y} x2={v3.x} y2={v3.y} stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.9" />
              )}
              {isV1Sacrificed && (
                <line x1={v2.x} y1={v2.y} x2={v3.x} y2={v3.y} stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.9" />
              )}

              {/* Dashed connector rays from Centroid to each apex */}
              <line x1={centroid.x} y1={centroid.y} x2={v1.x} y2={v1.y} stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" strokeDasharray="3 4" />
              <line x1={centroid.x} y1={centroid.y} x2={v2.x} y2={v2.y} stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" strokeDasharray="3 4" />
              <line x1={centroid.x} y1={centroid.y} x2={v3.x} y2={v3.y} stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" strokeDasharray="3 4" />
            </g>

            {/* Glowing Active Selector Core / Energy Gyroscope */}
            <g transform={`translate(${selectorPos.x}, ${selectorPos.y})`}>
              {/* Outer Pulse Ring */}
              <circle r="22" fill="none" stroke={activeColor} strokeWidth="1.5" strokeOpacity="0.6" filter="url(#triGlow)" />
              {/* Inner Glowing Core */}
              <circle r="12" fill={activeColor} filter="url(#intenseLaser)" />
              <circle r="5" fill="#FFFFFF" />

              {/* Selector Label Tag */}
              <rect x="-56" y="-38" width="112" height="22" rx="11" fill="rgba(8, 10, 16, 0.95)" stroke={activeColor} strokeWidth="1.2" />
              <text x="0" y="-23" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontFamily={FONT.mono} fontWeight="900" letterSpacing="1">
                OPTIMIZED STATE
              </text>
            </g>

            {/* THREE APEX RETICLES & PULL RINGS */}
            {/* Vertex 1 Reticle (Top) */}
            <circle cx={v1.x} cy={v1.y} r="16" fill="rgba(8, 10, 16, 0.9)" stroke={isV1Sacrificed ? sacrificedColor : accentColor} strokeWidth="2" filter="url(#triGlow)" />
            <circle cx={v1.x} cy={v1.y} r="6" fill={isV1Sacrificed ? sacrificedColor : accentColor} />

            {/* Vertex 2 Reticle (Bottom-Left) */}
            <circle cx={v2.x} cy={v2.y} r="16" fill="rgba(8, 10, 16, 0.9)" stroke={isV2Sacrificed ? sacrificedColor : accentColor} strokeWidth="2" filter="url(#triGlow)" />
            <circle cx={v2.x} cy={v2.y} r="6" fill={isV2Sacrificed ? sacrificedColor : accentColor} />

            {/* Vertex 3 Reticle (Bottom-Right) */}
            <circle cx={v3.x} cy={v3.y} r="16" fill="rgba(8, 10, 16, 0.9)" stroke={isV3Sacrificed ? sacrificedColor : accentColor} strokeWidth="2" filter="url(#triGlow)" />
            <circle cx={v3.x} cy={v3.y} r="6" fill={isV3Sacrificed ? sacrificedColor : accentColor} />

            {/* SACRIFICED APEX STRIKE-THROUGH STAMP (Over Vertex 3 by default) */}
            {isV3Sacrificed && sacrificeStampSpring > 0.05 && (
              <g
                transform={`translate(${v3.x}, ${v3.y}) rotate(-14) scale(${interpolate(sacrificeStampSpring, [0, 1], [1.6, 1])})`}
                opacity={sacrificeStampSpring}
              >
                <rect x="-85" y="-18" width="170" height="36" rx="6" fill="rgba(244, 63, 94, 0.22)" stroke={sacrificedColor} strokeWidth="2" filter="url(#triGlow)" />
                <text x="0" y="6" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontFamily={FONT.mono} fontWeight="900" letterSpacing="1.5">
                  ✕ SACRIFICED
                </text>
              </g>
            )}
            {isV2Sacrificed && sacrificeStampSpring > 0.05 && (
              <g
                transform={`translate(${v2.x}, ${v2.y}) rotate(14) scale(${interpolate(sacrificeStampSpring, [0, 1], [1.6, 1])})`}
                opacity={sacrificeStampSpring}
              >
                <rect x="-85" y="-18" width="170" height="36" rx="6" fill="rgba(244, 63, 94, 0.22)" stroke={sacrificedColor} strokeWidth="2" filter="url(#triGlow)" />
                <text x="0" y="6" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontFamily={FONT.mono} fontWeight="900" letterSpacing="1.5">
                  ✕ SACRIFICED
                </text>
              </g>
            )}
            {isV1Sacrificed && sacrificeStampSpring > 0.05 && (
              <g
                transform={`translate(${v1.x}, ${v1.y}) rotate(-8) scale(${interpolate(sacrificeStampSpring, [0, 1], [1.6, 1])})`}
                opacity={sacrificeStampSpring}
              >
                <rect x="-85" y="-18" width="170" height="36" rx="6" fill="rgba(244, 63, 94, 0.22)" stroke={sacrificedColor} strokeWidth="2" filter="url(#triGlow)" />
                <text x="0" y="6" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontFamily={FONT.mono} fontWeight="900" letterSpacing="1.5">
                  ✕ SACRIFICED
                </text>
              </g>
            )}
          </svg>

          {/* THREE FLOATING HUD CARDS (Positioned beside each apex) */}
          {/* Card 1: Top Apex (Centered above V1) */}
          <div
            style={{
              position: 'absolute',
              top: 15,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 380,
              padding: '14px 20px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(14, 18, 28, 0.95) 0%, rgba(9, 12, 20, 0.98) 100%)',
              border: `1px solid ${isV1Sacrificed ? `${sacrificedColor}60` : 'rgba(255, 255, 255, 0.12)'}`,
              borderTop: `4px solid ${isV1Sacrificed ? sacrificedColor : activeColor}`,
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: FONT.mono,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 6,
                  color: isV1Sacrificed ? sacrificedColor : activeColor,
                  backgroundColor: `${isV1Sacrificed ? sacrificedColor : activeColor}20`,
                }}
              >
                {isV1Sacrificed ? 'COMPROMISED [01]' : 'OPTIMIZED [01]'}
              </span>
              <span style={{ fontSize: 10, fontFamily: FONT.mono, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>
                {vertex1Metric}
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: FONT.display, color: '#FFFFFF', marginBottom: 2 }}>
              {vertex1Title}
            </div>
            <div style={{ fontSize: 12, fontFamily: FONT.sans, color: 'rgba(255, 255, 255, 0.65)' }}>
              {vertex1Desc}
            </div>
          </div>

          {/* Card 2: Bottom-Left Apex (Left of V2) */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              left: 40,
              width: 360,
              padding: '14px 20px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(14, 18, 28, 0.95) 0%, rgba(9, 12, 20, 0.98) 100%)',
              border: `1px solid ${isV2Sacrificed ? `${sacrificedColor}60` : 'rgba(255, 255, 255, 0.12)'}`,
              borderLeft: `4px solid ${isV2Sacrificed ? sacrificedColor : activeColor}`,
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: FONT.mono,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 6,
                  color: isV2Sacrificed ? sacrificedColor : activeColor,
                  backgroundColor: `${isV2Sacrificed ? sacrificedColor : activeColor}20`,
                }}
              >
                {isV2Sacrificed ? 'COMPROMISED [02]' : 'OPTIMIZED [02]'}
              </span>
              <span style={{ fontSize: 10, fontFamily: FONT.mono, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>
                {vertex2Metric}
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: FONT.display, color: '#FFFFFF', marginBottom: 2 }}>
              {vertex2Title}
            </div>
            <div style={{ fontSize: 12, fontFamily: FONT.sans, color: 'rgba(255, 255, 255, 0.65)' }}>
              {vertex2Desc}
            </div>
          </div>

          {/* Card 3: Bottom-Right Apex (Right of V3) */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              right: 40,
              width: 360,
              padding: '14px 20px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(28, 14, 20, 0.95) 0%, rgba(20, 9, 14, 0.98) 100%)',
              border: `1px solid ${isV3Sacrificed ? `${sacrificedColor}70` : 'rgba(255, 255, 255, 0.12)'}`,
              borderRight: `4px solid ${isV3Sacrificed ? sacrificedColor : activeColor}`,
              boxShadow: `0 8px 30px ${isV3Sacrificed ? `${sacrificedColor}20` : 'rgba(0, 0, 0, 0.7)'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: FONT.mono,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 6,
                  color: isV3Sacrificed ? sacrificedColor : activeColor,
                  backgroundColor: `${isV3Sacrificed ? sacrificedColor : activeColor}20`,
                }}
              >
                {isV3Sacrificed ? 'COMPROMISED [03]' : 'OPTIMIZED [03]'}
              </span>
              <span style={{ fontSize: 10, fontFamily: FONT.mono, color: isV3Sacrificed ? sacrificedColor : 'rgba(255,255,255,0.5)', letterSpacing: 1, fontWeight: 700 }}>
                {vertex3Metric}
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: FONT.display, color: isV3Sacrificed ? '#FFA4B4' : '#FFFFFF', marginBottom: 2 }}>
              {vertex3Title}
            </div>
            <div style={{ fontSize: 12, fontFamily: FONT.sans, color: 'rgba(255, 255, 255, 0.65)' }}>
              {vertex3Desc}
            </div>
          </div>
        </div>

        {/* BOTTOM AXIOM / TRILEMMA LAW BAR */}
        <div
          style={{
            marginTop: 10,
            height: 48,
            borderRadius: 14,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            gap: 16,
            transform: `translateY(${interpolate(axiomSpring, [0, 1], [15, 0])}px)`,
            opacity: axiomSpring,
          }}
        >
          <div
            style={{
              padding: '3px 10px',
              borderRadius: 6,
              background: 'rgba(0, 229, 255, 0.12)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              fontSize: 10,
              fontFamily: FONT.mono,
              fontWeight: 800,
              color: accentColor,
              letterSpacing: 1.5,
              whiteSpace: 'nowrap',
            }}
          >
            THE TRILEMMA LAW
          </div>

          <div
            style={{
              fontSize: 13,
              fontFamily: FONT.mono,
              color: 'rgba(255, 255, 255, 0.8)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: 0.5,
            }}
          >
            {axiom}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
