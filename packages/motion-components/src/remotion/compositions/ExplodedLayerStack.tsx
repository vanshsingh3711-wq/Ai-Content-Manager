import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate } from 'remotion';
import { FONT, useExitFade } from '../shared';

export interface StackLayer {
  level?: string | number;
  badge?: string;
  title: string;
  desc?: string;
  metric?: string;
  color?: string;
}

export interface ExplodedLayerStackProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  synthesis?: string;
  layer1Title?: string;
  layer1Desc?: string;
  layer1Badge?: string;
  layer1Metric?: string;
  layer2Title?: string;
  layer2Desc?: string;
  layer2Badge?: string;
  layer2Metric?: string;
  layer3Title?: string;
  layer3Desc?: string;
  layer3Badge?: string;
  layer3Metric?: string;
  layer4Title?: string;
  layer4Desc?: string;
  layer4Badge?: string;
  layer4Metric?: string;
  layers?: StackLayer[];
  accentColor?: string;
  colorTheme?: string;
  [key: string]: any;
}

const DEFAULT_LAYERS: StackLayer[] = [
  {
    level: '01',
    badge: 'HARDWARE SUBSTRATE',
    title: 'Foundational Neural Weights',
    desc: 'Quantized FP8 parameter clusters bound to ultra-dense HBM memory bandwidth.',
    metric: '4.8 TB/S BANDWIDTH',
    color: '#F59E0B', // Amber
  },
  {
    level: '02',
    badge: 'NEURAL LATENT CORE',
    title: 'Context Window Orchestration',
    desc: 'Attention routing, KV-cache compression, and speculative token draft verification.',
    metric: '128K TOKENS / SEC',
    color: '#10B981', // Emerald
  },
  {
    level: '03',
    badge: 'EPISTEMIC STATE',
    title: 'Long-Term Memory & Graph RAG',
    desc: 'Hierarchical vector indexing and real-time knowledge graph traversal.',
    metric: '1.2M EMBEDDINGS',
    color: '#818CF8', // Indigo/Violet
  },
  {
    level: '04',
    badge: 'COGNITIVE RUNTIME',
    title: 'Autonomous Tool Execution',
    desc: 'Sandboxed agent synthesis, deterministic code interpreter, and external API invocation.',
    metric: '< 150ms LATENCY',
    color: '#00E5FF', // Cyan
  },
];

