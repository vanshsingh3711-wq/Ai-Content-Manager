import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

export interface HierarchyPyramidProps {
  title?: string;
  badge?: string;
  tier1Title?: string;
  tier1Subtitle?: string;
  tier1Pct?: string;
  tier1Icon?: string;
  tier2Title?: string;
  tier2Subtitle?: string;
  tier2Pct?: string;
  tier2Icon?: string;
  tier3Title?: string;
  tier3Subtitle?: string;
  tier3Pct?: string;
  tier3Icon?: string;
  synthesis?: string;
}

export const HierarchyPyramid: React.FC<HierarchyPyramidProps> = ({
  title = 'THE RETENTION MASTERY PYRAMID',
  badge = '🔺 HIERARCHY ARCHITECTURE',
  tier1Title = 'Structural Value Thesis',
  tier1Subtitle = '80% of audience retention is determined by solving an acute curiosity gap.',
  tier1Pct = '80% FOUNDATION',
  tier1Icon = '🧱',
  tier2Title = 'Velocity Pacing Loops',
  tier2Subtitle = 'Dynamic visual pattern interrupts every 2.5s sustain subconscious arousal.',
  tier2Pct = '19% LEVERAGE',
  tier2Icon = '⚡',
  tier3Title = 'Compounding Viral Climax',
  tier3Subtitle = 'The top 1% memorable payoff that guarantees saves, shares, and algorithmic lift.',
  tier3Pct = '1% PINNACLE',
  tier3Icon = '👑',
  synthesis = 'SYSTEM HIERARCHY: Mastery at the apex is impossible without absolute base stability.',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 12);

  // Entrance spring for main card container
  const enterSpring = spring({ frame, fps, config: { damping: 14, mass: 0.7, stiffness: 160 } });

  // Staggered springs for each tier:
  // Tier 1 (Base): Lands at frame 8 with heavy gravitational drop
  const tier1Spring = spring({ frame: frame - 8, fps, config: { damping: 13, mass: 0.8, stiffness: 180 } });

  // Tier 2 (Middle): Lands at frame 22
  const tier2Spring = spring({ frame: frame - 22, fps, config: { damping: 12, mass: 0.6, stiffness: 190 } });

  // Tier 3 (Apex Crown): Descends at frame 36 with crowning spring
  const tier3Spring = spring({ frame: frame - 36, fps, config: { damping: 11, mass: 0.5, stiffness: 210 } });

  // Connector lines drawing progress
  const line1Progress = interpolate(frame, [14, 26], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const line2Progress = interpolate(frame, [28, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const line3Progress = interpolate(frame, [42, 54], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Apex radiant breathing pulse
  const apexPulse = Math.sin((frame / fps) * 6) * 0.04 + 1;
  const goldGlow = Math.sin((frame / fps) * 5) * 15 + 30;

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
      {/* Container Card */}
      <div
        style={{
          ...glassStyle,
          width: '100%',
          maxWidth: 960,
          padding: '38px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 22,
          background: 'rgba(10, 14, 28, 0.96)',
          backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.16) 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
          border: '1.5px solid rgba(245, 158, 11, 0.35)',
          boxShadow: `0 40px 100px rgba(0,0,0,0.85), 0 0 ${goldGlow}px rgba(245, 158, 11, 0.18)`,
          transform: `scale(${Math.min(1, enterSpring)}) translateY(${(1 - enterSpring) * 40}px)`,
          opacity: enterSpring,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Header & Tag */}
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
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15))',
              border: '1px solid rgba(245, 158, 11, 0.55)',
              color: '#FDE047',
              fontFamily: FONT.mono,
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: 2.5,
              padding: '6px 16px',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.25)',
            }}
          >
            <span>●</span> {badge}
          </div>

          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: 2.5,
              color: '#F8FAFC',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </div>
        </div>

        {/* Central Stage: 3D Isometric Pyramid (Left) + Detailed Callout Cards (Right) */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 530,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* 3D Isometric Pyramid Stage (Left ~440px) */}
          <div
            style={{
              position: 'relative',
              width: 440,
              height: 520,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* SVG 3D Isometric Pyramid */}
            <svg
              viewBox="0 0 440 520"
              style={{
                width: '100%',
                height: '100%',
                overflow: 'visible',
              }}
            >
              <defs>
                {/* Tier 1 Gradients */}
                <linearGradient id="t1Left" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E293B" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>
                <linearGradient id="t1Right" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1E293B" />
                </linearGradient>

                {/* Tier 2 Gradients */}
                <linearGradient id="t2Left" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0284C7" />
                  <stop offset="100%" stopColor="#0369A1" />
                </linearGradient>
                <linearGradient id="t2Right" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>

                {/* Tier 3 (Apex) Gradients */}
                <linearGradient id="t3Left" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
                <linearGradient id="t3Right" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FDE047" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
              </defs>

              {/* TIER 1 (BASE BLOCK) */}
              <g
                style={{
                  transform: `translateY(${(1 - tier1Spring) * 60}px)`,
                  opacity: Math.min(1, tier1Spring * 2),
                  transition: 'all 0.1s ease-out',
                }}
              >
                {/* Left Face */}
                <polygon
                  points="110,310 20,430 220,460 220,336"
                  fill="url(#t1Left)"
                  stroke="rgba(148, 163, 184, 0.45)"
                  strokeWidth="2"
                  filter="drop-shadow(0 15px 25px rgba(0,0,0,0.8))"
                />
                {/* Right Face */}
                <polygon
                  points="220,336 220,460 420,430 330,310"
                  fill="url(#t1Right)"
                  stroke="rgba(148, 163, 184, 0.45)"
                  strokeWidth="2"
                  filter="drop-shadow(0 15px 25px rgba(0,0,0,0.8))"
                />
                {/* Tier 1 Label on Face */}
                <text
                  x="220"
                  y="415"
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontFamily={FONT.mono}
                  fontSize="15"
                  fontWeight="900"
                  letterSpacing="2"
                >
                  80% BASE
                </text>
              </g>

              {/* TIER 2 (MIDDLE BLOCK) */}
              <g
                style={{
                  transform: `translateY(${(1 - tier2Spring) * 50}px)`,
                  opacity: Math.min(1, tier2Spring * 2),
                  transition: 'all 0.1s ease-out',
                }}
              >
                {/* Left Face */}
                <polygon
                  points="160,185 115,296 220,322 220,208"
                  fill="url(#t2Left)"
                  stroke="rgba(56, 189, 248, 0.7)"
                  strokeWidth="2"
                  filter="drop-shadow(0 0 15px rgba(56, 189, 248, 0.4))"
                />
                {/* Right Face */}
                <polygon
                  points="220,208 220,322 325,296 280,185"
                  fill="url(#t2Right)"
                  stroke="rgba(56, 189, 248, 0.7)"
                  strokeWidth="2"
                  filter="drop-shadow(0 0 15px rgba(56, 189, 248, 0.4))"
                />
                {/* Tier 2 Label on Face */}
                <text
                  x="220"
                  y="278"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontFamily={FONT.mono}
                  fontSize="15"
                  fontWeight="900"
                  letterSpacing="2"
                >
                  19% LEVERAGE
                </text>
              </g>

              {/* TIER 3 (APEX GOLDEN CROWN) */}
              <g
                style={{
                  transform: `scale(${apexPulse}) translateY(${(1 - tier3Spring) * 40}px)`,
                  transformOrigin: '220px 100px',
                  opacity: Math.min(1, tier3Spring * 2),
                  transition: 'all 0.1s ease-out',
                }}
              >
                {/* Left Face */}
                <polygon
                  points="220,60 165,172 220,195"
                  fill="url(#t3Left)"
                  stroke="rgba(253, 224, 71, 0.85)"
                  strokeWidth="2.5"
                  filter="drop-shadow(0 0 25px rgba(245, 158, 11, 0.8))"
                />
                {/* Right Face */}
                <polygon
                  points="220,60 220,195 275,172"
                  fill="url(#t3Right)"
                  stroke="rgba(253, 224, 71, 0.85)"
                  strokeWidth="2.5"
                  filter="drop-shadow(0 0 25px rgba(245, 158, 11, 0.8))"
                />
                {/* Tier 3 Label on Face */}
                <text
                  x="220"
                  y="155"
                  textAnchor="middle"
                  fill="#78350F"
                  fontFamily={FONT.mono}
                  fontSize="14"
                  fontWeight="900"
                  letterSpacing="1.5"
                >
                  1% APEX
                </text>
                {/* Crown Emoji above Apex */}
                <text x="220" y="44" textAnchor="middle" fontSize="26">
                  👑
                </text>
              </g>

              {/* Glowing Laser Conduits to Right Cards */}
              {/* Conduit 3 (Apex -> Card 3) */}
              <line
                x1="275"
                y1="130"
                x2="440"
                y2="75"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeDasharray="180"
                strokeDashoffset={(1 - line3Progress) * 180}
                filter="drop-shadow(0 0 8px #F59E0B)"
              />
              {line3Progress > 0.05 && (
                <circle cx="440" cy="75" r="4.5" fill="#FDE047" filter="drop-shadow(0 0 10px #FDE047)" />
              )}

              {/* Conduit 2 (Middle -> Card 2) */}
              <line
                x1="325"
                y1="250"
                x2="440"
                y2="245"
                stroke="#38BDF8"
                strokeWidth="2.5"
                strokeDasharray="120"
                strokeDashoffset={(1 - line2Progress) * 120}
                filter="drop-shadow(0 0 8px #38BDF8)"
              />
              {line2Progress > 0.05 && (
                <circle cx="440" cy="245" r="4.5" fill="#38BDF8" filter="drop-shadow(0 0 10px #38BDF8)" />
              )}

              {/* Conduit 1 (Base -> Card 1) */}
              <line
                x1="375"
                y1="380"
                x2="440"
                y2="415"
                stroke="#94A3B8"
                strokeWidth="2.5"
                strokeDasharray="100"
                strokeDashoffset={(1 - line1Progress) * 100}
                filter="drop-shadow(0 0 6px #94A3B8)"
              />
              {line1Progress > 0.05 && (
                <circle cx="440" cy="415" r="4.5" fill="#CBD5E1" filter="drop-shadow(0 0 8px #CBD5E1)" />
              )}
            </svg>
          </div>

          {/* Detailed Callout Cards (Right ~440px) */}
          <div
            style={{
              width: 440,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              paddingLeft: 10,
            }}
          >
            {/* Card 3 (Apex) */}
            <div
              style={{
                transform: `translateX(${(1 - tier3Spring) * 30}px) scale(${Math.max(0, tier3Spring)})`,
                opacity: Math.min(1, tier3Spring * 2),
                background: 'linear-gradient(135deg, rgba(30, 24, 15, 0.94), rgba(15, 12, 8, 0.98))',
                border: '1.5px solid rgba(245, 158, 11, 0.65)',
                borderRadius: 16,
                padding: '16px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                boxShadow: '0 12px 35px rgba(0,0,0,0.7), 0 0 25px rgba(245, 158, 11, 0.22)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: FONT.mono, fontSize: 12, fontWeight: 900, color: '#FDE047', letterSpacing: 2 }}>
                  {tier3Pct}
                </span>
                <span style={{ fontSize: 18 }}>{tier3Icon}</span>
              </div>
              <span style={{ fontFamily: FONT.display, fontSize: 19, fontWeight: 800, color: '#FFFFFF' }}>
                {tier3Title}
              </span>
              <span style={{ fontFamily: FONT.display, fontSize: 14, color: '#D1D5DB', lineHeight: 1.35 }}>
                {tier3Subtitle}
              </span>
            </div>

            {/* Card 2 (Middle) */}
            <div
              style={{
                transform: `translateX(${(1 - tier2Spring) * 30}px) scale(${Math.max(0, tier2Spring)})`,
                opacity: Math.min(1, tier2Spring * 2),
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(10, 15, 30, 0.98))',
                border: '1.5px solid rgba(56, 189, 248, 0.55)',
                borderRadius: 16,
                padding: '16px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                boxShadow: '0 12px 35px rgba(0,0,0,0.7), 0 0 20px rgba(56, 189, 248, 0.18)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: FONT.mono, fontSize: 12, fontWeight: 900, color: '#38BDF8', letterSpacing: 2 }}>
                  {tier2Pct}
                </span>
                <span style={{ fontSize: 18 }}>{tier2Icon}</span>
              </div>
              <span style={{ fontFamily: FONT.display, fontSize: 19, fontWeight: 800, color: '#FFFFFF' }}>
                {tier2Title}
              </span>
              <span style={{ fontFamily: FONT.display, fontSize: 14, color: '#94A3B8', lineHeight: 1.35 }}>
                {tier2Subtitle}
              </span>
            </div>

            {/* Card 1 (Base) */}
            <div
              style={{
                transform: `translateX(${(1 - tier1Spring) * 30}px) scale(${Math.max(0, tier1Spring)})`,
                opacity: Math.min(1, tier1Spring * 2),
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.96))',
                border: '1.5px solid rgba(148, 163, 184, 0.4)',
                borderRadius: 16,
                padding: '16px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                boxShadow: '0 10px 25px rgba(0,0,0,0.65)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: FONT.mono, fontSize: 12, fontWeight: 900, color: '#CBD5E1', letterSpacing: 2 }}>
                  {tier1Pct}
                </span>
                <span style={{ fontSize: 18 }}>{tier1Icon}</span>
              </div>
              <span style={{ fontFamily: FONT.display, fontSize: 19, fontWeight: 800, color: '#FFFFFF' }}>
                {tier1Title}
              </span>
              <span style={{ fontFamily: FONT.display, fontSize: 14, color: '#94A3B8', lineHeight: 1.35 }}>
                {tier1Subtitle}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Takeaway Synthesis Bar */}
        <div
          style={{
            width: '100%',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontFamily: FONT.mono, fontSize: 13, fontWeight: 900, color: '#FDE047', letterSpacing: 2 }}>
            SYSTEM SYNTHESIS:
          </span>
          <span style={{ fontFamily: FONT.display, fontSize: 17, fontWeight: 600, color: '#CBD5E1' }}>
            {synthesis}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
