import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

interface Props {
  headline?: string;
  category?: string;
  detailText?: string;
  specTag?: string;
  pointerX?: number;
  pointerY?: number;
  cardX?: number;
  cardY?: number;
  accentColor?: string;
}

export const FeatureCalloutPointer: React.FC<Props> = ({
  headline = 'RETINAL HUD DISPLAY',
  category = 'HARDWARE ARCHITECTURE',
  detailText = 'Micro-OLED 4K waveguides with real-time 120Hz spatial eye tracking and dynamic foveated rendering.',
  specTag = 'LATENCY < 12ms',
  pointerX = 540,
  pointerY = 720,
  cardX = 540,
  cardY = 1240,
  accentColor = '#22D3EE',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 14);

  // Staggered entrances
  const targetSpring = spring({ frame, fps, config: { damping: 12, mass: 0.6, stiffness: 180 } });
  const lineSpring = spring({ frame: frame - 10, fps, config: { damping: 14, mass: 0.7, stiffness: 130 } });
  const cardSpring = spring({ frame: frame - 20, fps, config: { damping: 12, mass: 0.6, stiffness: 160 } });

  // Radar ping waves
  const wave1 = (frame * 0.08) % 1;
  const wave2 = ((frame + 15) * 0.08) % 1;

  // Midpoint elbow bend for tech leader line
  const elbowX = pointerX + (cardX - pointerX) * 0.4;
  const elbowY = pointerY + (cardY - pointerY) * 0.5;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#030712',
        fontFamily: FONT.display,
        color: '#FFFFFF',
        opacity: exit.opacity,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: 'absolute',
          left: pointerX - 300,
          top: pointerY - 300,
          width: 600,
          height: 600,
          background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      {/* SVG Canvas for Radar Reticle & Angled Leader Line */}
      <svg
        width="1080"
        height="1920"
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 10 }}
      >
        <defs>
          <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="1" />
            <stop offset="100%" stopColor="#818CF8" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Concentric Radar Ping Rings */}
        <g style={{ opacity: targetSpring }}>
          <circle
            cx={pointerX}
            cy={pointerY}
            r={18 + wave1 * 60}
            fill="none"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeOpacity={1 - wave1}
          />
          <circle
            cx={pointerX}
            cy={pointerY}
            r={18 + wave2 * 60}
            fill="none"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeOpacity={1 - wave2}
          />

          {/* Solid Bullseye Center Pin */}
          <circle cx={pointerX} cy={pointerY} r={18} fill={accentColor} fillOpacity="0.25" />
          <circle
            cx={pointerX}
            cy={pointerY}
            r={10}
            fill={accentColor}
            stroke="#FFFFFF"
            strokeWidth="3"
            style={{ filter: `drop-shadow(0 0 12px ${accentColor})` }}
          />

          {/* Corner Crosshair Reticle Brackets */}
          <path
            d={`M ${pointerX - 28} ${pointerY - 14} L ${pointerX - 28} ${pointerY - 28} L ${pointerX - 14} ${pointerY - 28}`}
            stroke={accentColor}
            strokeWidth="3"
            fill="none"
          />
          <path
            d={`M ${pointerX + 28} ${pointerY - 14} L ${pointerX + 28} ${pointerY - 28} L ${pointerX + 14} ${pointerY - 28}`}
            stroke={accentColor}
            strokeWidth="3"
            fill="none"
          />
          <path
            d={`M ${pointerX - 28} ${pointerY + 14} L ${pointerX - 28} ${pointerY + 28} L ${pointerX - 14} ${pointerY + 28}`}
            stroke={accentColor}
            strokeWidth="3"
            fill="none"
          />
          <path
            d={`M ${pointerX + 28} ${pointerY + 14} L ${pointerX + 28} ${pointerY + 28} L ${pointerX + 14} ${pointerY + 28}`}
            stroke={accentColor}
            strokeWidth="3"
            fill="none"
          />
        </g>

        {/* Angled Tech Leader Line drawing from Pointer to Card */}
        {lineSpring > 0.05 && (
          <g>
            <polyline
              points={`${pointerX},${pointerY} ${elbowX},${elbowY} ${cardX},${cardY - 120}`}
              fill="none"
              stroke="url(#line-grad)"
              strokeWidth="4"
              strokeDasharray="1000"
              strokeDashoffset={(1 - lineSpring) * 1000}
              style={{ filter: `drop-shadow(0 0 10px ${accentColor}80)` }}
            />
            {/* Elbow joint glowing dot */}
            <circle
              cx={elbowX}
              cy={elbowY}
              r={6}
              fill="#FFFFFF"
              stroke={accentColor}
              strokeWidth="2"
              style={{ opacity: lineSpring }}
            />
          </g>
        )}
      </svg>

      {/* Target Coordinates Tag */}
      <div
        style={{
          position: 'absolute',
          left: pointerX + 42,
          top: pointerY - 32,
          padding: '6px 14px',
          borderRadius: 8,
          background: 'rgba(15,15,22,0.85)',
          border: `1px solid ${accentColor}60`,
          fontSize: 14,
          fontFamily: FONT.mono,
          fontWeight: 700,
          color: accentColor,
          letterSpacing: 1.5,
          opacity: targetSpring,
          transform: `scale(${0.8 + targetSpring * 0.2})`,
          zIndex: 15,
        }}
      >
        LOC: [{pointerX}, {pointerY}] • LOCKED
      </div>

      {/* Expanded Glassmorphic Callout Info Card */}
      <div
        style={{
          ...glassStyle,
          position: 'absolute',
          left: cardX - 440,
          top: cardY - 100,
          width: 880,
          padding: '36px 44px',
          borderRadius: 32,
          border: `2px solid ${accentColor}60`,
          background: 'linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(3,7,18,0.96) 100%)',
          boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 40px ${accentColor}25`,
          opacity: cardSpring,
          transform: `scale(${0.85 + cardSpring * 0.15}) translateY(${(1 - cardSpring) * 30}px)`,
          zIndex: 20,
        }}
      >
        {/* Top Header Row with Category & Spec Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: accentColor,
                boxShadow: `0 0 14px ${accentColor}`,
              }}
            />
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: 2, color: accentColor }}>
              {category}
            </span>
          </div>

          <div
            style={{
              padding: '8px 18px',
              borderRadius: 12,
              backgroundColor: `${accentColor}20`,
              border: `1px solid ${accentColor}60`,
              fontSize: 16,
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: 1,
            }}
          >
            {specTag}
          </div>
        </div>

        {/* Main Headline */}
        <h2
          style={{
            fontSize: 44,
            fontWeight: 900,
            letterSpacing: -1,
            margin: '0 0 14px 0',
            color: '#FFFFFF',
            lineHeight: 1.15,
          }}
        >
          {headline}
        </h2>

        {/* Detailed Description */}
        <p
          style={{
            fontSize: 22,
            color: 'rgba(255,255,255,0.75)',
            lineHeight: 1.5,
            margin: 0,
            fontWeight: 500,
          }}
        >
          {detailText}
        </p>

        {/* Bottom Technical Spec Footer */}
        <div
          style={{
            marginTop: 24,
            paddingTop: 18,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 14,
            fontFamily: FONT.mono,
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          <span>SUBSYSTEM: OPTICAL_CORE_V4</span>
          <span>STATUS: ONLINE • CALIBRATED</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
