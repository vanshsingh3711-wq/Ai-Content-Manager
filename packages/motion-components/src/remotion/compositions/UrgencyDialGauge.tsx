import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { COLORS, FONT, glassStyle, useExitFade } from '../shared';

export interface UrgencyDialGaugeProps {
  title?: string;
  badge?: string;
  value?: number;
  unit?: string;
  zoneLabel?: string;
  subtext?: string;
  personality?: string;
}

export const UrgencyDialGauge: React.FC<UrgencyDialGaugeProps> = ({
  title = 'SYSTEMIC RISK VELOCITY',
  badge = '⚠️ CRITICAL TELEMETRY',
  value = 94,
  unit = '%',
  zoneLabel = 'MAXIMUM HAZARD ZONE',
  subtext = 'Telemetry indicates risk has entered the red saturation zone where cascading failures become statistically imminent.',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 12);

  // Springs
  const enterSpring = spring({ frame, fps, config: { damping: 14, mass: 0.7, stiffness: 160 } });
  const needleSpring = spring({ frame: frame - 8, fps, config: { damping: 9, mass: 0.5, stiffness: 180 } });
  const badgeSpring = spring({ frame: frame - 28, fps, config: { damping: 10, mass: 0.5, stiffness: 220 } });

  // Progress of counter and needle from 0 to target value
  const animatedValue = interpolate(needleSpring, [0, 1], [0, value]);
  const displayValue = Math.min(100, Math.round(animatedValue));

  // High-intensity needle vibration once in the danger zone (> 75%)
  const vibration = needleSpring > 0.85 ? Math.sin((frame / fps) * 32) * 2.2 : 0;

  // Needle polygon points directly UP (12 o'clock = 50%)
  // -90 deg = 0% (pointing left)
  //   0 deg = 50% (pointing up)
  // +90 deg = 100% (pointing right)
  const needleAngle = -90 + (animatedValue / 100) * 180 + vibration;

  // Red alert pulse
  const redAlertPulse = Math.sin((frame / fps) * 8) * 0.5 + 0.5;
  const redGlow = 25 + redAlertPulse * 35;

  // Arc math: r = 200, semi-circle length = π * 200 ≈ 628.32 px
  const arcLength = 628.32;
  const fillOffset = arcLength * (1 - Math.min(1, animatedValue / 100));

  return (
    <AbsoluteFill
      style={{
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 28px',
        ...exit,
      }}
    >
      {/* Background container card */}
      <div
        style={{
          ...glassStyle,
          width: '100%',
          maxWidth: 960,
          padding: '42px 38px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          background: 'rgba(8, 12, 24, 0.95)',
          border: '1.5px solid rgba(239, 68, 68, 0.38)',
          boxShadow: `0 40px 100px rgba(0,0,0,0.88), 0 0 ${redGlow}px rgba(239, 68, 68, 0.25)`,
          transform: `scale(${Math.min(1, enterSpring)}) translateY(${(1 - enterSpring) * 40}px)`,
          opacity: enterSpring,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Header & Telemetry Badge */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: 16,
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.28), rgba(185, 28, 28, 0.18))',
              border: '1px solid rgba(239, 68, 68, 0.55)',
              color: '#F87171',
              fontFamily: FONT.mono,
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: 2.5,
              padding: '6px 16px',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
            }}
          >
            <span>●</span> {badge}
          </div>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: 3,
              color: '#F1F5F9',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </div>
        </div>

        {/* Tachometer Speedometer Gauge Stage */}
        <div
          style={{
            position: 'relative',
            width: 620,
            height: 290,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 6,
          }}
        >
          {/* SVG Gauge Arcs */}
          <svg
            viewBox="0 0 600 300"
            style={{
              width: '100%',
              height: '100%',
              overflow: 'visible',
            }}
          >
            <defs>
              <linearGradient id="urgencyGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />   {/* Safe Green */}
                <stop offset="50%" stopColor="#F59E0B" />  {/* Caution Amber */}
                <stop offset="78%" stopColor="#EF4444" />  {/* High Danger Red */}
                <stop offset="100%" stopColor="#DC2626" /> {/* Critical Crimson */}
              </linearGradient>

              <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background Track Arc */}
            <path
              d="M 100 270 A 200 200 0 0 1 500 270"
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="28"
              strokeLinecap="round"
            />

            {/* Tick marks around perimeter */}
            {[0, 20, 40, 60, 80, 100].map((tick) => {
              const tickAngle = -180 + (tick / 100) * 180;
              const rad = (tickAngle * Math.PI) / 180;
              const x1 = 300 + Math.cos(rad) * 224;
              const y1 = 270 + Math.sin(rad) * 224;
              const x2 = 300 + Math.cos(rad) * 238;
              const y2 = 270 + Math.sin(rad) * 238;
              const isDanger = tick >= 80;
              return (
                <g key={tick}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isDanger ? '#EF4444' : 'rgba(255,255,255,0.3)'}
                    strokeWidth={isDanger ? 3 : 2}
                  />
                  <text
                    x={300 + Math.cos(rad) * 258}
                    y={270 + Math.sin(rad) * 258 + 4}
                    textAnchor="middle"
                    fill={isDanger ? '#EF4444' : 'rgba(255,255,255,0.5)'}
                    fontFamily={FONT.mono}
                    fontSize="13"
                    fontWeight="800"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Dynamic Colored Active Arc */}
            <path
              d="M 100 270 A 200 200 0 0 1 500 270"
              fill="none"
              stroke="url(#urgencyGaugeGrad)"
              strokeWidth="28"
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={fillOffset}
              filter="url(#arcGlow)"
            />

            {/* Center Pivot Hub */}
            <circle cx="300" cy="270" r="30" fill="#0F172A" stroke="#475569" strokeWidth="3" />
            <circle
              cx="300"
              cy="270"
              r="13"
              fill="#EF4444"
              filter="drop-shadow(0 0 10px #EF4444)"
            />

            {/* Spring High-Velocity Needle (points UP by default, rotated by needleAngle) */}
            <g transform={`rotate(${needleAngle}, 300, 270)`}>
              {/* Needle Blade */}
              <polygon
                points="300,274 296,270 297,85 300,75 303,85 304,270"
                fill="#EF4444"
                filter="drop-shadow(0 0 12px rgba(239, 68, 68, 0.95))"
              />
              <polygon
                points="299,270 300,78 301,270"
                fill="#FFFFFF"
                opacity="0.85"
              />
              {/* Counter-weight tail */}
              <polygon
                points="297,270 303,270 301,298 299,298"
                fill="#64748B"
              />
            </g>
          </svg>
        </div>

        {/* Dedicated Live Digital Readout Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1.5px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 18,
            padding: '8px 36px',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          <span
            style={{
              fontFamily: FONT.display,
              fontSize: 78,
              fontWeight: 900,
              color: displayValue >= 80 ? '#EF4444' : '#F1F5F9',
              textShadow: displayValue >= 80 ? '0 0 35px rgba(239, 68, 68, 0.8), 0 4px 8px rgba(0,0,0,0.9)' : '0 4px 8px rgba(0,0,0,0.8)',
              letterSpacing: -2,
              lineHeight: 1,
            }}
          >
            {displayValue}
          </span>
          <span
            style={{
              fontFamily: FONT.display,
              fontSize: 42,
              fontWeight: 900,
              color: displayValue >= 80 ? '#F87171' : '#94A3B8',
            }}
          >
            {unit}
          </span>
        </div>

        {/* Slamming Critical Danger Status Tag */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(185, 28, 28, 0.98))',
            color: '#FFFFFF',
            fontFamily: FONT.mono,
            fontWeight: 900,
            fontSize: 20,
            letterSpacing: 4,
            padding: '10px 32px',
            borderRadius: 12,
            boxShadow: `0 0 ${redGlow}px rgba(239, 68, 68, 0.75), 0 8px 24px rgba(0,0,0,0.6)`,
            transform: `scale(${Math.max(0, badgeSpring)})`,
            opacity: Math.min(1, badgeSpring * 2),
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span>🚨</span> {zoneLabel} <span>🚨</span>
        </div>

        {/* Bottom Takeaway Explanation Card */}
        <div
          style={{
            width: '100%',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.18)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            ⚡
          </div>
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 22,
              fontWeight: 600,
              lineHeight: 1.45,
              color: '#CBD5E1',
            }}
          >
            {subtext}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