export const ExplodedLayerStack: React.FC<ExplodedLayerStackProps> = ({
  title = 'THE AUTONOMOUS AGENT STACK',
  subtitle = 'DECONSTRUCTED COMPUTE ANATOMY & MULTI-TIER EXECUTION PIPELINE',
  badge = 'ISOMETRIC SYSTEM ARCHITECTURE',
  synthesis = 'Upper tiers inherit latency constraints and epistemic coherence directly from the foundational substrate below.',
  layer1Title,
  layer1Desc,
  layer1Badge,
  layer1Metric,
  layer2Title,
  layer2Desc,
  layer2Badge,
  layer2Metric,
  layer3Title,
  layer3Desc,
  layer3Badge,
  layer3Metric,
  layer4Title,
  layer4Desc,
  layer4Badge,
  layer4Metric,
  layers: customLayers,
  accentColor = '#00E5FF',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exitOpacity = useExitFade(frame, durationInFrames, 15);

  // Normalize layers: 0 is bottom (L01), 3 is top (L04)
  const resolvedLayers: StackLayer[] = [
    {
      level: '01',
      badge: layer1Badge || customLayers?.[0]?.badge || DEFAULT_LAYERS[0].badge,
      title: layer1Title || customLayers?.[0]?.title || DEFAULT_LAYERS[0].title,
      desc: layer1Desc || customLayers?.[0]?.desc || DEFAULT_LAYERS[0].desc,
      metric: layer1Metric || customLayers?.[0]?.metric || DEFAULT_LAYERS[0].metric,
      color: customLayers?.[0]?.color || DEFAULT_LAYERS[0].color,
    },
    {
      level: '02',
      badge: layer2Badge || customLayers?.[1]?.badge || DEFAULT_LAYERS[1].badge,
      title: layer2Title || customLayers?.[1]?.title || DEFAULT_LAYERS[1].title,
      desc: layer2Desc || customLayers?.[1]?.desc || DEFAULT_LAYERS[1].desc,
      metric: layer2Metric || customLayers?.[1]?.metric || DEFAULT_LAYERS[1].metric,
      color: customLayers?.[1]?.color || DEFAULT_LAYERS[1].color,
    },
    {
      level: '03',
      badge: layer3Badge || customLayers?.[2]?.badge || DEFAULT_LAYERS[2].badge,
      title: layer3Title || customLayers?.[2]?.title || DEFAULT_LAYERS[2].title,
      desc: layer3Desc || customLayers?.[2]?.desc || DEFAULT_LAYERS[2].desc,
      metric: layer3Metric || customLayers?.[2]?.metric || DEFAULT_LAYERS[2].metric,
      color: customLayers?.[2]?.color || DEFAULT_LAYERS[2].color,
    },
    {
      level: '04',
      badge: layer4Badge || customLayers?.[3]?.badge || DEFAULT_LAYERS[3].badge,
      title: layer4Title || customLayers?.[3]?.title || DEFAULT_LAYERS[3].title,
      desc: layer4Desc || customLayers?.[3]?.desc || DEFAULT_LAYERS[3].desc,
      metric: layer4Metric || customLayers?.[3]?.metric || DEFAULT_LAYERS[3].metric,
      color: customLayers?.[3]?.color || DEFAULT_LAYERS[3].color,
    },
  ];

  // Global card frame entrance
  const containerEntrance = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 95, mass: 0.9 },
  });

  // Staggered explosion spring: 0 means collapsed monolith, 1 means fully separated strata
  const explodeSpring = spring({
    frame: Math.max(0, frame - 14),
    fps,
    config: { damping: 16, stiffness: 80, mass: 1.1 },
  });

  // Subtle floating breathing motion once separated
  const hoverBreathe = Math.sin((frame / fps) * 2 * Math.PI * 0.4) * 4;

  // Synthesis bar entrance
  const synthesisSpring = spring({
    frame: Math.max(0, frame - 38),
    fps,
    config: { damping: 16, stiffness: 100 },
  });

  // Isometric Stage Geometry
  // Center X for isometric slabs
  const isoCx = 330;
  // Radius half-width and half-height for isometric rhombus (2.4:1 ratio)
  const slabW = 160; // total width = 320
  const slabH = 60;  // total height = 120
  const bevelH = 16; // vertical 3D edge extrusion

  // Vertical positions:
  // When collapsed (explodeProgress = 0), all plates rest at cyCenter ± delta
  // When exploded (explodeProgress = 1), layers separate to exact targets matching cards
  const collapsedCy = 325;
  const explodedPositions = [
    520, // Layer 1 (Bottom, center Y = 520)
    390, // Layer 2 (center Y = 390)
    260, // Layer 3 (center Y = 260)
    130, // Layer 4 (Top, center Y = 130)
  ];

  // Pre-calculate animated Y center for each layer
  const layerYPositions = [0, 1, 2, 3].map((idx) => {
    const collapsedY = collapsedCy + (idx === 0 ? 24 : idx === 1 ? 8 : idx === 2 ? -8 : -24);
    const targetY = explodedPositions[idx];
    return interpolate(explodeSpring, [0, 1], [collapsedY, targetY]);
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
      {/* Ambient background atmosphere */}
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          left: 100,
          top: 100,
          background: 'radial-gradient(circle, rgba(0, 229, 255, 0.08) 0%, rgba(99, 102, 241, 0.04) 50%, transparent 75%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 700,
          right: 80,
          bottom: 60,
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.05) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Obsidian Glass Outer Frame (16:9 Canvas) */}
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
        {/* Subtle Tech Grid Lines / Reticles */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            right: 28,
            fontSize: 10,
            fontFamily: FONT.mono,
            color: 'rgba(255, 255, 255, 0.25)',
            letterSpacing: 2,
          }}
        >
          STRATA ENGINE // AXONOMETRIC PERSPECTIVE
        </div>

        {/* TOP HEADER */}
        <div style={{ marginBottom: 20 }}>
          {/* Top Metadata Badges */}
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
                background: 'rgba(0, 229, 255, 0.08)',
                border: '1px solid rgba(0, 229, 255, 0.28)',
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
              DECONSTRUCTED VIEW &nbsp;|&nbsp; <span style={{ color: '#00E5FF' }}>4-TIER ORTHOGONAL STRATA</span>
            </div>
          </div>

          {/* Main Title */}
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

          {/* Subtitle */}
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

        {/* MAIN BODY: LEFT ISOMETRIC 3D STAGE & RIGHT CALLOUT CARDS */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            position: 'relative',
            marginTop: 10,
          }}
        >
          {/* LEFT: ISOMETRIC 3D EXPLODED SVG STAGE */}
          <div
            style={{
              width: 720,
              height: '100%',
              position: 'relative',
            }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 720 620"
              style={{ overflow: 'visible' }}
            >
              <defs>
                {/* Glow Filter for lasers and edges */}
                <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="intenseGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="9" result="blur1" />
                  <feGaussianBlur stdDeviation="3" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur1" />
                    <feMergeNode in="blur2" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Vertical Interconnect Lasers between layers */}
              {explodeSpring > 0.05 && (
                <g opacity={explodeSpring}>
                  {/* Central Core Conduit */}
                  <line
                    x1={isoCx}
                    y1={layerYPositions[0]}
                    x2={isoCx}
                    y2={layerYPositions[3]}
                    stroke="rgba(0, 229, 255, 0.35)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  {/* Left edge alignment beam */}
                  <line
                    x1={isoCx - slabW}
                    y1={layerYPositions[0]}
                    x2={isoCx - slabW}
                    y2={layerYPositions[3]}
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="1"
                    strokeDasharray="3 5"
                  />
                  {/* Right edge alignment beam */}
                  <line
                    x1={isoCx + slabW}
                    y1={layerYPositions[0]}
                    x2={isoCx + slabW}
                    y2={layerYPositions[3]}
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="1"
                    strokeDasharray="3 5"
                  />

                  {/* Pulsing upward vertical data particles */}
                  {Array.from({ length: 4 }).map((_, pIdx) => {
                    const particleProgress = ((frame * 2.5 + pIdx * 25) % 100) / 100;
                    const py = interpolate(
                      particleProgress,
                      [0, 1],
                      [layerYPositions[0], layerYPositions[3]]
                    );
                    return (
                      <circle
                        key={`particle-${pIdx}`}
                        cx={isoCx}
                        cy={py}
                        r="3.5"
                        fill="#00E5FF"
                        filter="url(#neonGlow)"
                        opacity={0.8}
                      />
                    );
                  })}
                </g>
              )}

              {/* RENDER 4 ISOMETRIC PLATES (From bottom Layer 1 to top Layer 4) */}
              {[0, 1, 2, 3].map((idx) => {
                const layer = resolvedLayers[idx];
                const layerSpringDelay = 14 + idx * 4;
                const plateSpring = spring({
                  frame: Math.max(0, frame - layerSpringDelay),
                  fps,
                  config: { damping: 15, stiffness: 90 },
                });

                const cy = layerYPositions[idx] + (idx === 3 ? hoverBreathe : 0);
                const col = layer.color || '#38BDF8';

                // Rhombus vertices:
                // Top vertex: (isoCx, cy - slabH)
                // Right vertex: (isoCx + slabW, cy)
                // Bottom vertex: (isoCx, cy + slabH)
                // Left vertex: (isoCx - slabW, cy)
                const ptTop = `${isoCx},${cy - slabH}`;
                const ptRight = `${isoCx + slabW},${cy}`;
                const ptBottom = `${isoCx},${cy + slabH}`;
                const ptLeft = `${isoCx - slabW},${cy}`;

                // Extruded Bottom Points (lowered by bevelH)
                const ptLeftExt = `${isoCx - slabW},${cy + bevelH}`;
                const ptBottomExt = `${isoCx},${cy + slabH + bevelH}`;
                const ptRightExt = `${isoCx + slabW},${cy + bevelH}`;

                // Callout bracket line from right vertex across to card edge
                const bracketStartX = isoCx + slabW;
                const bracketStartY = cy;
                const bracketEndX = 725;
                const bracketProgress = spring({
                  frame: Math.max(0, frame - (layerSpringDelay + 8)),
                  fps,
                  config: { damping: 18, stiffness: 100 },
                });

                return (
                  <g key={`iso-layer-${idx}`} opacity={plateSpring}>
                    {/* Shadow underneath plate when exploded */}
                    <polygon
                      points={`${isoCx},${cy - slabH + 30} ${isoCx + slabW + 15},${cy + 30} ${isoCx},${cy + slabH + 30} ${isoCx - slabW - 15},${cy + 30}`}
                      fill="rgba(0, 0, 0, 0.45)"
                      filter="url(#neonGlow)"
                      opacity={explodeSpring * 0.7}
                    />

                    {/* Left Beveled Extrusion Face */}
                    <polygon
                      points={`${ptLeft} ${ptBottom} ${ptBottomExt} ${ptLeftExt}`}
                      fill="rgba(10, 14, 24, 0.95)"
                      stroke={col}
                      strokeWidth="1"
                      strokeOpacity="0.4"
                    />

                    {/* Right Beveled Extrusion Face */}
                    <polygon
                      points={`${ptBottom} ${ptRight} ${ptRightExt} ${ptBottomExt}`}
                      fill="rgba(18, 24, 38, 0.98)"
                      stroke={col}
                      strokeWidth="1"
                      strokeOpacity="0.5"
                    />

                    {/* Top Rhombus Face */}
                    <polygon
                      points={`${ptTop} ${ptRight} ${ptBottom} ${ptLeft}`}
                      fill="rgba(12, 17, 28, 0.92)"
                      stroke={col}
                      strokeWidth="2"
                      filter="url(#neonGlow)"
                    />

                    {/* Inner Grid / Circuit Trace on Top Face */}
                    <line
                      x1={isoCx - slabW * 0.5}
                      y1={cy - slabH * 0.5}
                      x2={isoCx + slabW * 0.5}
                      y2={cy + slabH * 0.5}
                      stroke={col}
                      strokeWidth="1"
                      strokeOpacity="0.3"
                      strokeDasharray="2 4"
                    />
                    <line
                      x1={isoCx - slabW * 0.5}
                      y1={cy + slabH * 0.5}
                      x2={isoCx + slabW * 0.5}
                      y2={cy - slabH * 0.5}
                      stroke={col}
                      strokeWidth="1"
                      strokeOpacity="0.3"
                      strokeDasharray="2 4"
                    />

                    {/* Central Processor Core / Rhombus Die */}
                    <polygon
                      points={`${isoCx},${cy - 22} ${isoCx + 44},${cy} ${isoCx},${cy + 22} ${isoCx - 44},${cy}`}
                      fill={col}
                      fillOpacity="0.25"
                      stroke={col}
                      strokeWidth="1.8"
                      filter="url(#intenseGlow)"
                    />

                    {/* Micro-label on the die */}
                    <text
                      x={isoCx}
                      y={cy + 4}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="12"
                      fontWeight="900"
                      fontFamily={FONT.mono}
                      letterSpacing="1"
                    >
                      L{layer.level || `0${idx + 1}`}
                    </text>

                    {/* Horizontal Callout Laser Beam to Right Card */}
                    {bracketProgress > 0.05 && (
                      <g opacity={bracketProgress}>
                        {/* Target Reticle at the plate edge */}
                        <circle
                          cx={bracketStartX}
                          cy={bracketStartY}
                          r="5"
                          fill="#FFFFFF"
                          stroke={col}
                          strokeWidth="2"
                          filter="url(#neonGlow)"
                        />
                        <circle
                          cx={bracketStartX}
                          cy={bracketStartY}
                          r="10"
                          fill="none"
                          stroke={col}
                          strokeWidth="1"
                          strokeOpacity="0.7"
                        />

                        {/* Outer Neon Glow Beam */}
                        <line
                          x1={bracketStartX}
                          y1={bracketStartY}
                          x2={interpolate(
                            bracketProgress,
                            [0, 1],
                            [bracketStartX, bracketEndX]
                          )}
                          y2={bracketStartY}
                          stroke={col}
                          strokeWidth="3"
                          strokeOpacity="0.9"
                          filter="url(#intenseGlow)"
                        />
                        {/* Inner Crisp White Core Beam */}
                        <line
                          x1={bracketStartX}
                          y1={bracketStartY}
                          x2={interpolate(
                            bracketProgress,
                            [0, 1],
                            [bracketStartX, bracketEndX]
                          )}
                          y2={bracketStartY}
                          stroke="#FFFFFF"
                          strokeWidth="1"
                          strokeOpacity="0.95"
                        />

                        {/* Terminal Arrow Reticle at Card Entrance */}
                        {bracketProgress > 0.92 && (
                          <polygon
                            points={`${bracketEndX - 8},${bracketStartY - 5} ${bracketEndX},${bracketStartY} ${bracketEndX - 8},${bracketStartY + 5}`}
                            fill={col}
                            filter="url(#neonGlow)"
                          />
                        )}
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* RIGHT: 4 VERTICALLY ALIGNED STRATA DETAIL CARDS */}
          <div
            style={{
              flex: 1,
              height: 620,
              position: 'relative',
              paddingLeft: 14,
              boxSizing: 'border-box',
            }}
          >
            {/* Exactly aligned to layer centers (Y = 130, 260, 390, 520) */}
            {[3, 2, 1, 0].map((idx) => {
              const layer = resolvedLayers[idx];
              const cardDelay = 18 + (3 - idx) * 4;
              const cardSpring = spring({
                frame: Math.max(0, frame - cardDelay),
                fps,
                config: { damping: 16, stiffness: 95 },
              });

              const col = layer.color || '#38BDF8';
              // Center Y matches layer Y (130, 260, 390, 520) -> top is cy - 58
              const cardTop = explodedPositions[idx] - 58;

              return (
                <div
                  key={`card-${idx}`}
                  style={{
                    position: 'absolute',
                    top: cardTop,
                    left: 14,
                    right: 0,
                    height: 116,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, rgba(14, 18, 28, 0.95) 0%, rgba(9, 12, 20, 0.98) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                    transform: `translateX(${interpolate(cardSpring, [0, 1], [40, 0])}px)`,
                    opacity: cardSpring,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '16px 24px',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                  }}
                >
                  {/* Left edge neon colored glow stripe */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 5,
                      backgroundColor: col,
                      boxShadow: `0 0 12px ${col}`,
                    }}
                  />

                  {/* Top Row: Layer Level Pill, Sub-Badge & Metric Tag */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Level Badge */}
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: FONT.mono,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 6,
                          backgroundColor: `${col}22`,
                          color: col,
                          border: `1px solid ${col}55`,
                          letterSpacing: 1,
                        }}
                      >
                        LEVEL {layer.level || `0${idx + 1}`}
                      </span>

                      {/* Strata Function Badge */}
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: FONT.mono,
                          color: 'rgba(255, 255, 255, 0.5)',
                          letterSpacing: 1.5,
                          fontWeight: 700,
                        }}
                      >
                        {layer.badge?.toUpperCase()}
                      </span>
                    </div>

                    {/* Metric Callout */}
                    {layer.metric && (
                      <div
                        style={{
                          fontSize: 11,
                          fontFamily: FONT.mono,
                          fontWeight: 800,
                          color: '#FFFFFF',
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          letterSpacing: 1,
                        }}
                      >
                        {layer.metric}
                      </div>
                    )}
                  </div>

                  {/* Layer Title */}
                  <div
                    style={{
                      fontSize: 21,
                      fontWeight: 800,
                      fontFamily: FONT.display,
                      color: '#FFFFFF',
                      lineHeight: 1.2,
                      marginBottom: 4,
                    }}
                  >
                    {layer.title}
                  </div>

                  {/* Layer Description */}
                  <div
                    style={{
                      fontSize: 13,
                      fontFamily: FONT.sans,
                      color: 'rgba(255, 255, 255, 0.65)',
                      lineHeight: 1.35,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {layer.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM SYNTHESIS / VERDICT BAR */}
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
              background: 'rgba(0, 229, 255, 0.12)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              fontSize: 10,
              fontFamily: FONT.mono,
              fontWeight: 800,
              color: '#00E5FF',
              letterSpacing: 1.5,
              whiteSpace: 'nowrap',
            }}
          >
            FOUNDATION AXIOM
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
