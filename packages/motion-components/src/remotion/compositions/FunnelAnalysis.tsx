import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

interface FunnelStage {
  name: string;
  count: string;
  pct: string;
  color: string;
}

interface Props {
  title?: string;
  subtitle?: string;
  stages?: FunnelStage[];
  dropoffNote?: string;
}

const DEFAULT_STAGES: FunnelStage[] = [
  { name: 'Total Impressions', count: '1,000,000', pct: '100%', color: '#38BDF8' },
  { name: 'Website Visitors', count: '125,000', pct: '12.5%', color: '#818CF8' },
  { name: 'Booked Calls', count: '8,400', pct: '0.84%', color: '#C084FC' },
  { name: 'Closed Revenue', count: '940', pct: '$2.8M', color: '#10B981' },
];

export const FunnelAnalysis: React.FC<Props> = ({
  title = 'CONVERSION DROP-OFF',
  subtitle = 'HIGH-TICKET CLIENT PIPELINE',
  stages = DEFAULT_STAGES,
  dropoffNote = '99.9% ELIMINATED AT TOP OF FUNNEL',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 14);

  const headerSpring = spring({ frame, fps, config: { damping: 14, mass: 0.7, stiffness: 140 } });
  const footerSpring = spring({ frame: frame - 40, fps, config: { damping: 12, mass: 0.6, stiffness: 160 } });

  // Widths for the 4 tiers (trapezoids from wide to narrow)
  const TIER_WIDTHS = [
    { top: 880, bottom: 720 },
    { top: 700, bottom: 540 },
    { top: 520, bottom: 380 },
    { top: 360, bottom: 260 },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#030712',
        fontFamily: FONT.display,
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '110px 48px',
        opacity: exit.opacity,
      }}
    >
      {/* Background radial atmosphere */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 820,
          height: 820,
          background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, rgba(16,185,129,0.08) 50%, transparent 70%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      {/* Header Container */}
      <div
        style={{
          textAlign: 'center',
          transform: `translateY(${(1 - headerSpring) * -30}px)`,
          opacity: headerSpring,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 24px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(56,189,248,0.3)',
            backdropFilter: 'blur(20px)',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#38BDF8',
              boxShadow: '0 0 14px #38BDF8',
            }}
          />
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2.5, color: '#38BDF8' }}>
            PIPELINE ATTRITION
          </span>
        </div>

        <h1
          style={{
            fontSize: 56,
            fontWeight: 900,
            letterSpacing: -1.5,
            margin: '0 0 12px 0',
            textShadow: '0 4px 24px rgba(0,0,0,0.8)',
          }}
        >
          {title}
        </h1>

        <p style={{ fontSize: 24, color: 'rgba(255,255,255,0.65)', fontWeight: 500, margin: 0 }}>
          {subtitle}
        </p>
      </div>

      {/* Stacked Funnel Trapezoid Tiers */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          width: '100%',
          marginTop: 10,
        }}
      >
        {stages.map((stg, i) => {
          const tierSpring = spring({
            frame: frame - 12 - i * 8,
            fps,
            config: { damping: 13, mass: 0.7, stiffness: 130 },
          });

          const tierWidth = TIER_WIDTHS[i] || { top: 340, bottom: 240 };
          const isFinal = i === stages.length - 1;

          return (
            <div
              key={i}
              style={{
                width: tierWidth.top,
                opacity: tierSpring,
                transform: `scale(${0.85 + tierSpring * 0.15}) translateY(${(1 - tierSpring) * 30}px)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* Trapezoid Card */}
              <div
                style={{
                  ...glassStyle,
                  width: '100%',
                  padding: '22px 32px',
                  borderRadius: 24,
                  border: `2px solid ${stg.color}50`,
                  background: `linear-gradient(135deg, ${stg.color}20 0%, rgba(15,15,22,0.95) 100%)`,
                  boxShadow: `0 8px 32px ${stg.color}25`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Glowing left accent border strip */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 6,
                    backgroundColor: stg.color,
                    boxShadow: `0 0 16px ${stg.color}`,
                  }}
                />

                {/* Left: Stage Title & Subtext */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: `${stg.color}25`,
                      border: `1px solid ${stg.color}60`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      fontWeight: 900,
                      color: stg.color,
                    }}
                  >
                    0{i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', letterSpacing: 0.5 }}>
                      {stg.name}
                    </div>
                    <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                      {isFinal ? 'High-Value Conversion Yield' : `Funnel Step ${i + 1}`}
                    </div>
                  </div>
                </div>

                {/* Right: Count and Percentage Badge */}
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#FFFFFF', letterSpacing: -0.5 }}>
                    {stg.count}
                  </div>
                  <div
                    style={{
                      padding: '8px 16px',
                      borderRadius: 12,
                      backgroundColor: `${stg.color}30`,
                      border: `1px solid ${stg.color}70`,
                      fontSize: 18,
                      fontWeight: 800,
                      color: stg.color,
                    }}
                  >
                    {stg.pct}
                  </div>
                </div>
              </div>

              {/* Connecting downward flow arrow */}
              {!isFinal && (
                <div
                  style={{
                    height: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: tierSpring,
                    marginTop: 4,
                  }}
                >
                  <svg width="24" height="14" viewBox="0 0 24 14" fill="none">
                    <path
                      d="M12 14L0 0H24L12 14Z"
                      fill={stg.color}
                      fillOpacity={0.6}
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Drop-off Insight Pill */}
      <div
        style={{
          marginTop: 'auto',
          padding: '20px 40px',
          borderRadius: 24,
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.35)',
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
          maxWidth: 860,
          opacity: footerSpring,
          transform: `translateY(${(1 - footerSpring) * 20}px)`,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 2, color: '#F87171', marginBottom: 4 }}>
          CRITICAL BOTTLENECK
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#FFFFFF' }}>
          {dropoffNote}
        </div>
      </div>
    </AbsoluteFill>
  );
};
